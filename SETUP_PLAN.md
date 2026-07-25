# Plan de préparation — landing page Cadance

> Objectif : que Claude Code puisse construire, vérifier et corriger la page en boucle fermée,
> avec le minimum d'interventions humaines — et qu'elles soient au bon endroit.

---

## Ce qui est automatisable, et ce qui ne l'est pas

**Automatisable intégralement** — extraction des tokens, génération des fixtures, captures d'écran de l'app, construction des composants, vérification visuelle multi-largeurs, audit d'accessibilité, budget de performance, SEO technique, déploiement, non-régression.

**Trois portes humaines, courtes et incompressibles :**

| Porte | Quand | Durée | Pourquoi |
|---|---|---|---|
| **G1 — Direction artistique** | Après le style tile (phase 5) | ~15 min | Une machine ne sait pas si la page *donne envie*. C'est le seul jugement qu'aucune métrique ne remplace, et c'est exactement l'étape dont la suppression produit un site générique. |
| **G2 — Hero + section signature** | Après la phase 7 | ~20 min | Le tempo des micro-actions. Une animation techniquement correcte peut sonner faux. |
| **G3 — Relecture du contenu** | Avant mise en ligne | ~30 min | Prix, promesses de conformité légale, mentions TVA et Factur-X. Un chiffre faux sur une page qui vend la conformité est un risque réel, pas un défaut de style. |

Tout le reste tourne seul. Sans G1 et G2, la page sera correcte, conforme et rapide — et ressemblera à toutes les autres.

---

## Phase 0 — Fondations du repo

```bash
# 1. Renommage global de la marque
rg -l "Uber'?s Clap" --hidden | xargs sed -i '' "s/Uber's Clap/Cadance/g; s/Ubers Clap/Cadance/g"
rg -i "uber" --hidden          # vérifier qu'il ne reste rien (slugs, bundle id, assets, stores)
```

À contrôler manuellement après le `sed` : `app.json` / `app.config.ts` (`name`, `slug`, `scheme`, `ios.bundleIdentifier`, `android.package`), le nom affiché sous l'icône, les métadonnées de store, les noms de fichiers d'assets.

```bash
# 2. Fichiers de contexte
cp DESIGN_CONTEXT.md ./DESIGN_CONTEXT.md
touch CLAUDE.md
```

Contenu de `CLAUDE.md` (voir §Annexe A).

```bash
# 3. Le token de marque, en un seul endroit
# packages/shared/src/brand.ts
export const BRAND_NAME = 'Cadance';
```

---

## Phase 1 — Extraction automatique

Une seule fois. Produit un condensé que Claude relira à chaque session au lieu de rouvrir 40 fichiers.

**Prompt :**
```
Lis packages/shared/src/design-tokens.ts, plans.ts, format.ts, money.ts,
apps/mobile/components/*.tsx, apps/mobile/app/**, BUSINESS.md, FEATURES.md.

Produis DESIGN_AUDIT.md : un tableau des tokens réels (couleurs, espacements,
radius, typo, ombres), l'inventaire des composants avec leurs props et variantes,
les offres et features de plans.ts, et les règles de formatage FR de format.ts.

Toute valeur absente du repo : marque-la ABSENTE. N'invente rien, ne complète rien.
```

Sortie : `DESIGN_AUDIT.md`. À partir de là, `DESIGN_CONTEXT.md` + `DESIGN_AUDIT.md` suffisent.

---

## Phase 2 — Fixtures de démonstration ⚠️ prérequis bloquant

Une capture d'un écran vide ne sert à rien. Sans ce jeu de données, tout le reste produit des mockups creux.

**Prompt :**
```
Crée packages/shared/src/fixtures/demo.ts : un jeu de données de démonstration
cohérent et plausible pour le marché français.

- 8 clients (noms français crédibles, téléphones au format FR)
- 12 courses réparties sur une semaine, adresses réelles de région parisienne,
  statuts variés, montants réalistes pour du VTC
- 6 factures : payées, en attente, une en retard. Numérotation immuable continue.
- 10 dépenses : carburant, péage, lavage, entretien, assurance
- Les agrégats CA / volume / temps doivent être VRAIS, calculés à partir des courses.

Utilise les helpers de format.ts et money.ts. Formatage FR strict :
virgule décimale, espace insécable avant €, dates jj/mm/aaaa, heures 14 h 30.
Aucun nom de personne réelle, aucun lorem ipsum.

Ajoute un flag EXPO_PUBLIC_DEMO_MODE qui charge ces fixtures dans l'app.
```

Double bénéfice : ces fixtures servent aussi de données de développement et de base de tests.

---

## Phase 3 — Captures de référence de l'app

```bash
# Voie A — Expo web : l'app dans le même navigateur que la landing, pilotable par Playwright
EXPO_PUBLIC_DEMO_MODE=1 npx expo start --web

# Voie B — simulateur, fidélité au pixel
xcrun simctl io booted screenshot ref/ios-agenda-light.png
adb exec-out screencap -p > ref/android-agenda-light.png
```

Nuance : `react-native-web` diffère du natif sur les ombres et le rendu des polices. Voie A pour itérer vite, voie B pour la vérité.

**À capturer, dans les deux thèmes :** agenda, fiche client, création de course, facture, dépenses, tableau de bord, bandeau hors-ligne (3 états).

→ `ref/` (14 fichiers minimum). Ces images sont une **référence de fidélité**, jamais un asset de la page.

---

## Phase 4 — Échafaudage du site

### Où vit le site

**Dans le monorepo, en `apps/web`.** Pas dans un repo séparé.

```
cadance/
├─ apps/
│  ├─ mobile/              ← existant, jamais modifié par le chantier web
│  └─ web/                 ← le site
│     ├─ src/
│     │  ├─ styles/tokens.css      ← généré depuis packages/shared au build
│     │  ├─ components/            ← réimplémentations web
│     │  ├─ sections/
│     │  └─ pages/index.astro
│     ├─ tests/            ← visual, a11y
│     ├─ ref/              ← captures de l'app (phase 3)
│     └─ CLAUDE.md         ← consignes locales
├─ packages/shared/        ← tokens, plans, format, money, fixtures
├─ DESIGN_CONTEXT.md
├─ DESIGN_AUDIT.md
└─ CLAUDE.md
```

**Raison :** la landing doit hériter des vrais tokens. Dans un repo séparé il faudrait publier ou recopier `design-tokens.ts`, et les deux divergent à la première modification côté mobile — exactement le problème des « deux équipes différentes » que le brief interdit.

### Deux pièges

**Les composants mobiles ne sont pas importables.** `apps/mobile/components/*.tsx` sont du React Native, ils ne compilent pas en web. La « filiation » du §9 de `DESIGN_CONTEXT.md` est une réimplémentation qui respecte les mêmes valeurs et le même comportement — jamais un `import`.

**`packages/shared` doit rester agnostique.** Vérifier avant de commencer qu'il ne contient aucun import `react-native` / `expo-*`, sinon le build web casse :
```bash
rg "from ['\"](react-native|expo)" packages/shared/src
```
Si c'est le cas, isoler la partie pure dans `packages/shared/src/core/`.

### Installation

```bash
pnpm create astro@latest apps/web -- --template minimal --typescript strict
cd apps/web && pnpm add -D @playwright/test axe-core @axe-core/playwright @lhci/cli
pnpm add @cadance/shared --workspace
```

Vérifier que `pnpm-workspace.yaml` couvre bien `apps/*`, et ajouter les tâches `build` / `dev` / `verify` de `apps/web` au pipeline turbo.

**Pourquoi Astro plutôt que Next :** zéro JavaScript expédié par défaut, îlots pour la seule partie interactive. Le budget « JS < 30 KB gzip » et « Lighthouse ≥ 95 » est atteint par construction au lieu d'être une lutte permanente. La page est statique à 95 %.

Les tokens sont convertis en variables CSS au build depuis `packages/shared` — **aucune valeur en dur**.

### Déploiement

Vercel ou Netlify : régler le *root directory* sur `apps/web`. L'app mobile n'est jamais déployée.

### `apps/web/CLAUDE.md`

```markdown
# Périmètre

Tu travailles UNIQUEMENT dans apps/web.

Ne modifie JAMAIS apps/mobile ni packages/shared pour faire converger un rendu web.
Si un mockup ne correspond pas à la référence de ref/, corrige le HTML/CSS du web.
Si la divergence vient d'un token mobile réellement incohérent, signale-le — ne le change pas.

Les composants de apps/mobile sont du React Native : ils ne s'importent pas.
On les réimplémente en respectant valeurs et comportement (voir DESIGN_CONTEXT.md §9).

Seul packages/shared est importable, et seulement sa partie agnostique.
```

---

## Phase 5 — Style tile 🔴 PORTE G1

**Ne pas générer de page.**

**Prompt :**
```
Lis DESIGN_CONTEXT.md. Génère /styleguide : une page unique présentant
le système, pas une mise en page marketing.

Palette (2 thèmes) · échelle typographique complète dont type-impact ·
Button dans ses 6 états et 5 variantes · Field · Card · StatusBadge ·
StatCard dans les 3 gradients · le panneau crème avec un cadre de téléphone vide ·
la grille de fond du hero · les 4 ombres.

Trois propositions de traitement pour le seul H1 du hero, franchement différentes.
Rien d'autre.
```

**Ce que tu regardes, 15 minutes :** le crème est-il chaud sans être jaune · Jakarta 800 en capitales a-t-il assez de nervosité (sinon → Archivo Black, et mettre à jour §3) · le contraste blanc sur teal et coral passe-t-il · un des trois H1 te fait-il quelque chose.

Tant que la réponse à la dernière question est non, on n'avance pas. C'est la seule étape où s'arrêter coûte moins cher que continuer.

---

## Phase 6 — Composants

```
Construis la bibliothèque de composants du §9 de DESIGN_CONTEXT.md.
Chaque composant : un fichier, ses variantes, ses états, un commentaire d'en-tête
indiquant sa filiation avec le composant mobile d'origine.
Toutes les valeurs en variables CSS. Aucune couleur en dur.
Ajoute chaque composant à /styleguide au fur et à mesure.
```

Automatisable de bout en bout, vérifié par la boucle visuelle de la phase 9.

---

## Phase 7 — Section signature 🔴 PORTE G2

La partie la plus difficile du projet, et la seule qui ne s'extrait de rien : **les micro-actions n'existent nulle part dans le repo.** Les captures donnent l'état de départ et l'état d'arrivée ; la chorégraphie est à inventer.

Ordre imposé :
1. La structure d'onglets, statique, cinq panneaux dans le DOM, ARIA complet
2. Le `PhoneMockup` avec le contenu reconstruit en HTML/CSS, comparé à `ref/`
3. Les fragments en orbite
4. **Les micro-actions, une par une**, en validant le tempo à chaque fois
5. L'enchaînement automatique, la barre de progression, l'arrêt définitif au premier clic
6. `prefers-reduced-motion` : états finaux
7. Le repli mobile

**Ce que tu regardes, 20 minutes :** est-ce que ça a l'air de quelqu'un qui se sert de l'app, ou d'une animation. Si la boucle est trop rapide c'est nerveux, trop lente c'est mou. Viser 3 à 4 secondes et ajuster à l'œil.

---

## Phase 8 — Sections restantes

Par groupes de deux ou trois, jamais toute la page d'un coup, en rappelant `DESIGN_CONTEXT.md` à chaque fois.

Ordre : hero → hors-ligne → conformité → comment ça marche → tarifs → réassurance → FAQ → CTA final → nav et footer.

Le composant de témoignages est construit mais **la section n'est pas montée dans la page**.

---

## Phase 9 — Boucle de vérification 🤖 entièrement automatique

C'est le cœur de l'automatisation. Une fois en place, Claude corrige seul.

```bash
claude mcp add playwright npx @playwright/mcp@latest
```

`package.json` :
```json
{
  "scripts": {
    "verify:visual": "playwright test tests/visual.spec.ts",
    "verify:a11y":   "playwright test tests/a11y.spec.ts",
    "verify:perf":   "lhci autorun",
    "verify:tokens": "node scripts/check-hardcoded-values.mjs",
    "verify":        "pnpm verify:tokens && pnpm verify:a11y && pnpm verify:visual && pnpm verify:perf"
  }
}
```

**`verify:visual`** — captures aux 8 largeurs (320 → 1920), dans les 2 thèmes, plus une passe `prefers-reduced-motion`. Détecte tout scroll horizontal et toute perte de contenu au zoom 200 %.

**`verify:a11y`** — `axe-core` sur chaque section, tabulation complète, focus visible, ARIA des onglets, contraste. Échec bloquant.

**`verify:perf`** — Lighthouse CI avec seuils durs : LCP < 1,8 s · CLS < 0,05 · INP < 200 ms · 4 catégories ≥ 95 · budget JS 30 KB.

**`verify:tokens`** — script maison qui échoue si un hex, un px d'espacement ou un radius est écrit en dur hors `tokens.css`, ou si `Cadance` apparaît en dur hors `brand.ts`. C'est le garde-fou anti-dérive le plus rentable du lot.

Et le comparateur de fidélité :
```
Pour chaque écran de ref/ : ouvre la page, capture le PhoneMockup correspondant,
compare avec l'image de référence. Liste les écarts de couleur, d'espacement,
de graisse, de rayon. Corrige le HTML/CSS jusqu'à convergence.
Ne modifie jamais l'app mobile pour faire converger.
```

En CI, `pnpm verify` sur chaque PR. La page ne peut plus se dégrader sans que ça se voie.

---

## Phase 10 — Mise en ligne 🔴 PORTE G3

Avant le premier déploiement public :

- [ ] Tous les `{{PRIX_*}}` remplacés par de vraies valeurs issues de `plans.ts`
- [ ] Relecture juridique de chaque affirmation de conformité (TVA 10 % ou franchise, Factur-X, registre VTC, numérotation)
- [ ] Aucune statistique non vérifiable présentée comme un fait
- [ ] Section témoignages toujours absente
- [ ] `og:image` 1200×630 généré, `sitemap.xml`, `robots.txt`, JSON-LD validé
- [ ] Orthographe et disponibilité du nom de marque confirmées

---

## Annexe A — `CLAUDE.md`

```markdown
# Cadance — landing page

## Avant toute chose
Lis DESIGN_CONTEXT.md (direction artistique, source de vérité) et
DESIGN_AUDIT.md (tokens et composants extraits du repo).
Ne rouvre packages/shared que si une valeur manque dans l'audit.

## Après CHAQUE modification front
Via Playwright MCP :
1. ouvre http://localhost:4321
2. capture en 1440px et 390px, thèmes clair et sombre
3. compare à DESIGN_CONTEXT.md : hiérarchie, rythme vertical, débordement, contraste
4. corrige, recapture, itère jusqu'à conformité
5. si un écart ne peut pas être résolu, dis-le au lieu de le contourner

## Règles permanentes
- Aucune valeur en dur : tout passe par les variables CSS de tokens.css
- type-impact : trois usages maximum dans toute la page (h1 hero, hors-ligne, CTA final)
- Aucun gradient hors d'un mockup d'app
- Aucune interface de bureau — le produit est mobile uniquement
- Aucun chiffre, prix ou témoignage inventé : jeton {{...}} visible et signalement
- Le nom de marque vient de brand.ts, jamais écrit en dur
- prefers-reduced-motion traité à chaque ajout d'animation, pas à la fin

## Avant de dire que c'est terminé
pnpm verify
```

---

## Ordre d'exécution résumé

```
0 fondations · 1 extraction · 2 fixtures ⚠️ · 3 captures · 4 échafaudage
5 style tile 🔴G1 · 6 composants · 7 section signature 🔴G2
8 sections · 9 boucle de vérification 🤖 · 10 mise en ligne 🔴G3
```

Phases 0 à 4 : une session. Phase 5 : autant qu'il faut. Phases 6 à 9 : en continu, largement autonomes.