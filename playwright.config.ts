import { defineConfig, devices } from "@playwright/test";

// Runs the production build against e2e/mock-api.mjs (a stand-in for the SideKick API).
const env = { SIDEKICK_API_URL: "http://127.0.0.1:4999", PUBLIC_SITE_TOKEN: "test-site-token" };

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  use: { baseURL: "http://127.0.0.1:3311", reducedMotion: "reduce" },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } },
    { name: "mobile", use: { ...devices["Desktop Chrome"], viewport: { width: 390, height: 844 }, hasTouch: true } },
  ],
  webServer: [
    { command: "node e2e/mock-api.mjs", url: "http://127.0.0.1:4999/v1/public/pricing", reuseExistingServer: !process.env.CI },
    { command: "npm run build && npx next start -p 3311", url: "http://127.0.0.1:3311/pricing", env, timeout: 240_000, reuseExistingServer: !process.env.CI },
  ],
});
