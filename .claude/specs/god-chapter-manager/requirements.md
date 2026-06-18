# Requirements — Décomposition `ChapterManager.vue` (#28)

> TIER 2 — HIGH · `tier-2-god-components` · §1.1. 1 spec/vue.

## Investigation (vérifié 2026-06-18)

`src/components/lessons/ChapterManager.vue` : **1427 lignes**, Options API, ~10
responsabilités. La surface de **logique pure** est mince (le gros du fichier est
du CRUD chapitres/upload + knowledge-checks + template + CSS) :
`getContentTypeLabel` (mapper), `getContentPreview` (troncature). `getQuizScoreBadge`
délègue déjà à `knowledgeCheckService` ; `getAcceptedFileTypes` indexe la constante
`ACCEPTED_FILE_TYPES` (#24).

## Stratégie (tranches)

- **Tranche 1 (cette PR)** — extraire la logique pure restante → `src/utils/chapterContent.js` (TDD). Zéro risque.
- **Tranche 2 (éventuelle)** — composable CRUD chapitres + upload (nécessite `setup()` ou conversion `<script setup>`), puis sous-composants (carte chapitre, éditeur). Plus gros levier mais plus de risque.

## Exigences (tranche 1)

- THE SYSTEM SHALL exposer dans `src/utils/chapterContent.js` :
  `getChapterContentTypeLabel(type)`, `getChapterContentPreview(content)` (pures).
- WHEN mêmes entrées, THE SYSTEM SHALL produire les mêmes sorties (ellipsis `...`
  conservé, distinct de `truncate`/formatters qui utilise `…`).
- THE SYSTEM SHALL couvrir ces fonctions par des tests.
- WHEN le composant est refactoré, THE SYSTEM SHALL déléguer ses méthodes au module.

## Note

Le plus gros gain pour ce fichier viendra de la tranche 2 (composable + sous-composants),
pas de la tranche 1 (logique pure limitée).
