/**
 * Capture agrandie d'un sélecteur du /styleguide (jugement de détails
 * typographiques — porte G1). deviceScaleFactor 3 pour voir le trait.
 *
 * Usage : node scripts/capture-zoom.mjs --selector .h1-c-outline --file zoom.png
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try {
    return require('playwright');
  } catch {
    const extra = process.env.PLAYWRIGHT_MODULES;
    if (!extra) throw new Error('playwright introuvable');
    return createRequire(path.join(extra, 'noop.js'))('playwright');
  }
})();

const argv = process.argv.slice(2);
function arg(name, fallback) {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
}

const BASE = arg('base', 'http://localhost:4321');
const SELECTOR = arg('selector', '.h1-c-outline');
const FILE = arg('file', 'zoom.png');
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(scriptDir, '..', 'shots');

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 3,
  locale: 'fr-FR',
});
const page = await context.newPage();
await page.addInitScript(() => localStorage.setItem('theme', 'light'));
await page.goto(`${BASE}/styleguide`, { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const element = page.locator(SELECTOR).first();
await element.scrollIntoViewIfNeeded();
await page.waitForTimeout(200);
await element.screenshot({ path: path.join(OUT, FILE) });
process.stdout.write(`→ shots/${FILE}\n`);
await browser.close();
