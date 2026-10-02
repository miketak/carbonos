import { defineConfig } from '@playwright/test'

/**
 * Two projects, one per driver. Both run the generated procedures serially,
 * in procedure order, with one worker and no retries: a procedure chains its
 * state from the one before, and a flaky step is a finding, not a retry.
 */
export default defineConfig({
  testDir: 'generated',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 10 * 60 * 1000,
  expect: { timeout: 15_000 },
  use: { actionTimeout: 15_000, navigationTimeout: 30_000 },
  reporter: [['list'], ['json', { outputFile: 'out/report.json' }]],
  outputDir: 'out/artifacts',
  projects: [
    { name: 'api', testMatch: /api\/.*\.api\.spec\.ts/ },
    {
      name: 'ui',
      testMatch: /ui\/.*\.ui\.spec\.ts/,
      use: { viewport: { width: 1440, height: 900 }, trace: 'retain-on-failure', actionTimeout: 15_000, navigationTimeout: 30_000 },
    },
  ],
})
