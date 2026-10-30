import { defineConfig } from "@playwright/test";
const production = Boolean(process.env.TEST_PRODUCTION);
const url = `http://127.0.0.1:${production ? 4173 : 5173}`;
export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: url,
    viewport: { width: 1440, height: 1000 },
    headless: true,
    launchOptions: process.env.CHROMIUM_PATH
      ? { executablePath: process.env.CHROMIUM_PATH, args: ["--no-sandbox"] }
      : undefined,
  },
  webServer: {
    command: production
      ? "npm run preview -- --port 4173 --strictPort"
      : "npm run dev -- --port 5173 --strictPort",
    url,
    reuseExistingServer: !production && !process.env.CI,
  },
});
