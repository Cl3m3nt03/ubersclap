/**
 * Contraste WCAG du texte blanc sur les fins de gradient (DESIGN_CONTEXT.md §4).
 *
 * Résolu par la composition (§4, §9) : le texte vit dans les 60 % supérieurs-
 * gauche, côté sombre du 135°. Ce script mesure donc DEUX choses :
 *  1. les extrémités théoriques des gradients (référence) ;
 *  2. avec --live, les ratios AUX POSITIONS RÉELLES du texte dans les
 *     StatCards rendues du /styleguide (pire point = coin bas-droit de chaque
 *     bloc de texte, interpolation sRGB du 135°).
 *
 * Seuils WCAG : 4,5:1 texte courant · 3:1 grand texte (≥24px, ou ≥18,66px
 * gras). Le label 14px 800 doit donc atteindre 4,5:1 ; la valeur ~30px 800
 * doit atteindre 3:1.
 *
 * Les couleurs viennent de @cadance/shared, jamais recopiées ici.
 */

import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const { gradient } = require('@cadance/shared');

function channel(value) {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function parseHex(hex) {
  const n = hex.replace('#', '');
  return [
    parseInt(n.slice(0, 2), 16),
    parseInt(n.slice(2, 4), 16),
    parseInt(n.slice(4, 6), 16),
  ];
}

function luminance(hex) {
  const [r, g, b] = parseHex(hex);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function ratio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** Couleur du gradient 135° au point (x, y) d'une boîte w×h — interpolation sRGB. */
function gradientColorAt(from, to, w, h, x, y) {
  // CSS : 0deg = vers le haut, sens horaire. 135° pointe vers le bas-droit.
  const angle = (135 * Math.PI) / 180;
  const dx = Math.sin(angle);
  const dy = -Math.cos(angle);
  const lineLength = Math.abs(w * Math.sin(angle)) + Math.abs(h * Math.cos(angle));
  const t = Math.min(1, Math.max(0, 0.5 + ((x - w / 2) * dx + (y - h / 2) * dy) / lineLength));
  const a = parseHex(from);
  const b = parseHex(to);
  const mix = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `#${mix.map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

const WHITE = '#FFFFFF';

process.stdout.write('— Extrémités théoriques des gradients —\n');
for (const [name, [from, to]] of Object.entries(gradient)) {
  const rStart = ratio(WHITE, from);
  const rEnd = ratio(WHITE, to);
  process.stdout.write(
    `${name.padEnd(7)} début ${from} : ${rStart.toFixed(2)}:1 · fin ${to} : ${rEnd.toFixed(2)}:1\n`,
  );
}

if (!process.argv.includes('--live')) process.exit(0);

// ---- Mesure aux positions réelles du texte (nécessite un serveur) ----

const BASE = process.env.STYLEGUIDE_URL ?? 'http://localhost:4321';

const { chromium } = (() => {
  try {
    return require('playwright');
  } catch {
    const extra = process.env.PLAYWRIGHT_MODULES;
    if (!extra) throw new Error('playwright introuvable');
    return createRequire(path.join(extra, 'noop.js'))('playwright');
  }
})();

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto(`${BASE}/styleguide`, { waitUntil: 'networkidle' });

const cards = await page.evaluate(() => {
  return [...document.querySelectorAll('.statcard')].map((card) => {
    const cardBox = card.getBoundingClientRect();
    const tone = [...card.classList].find((c) => c.startsWith('statcard-') && c !== 'statcard-text').replace('statcard-', '');
    const parts = ['label', 'value', 'footer'].flatMap((kind) => {
      const el = card.querySelector(`.statcard-${kind}`);
      if (!el) return [];
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return [{
        kind,
        fontSize: parseFloat(style.fontSize),
        fontWeight: style.fontWeight,
        // Pire point : coin bas-droit du bloc de texte, relatif à la carte.
        x: box.right - cardBox.left,
        y: box.bottom - cardBox.top,
      }];
    });
    return { tone, width: cardBox.width, height: cardBox.height, parts };
  });
});

await browser.close();

let failures = 0;
process.stdout.write('\n— Ratios aux positions réelles du texte (pire point : coin bas-droit) —\n');
for (const card of cards) {
  const [from, to] = gradient[card.tone];
  process.stdout.write(`${card.tone} (carte ${Math.round(card.width)}×${Math.round(card.height)}px)\n`);
  for (const part of card.parts) {
    const bg = gradientColorAt(from, to, card.width, card.height, part.x, part.y);
    const r = ratio(WHITE, bg);
    // Grand texte WCAG : ≥24px, ou ≥18,66px en gras (700+).
    const isLarge = part.fontSize >= 24 || (part.fontSize >= 18.66 && Number(part.fontWeight) >= 700);
    const threshold = isLarge ? 3 : 4.5;
    const ok = r >= threshold;
    if (!ok) failures += 1;
    process.stdout.write(
      `  ${part.kind.padEnd(6)} ${String(part.fontSize)}px/${part.fontWeight} · fond ${bg} à (${Math.round(part.x)},${Math.round(part.y)}) : ` +
        `${r.toFixed(2)}:1 (seuil ${threshold}:1) ${ok ? 'OK' : 'ÉCHEC'}\n`,
    );
  }
}

process.exit(failures > 0 ? 2 : 0);
