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
