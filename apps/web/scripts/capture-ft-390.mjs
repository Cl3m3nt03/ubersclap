/**
 * Capture des cinq onglets FeatureTabs en 390px, animations GELÉES à un
 * instant précis de la boucle (délai négatif + paused) — jamais de capture
 * mi-crossfade illisible.
 *
 * Usage : node scripts/capture-ft-390.mjs [--t 2000] [--theme light]
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
const FREEZE_MS = Number(arg('t', '2000'));
const THEME = arg('theme', 'light');
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(scriptDir, '..', 'shots');
fs.mkdirSync(OUT, { recursive: true });

// Ordre du DOM (FeatureTabs.astro:182-222).
const TABS = ['agenda', 'clients', 'facturation', 'depenses', 'tableau'];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  locale: 'fr-FR',
  isMobile: true,
  hasTouch: true,
});
const page = await context.newPage();
await page.addInitScript((theme) => localStorage.setItem('theme', theme), THEME);
await page.goto(`${BASE}/styleguide`, { waitUntil: 'networkidle' });
await page.waitForTimeout(400);

for (let i = 0; i < TABS.length; i += 1) {
  const key = TABS[i];
  // Sélectionne l'onglet (le premier clic arrête l'enchaînement — voulu ici).
  await page.locator('.ft [role="tab"]').nth(i).click();
  await page.waitForTimeout(150);

  // Gel : coupe tout, reflow, puis rejoue chaque animation en paused avec
  // un délai négatif — l'instant t de la boucle, net, sans crossfade flou.
  await page.evaluate((freezeMs) => {
    const targets = document.querySelectorAll(
      '.ft [class*="ma-"], .ft .ft-fragment, .ft .scr',
    );
    for (const el of targets) el.style.animation = 'none';
    void document.body.offsetHeight; // reflow → redémarrage propre
    for (const el of targets) {
      el.style.animation = '';
      el.style.animationDelay = `-${freezeMs}ms`;
      el.style.animationPlayState = 'paused';
    }
  }, FREEZE_MS);
  await page.waitForTimeout(120);

  const section = page.locator('.ft').first();
  await section.scrollIntoViewIfNeeded();
  await page.waitForTimeout(120);
  const file = `ft-${key}-390.png`;
  await section.screenshot({ path: path.join(OUT, file) });
  process.stdout.write(`→ shots/${file}\n`);
}

await browser.close();
