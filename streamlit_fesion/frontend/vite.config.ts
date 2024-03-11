import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "./", // Necessary for the Streamlit component to solve the frontend path
  plugins: [react()],
});
