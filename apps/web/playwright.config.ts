import { defineConfig } from '@playwright/test';

/**
 * Config Playwright — verify:a11y et verify:visual (SETUP_PLAN.md, phase 9).
 *
 * Le webServer démarre le site construit ; les specs sont des squelettes
 * (test.skip) jusqu'à la phase 9.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4321',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
  },
  webServer: {
    command: 'pnpm preview',
    url: 'http://localhost:4321',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
