import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  use: {
    baseURL: "http://localhost:5173",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
    env: { VITE_MOCK_CAPTURE: "1" },
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
