/**
 * Captures ciblées pour la porte G1 : le panneau crème à côté du fond de
 * page, et le H1 « Le contour » isolé — 1440 et 390, deux thèmes.
 * Prérequis : serveur sur --base (pnpm preview).
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
  // Le crème face au fond de page, pour juger l'écart.
  { file: 'g1-panel-1440-light.png', width: 1440, theme: 'light', selector: '[aria-labelledby="titre-panneau"]' },
  // H1 « Le contour » — 1440 et 390, deux thèmes.
  { file: 'g1-h1-1440-light.png', width: 1440, theme: 'light', selector: '[aria-labelledby="titre-h1"]' },
  { file: 'g1-h1-1440-dark.png', width: 1440, theme: 'dark', selector: '[aria-labelledby="titre-h1"]' },
  { file: 'g1-h1-390-light.png', width: 390, theme: 'light', selector: '[aria-labelledby="titre-h1"]' },
  { file: 'g1-h1-390-dark.png', width: 390, theme: 'dark', selector: '[aria-labelledby="titre-h1"]' },
  // Contrôle : le contour FORCÉ à 390 pour juger si le trait tient.
  { file: 'g1-h1-390-light-contour-force.png', width: 390, theme: 'light', selector: '[aria-labelledby="titre-h1"]', forceContour: true },
];

const browser = await chromium.launch();

for (const shot of SHOTS) {
  const context = await browser.newContext({
    viewport: { width: shot.width, height: 1000 },
    deviceScaleFactor: 2,
    locale: 'fr-FR',
  });
  const page = await context.newPage();
  await page.addInitScript((theme) => localStorage.setItem('theme', theme), shot.theme);
  await page.goto(`${BASE}/styleguide`, { waitUntil: 'networkidle' });
  if (shot.forceContour) {
    await page.evaluate(() => {
      const el = document.querySelector('.h1-c-outline');
      const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink');
      el.style.color = 'transparent';
      el.style.webkitTextStroke = `2px ${ink}`;
    });
  }
  await page.waitForTimeout(600);
  const element = page.locator(shot.selector);
  await element.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  await element.screenshot({ path: path.join(OUT, shot.file) });
  process.stdout.write(`→ ${shot.file}\n`);
  await context.close();
}

await browser.close();
process.stdout.write(`Captures écrites dans ${OUT}\n`);
