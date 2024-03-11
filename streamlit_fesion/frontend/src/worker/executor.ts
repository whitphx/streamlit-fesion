import type { PyodideInterface } from "pyodide";
import type { PyProxy } from "pyodide/ffi";

declare const self: DedicatedWorkerGlobalScope;

const NUMPY_GLOBAL_ALIAS = "gai6sa2eM9Atiev5Shu5ohtie6phai8i"; // To avoid name conflict

export class ImageFilterExecutor {
  private pyodide: PyodideInterface;
  private setupPromise: Promise<void>;
  private imageFilterPyFuncName: string | undefined = undefined;

  constructor(pyodide: PyodideInterface) {
    this.pyodide = pyodide;
    this.setupPromise = this.pyodide
      .loadPackage(["numpy"])
      .then(() =>
        pyodide.runPythonAsync(`import numpy as ${NUMPY_GLOBAL_ALIAS}`)
      )
      .then(() => pyodide.runPythonAsync(`import asyncio`));
  }

  public setFilterFunc(
    funcName: string,
    funcDefPyCode: string,
    requirements: string[]
  ): Promise<void> {
    this.setupPromise = this.setupPromise.then(async () => {
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

      this.imageFilterPyFuncName = funcName;
    });

    return this.setupPromise;
  }

  public async executeFilter(imageData: ImageData): Promise<ImageData> {
    await this.setupPromise;

    const imageFilterPyFuncName = this.imageFilterPyFuncName;
    if (imageFilterPyFuncName == undefined) {
      return imageData;
    }

    /* eslint-disable @typescript-eslint/ban-ts-comment */
    // @ts-ignore
    self.fesionImageWidth = imageData.width;
    // @ts-ignore
    self.fesionImageHeight = imageData.height;
    // @ts-ignore
    self.fesionImageData = imageData.data;
    /* eslint-enable */

    await this.pyodide.runPythonAsync(`
    from js import fesionImageWidth, fesionImageHeight, fesionImageData  # Import from JS globals

    input_image4chan = ${NUMPY_GLOBAL_ALIAS}.asarray(fesionImageData.to_py()).reshape((fesionImageHeight, fesionImageWidth, 4)) # 4 channels (RGBA)
    input_image = input_image4chan[:,:,:3]

    if asyncio.iscoroutinefunction(${imageFilterPyFuncName}):
        output_image = await ${imageFilterPyFuncName}(input_image)
    else:
        output_image = ${imageFilterPyFuncName}(input_image)

    if ${NUMPY_GLOBAL_ALIAS}.issubdtype(output_image.dtype, ${NUMPY_GLOBAL_ALIAS}.floating):
        output_image = (output_image * 255).astype(${NUMPY_GLOBAL_ALIAS}.uint8)

    output_alpha = ${NUMPY_GLOBAL_ALIAS}.full((fesionImageHeight, fesionImageWidth, 1), fill_value=255, dtype=${NUMPY_GLOBAL_ALIAS}.uint8)
    output_image4chan = ${NUMPY_GLOBAL_ALIAS}.concatenate((output_image, output_alpha), axis=2).copy()

    output_height, output_width = output_image4chan.shape[:2]
    `);

    const outputImageProxy: PyProxy =
      this.pyodide.globals.get("output_image4chan");
    const outputImageBuffer = outputImageProxy.getBuffer("u8");
    outputImageProxy.destroy();

    const outputWidth: number = this.pyodide.globals.get("output_width");
    const outputHeight: number = this.pyodide.globals.get("output_height");

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
