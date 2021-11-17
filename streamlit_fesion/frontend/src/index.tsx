import React from "react"
import ReactDOM from "react-dom"
import { StreamlitProvider } from "streamlit-component-lib-react-hooks"
import PyodideProvider from "./PyodideProvider"
import MyComponent from "./MyComponent"

ReactDOM.render(
  <React.StrictMode>
    <StreamlitProvider>
      <PyodideProvider>
        <MyComponent />
      </PyodideProvider>
    </StreamlitProvider>
  </React.StrictMode>,
  document.getElementById("root")
)
