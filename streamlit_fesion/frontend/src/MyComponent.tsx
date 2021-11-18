import React, { useState, useCallback, useEffect } from "react";
import { useCamera } from "./camera";
import { usePyodide } from "./PyodideProvider";
import ImageDataPreview from "./ImageDataPreview";

type ImageDataFilter = (imageData: ImageData) => Promise<ImageData>;

const MyComponent: React.VFC = () => {
  const [playing, setPlaying] = useState(false);

  const play = useCallback(() => setPlaying(true), []);
  const stop = useCallback(() => {
    setPlaying(false);
    setFrame(undefined);
  }, []);

  const [frame, setFrame] = useState<ImageData>();

  // TODO: Make these injectable
  const imageFilterPyFuncDefCode = `
  import skimage

  def filter(input_image):
      grayscale = skimage.color.rgb2gray(input_image)
      return skimage.color.gray2rgb(grayscale)
  `;
  const imageFilterPyFuncName = "filter";
  const iamgeFilterDepPackages = ["scikit-image"];
  const imageFilterDepPackagesJson = JSON.stringify(iamgeFilterDepPackages); // Serialize for memoization

  const [imageDataFilter, setImageDataFilter] =
    useState<{ fn: ImageDataFilter }>();

  const pyodide = usePyodide();
  useEffect(() => {
    if (pyodide == null) {
      return;
    }

    const filterDepPackages: string[] = JSON.parse(imageFilterDepPackagesJson);

    (async () => {
      await pyodide
        .loadPackage(["numpy"]) // numpy is used in the Python program
        .then(() => pyodide.runPythonAsync("import numpy as np"));

      await pyodide.loadPackage(filterDepPackages);

      // Run Python code including a function definition
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

        await pyodide.runPythonAsync(`
        from js import fesionImageWidth, fesionImageHeight, fesionImageData  # Import from JS globals

        input_image4chan = np.asarray(fesionImageData.to_py()).reshape((fesionImageHeight, fesionImageWidth, 4)) # 4 channels (RGBA)
        input_image = input_image4chan[:,:,:3]

        output_image = ${imageFilterPyFuncName}(input_image)

        if np.issubdtype(output_image.dtype, np.floating):
            output_image = (output_image * 255).astype(np.uint8)

        output_alpha = np.full((fesionImageHeight, fesionImageWidth, 1), fill_value=255, dtype=np.uint8)
        output_image4chan = np.concatenate((output_image, output_alpha), axis=2).copy()

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
      };

      setImageDataFilter({ fn: filterFn });
    })();
  }, [
    pyodide,
    imageFilterPyFuncName,
    imageFilterPyFuncDefCode,
    imageFilterDepPackagesJson,
  ]);

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
