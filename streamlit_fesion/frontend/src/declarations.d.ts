interface PyBuffer {
  data: TypedArray;
  release(): void;
}

interface PyProxy {
  length: number;
  type: string;
  get(key: string): any;
  getBuffer(type: string): PyBuffer;
  destroy(destroyed_msg?: string): void;
}

declare namespace Pyodide {
  type LogFn = (log: string) => void;
}

interface Pyodide {
  globals: PyProxy;
  loadPackage(
    names: string | string[],
    messageCallback?: Pyodide.LogFn,
    errorCallback?: Pyodide.LogFn
  ): Promise<void>;
  loadPackagesFromImports(
    code: string,
    messageCallback?: Pyodide.LogFn,
    errorCallback?: Pyodide.LogFn
  ): Promise<void>;
  runPython(code: string, globals?: any): any;
  runPythonAsync(code: string): Promise<any>;
}
declare let loadPyodide: (options: any) => Promise<Pyodide>;
