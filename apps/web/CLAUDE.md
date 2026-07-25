# Périmètre

Tu travailles UNIQUEMENT dans apps/web.

Ne modifie JAMAIS apps/mobile ni packages/shared pour faire converger un rendu web.
Si un mockup ne correspond pas à la référence de ref/, corrige le HTML/CSS du web.
Si la divergence vient d'un token mobile réellement incohérent, signale-le — ne le change pas.

Les composants de apps/mobile sont du React Native : ils ne s'importent pas.
On les réimplémente en respectant valeurs et comportement (voir DESIGN_CONTEXT.md §9).

Seul packages/shared est importable, et seulement sa partie agnostique.

# Tokens

`src/styles/tokens.css` est GÉNÉRÉ par `scripts/generate-tokens.mjs` depuis
@cadance/shared — ne jamais l'éditer à la main, ne jamais écrire une valeur
en dur ailleurs. `pnpm dev` et `pnpm build` le régénèrent automatiquement.

# Captures de référence

`ref/` contient les captures de l'app mobile en mode démo (390×844, thème
clair). Ce sont des références de fidélité, jamais des assets de page.
Pour les régénérer : serveur Expo web en mode démo, puis `pnpm capture:ref`
(voir scripts/capture-ref.mjs).
