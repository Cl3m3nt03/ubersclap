/**
 * verify:perf — budget de performance (SETUP_PLAN.md, phase 9).
 *
 * Cible : Lighthouse CI avec seuils durs — LCP < 1,8 s · CLS < 0,05 ·
 * INP < 200 ms · 4 catégories ≥ 95 · budget JS 30 KB gzip.
 *
 * En attente tant que la page n'existe pas : auditer la page squelette de la
 * phase 4 ne mesurerait rien. En phase 9, remplacer ce script par
 * `lhci autorun` + lighthouserc avec les seuils ci-dessus.
 */

process.stdout.write(
  'verify:perf — en attente de la phase 9 (aucune page à auditer). ✓\n',
);
