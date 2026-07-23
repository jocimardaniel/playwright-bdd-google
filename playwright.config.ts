import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'never' }]],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], headless: true }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], headless: true }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], headless: true }
    }
  ],
  use: {
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    trace: 'retain-on-failure'
  }
});
