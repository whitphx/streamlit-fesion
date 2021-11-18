import React from "react";
import ReactDOM from "react-dom";
import CssBaseline from "@mui/material/CssBaseline";
import ThemeProvider from "./ThemeProvider";
import { StreamlitProvider } from "streamlit-component-lib-react-hooks";
import PyodideProvider from "./PyodideProvider";
import MyComponent from "./MyComponent";

ReactDOM.render(
  <React.StrictMode>
    <CssBaseline />
    <StreamlitProvider>
      <ThemeProvider>
        <PyodideProvider>
          <MyComponent />
        </PyodideProvider>
      </ThemeProvider>
    </StreamlitProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
