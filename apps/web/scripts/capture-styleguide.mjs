/**
 * Captures du /styleguide — porte G1 (SETUP_PLAN.md, phase 5).
 *
 * 1440 et 390, thèmes clair et sombre → apps/web/shots/.
 * Prérequis : `pnpm preview` (ou un serveur sur --base).
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
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(scriptDir, '..', arg('out', 'shots'));

fs.mkdirSync(OUT, { recursive: true });

const SHOTS = [
  { file: 'styleguide-1440-light.png', width: 1440, theme: 'light' },
  { file: 'styleguide-1440-dark.png', width: 1440, theme: 'dark' },
  { file: 'styleguide-390-light.png', width: 390, theme: 'light' },
  { file: 'styleguide-390-dark.png', width: 390, theme: 'dark' },
];

const browser = await chromium.launch();

for (const shot of SHOTS) {
  const context = await browser.newContext({
    viewport: { width: shot.width, height: 900 },
    deviceScaleFactor: shot.width < 800 ? 2 : 1,
    locale: 'fr-FR',
  });
  const page = await context.newPage();
  await page.addInitScript((theme) => localStorage.setItem('theme', theme), shot.theme);
  await page.goto(`${BASE}/styleguide`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, shot.file), fullPage: true });
  process.stdout.write(`→ ${shot.file}\n`);
  await context.close();
}

await browser.close();
process.stdout.write(`Captures écrites dans ${OUT}\n`);
