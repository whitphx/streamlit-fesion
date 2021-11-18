import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRenderData } from "streamlit-component-lib-react-hooks";
import { useCamera } from "./camera";
import { usePyodide } from "./PyodideProvider";
import ImageDataPreview from "./ImageDataPreview";
import { setComponentValue } from "./component-value";

type ImageDataFilter = (imageData: ImageData) => Promise<ImageData>;

const NUMPY_GLOBAL_ALIAS = "gai6sa2eM9Atiev5Shu5ohtie6phai8i"; // To avoid name conflict

const MyComponent: React.VFC = () => {
  const renderData = useRenderData();

  const imageFilterPyFuncDefCode = renderData.args["func_def_code"];
  const imageFilterPyFuncName = renderData.args["func_name"];
  const iamgeFilterDepPackages: string[] | null =
    renderData.args["dep_packages"];
  const imageFilterDepPackagesJson = JSON.stringify(iamgeFilterDepPackages); // Serialize for memoization

  const [imageDataFilter, setImageDataFilter] =
    useState<{ fn: ImageDataFilter }>();

  const pyodide = usePyodide();
  useEffect(() => {
    setComponentValue({ pythonError: null });

    if (pyodide == null) {
      return;
    }

    const filterDepPackages: string[] | null = JSON.parse(
      imageFilterDepPackagesJson
    );

    (async () => {
      // Import NumPy, which is used in the wrapper script.
      await pyodide
        .loadPackage(["numpy"])
        .then(() =>
          pyodide.runPythonAsync(`import numpy as ${NUMPY_GLOBAL_ALIAS}`)
        );

      // Load packages used in the user-defined filter function.
      await pyodide.loadPackagesFromImports(imageFilterPyFuncDefCode);
      if (filterDepPackages) {
        await pyodide.loadPackage(filterDepPackages);
      }

      // Run the Python code including the user-defined filter function.
      await pyodide.runPythonAsync(imageFilterPyFuncDefCode);

      const filterFn: ImageDataFilter = async (imageData) => {
        // TODO: Run in WebWorker
        /* eslint-disable @typescript-eslint/ban-ts-comment */
        // @ts-ignore
        self.fesionImageWidth = imageData.width;
        // @ts-ignore
        self.fesionImageHeight = imageData.height;
        // @ts-ignore
        self.fesionImageData = imageData.data;
        /* eslint-enable */

        try {
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
        } catch (err: any) {
          if (err.name === "PythonError") {
            const serializableError = {
              stack: err.stack,
              message: err.message,
            };
            setComponentValue({ pythonError: serializableError });
          }
          setPlaying(false);
          throw err;
        }

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
      };

      setImageDataFilter({ fn: filterFn });
    })();
  }, [
    pyodide,
    imageFilterPyFuncName,
    imageFilterPyFuncDefCode,
    imageFilterDepPackagesJson,
  ]);

  const [frame, setFrame] = useState<ImageData>();

  const [playing, setPlaying] = useState(false);

  const play = useCallback(() => setPlaying(true), []);
  const stop = useCallback(() => {
    setPlaying(false);
    setFrame(undefined);
  }, []);

  const playingRef = useRef(false);
  playingRef.current = playing;
  const onFrame = useCallback(
    async (imageData: ImageData) => {
      if (pyodide == null) {
        console.log("Pyodide is not loaded");
        return;
      }
      if (!imageDataFilter) {
        console.log("Python packages have not been loaded.");
        return;
      }

      const outImageData = await imageDataFilter.fn(imageData);

      // Here is called asynchronously, so use ref to check the `playing` value.
      if (!playingRef.current) {
        setFrame(undefined);
        return;
      }
      setFrame(outImageData);
    },
    [pyodide, imageDataFilter]
  );

  useCamera({
    playing,
    videoConstraints: true,
    onFrame,
  });

  return (
    <div>
      <div>{frame && <ImageDataPreview imageData={frame} />}</div>
      <div>
        {playing ? (
          <button onClick={stop}>Stop</button>
        ) : (
          <button onClick={play}>Play</button>
        )}
      </div>
    </div>
  );
};

export default MyComponent;
