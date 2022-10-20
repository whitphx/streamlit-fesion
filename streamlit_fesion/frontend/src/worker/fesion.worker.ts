import { PyodideInterface, PyProxy } from "pyodide"
import { PromiseDelegate } from "@lumino/coreutils";

// To use worker-loader with CRA,
// followed https://github.com/dominique-mueller/create-react-app-typescript-web-worker-setup
declare const self: DedicatedWorkerGlobalScope;
export default {} as typeof Worker & { new(): Worker };

interface FesionWorkerContext extends Worker {
  postMessage(message: OutMessage, transfer: Transferable[]): void;
  postMessage(message: OutMessage, options?: StructuredSerializeOptions): void;
}

// Ref: https://v4.webpack.js.org/loaders/worker-loader/#loading-with-worker-loader
const ctx: FesionWorkerContext = self as any;

importScripts("https://cdn.jsdelivr.net/pyodide/v0.21.3/full/pyodide.js");
declare let loadPyodide: any;

const NUMPY_GLOBAL_ALIAS = "gai6sa2eM9Atiev5Shu5ohtie6phai8i"; // To avoid name conflict

const initDataPromiseDelegate = new PromiseDelegate<WorkerInitialData>();

let pyodide: PyodideInterface;
let imageFilterPyFuncName: string;
async function loadPyodideAndPackages() {
  const {
    funcName,
    funcDefPyCode,
    requirements
  } = await initDataPromiseDelegate.promise;

  pyodide = await loadPyodide();

  /* Initialize the Python environment. */

  // Import NumPy, which is used in the wrapper script.
  await pyodide
    .loadPackage(["numpy"])
    .then(() =>
      pyodide.runPythonAsync(`import numpy as ${NUMPY_GLOBAL_ALIAS}`)
    );

  // Load packages used in the user-defined filter function.
  await pyodide.loadPackagesFromImports(funcDefPyCode);
  await pyodide.loadPackage(requirements);

  // TODO: Delete the previous filter func by running "del {func_name}" to avoid memory leak.

  // Run the Python code including the user-defined filter function.
  await pyodide.runPythonAsync(funcDefPyCode);

  imageFilterPyFuncName = funcName;

  console.log("Worker initialization finished.")
}
const pyodideReadyPromise = loadPyodideAndPackages();

async function filterFn(imageData: ImageData): Promise<ImageData> {
  /* eslint-disable @typescript-eslint/ban-ts-comment */
  // @ts-ignore
  self.fesionImageWidth = imageData.width;
  // @ts-ignore
  self.fesionImageHeight = imageData.height;
  // @ts-ignore
  self.fesionImageData = imageData.data;
  /* eslint-enable */

  await pyodide.runPythonAsync(`
  from js import fesionImageWidth, fesionImageHeight, fesionImageData  # Import from JS globals

  input_image4chan = ${NUMPY_GLOBAL_ALIAS}.asarray(fesionImageData.to_py()).reshape((fesionImageHeight, fesionImageWidth, 4)) # 4 channels (RGBA)
  input_image = input_image4chan[:,:,:3]

  output_image = ${imageFilterPyFuncName}(input_image)

  if ${NUMPY_GLOBAL_ALIAS}.issubdtype(output_image.dtype, ${NUMPY_GLOBAL_ALIAS}.floating):
      output_image = (output_image * 255).astype(${NUMPY_GLOBAL_ALIAS}.uint8)

  output_alpha = ${NUMPY_GLOBAL_ALIAS}.full((fesionImageHeight, fesionImageWidth, 1), fill_value=255, dtype=${NUMPY_GLOBAL_ALIAS}.uint8)
  output_image4chan = ${NUMPY_GLOBAL_ALIAS}.concatenate((output_image, output_alpha), axis=2).copy()

  output_height, output_width = output_image4chan.shape[:2]
  `);

  const outputImageProxy: PyProxy =
    pyodide.globals.get("output_image4chan");
  const outputImageBuffer = outputImageProxy.getBuffer("u8");
  outputImageProxy.destroy();

  const outputWidth: number = pyodide.globals.get("output_width");
  const outputHeight: number = pyodide.globals.get("output_height");

  try {
    const newImageData = new ImageData(
      new Uint8ClampedArray(
        outputImageBuffer.data.buffer,
        outputImageBuffer.data.byteOffset,
        outputImageBuffer.data.byteLength
      ),
      outputWidth,
      outputHeight
    );
    return newImageData;
  } finally {
    outputImageBuffer.release();
  }
}

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
  const postReplyMessage = (msg: ReplyMessage) => messagePort.postMessage(msg)

  switch (data.type) {
    case "inputImage": {
      const imageData = data.data.imageData;

      const outputImageData = await filterFn(imageData);

      postReplyMessage({
        type: "outputImage",
        data: {
          imageData: outputImageData
        }
      })
    }
  }
};

// At the end, after all the code is loaded, send the message to notify the worker is ready to receive the messages from the main thread.
ctx.postMessage({
  type: "ready"
})
