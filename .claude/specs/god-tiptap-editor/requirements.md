# Requirements — Décomposition `TipTapEditor.vue` (#28)

> TIER 2 — HIGH · `tier-2-god-components` · §1.1. 1 spec/vue.

## Investigation (vérifié 2026-06-18)

`src/components/common/TipTapEditor.vue` : **1679 lignes**. Profil **différent** des
autres god-components : dominé par le **template** (barre d'outils ≈ 764 lignes) et
les styles ; le script (~174 l.) est déjà propre (config d'extensions + handlers).
Peu de logique métier pure : `wordCount`/`characterCount`, et la liste des
extensions TipTap (config).

## Stratégie (tranches)

- **Tranche 1 (cette PR)** — extraire (a) stats de texte → `src/utils/textStats.js`
  (TDD) et (b) config des extensions → `src/config/tiptapExtensions.js`
  (séparation config / composant). Zéro risque.
- **Tranche 2 (éventuelle)** — sous-composant `EditorToolbar` (la barre d'outils,
  ~600 l. de template + CSS) : plus gros levier mais migration template/CSS risquée.

## Exigences (tranche 1)

- THE SYSTEM SHALL exposer dans `src/utils/textStats.js` : `countWords(text)`,
  `countCharacters(text)` (pures, testées).
- THE SYSTEM SHALL exposer dans `src/config/tiptapExtensions.js` :
  `buildEditorExtensions(placeholder)` retournant la liste configurée.
- WHEN le composant est refactoré, THE SYSTEM SHALL utiliser ces modules sans
  changer le comportement de l'éditeur (build + tests verts).

## Note

Le plus gros gain (passer sous 300 l.) nécessite l'extraction de la toolbar en
sous-composant (tranche 2), seule façon de réduire significativement template+CSS.
