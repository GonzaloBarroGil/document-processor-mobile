import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    environmentOptions: {
      jsdom: {
        url: "http://localhost:3000",
      },
    },
    setupFiles: ["./src/test-setup.ts"],
    exclude: ["e2e/**", "node_modules/**"],
    coverage: {
      provider: "v8",
      include: ["src/queue/**", "src/sync/**", "src/capture/**"],
      thresholds: {
        lines: 80,
        functions: 80,
        statements: 80,
        branches: 80,
      },
    },
  },
});
