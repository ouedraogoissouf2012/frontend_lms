# Requirements — Décomposition `UniversalCalendar.vue` (#28)

> TIER 2 — HIGH · `tier-2-god-components` · §1.1. 1 spec/vue.

## Investigation (vérifié 2026-06-18)

`src/components/calendar/UniversalCalendar.vue` : **1613 lignes**, `<script setup>`,
~10 responsabilités. Logique pure identifiée (fichier:ligne, avant extraction) :
`determineSeanceColor` (:512), `determineEvaluationColor` (:534),
`isEvaluationUrgent` (:541), `getDateRangeStart`/`getDateRangeEnd` (:555/:571).
Fetch (`loadEvents`/`loadSeances`/`loadEvaluations`/`loadFilterOptions`),
options FullCalendar, et handlers de navigation restent dans le composant.

## Stratégie (tranches TDD)

- **Tranche 1 (cette PR)** — logique pure → `src/utils/calendar.js` (TDD). Zéro risque UI.
- **Tranche 2 (éventuelle)** — composable de données (loadEvents + filtres + état)
  et/ou sous-composants (barre de filtres, légende).

## Exigences (tranche 1)

- THE SYSTEM SHALL exposer dans `src/utils/calendar.js` des fonctions **pures** :
  `determineSeanceColor(seance)`, `determineEvaluationColor(evaluation)`,
  `isEvaluationUrgent(evaluation)`, `getDateRangeStart(preset)`, `getDateRangeEnd(preset)`.
- WHEN mêmes entrées qu'aujourd'hui, THE SYSTEM SHALL produire les mêmes sorties.
- THE SYSTEM SHALL couvrir chaque fonction par des tests (couleurs par statut,
  urgence < 24 h / passée / invalide / sans date, présets de plage).
- WHEN le composant est refactoré, THE SYSTEM SHALL importer ces fonctions et
  passer `dateRangePreset.value` aux bornes, sans changer le comportement.
