import React from "react";
import { createRoot } from "react-dom/client";
import CssBaseline from "@mui/material/CssBaseline";
import ThemeProvider from "./ThemeProvider";
import { StreamlitProvider } from "streamlit-component-lib-react-hooks";
import MyComponent from "./MyComponent";

const container = document.getElementById("root");
if (container === null) {
  throw new Error("Root element not found");
}
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <CssBaseline />
    <StreamlitProvider>
      <ThemeProvider>
        <MyComponent />
      </ThemeProvider>
    </StreamlitProvider>
  </React.StrictMode>
);
