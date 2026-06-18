# Requirements — Décomposition `MatiereDetails.vue` (#28)

> TIER 2 — HIGH · `tier-2-god-components` · §1.1. 1 spec/vue.

## Investigation (vérifié 2026-06-18)

`src/views/matieres/MatiereDetails.vue` : **1454 lignes**, Options API.
Logique pure : `calculateDuration` (durée séance), mappers de statut séance
(`getSeanceStatusClass`/`Label`) et fenêtre d'évaluation
(`getEvaluationStatusClass`/`Label`). `formatDate`/`formatTime` dupliquent
`utils/formatters` (#23, dette). Le reste = fetch + onglets + template/CSS.

## Stratégie (tranches)

- **Tranche 1 (cette PR)** — logique pure → `src/utils/matiereDetails.js` (TDD).
- **Tranche 2 (éventuelle)** — sous-composants (onglets : leçons, séances, évaluations).

## Exigences (tranche 1)

- THE SYSTEM SHALL exposer dans `src/utils/matiereDetails.js` :
  `calculateSeanceDuration`, `getSeanceStatusClass`, `getSeanceStatusLabel`,
  `getEvaluationStatusClass`, `getEvaluationStatusLabel` (pures).
- WHEN mêmes entrées, THE SYSTEM SHALL produire les mêmes sorties.
- THE SYSTEM SHALL couvrir ces fonctions par des tests (durée, statuts séance
  à venir/terminé/passé, statuts fenêtre éval).
- WHEN la vue est refactorée, THE SYSTEM SHALL déléguer ses méthodes au module
  (imports aliasés pour éviter les collisions de noms).
