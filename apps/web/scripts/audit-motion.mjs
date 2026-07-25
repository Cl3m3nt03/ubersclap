/**
 * Audit d'un bloc de la section FeatureTabs (§7, étapes 6-7) :
 * 1. prefers-reduced-motion → aucune animation en cours d'exécution
 *    (getAnimations, playState réel — pas un sélecteur CSS approximatif),
 *    barre de progression absente, enchaînement inerte.
 * 2. 320 / 375 / 390 → aucun scroll horizontal de page.
 *
 * Usage : node scripts/audit-motion.mjs
 */

import path from 'node:path';
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

const BASE = process.env.BASE ?? 'http://localhost:4321';
const browser = await chromium.launch();

// ---- 1. reduced-motion : plus aucune boucle, nulle part. ----
{
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    reducedMotion: 'reduce',
    locale: 'fr-FR',
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/styleguide`, { waitUntil: 'networkidle' });
  await page.locator('.ft').first().scrollIntoViewIfNeeded();
  await page.waitForTimeout(800);

  const report = await page.evaluate(() => {
    const root = document.querySelector('.ft');
    const running = root
      .getAnimations({ subtree: true })
      .filter((a) => a.playState === 'running')
      .map((a) => {
        const target = a.effect?.target;
        return `${a.animationName ?? a.constructor.name} on .${[...(target?.classList ?? [])].join('.')}`;
      });
    const bars = [...root.querySelectorAll('.ft-tab-progress')].map(
      (b) => getComputedStyle(b).display,
    );
    return { running, bars };
  });

  // L'enchaînement : l'onglet actif ne doit pas changer tout seul.
  const before = await page
    .locator('.ft [role="tab"][aria-selected="true"]')
    .first()
    .textContent();
  await page.waitForTimeout(8000);
  const after = await page
    .locator('.ft [role="tab"][aria-selected="true"]')
    .first()
    .textContent();

  console.log('— reduced-motion —');
  console.log(
    `animations running dans .ft : ${report.running.length === 0 ? 'AUCUNE ✓' : report.running.join(' | ')}`,
  );
  console.log(
    `barres de progression : ${report.bars.every((d) => d === 'none') ? 'toutes display:none ✓' : report.bars.join(', ')}`,
  );
  console.log(
    `enchaînement après 8 s : ${before?.trim() === after?.trim() ? `onglet inchangé (${before?.trim()}) ✓` : `A CHANGÉ ${before?.trim()} → ${after?.trim()} ✗`}`,
  );
  await context.close();
}

// ---- 2. repli mobile : pas de scroll horizontal de page. ----
for (const width of [320, 375, 390]) {
  const context = await browser.newContext({
    viewport: { width, height: 844 },
    locale: 'fr-FR',
    isMobile: true,
    hasTouch: true,
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/styleguide`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      pageOverflow: doc.scrollWidth > doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
  console.log(
    `— ${width}px — scroll horizontal page : ${overflow.pageOverflow ? `OUI ✗ (${overflow.scrollWidth} > ${overflow.clientWidth})` : 'non ✓'}`,
  );
  await context.close();
}

await browser.close();
