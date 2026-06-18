# Requirements — Décomposition `TeacherEvaluations.vue` (#28)

> TIER 2 — HIGH · `tier-2-god-components` · `PRODUCTION_STANDARDS.md §1.1`
> (aucun fichier > 300 lignes). 1 spec dédiée par god-component.

## Investigation (code réel — vérifié 2026-06-18)

`src/views/evaluations/TeacherEvaluations.vue` : **1877 lignes** (`<script setup>`,
template 1-440 ≈ 440 l., script 442-944 ≈ 500 l., styles ≈ 940 l.).
~11 responsabilités mélangées.

Surface du script (fichier:ligne) :

| Catégorie | Éléments |
|---|---|
| **Logique métier PURE** (extractible, testable) | `evaluationsWithOnline`/merge (:497), `isExpiredWithoutOnline` (:506), `expiredWithoutOnlineCount` (:521), `filteredEvaluations` (:526), `stats` (:553), `getStatusBadgeClass` (:682), `getStatusLabel` (:700), `getStatusTooltip` (:728) |
| Mapper UI (icônes) | `getStatusIcon` (:714) — réfère des **composants** d'icônes importés → reste dans la vue |
| Formatage date | `formatDate` (:742) — duplique `formatDateTime` (#23) → **non touché ici** (dette) |
| Fetch (composable cible) | `loadData` (:564), `loadClasses` (:591), `loadMatieres` (:609), `loadEvaluationsKlassci` (:627), `loadEvaluationsLMS` (:651) |
| Actions | create/submit/edit/view/sync/publish/preview/delete online version |
| Template (sous-composants cibles) | modale création version en ligne, table des évaluations, cartes stats, barre de filtres |

## Stratégie de livraison (incrémentale, par tranche TDD)

Décomposition trop large pour une PR. On livre par tranches, du plus sûr au plus
risqué, chacune gardée par les tests :

- **Tranche 1 (cette PR)** — extraire la **logique métier pure** vers
  `src/utils/evaluations.js` (TDD complet), la vue l'importe. **Zéro risque UI.**
- **Tranche 2** — composable `useTeacherEvaluations` (fetch + état + cache).
- **Tranche 3** — sous-composants à slots (table, stats, filtres, modale).

## Exigences (tranche 1)

### Besoin 1 — Logique métier pure extraite et testée
**User story :** En tant que mainteneur, je veux la logique d'évaluation dans un
module pur testable, afin de la fiabiliser et d'alléger la vue.

- THE SYSTEM SHALL exposer dans `src/utils/evaluations.js` des fonctions **pures** :
  `mergeWithOnlineVersions(klassci, lms)`, `isExpiredWithoutOnline(evaluation)`,
  `filterEvaluations(evals, filters)`, `computeEvaluationStats(evals)`,
  `getStatusLabel(status)`, `getStatusTooltip(status)`, `getStatusBadgeClass(evaluation)`.
- WHEN ces fonctions reçoivent les mêmes entrées qu'aujourd'hui, THE SYSTEM SHALL
  produire **exactement** les mêmes sorties (parité comportementale).
- THE SYSTEM SHALL couvrir chaque fonction par des tests unitaires (happy path +
  cas limites : pas de version en ligne, fenêtre fermée, date passée/future,
  statuts inconnus).
- WHEN la vue est refactorée, THE SYSTEM SHALL importer ces fonctions sans
  changer le rendu ni le comportement (build + tests verts).

### Hors périmètre (dette tracée)
- `formatDate` → `formatDateTime` (#23-FE-1) : non touché ici (un doc WIP
  d'affichage des dates d'évaluations est en cours côté utilisateur).
- `getStatusIcon` : reste dans la vue (mappe des composants Vue).
- Composable de fetch + sous-composants : tranches 2 et 3.

## Vérification
- `npm run test` (nouveaux tests `evaluations.test.js`) · `npm run test:contract` · `npm run build`.
