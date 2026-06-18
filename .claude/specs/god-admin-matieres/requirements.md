# Requirements — Décomposition `AdminMatieres.vue` (#28)

> TIER 2 — HIGH · `tier-2-god-components` · §1.1. 1 spec/vue.

## Investigation (vérifié 2026-06-18)

`src/views/admin/AdminMatieres.vue` : **1434 lignes**, `<script setup>`.
L'issue #28 signalait un « computed de ~100 lignes » → c'est
`filteredNiveauxWithMatieres` (regroupement par niveau). Logique pure identifiée :
`filteredMatieres` (filtrage), `filteredNiveauxWithMatieres` (regroupement+totaux),
`stats`, `getMatiereFilieres`, `getMatiereNiveaux`.

## Stratégie (tranches)

- **Tranche 1 (cette PR)** — logique pure → `src/utils/matieres.js` (TDD). Zéro risque.
- **Tranche 2 (éventuelle)** — sous-composants (table matières, modales niveau/matière).

## Exigences (tranche 1)

- THE SYSTEM SHALL exposer dans `src/utils/matieres.js` des fonctions pures :
  `filterMatieres`, `groupMatieresByNiveau`, `computeMatieresStats`,
  `getMatiereFilieres`, `getMatiereNiveaux`.
- WHEN mêmes entrées, THE SYSTEM SHALL produire les mêmes sorties (tri/groupes
  « non défini » / « sans niveau » en fin de liste préservés).
- THE SYSTEM SHALL couvrir ces fonctions par des tests (filtres, regroupement,
  fallback, totaux, unicité filières/niveaux).
- WHEN la vue est refactorée, THE SYSTEM SHALL déléguer ses computeds/méthodes au module.
