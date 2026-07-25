/**
 * Génère src/styles/tokens.css depuis @cadance/shared — SETUP_PLAN.md, phase 4.
 *
 * Les tokens produit (couleurs, rayons, gradients, typo) viennent du package
 * partagé : ils ne peuvent pas diverger du mobile. Les ajouts web-only
 * (panneau crème, ombres, échelle fluide, easings) viennent de
 * DESIGN_CONTEXT.md §3-5, §10 et sont marqués comme tels.
 *
 * À lancer avant chaque build (`pnpm tokens`, câblé dans dev/build).
 * AUCUNE valeur de couleur ne doit être écrite en dur ailleurs que dans le
 * fichier généré — c'est ce que vérifie verify:tokens.
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const shared = require('@cadance/shared');

const { light, dark, gradient, radius, space, touch, font, BRAND_NAME } = shared;

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(scriptDir, '../src/styles/tokens.css');

/** camelCase → kebab-case : inkMuted → ink-muted. */
const kebab = (name) => name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

const paletteVars = (palette, indent = '  ') =>
  Object.entries(palette)
    .map(([name, value]) => `${indent}--${kebab(name)}: ${value};`)
    .join('\n');

const gradientVars = (indent = '  ') =>
  Object.entries(gradient)
    .map(
      ([name, [from, to]]) =>
        `${indent}--gradient-${name}: linear-gradient(135deg, ${from}, ${to});`,
    )
    .join('\n');

const css = `/*
 * GÉNÉRÉ par scripts/generate-tokens.mjs — NE PAS ÉDITER À LA MAIN.
 * Source produit : packages/shared/src/design-tokens.ts (via @cadance/shared).
 * Ajouts web-only : DESIGN_CONTEXT.md §3, §4, §5, §10.
 */

:root {
  /* ---- Marque (source : brand.ts) */
  --brand-name: '${BRAND_NAME}';

  /* ---- Couleurs produit — thème clair (source : design-tokens.ts) */
${paletteVars(light)}

  /* ---- Gradients — CONFINÉS aux mockups d'app (DESIGN_CONTEXT.md §4) */
${gradientVars()}

  /* ---- Panneau chaud — AJOUT WEB-ONLY (DESIGN_CONTEXT.md §4) */
  --panel: #FAF3E8;
  --panel-edge: #EFE4D2;

  /* ---- Rayons (source : design-tokens.ts) */
  --r-sm: ${radius.sm}px;
  --r-md: ${radius.md}px;
  --r-lg: ${radius.lg}px;
  /* Ajouts web-only (DESIGN_CONTEXT.md §5) */
  --r-xl: 32px;
  --r-pill: 999px;

  /* ---- Espacements mobiles de référence (source : design-tokens.ts) */
  --space-screen: ${space.screen}px;
  --space-card: ${space.card}px;
  --space-section: ${space.section}px;
  --space-grid: ${space.grid}px;

  /* ---- Rythme web — AJOUTS WEB-ONLY (DESIGN_CONTEXT.md §5) */
  --container: 1200px;
  --pad-inline: 24px;
  --section-y: clamp(72px, 6.4vw, 112px);
  --block-gap: clamp(32px, 4vw, 56px);
  --grid-gap: 16px;
  --card-pad: 20px;

  /* ---- Cibles tactiles (source : design-tokens.ts) */
  --touch-primary: ${touch.primary}px;
  --touch-secondary: ${touch.secondary}px;

  /* ---- Typographie (source : design-tokens.ts) */
  --font-family: '${font.family}', 'Plus Jakarta Sans', system-ui, sans-serif;
  --weight-regular: ${font.weight.regular};
  --weight-medium: ${font.weight.medium};
  --weight-semibold: ${font.weight.semibold};
  --weight-bold: ${font.weight.bold};
  --weight-extra: ${font.weight.extra};
  --text-micro: ${font.size.micro}px;
  --text-label: ${font.size.label}px;
  --text-body: ${font.size.body}px;
  --text-title: ${font.size.title}px;
  --text-display: ${font.size.display}px;
  --text-hero: ${font.size.hero}px;

  /* ---- Échelle web fluide — AJOUTS WEB-ONLY (DESIGN_CONTEXT.md §3) */
  --scale-impact: clamp(40px, 7vw, 92px);
  --scale-display: clamp(30px, 3.6vw, 48px);
  --scale-title: clamp(20px, 2.2vw, 28px);
  --scale-body-lg: clamp(17px, 1.3vw, 20px);

  /* ---- Ombres — AJOUTS WEB-ONLY (DESIGN_CONTEXT.md §5) */
  --shadow-soft: 0 4px 16px rgba(26, 28, 30, 0.06);
  --shadow-lift: 0 12px 32px rgba(26, 28, 30, 0.10);
  --shadow-cta: 0 8px 24px rgba(79, 70, 229, 0.28);
  --shadow-cta-hover: 0 12px 32px rgba(79, 70, 229, 0.38);
  --shadow-device: 0 32px 80px rgba(26, 28, 30, 0.16);

  /* ---- Mouvement — AJOUTS WEB-ONLY (DESIGN_CONTEXT.md §10) */
  --ease-out: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-fast: 120ms;
  --dur-base: 220ms;
  --dur-slow: 420ms;
}

@media (min-width: 768px) {
  :root {
    --pad-inline: 40px;
    --grid-gap: 24px;
    --card-pad: 28px;
  }
}

@media (min-width: 1280px) {
  :root {
    --pad-inline: 64px;
    --grid-gap: 32px;
  }
}

/*
 * Thème sombre : préférence système par défaut, écrasable par
 * [data-theme] dans les deux sens (DESIGN_CONTEXT.md §4).
 * En sombre, le panneau crème ne se traduit pas : surface + bordure.
 */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme='light']) {
${paletteVars(dark, '    ')}
    --panel: var(--surface);
    --panel-edge: var(--border);
    --shadow-soft: 0 4px 16px rgba(0, 0, 0, 0.03);
    --shadow-lift: 0 12px 32px rgba(0, 0, 0, 0.05);
    --shadow-device: 0 32px 80px rgba(0, 0, 0, 0.08);
  }
}

:root[data-theme='dark'] {
${paletteVars(dark)}
  --panel: var(--surface);
  --panel-edge: var(--border);
  --shadow-soft: 0 4px 16px rgba(0, 0, 0, 0.03);
  --shadow-lift: 0 12px 32px rgba(0, 0, 0, 0.05);
  --shadow-device: 0 32px 80px rgba(0, 0, 0, 0.08);
}
`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, css);
process.stdout.write(`tokens.css généré → ${path.relative(process.cwd(), OUT)}\n`);
