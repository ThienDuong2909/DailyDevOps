import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
const apiURL = process.env.PLAYWRIGHT_API_URL || "http://localhost:3001";

export default defineConfig({
  testDir: "./tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: process.env.CI
    ? [
        {
          command: "node .next/standalone/server.js",
          cwd: ".",
          url: baseURL,
          timeout: 180_000,
          reuseExistingServer: true,
          stdout: "pipe",
          stderr: "pipe",
          env: {
            PORT: "3000",
            HOSTNAME: "0.0.0.0",
            NEXT_PUBLIC_API_URL: apiURL,
            INTERNAL_API_URL: apiURL,
          },
        },
      ]
    : [
        {
          command: "npm start",
          cwd: "../server-nodejs",
          url: `${apiURL}/health`,
          timeout: 120_000,
          reuseExistingServer: true,
        },
        {
          command: "npm run dev",
          cwd: ".",
          url: baseURL,
          timeout: 120_000,
          reuseExistingServer: true,
          env: {
            NEXT_PUBLIC_API_URL: apiURL,
            INTERNAL_API_URL: apiURL,
          },
        },
      ],
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
      },
    },
  ],
});
