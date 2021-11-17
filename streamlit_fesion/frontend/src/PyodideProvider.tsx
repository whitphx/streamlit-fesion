import React, { useState, useEffect, useMemo, useContext } from "react";

interface PyodideContextValue {
  pyodide: Pyodide | undefined;
}
const pyodideContext = React.createContext<PyodideContextValue | undefined>(
  undefined
);

export const usePyodide = (): Pyodide | undefined => {
  const value = useContext(pyodideContext);
  if (value == null) {
    throw new Error("usePyodide() must be used inside <PyodideProvider />.");
  }
  return value.pyodide;
};

interface PyodideProviderProps {
  children: React.ReactNode;
}
const PyodideProvider: React.VFC<PyodideProviderProps> = (props) => {
  const [pyodide, setPyodide] = useState<Pyodide>();

  useEffect(() => {
    loadPyodide({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.18.1/full/",
    }).then(setPyodide);
  }, []);

  const value: PyodideContextValue = useMemo(
    () => ({
      pyodide,
    }),
    [pyodide]
  );

  return (
    <pyodideContext.Provider value={value}>
      {props.children}
    </pyodideContext.Provider>
  );
};

export default PyodideProvider;
