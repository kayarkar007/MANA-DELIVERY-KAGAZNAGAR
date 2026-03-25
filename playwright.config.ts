import { defineConfig, devices } from '@playwright/test';
const projectRoot = process.cwd();

export default defineConfig({
  testDir: './tests',
  globalSetup: './tests/global.setup.ts',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  webServer: {
    command: 'node ./node_modules/next/dist/bin/next dev . --webpack --port 3000',
    cwd: projectRoot,
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
