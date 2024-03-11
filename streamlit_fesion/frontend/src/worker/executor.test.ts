import type { PyodideInterface } from "pyodide";
import { describe, it, beforeEach, expect } from "vitest";
import { ImageFilterExecutor } from "./executor";
import { setupPyodideForTest } from "./test-utils";

describe("ImageFilterExecutor", () => {
  let pyodide: PyodideInterface;

  beforeEach(async () => {
    pyodide = await setupPyodideForTest();
  });

  [true, false].forEach((isFilterFnAsync) => {
    it(`should register a Python filter function and execute it with an input image (${
      isFilterFnAsync ? "async" : "sync"
    })`, async () => {
      const executor = new ImageFilterExecutor(pyodide);
      await executor.setFilterFunc(
        "flip",
        `
${isFilterFnAsync ? "async " : ""}def flip(img):
    flipped = img[:,::-1,:]
    return flipped
    `,
        ["numpy"]
      );
      const imageData = new ImageData(
        new Uint8ClampedArray(640 * 320 * 4),
        640,
        320
      );
      // Set white color at (0, 0)
      imageData.data[0] = 255;
      imageData.data[1] = 255;
      imageData.data[2] = 255;
      imageData.data[3] = 255;

      const output = await executor.executeFilter(imageData);

      // Except (0, 0) is black because of flip
      expect(output.data[0]).toBe(0);
      expect(output.data[1]).toBe(0);
      expect(output.data[2]).toBe(0);
      expect(output.data[3]).toBe(255);
      // Except (639, 0) is white because of flip
      expect(output.data[639 * 4 + 0]).toBe(255);
      expect(output.data[639 * 4 + 1]).toBe(255);
      expect(output.data[639 * 4 + 2]).toBe(255);
      expect(output.data[639 * 4 + 3]).toBe(255);
    });
  });
});
