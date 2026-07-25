/**
 * verify:tokens — le garde-fou anti-dérive (SETUP_PLAN.md, phase 9).
 *
 * Échoue si, hors tokens.css (généré) :
 *  - une couleur hex, rgb() ou hsl() est écrite en dur dans src/ ;
 *  - le nom de marque est écrit en dur (il vient de brand.ts / --brand-name).
 *  - le mot « taxi » apparaît : VTC et taxi sont deux professions
 *    juridiquement distinctes, faute rédhibitoire pour la cible
 *    (DESIGN_CONTEXT.md §1).
 *
 * Exécutable dès la phase 4 : il protège tout ce qui sera écrit ensuite.
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const SRC = path.resolve(scriptDir, '../src');
const TOKENS = path.resolve(SRC, 'styles/tokens.css');

const EXTENSIONS = new Set(['.astro', '.css', '.ts', '.tsx', '.js', '.mjs', '.html', '.svelte', '.vue']);

/** Le nom de marque, lu depuis la seule source autorisée. */
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { BRAND_NAME } = require('@cadance/shared');

const HEX = /#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})\b/;
const COLOR_FN = /\b(?:rgb|rgba|hsl|hsla|oklch|color-mix)\(/;
const BRAND = new RegExp(`\\b${BRAND_NAME}\\b`);
const TAXI = /taxi/i;

const failures = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (!EXTENSIONS.has(path.extname(entry.name))) continue;
    if (full === TOKENS) continue;

    const lines = fs.readFileSync(full, 'utf8').split('\n');
    lines.forEach((line, index) => {
      const where = `${path.relative(process.cwd(), full)}:${index + 1}`;
      if (HEX.test(line)) failures.push(`${where} — couleur hex en dur : ${line.trim()}`);
      else if (COLOR_FN.test(line) && !line.includes('var(--'))
        failures.push(`${where} — fonction couleur en dur : ${line.trim()}`);
      if (BRAND.test(line)) failures.push(`${where} — nom de marque en dur : ${line.trim()}`);
      if (TAXI.test(line)) failures.push(`${where} — « taxi » interdit (VTC ≠ taxi, DESIGN_CONTEXT.md §1) : ${line.trim()}`);
    });
  }
}

if (fs.existsSync(SRC)) walk(SRC);

if (failures.length > 0) {
  process.stderr.write('verify:tokens — valeurs en dur détectées :\n\n');
  for (const failure of failures) process.stderr.write(`  ✗ ${failure}\n`);
  process.stderr.write(
    `\n${failures.length} violation(s). Tout passe par les variables de tokens.css ; le nom de marque par --brand-name / BRAND_NAME.\n`,
  );
  process.exit(1);
}

process.stdout.write('verify:tokens — aucune valeur en dur. ✓\n');
