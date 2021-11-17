interface Pyodide {
  runPython: (code: string, globals?: any) => any;
  runPythonAsync: (code: string) => Promise<any>;
}
declare let loadPyodide: (options: any) => Promise<Pyodide>;

declare module "!!raw-loader!*" {
  const content: string;
  export default content;
}
