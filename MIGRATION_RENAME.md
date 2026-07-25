# Renommage Uber's Clap → Cadance — ce que sed ne couvre pas

> Phase 0 du SETUP_PLAN.md. Le renommage textuel est fait (nom affiché,
> docs, packages `@ubersclap/*` → `@cadance/*`, clés de stockage local).
> Ce fichier liste ce qui reste volontairement inchangé et pourquoi.

## Fait automatiquement

- « Uber's Clap » / « Ubers Clap » → « Cadance » dans tous les fichiers (docs, code, `app.json` `name`, permission contacts).
- Packages workspace : `@ubersclap/shared|mobile|api` → `@cadance/*` (+ `pnpm-lock` régénéré, typecheck vert).
- `packages/shared/src/brand.ts` créé : `BRAND_NAME = 'Cadance'`, exporté par l'index.
- Clés locales : SecureStore `cadance.accessToken` / `cadance.refreshToken`, SQLite `cadance.db` — sans migration, l'utilisateur de dev se reconnecte, rien de plus.
- ADR-016 (00_CANON.md) et BACKLOG mis à jour : le nom est tranché.

## À décider / faire à la main — bloquant avant tout build de store

| Élément | Valeur actuelle | Pourquoi sed ne suffit pas |
|---|---|---|
| `ios.bundleIdentifier` | `dev.ubersclap.app` | Identifiant App Store. S'il existe déjà un build EAS/TestFlight, en changer crée une **nouvelle app** côté Apple. À changer en `dev.cadance.app` (ou autre domaine possédé) AVANT la première soumission — après, c'est définitif. |
| `android.package` | `dev.ubersclap.app` | Même logique côté Play Store : immuable après publication. |
| `slug` Expo | `ubersclap` | Identifie le projet sur les serveurs Expo/EAS. Le changer casse le lien avec les builds existants (`eas.json` présent). À changer en connaissance de cause. |
| `scheme` | `ubersclap` | Deep links `ubersclap://`. Changement sans risque tant qu'aucun lien n'est publié. |
| Domaines | `api.ubersclap.com`, `contact@ubersclap.dev` | Mentionnés dans 00_CANON, API.md, `.env.example`, `osm.provider.ts` (User-Agent Nominatim). À migrer quand le domaine Cadance est acheté — vérifier d'abord sa **disponibilité** (DESIGN_CONTEXT.md §15). |
| Base de données | `ubersclap` (user/db/containers docker-compose) | Renommer casse les volumes Postgres locaux de chaque dev. Sans enjeu de marque : à faire à l'occasion, pas en urgence. |
| Assets | `apps/mobile/assets/icon.png`, splash, adaptive icons | Le logo actuel peut contenir l'ancien nom en pixels — à vérifier visuellement et à refaire avec l'identité Cadance. Un PNG ne se sed pas. |
| Métadonnées stores | — | Nom affiché, description, captures : à créer directement sous Cadance, rien d'existant à migrer. |
| Dossier du repo / remote git | `~/Developer/ubersclap`, nom GitHub | Cosmétique, à renommer quand pratique. |

## Références internes conservées

- `design-tokens.ts` : mention « projet Superdesign "ubersclap" » — nom historique du projet de design, exact en tant que référence.
- `PROJECT_STRUCTURE.md` / `CODING_GUIDELINES.md` : exemples `uber-clap-*` d'une ancienne structure multi-repos, obsolètes de toute façon (le monorepo fait foi).
- Mentions d'Uber (la plateforme) dans BUSINESS, COMPETITIVE_ANALYSIS, etc. : il s'agit du concurrent, pas de la marque du produit.
