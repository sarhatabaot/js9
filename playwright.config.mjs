import { defineConfig, devices } from "@playwright/test";
import { PORT } from "./tests/e2e/support/serve.mjs";

// JS9 end-to-end suite. A local static server serves the repo root; specs load
// a JS9 harness page and drive the public API (see tests/e2e/support/js9.mjs).
// Test data is limited to the committed tiny FITS — data-dependent and
// server-side tests from smoke.py are out of scope (see tests/e2e/README.md).
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "list" : [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
  ],
  webServer: {
    command: "node tests/e2e/support/serve.mjs",
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});
