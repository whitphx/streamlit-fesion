import { loadPyodide, type PyodideInterface, version } from "pyodide";

export const IS_NODE = typeof window === "undefined";

export async function setupPyodideForTest(
  requirements: string[] = []
): Promise<PyodideInterface> {
  const pyodide = await loadPyodide({
    indexURL: IS_NODE
      ? "node_modules/pyodide" // pnpm puts pyodide at this path
      : `https://cdn.jsdelivr.net/pyodide/v${version}/full/`, // In the CI env, it looks like only the remove URL works in web browser.
  });
  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");

  await micropip.install(requirements);

  return pyodide;
}

export async function downloadFile(
  pyodide: PyodideInterface,
  url: string,
  path: string
) {
  const response = await fetch(url);
  const fileData = await response.arrayBuffer();
  pyodide.FS.writeFile(path, new Uint8Array(fileData));
}
