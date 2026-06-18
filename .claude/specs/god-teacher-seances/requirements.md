# Requirements — Décomposition `TeacherSeances.vue` (#28)

> TIER 2 — HIGH · `tier-2-god-components` · §1.1. 1 spec/vue.

## Investigation (vérifié 2026-06-18)

`src/views/TeacherSeances.vue` : **1354 lignes**, `<script setup>`. Logique pure :
`filteredSeances` (filtrage matière/statut visio/période) et `stats` (par statut
visio). `formatDate`/`formatTime` dupliquent `utils/formatters` (#23, dette).
Le reste = fetch + handlers visio (activate/start/join/end) + template/CSS.

## Stratégie (tranches)

- **Tranche 1 (cette PR)** — logique pure → `src/utils/seances.js` (TDD).
- **Tranche 2 (éventuelle)** — sous-composants (carte séance, filtres) ; les
  handlers visio s'appuient déjà sur le composable `useVisioParticipation`.

## Exigences (tranche 1)

- THE SYSTEM SHALL exposer dans `src/utils/seances.js` : `filterSeances(seances, filters)`
  et `computeSeancesStats(seances)` (pures).
- WHEN mêmes entrées, THE SYSTEM SHALL produire les mêmes sorties.
- THE SYSTEM SHALL couvrir ces fonctions par des tests (matière, statut visio,
  « none », période, stats par statut).
- WHEN la vue est refactorée, THE SYSTEM SHALL déléguer ses computeds au module.
