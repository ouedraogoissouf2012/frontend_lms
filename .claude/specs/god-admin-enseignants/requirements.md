# Requirements — Décomposition `AdminEnseignants.vue` (#28)

> TIER 2 — HIGH · `tier-2-god-components` · §1.1. 1 spec/vue.

## Investigation (vérifié 2026-06-18)

`src/views/admin/AdminEnseignants.vue` : **1283 lignes**, `<script setup>`.
Logique pure : stats (`totalMatieres`/`totalClasses`/`enseignantsActifs`),
`getEnseignantClassesCount` (avec fallback matières), `getEnseignantUniqueClasses`.
La vue utilise déjà `getInitials` de `utils/formatters` (#23). Le reste = fetch +
template/CSS.

## Stratégie (tranches)

- **Tranche 1 (cette PR)** — logique pure → `src/utils/enseignants.js` (TDD).
- **Tranche 2 (éventuelle)** — sous-composants (carte enseignant, modale détails).

## Exigences (tranche 1)

- THE SYSTEM SHALL exposer dans `src/utils/enseignants.js` :
  `computeEnseignantsStats(enseignants)`, `getEnseignantClassesCount(enseignant)`,
  `getEnseignantUniqueClasses(enseignant)` (pures).
- WHEN mêmes entrées, THE SYSTEM SHALL produire les mêmes sorties (priorité
  statistiques backend, fallback matières, robustesse non-array).
- THE SYSTEM SHALL couvrir ces fonctions par des tests.
- WHEN la vue est refactorée, THE SYSTEM SHALL déléguer ses computeds/méthodes au module.
