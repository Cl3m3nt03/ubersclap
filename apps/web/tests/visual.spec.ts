/**
 * verify:visual — vérification visuelle multi-largeurs (SETUP_PLAN.md, phase 9).
 *
 * Captures aux 8 largeurs (320 → 1920), dans les 2 thèmes, plus une passe
 * prefers-reduced-motion. Détecte tout scroll horizontal et toute perte de
 * contenu au zoom 200 %.
 *
 * Squelette volontairement vide (test.skip) tant que la page n'existe pas :
 * il n'y a rien à capturer avant les phases 5-8. À remplir en phase 9.
 */

import { test } from '@playwright/test';

test.skip('captures 320 → 1920, thèmes clair et sombre — à écrire en phase 9', () => {});
test.skip('aucun scroll horizontal à aucune largeur ≥ 320px — à écrire en phase 9', () => {});
test.skip('prefers-reduced-motion : états finaux affichés — à écrire en phase 9', () => {});
