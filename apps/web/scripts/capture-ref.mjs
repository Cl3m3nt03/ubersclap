/**
 * Captures de référence de l'app mobile (SETUP_PLAN.md, phase 3 — voie A).
 *
 * Prérequis : le serveur Expo web en mode démo doit tourner :
 *   cd apps/mobile && EXPO_PUBLIC_DEMO_MODE=1 npx expo start --web --port 8090
 *
 * Usage :
 *   node scripts/capture-ref.mjs [--base http://localhost:8090] [--out ref]
 *
 * Ces images sont une RÉFÉRENCE DE FIDÉLITÉ pour les mockups reconstruits en
 * HTML/CSS — jamais un asset de la page. react-native-web diffère du natif
 * sur les ombres et le rendu des polices : la voie B (simulateur) reste la
 * vérité au pixel.
 *
 * Limites connues, consignées plutôt que contournées :
 *  - Thème sombre : les tokens existent mais le thème n'est pas branché dans
 *    l'app mobile (« v1.1 » dans design-tokens.ts). Aucune capture sombre
 *    possible tant que ce branchement n'existe pas.
 *  - Bandeau hors-ligne : l'état « données en cache » se capture en coupant
 *    le réseau du navigateur. Les états « N modifications en attente » et
 *    « synchronisation » exigent des mutations en pause, or le mode démo
 *    répond sans réseau — ces deux états sont à capturer sur simulateur.
 */

import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';
import { createRequire } from 'node:module';

/**
 * Résolution de Playwright : d'abord le paquet local (installé en phase 4),
 * sinon le répertoire passé via PLAYWRIGHT_MODULES (runtime externe).
 */
const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try {
    return require('playwright');
  } catch {
    const extra = process.env.PLAYWRIGHT_MODULES;
    if (!extra) throw new Error('playwright introuvable : pnpm add -D playwright, ou PLAYWRIGHT_MODULES=<node_modules>');
    return createRequire(path.join(extra, 'noop.js'))('playwright');
  }
})();

const argv = process.argv.slice(2);
function arg(name, fallback) {
  const index = argv.indexOf(`--${name}`);
  return index >= 0 && argv[index + 1] ? argv[index + 1] : fallback;
}

const BASE = arg('base', 'http://localhost:8090');
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(scriptDir, '..', arg('out', 'ref'));

fs.mkdirSync(OUT, { recursive: true });

/** iPhone 14/15 logique : 390×844. */
const VIEWPORT = { width: 390, height: 844 };

const SCREENS = [
  { file: 'ios-dashboard-light.png', path: '/', settle: 2500 },
  { file: 'ios-agenda-light.png', path: '/agenda', settle: 2000 },
  { file: 'ios-clients-light.png', path: '/clients', settle: 2000 },
  { file: 'ios-client-detail-light.png', path: '/client/00000000-0000-4000-8000-100000000001', settle: 2000 },
  { file: 'ios-course-nouvelle-light.png', path: '/course/nouvelle', settle: 2000 },
  { file: 'ios-factures-light.png', path: '/factures', settle: 2000 },
  { file: 'ios-depenses-light.png', path: '/depenses', settle: 2000 },
];

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: VIEWPORT,
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: 'fr-FR',
  timezoneId: 'Europe/Paris',
});

const page = await context.newPage();

for (const screen of SCREENS) {
  const url = `${BASE}${screen.path}`;
  process.stdout.write(`→ ${screen.file} (${url})\n`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 90_000 });
  // Laisse les polices, requêtes de démo et animations d'entrée se poser.
  await page.waitForTimeout(screen.settle);
  await page.screenshot({ path: path.join(OUT, screen.file) });
}

// Bandeau hors-ligne, état « données du dernier chargement » : on charge le
// tableau de bord, puis on coupe le réseau du navigateur.
process.stdout.write('→ ios-offline-banner-light.png (réseau coupé)\n');
await page.goto(`${BASE}/`, { waitUntil: 'networkidle', timeout: 90_000 });
await page.waitForTimeout(2000);
await context.setOffline(true);
// Le relais NetInfo → onlineManager est trop lent (ou muet) dans un contexte
// piloté : l'app expose __demoSetOnline en mode démo web précisément pour ça.
await page.evaluate(() => globalThis.__demoSetOnline?.(false));
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(OUT, 'ios-offline-banner-light.png') });
await page.evaluate(() => globalThis.__demoSetOnline?.(true));
await context.setOffline(false);

await browser.close();

process.stdout.write(`\nCaptures écrites dans ${OUT}\n`);
process.stdout.write(
  'Restant à capturer sur simulateur (voie B) : thème sombre (non branché), ' +
    'états hors-ligne « en attente » et « synchronisation ».\n',
);
