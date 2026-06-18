# Requirements — Décomposition `StudentLessonView.vue` (#28)

> TIER 2 — HIGH · `tier-2-god-components` · §1.1. 1 spec/vue.
> (Vue canonique unifiée en #26 ; reste en Options API → conversion `<script setup>` = #27.)

## Investigation (vérifié 2026-06-18)

`src/views/student/StudentLessonView.vue` : **1547 lignes**, Options API.
Logique pure : `getEmbedUrl` (YouTube/Vimeo), `getSlideUrl`/`getPdfUrl` (storage),
mappers `getContentTypeLabel`/`getContentTypeIcon`, `isContentEmpty`. Le reste =
chargement + navigation chapitres + progression + template/CSS.

## Stratégie (tranches)

- **Tranche 1 (cette PR)** — logique pure → `src/utils/lessonContent.js` (TDD).
- **Tranche 2 (éventuelle)** — sous-composants (visionneuse chapitre : vidéo/slides/PDF, sidebar chapitres).

## Exigences (tranche 1)

- THE SYSTEM SHALL exposer dans `src/utils/lessonContent.js` :
  `getVideoEmbedUrl`, `getSlideUrl`, `getPdfUrl`, `getContentTypeLabel`,
  `getContentTypeIcon`, `isChapterContentEmpty(chapter, hasQuiz)`.
- WHEN mêmes entrées, THE SYSTEM SHALL produire les mêmes sorties (le cas `quiz`
  de `isContentEmpty` reçoit `hasQuiz` au lieu de lire l'état du composant).
- THE SYSTEM SHALL couvrir ces fonctions par des tests (embed YT/Vimeo, URLs
  storage absolues/relatives, mappers, vide par type).
- WHEN la vue est refactorée, THE SYSTEM SHALL déléguer ses méthodes au module
  (imports aliasés) et retirer l'import `apiOrigin` devenu inutile.
