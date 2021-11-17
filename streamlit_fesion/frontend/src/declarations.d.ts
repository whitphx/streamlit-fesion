interface Pyodide {
  runPython: (code: string, globals?: any) => any;
  runPythonAsync: (code: string) => Promise<any>;
}
declare let loadPyodide: (options: any) => Promise<Pyodide>;
