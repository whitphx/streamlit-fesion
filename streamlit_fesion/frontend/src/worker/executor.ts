import type { PyodideInterface } from "pyodide";
import type { PyProxy, PyCallable } from "pyodide/ffi";

export class ImageFilterExecutor {
  private pyodide: PyodideInterface;
  private numpyPromise: Promise<PyProxy>;
  private imageFilterPyFunc: PyCallable | undefined = undefined;

  constructor(pyodide: PyodideInterface) {
    this.pyodide = pyodide;
    this.numpyPromise = this.pyodide
      .loadPackage(["numpy"])
      .then(() => pyodide.pyimport("numpy"));
  }

  public async setFilterFunc(
    funcName: string,
    funcDefPyCode: string,
    requirements: string[]
  ): Promise<void> {
    await this.pyodide.loadPackagesFromImports(funcDefPyCode);
    await this.pyodide.loadPackage(requirements);

    // Delete the previous filter func to avoid memory leaks.
    await this.pyodide.runPythonAsync(`
try:
  del ${funcName}
except NameError:
  pass
    `);

    // Run the Python code including the user-defined filter function.
    await this.pyodide.runPythonAsync(funcDefPyCode);

    this.imageFilterPyFunc = this.pyodide.globals.get(funcName);
  }

  public async executeFilter(imageData: ImageData): Promise<ImageData> {
    const np = await this.numpyPromise;

    const imageFilterPyFunc = this.imageFilterPyFunc;
    if (imageFilterPyFunc == undefined) {
      return imageData;
    }

    const inputImage4chan = np
      .asarray(this.pyodide.toPy(imageData.data))
      .reshape([imageData.height, imageData.width, 4]);
    const inputImage = np.take(inputImage4chan, [0, 1, 2], 2);

    let outputImage = await imageFilterPyFunc(inputImage);

    if (np.issubdtype(outputImage.dtype, np.floating)) {
      outputImage = np.multiply(outputImage, 255).astype(np.uint8);
    }

    const outputHeight = outputImage.shape[0];
    const outputWidth = outputImage.shape[1];

    const outputAlpha = np.full([outputHeight, outputWidth, 1], 255, np.uint8);
    const outputImage4chan = np.concatenate(
      this.pyodide.toPy([outputImage, outputAlpha]),
      2
    );

    const outputImageBuffer = outputImage4chan.getBuffer("u8");

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
}
