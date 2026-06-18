# Requirements — Décomposition `SeanceAttendanceHistory.vue` (#28)

> TIER 2 — HIGH · `tier-2-god-components` · §1.1 (≤ 300 l/fichier). 1 spec/vue.

## Investigation (vérifié 2026-06-18)

`src/views/attendance/SeanceAttendanceHistory.vue` : **1708 lignes**, Options API
(`export default {}`), template 1-322, script 324-719, styles ≈ 990 l.
~12 responsabilités (issue #28).

| Catégorie | Éléments (fichier:ligne) |
|---|---|
| **Logique métier PURE** | seuils de présence `getRateClass` 80/60 % (:685), mappers `getStatusBadgeClass` (:691) / `getStatusClass` (:710) / `getStatusLabel` (:714), bornes de période `getPeriodDates` (:409) |
| Formatage (dette #23) | `formatDate`/`formatTime`/`formatDateInput`/`formatDuration`/`getInitials` — dupliquent `utils/formatters.js` |
| Fetch (composable cible) | `loadSeances` (:378), `openSeanceById` (:467), `viewAttendances` (:504) |
| Export (service cible) | `exportPDF` (:531), `exportExcel` (:580) — fetch blob + téléchargement dans la vue |
| Actions / UI | `deleteSeance`, `selectPeriod`, `applyCustomDates`, `debouncedSearch`, `clearSearch`, `changePage`, `closeModal` |
| Template (sous-composants) | tableau des séances, modale de détail des présences, barre de filtres/période |

## Stratégie (tranches TDD)

- **Tranche 1 (cette PR)** — logique métier pure → `src/utils/attendance.js` (TDD). Zéro risque UI.
- **Tranche 2** — service d'export (`exportAttendancePdf`/`Excel`) + composable de données.
- **Tranche 3** — sous-composants (tableau, modale, filtres).

## Exigences (tranche 1)

- THE SYSTEM SHALL exposer dans `src/utils/attendance.js` des fonctions **pures** :
  `getAttendanceRateClass(rate)`, `getAttendanceStatusBadgeClass(level)`,
  `getConnectionStatusClass(status)`, `getConnectionStatusLabel(status)`,
  `getPeriodDates(period, customDates)`.
- WHEN mêmes entrées qu'aujourd'hui, THE SYSTEM SHALL produire **les mêmes sorties**.
- THE SYSTEM SHALL couvrir chaque fonction par des tests (seuils limites 80/60, mappers, périodes today/week/month/custom/inconnue).
- WHEN la vue est refactorée, THE SYSTEM SHALL déléguer ses méthodes à l'util sans changer le rendu.

### Hors périmètre (dette tracée)
- Formatters dupliqués (`formatDate`…) → #23-FE-1, tranche ultérieure.
- Export PDF/Excel + fetch → tranche 2. Sous-composants → tranche 3.
