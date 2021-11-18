import React, { useState, useCallback, useEffect } from "react";
import { useCamera } from "./camera";
import { usePyodide } from "./PyodideProvider";
import ImageDataPreview from "./ImageDataPreview";
import pythonProgram from "!!raw-loader!./program.py";

const MyComponent: React.VFC = () => {
  const [playing, setPlaying] = useState(false);

  const play = useCallback(() => setPlaying(true), []);
  const stop = useCallback(() => {
    setPlaying(false);
    setFrame(undefined);
  }, []);

  const [frame, setFrame] = useState<ImageData>();

  const pyodide = usePyodide();
  const [pyPackageLoaded, setPyPackageLoaded] = useState(false);
  useEffect(() => {
    if (pyodide == null) {
      return;
    }

    pyodide
      .loadPackage(["numpy"]) // numpy is used in the Python program
      .then(() => setPyPackageLoaded(true));
  }, [pyodide]);

  const onFrame = useCallback(
    async (imageData: ImageData) => {
      if (pyodide == null) {
        console.log("Pyodide is not loaded");
        return;
      }
      if (!pyPackageLoaded) {
        console.log("Python packages have not been loaded.");
        return;
      }

      // TODO: Run in WebWorker
      /* eslint-disable @typescript-eslint/ban-ts-comment */
      // @ts-ignore
      self.fesionImageWidth = imageData.width;
      // @ts-ignore
      self.fesionImageHeight = imageData.height;
      // @ts-ignore
      self.fesionImageData = imageData.data;
      /* eslint-enable */

      await pyodide.runPythonAsync(pythonProgram);

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
        setFrame(newImageData);
      } finally {
        outputImageBuffer.release();
      }
    },
    [pyodide, pyPackageLoaded]
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
