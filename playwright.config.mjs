// Tests WebKit (moteur de Safari) avec émulation tactile iPhone et iPad.
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests',
  timeout: 60_000,
  fullyParallel: true,
  reporter: [['list']],
  use: { baseURL: 'http://localhost:8090/' },
  webServer: {
    command: 'node tests/serve.mjs',
    url: 'http://localhost:8090/',
    reuseExistingServer: true,
  },
  projects: [
    { name: 'iphone-portrait', use: { ...devices['iPhone 13'] } },
    { name: 'iphone-paysage', use: { ...devices['iPhone 13 landscape'] } },
    { name: 'ipad-portrait', use: { ...devices['iPad Pro 11'] } },
    { name: 'ipad-paysage', use: { ...devices['iPad Pro 11 landscape'] } },
  ],
});
