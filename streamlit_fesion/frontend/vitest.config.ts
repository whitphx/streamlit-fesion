import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      name: "chrome", // browser name is required
    },
    testTimeout: 30 * 1000,
  },
});
