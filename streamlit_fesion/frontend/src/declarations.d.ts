interface PyBuffer {
  data: TypedArray
  release(): void;
}

interface PyProxy {
  length: number;
  type: string;
  get(key: string): any;
  getBuffer(type: string): PyBuffer;
  destroy(destroyed_msg?: string): void;
};

interface Pyodide {
  globals: PyProxy
  loadPackage(names: string | string[], messageCallback?: (log: string) => void, errorCallback?: (log: string) => void): Promise<void>;
  runPython(code: string, globals?: any): any;
  runPythonAsync(code: string): Promise<any>;
}
declare let loadPyodide: (options: any) => Promise<Pyodide>;

declare module "!!raw-loader!*" {
  const content: string;
  export default content;
}
