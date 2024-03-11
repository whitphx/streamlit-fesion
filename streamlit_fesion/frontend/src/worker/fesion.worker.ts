import type { PyodideInterface } from "pyodide";
import { PromiseDelegate } from "@lumino/coreutils";
import { ImageFilterExecutor } from "./executor";

declare const self: DedicatedWorkerGlobalScope;

interface FesionWorkerContext extends Worker {
  postMessage(message: OutMessage, transfer: Transferable[]): void;
  postMessage(message: OutMessage, options?: StructuredSerializeOptions): void;
}

// Ref: https://v4.webpack.js.org/loaders/worker-loader/#loading-with-worker-loader
const ctx: FesionWorkerContext = self as any; // eslint-disable-line @typescript-eslint/no-explicit-any

let executor: ImageFilterExecutor;

const initDataPromiseDelegate = new PromiseDelegate<InitDataMessage["data"]>();

let pyodide: PyodideInterface;
async function loadPyodideAndPackages() {
  const { funcName, funcDefPyCode, requirements } =
    await initDataPromiseDelegate.promise;

  const pyodideModule = await import(
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.mjs"
  );
  const loadPyodide = pyodideModule.loadPyodide;
  pyodide = await loadPyodide();

  executor = new ImageFilterExecutor(pyodide);

  executor.setFilterFunc(funcName, funcDefPyCode, requirements);

  ctx.postMessage({
    type: "loaded",
  });
  console.log("Worker initialization finished.");
}
const pyodideReadyPromise = loadPyodideAndPackages();

self.onmessage = async (event: MessageEvent<InMessage>): Promise<void> => {
  const data = event.data;

  // Special case for transmitting the initial data
  if (data.type === "initData") {
    initDataPromiseDelegate.resolve(data.data);
    return;
  }

  // make sure loading is done
  await pyodideReadyPromise;

  const messagePort = event.ports[0];
  const postReplyMessage = (msg: ReplyMessage) => messagePort.postMessage(msg);

  try {
    switch (data.type) {
      case "inputImage": {
        const imageData = data.data.imageData;

        const outputImageData = await executor.executeFilter(imageData);

        postReplyMessage({
          type: "outputImage",
          data: {
            imageData: outputImageData,
          },
        });
        break;
      }
      case "updateFilterFunc": {
        const { funcName, funcDefPyCode, requirements } = data.data;
        console.debug("updateFilterFunc", {
          funcName,
          funcDefPyCode,
          requirements,
        });

        await executor.setFilterFunc(funcName, funcDefPyCode, requirements);

        postReplyMessage({
          type: "reply",
        });
        break;
      }
    }
  } catch (error) {
    postReplyMessage({
      type: "reply",
      error: error as Error,
    });
  }
};

// At the end, after all the code is loaded, send the message to notify the worker is ready to receive the messages from the main thread.
ctx.postMessage({
  type: "ready",
});
