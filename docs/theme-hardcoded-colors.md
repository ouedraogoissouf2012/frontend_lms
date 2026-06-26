# Audit des couleurs en dur dans les `.vue` (issue #106 — T1)

> **Type :** analyse en lecture seule. Aucun fichier `.vue` n'a été modifié.
> **Objet :** recenser toutes les couleurs codées en dur (`#hexa`, `rgb()`, `rgba()`) dans `src/**/*.vue` et proposer, pour chacune, le token `var(--…)` de [`src/assets/styles/themes.css`](../src/assets/styles/themes.css) le plus adapté.
> **But :** servir de base de découpage pour les lots de migration #T2 / #T3 / #T4.

## Méthode

1. Extraction exhaustive par `grep -noE '#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)'` sur chaque `.vue` (numéro de ligne + valeur exacte ; une entrée par couleur, même quand plusieurs couleurs partagent une ligne — gradients, box-shadow multi-couches).
2. Choix du token selon la **propriété CSS** de la ligne : `color:` → token texte ; `background`/`background-color` → token surface ; `border`/`border-color`/`outline` → token bordure ; `box-shadow` (ombre noire) → `--shadow-*`.
3. Application de la **légende de mapping** ci-dessous (valeurs canoniques *light-mode* de `themes.css`).

### Conventions de notation

| Marqueur | Signification |
|---|---|
| `--token` | **Correspondance exacte** : la valeur en dur est identique à celle du token proposé. |
| `≈ --token` | **Approximation** : couleur (souvent une teinte Tailwind/Material) sans valeur identique dans `themes.css`, mais sémantiquement couverte par ce token. Migration = léger glissement de teinte, à valider visuellement. |
| `⚠ aucun token` | **Sans équivalent** : aucune famille de `themes.css` ne couvre cette couleur (violet/indigo, cyan/sky, orange material, couleurs de marque, voiles `rgba` translucides, overlays). Nécessite une décision amont (#T2) : créer un token, ou conserver/justifier la valeur. |

> Les valeurs présentes dans un `var(--token, #fallback)` sont comptées : le `#fallback` reste une couleur en dur tant que le token n'est pas garanti défini partout.

## Légende de mapping (référence)

**Bleu de marque (exacts) :** `#eff6ff`→`--blue-50` · `#dbeafe`→`--blue-100` / `--info-bg` · `#bfdbfe`→`--blue-200` · `#93c5fd`→`--blue-300` / `--info-border` · `#60a5fa`→`--blue-400` · `#3b82f6`→`--blue-500` · `#0052cc`→`--blue-600` · `#0747a6`→`--blue-700` · `#172554`→`--blue-800` · `#0a1929`→`--blue-900`

**Neutres surfaces/texte/bordures (exacts) :** `#ffffff`→`--bg-primary` (carte `--card-bg`, input `--input-bg`, texte clair `--btn-primary-text`) · `#f8fafc`→`--bg-secondary` · `#f1f5f9`→`--bg-tertiary` · `#0f172a`→`--text-primary` · `#475569`→`--text-secondary` · `#64748b`→`--text-tertiary` · `#94a3b8`→`--text-disabled` · `#e2e8f0`→`--border-primary` · `#cbd5e1`→`--border-secondary` / `--input-border` · `#1e293b`→`--navbar-text` (clair) · `#334155`→`--border-primary` (dark)

**Statuts (exacts) :** succès `#dcfce7`→`--success-bg` · `#86efac`→`--success-border` · `#166534`→`--success-text` ; avert. `#fef3c7`→`--warning-bg` · `#fde047`→`--warning-border` · `#854d0e`→`--warning-text` ; erreur `#fee2e2`→`--error-bg` · `#fca5a5`→`--error-border` · `#991b1b`→`--error-text` ; info `#dbeafe`→`--info-bg` · `#93c5fd`→`--info-border` · `#1e40af`→`--info-text`

**Approximatifs (`≈`) :** bleus Tailwind `#2563eb`/`#1d4ed8`→`--blue-600`/`--blue-700`, `#1e3a8a`→`--blue-800` ; gris `#6b7280`→`--text-tertiary`, `#9ca3af`→`--text-disabled`, `#4b5563`→`--text-secondary`, `#374151`/`#1f2937`/`#111827`→`--text-primary`, `#e5e7eb`→`--border-primary`, `#d1d5db`→`--border-secondary`, `#f3f4f6`→`--bg-tertiary`, `#f9fafb`→`--bg-secondary` ; rouge `#ef4444`/`#dc2626`/`#b91c1c`→`--error-text`, `#fef2f2`→`--error-bg`, `#fecaca`→`--error-border` ; vert `#10b981`/`#22c55e`/`#16a34a`/`#059669`/`#15803d`/`#047857`/`#065f46`→`--success-text`, `#d1fae5`/`#f0fdf4`→`--success-bg`, `#34d399`→`--success-border` ; ambre `#f59e0b`/`#d97706`/`#b45309`/`#92400e`→`--warning-text`, `#fbbf24`/`#fde68a`→`--warning-border`, `#fffbeb`→`--warning-bg`

**Sans équivalent (`⚠`) :** violet/indigo (`#6366f1`, `#4f46e5`, `#8b5cf6`, `#7c3aed`, `#a855f7`, `#9333ea`, `#6d28d9`, `#5b21b6`, `#e0e7ff`, `#e9d5ff`, `#f3e8ff`, …) — *aucune palette violette dans `themes.css`* · cyan/sky (`#06b6d4`, `#0ea5e9`, `#7dd3fc`, `#0369a1`, `#e0f2fe`, …) — *aucun cyan* · orange material (`#ff9800`, `#ea580c`, `#f97316`, `#f44336`, …) · rose (`#fce7f3`, `#be123c`) · couleurs de marque KLASSCI (`#1B3B6F`, `#2D5A9E`, `#FFB81C`) · noir pur `#000`/`#000000` · overlays `rgba(0,0,0,α)` hors box-shadow (backdrops de modale) · voiles `rgba(255,255,255,α)` hors sidebar · box-shadow/glow **teintés** (`rgba(bleu/vert/rouge, α)`) — pas de token d'ombre colorée.

## Récapitulatif global

| Groupe | Occurrences | Sans équivalent (`⚠`) |
|---|---:|---:|
| Admin (`src/views/admin`) | 266 | 109 |
| Dashboards (`src/views/dashboards`) | 82 | 12 |
| Student (`src/views/student`) | 215 | 54 |
| Teacher (`src/views/teacher`) | 119 | 15 |
| Vues pédagogiques (`evaluations` / `lessons` / `attendance`) | 273 | 40 |
| Autres vues (`seances` / `matieres` / `coordinateur` / `classes` / racine) | 151 | 20 |
| Components — `lessons` | 243 | 78 |
| Components — `calendar` / `ui` / `Navbar` | 208 | 43 |
| Components — `common` / `evaluations` / `modals` | 146 | 46 |
| Components — `attendance`/`charts`/`enseignants`/`layout`/`seances`/`visio`/`widgets` | 132 | 25 |
| **Total** | **1835** | **442** |

> Couverture vérifiée : **1675 lignes `fichier:ligne` distinctes**, identiques à l'extraction `grep` de référence (0 manquante). Le total d'**occurrences** (1835) dépasse le nombre de lignes car une ligne de gradient ou de box-shadow multi-couches porte plusieurs couleurs. Les déclarations de variables SCSS (`$lms-blue: #2563eb;`) et les valeurs assignées en JS (options Chart.js, `backgroundColor` dynamiques) sont incluses car elles portent une couleur en dur.

---

## Admin (src/views/admin)

### src/views/admin/AdminClasses.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/admin/AdminClasses.vue:469 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/views/admin/AdminClasses.vue:476 | rgba(0, 0, 0, 0.15) | --shadow-md (box-shadow) |
| src/views/admin/AdminClasses.vue:480 | #3b82f6 | --blue-500 |
| src/views/admin/AdminClasses.vue:484 | #10b981 | ≈ --success-text (accent vert) |
| src/views/admin/AdminClasses.vue:488 | #8b5cf6 | ⚠ aucun token (violet) |
| src/views/admin/AdminClasses.vue:492 | #f59e0b | ≈ --warning-text (accent ambre) |
| src/views/admin/AdminClasses.vue:524 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/views/admin/AdminClasses.vue:574 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (focus-ring bleu translucide) |
| src/views/admin/AdminClasses.vue:616 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/views/admin/AdminClasses.vue:621 | rgba(0, 0, 0, 0.15) | --shadow-md (box-shadow) |
| src/views/admin/AdminClasses.vue:660 | #e0e7ff | ⚠ aucun token (indigo-100) |
| src/views/admin/AdminClasses.vue:661 | #5b21b6 | ⚠ aucun token (violet) |
| src/views/admin/AdminClasses.vue:665 | #fef3c7 | --warning-bg |
| src/views/admin/AdminClasses.vue:666 | #92400e | ≈ --warning-text |
| src/views/admin/AdminClasses.vue:674 | #dcfce7 | --success-bg |
| src/views/admin/AdminClasses.vue:675 | #15803d | ≈ --success-text |
| src/views/admin/AdminClasses.vue:685 | #22c55e | ≈ --success-text (accent vert) |
| src/views/admin/AdminClasses.vue:788 | #3b82f6 | --blue-500 |
| src/views/admin/AdminClasses.vue:788 | #2563eb | ≈ --blue-600 |
| src/views/admin/AdminClasses.vue:790 | rgba(59, 130, 246, 0.3) | ⚠ aucun token (ombre bleue translucide) |
| src/views/admin/AdminClasses.vue:794 | #2563eb | ≈ --blue-600 |
| src/views/admin/AdminClasses.vue:794 | #1d4ed8 | ≈ --blue-700 |
| src/views/admin/AdminClasses.vue:796 | rgba(59, 130, 246, 0.4) | ⚠ aucun token (ombre bleue translucide) |
| src/views/admin/AdminClasses.vue:805 | #FEF2F2 | ≈ --error-bg |
| src/views/admin/AdminClasses.vue:806 | #FCA5A5 | ≈ --error-border |
| src/views/admin/AdminClasses.vue:813 | #DC2626 | ≈ --error-text (accent) |
| src/views/admin/AdminClasses.vue:824 | #991B1B | --error-text |
| src/views/admin/AdminClasses.vue:829 | #B91C1C | ≈ --error-text (accent) |
| src/views/admin/AdminClasses.vue:838 | #DC2626 | ≈ --error-text (accent) |
| src/views/admin/AdminClasses.vue:849 | #B91C1C | ≈ --error-text (accent) |
| src/views/admin/AdminClasses.vue:881 | #3b82f6 | --blue-500 |
| src/views/admin/AdminClasses.vue:881 | #2563eb | ≈ --blue-600 |
| src/views/admin/AdminClasses.vue:891 | #2563eb | ≈ --blue-600 |
| src/views/admin/AdminClasses.vue:891 | #1d4ed8 | ≈ --blue-700 |

### src/views/admin/AdminEnseignants.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/admin/AdminEnseignants.vue:782 | #e0f2fe | ⚠ aucun token (cyan/sky) |
| src/views/admin/AdminEnseignants.vue:783 | #0369a1 | ⚠ aucun token (cyan) |
| src/views/admin/AdminEnseignants.vue:787 | rgba(14, 165, 233, 0.2) | ⚠ aucun token (sky translucide) |
| src/views/admin/AdminEnseignants.vue:788 | #7dd3fc | ⚠ aucun token (cyan) |
| src/views/admin/AdminEnseignants.vue:792 | #f0fdf4 | ≈ --success-bg |
| src/views/admin/AdminEnseignants.vue:793 | #15803d | ≈ --success-text |
| src/views/admin/AdminEnseignants.vue:797 | rgba(34, 197, 94, 0.2) | ⚠ aucun token (vert translucide) |
| src/views/admin/AdminEnseignants.vue:798 | #86efac | --success-border |
| src/views/admin/AdminEnseignants.vue:818 | #3b82f6 | --blue-500 |
| src/views/admin/AdminEnseignants.vue:838 | rgba(0, 0, 0, 0.5) | ⚠ aucun token (overlay modale) |
| src/views/admin/AdminEnseignants.vue:978 | #e0f2fe | ⚠ aucun token (cyan/sky) |
| src/views/admin/AdminEnseignants.vue:979 | #0369a1 | ⚠ aucun token (cyan) |
| src/views/admin/AdminEnseignants.vue:983 | rgba(14, 165, 233, 0.2) | ⚠ aucun token (sky translucide) |
| src/views/admin/AdminEnseignants.vue:984 | #7dd3fc | ⚠ aucun token (cyan) |
| src/views/admin/AdminEnseignants.vue:988 | #f0fdf4 | ≈ --success-bg |
| src/views/admin/AdminEnseignants.vue:989 | #15803d | ≈ --success-text |
| src/views/admin/AdminEnseignants.vue:993 | rgba(34, 197, 94, 0.2) | ⚠ aucun token (vert translucide) |
| src/views/admin/AdminEnseignants.vue:994 | #86efac | --success-border |
| src/views/admin/AdminEnseignants.vue:1106 | #dbeafe | --info-bg (--blue-100) |
| src/views/admin/AdminEnseignants.vue:1107 | #1e40af | --info-text |
| src/views/admin/AdminEnseignants.vue:1111 | rgba(59, 130, 246, 0.2) | ⚠ aucun token (bleu translucide) |
| src/views/admin/AdminEnseignants.vue:1112 | #93c5fd | --blue-300 (ou --info-border) |
| src/views/admin/AdminEnseignants.vue:1116 | #fef3c7 | --warning-bg |
| src/views/admin/AdminEnseignants.vue:1117 | #92400e | ≈ --warning-text |
| src/views/admin/AdminEnseignants.vue:1121 | rgba(251, 191, 36, 0.2) | ⚠ aucun token (ambre translucide) |
| src/views/admin/AdminEnseignants.vue:1122 | #fde047 | --warning-border |

### src/views/admin/AdminEvaluationDetails.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/admin/AdminEvaluationDetails.vue:604 | #10b981 | ≈ --success-text (accent vert) |
| src/views/admin/AdminEvaluationDetails.vue:608 | #3b82f6 | --blue-500 |
| src/views/admin/AdminEvaluationDetails.vue:612 | #f59e0b | ≈ --warning-text (accent ambre) |
| src/views/admin/AdminEvaluationDetails.vue:616 | #ef4444 | ≈ --error-text (accent) |

### src/views/admin/AdminHub.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/admin/AdminHub.vue:217 | rgba(0, 0, 0, 0.18) | --shadow-md (box-shadow) |
| src/views/admin/AdminHub.vue:218 | #3b82f6 | --blue-500 (fallback de var(--primary-color)) |
| src/views/admin/AdminHub.vue:222 | #3b82f6 | --blue-500 (fallback de var(--primary-color)) |
| src/views/admin/AdminHub.vue:247 | #3b82f6 | --blue-500 |
| src/views/admin/AdminHub.vue:247 | #2563eb | ≈ --blue-600 |
| src/views/admin/AdminHub.vue:251 | #f59e0b | ≈ --warning-text (accent ambre) |
| src/views/admin/AdminHub.vue:251 | #d97706 | ≈ --warning-text (accent ambre) |
| src/views/admin/AdminHub.vue:255 | #10b981 | ≈ --success-text (accent vert) |
| src/views/admin/AdminHub.vue:255 | #059669 | ≈ --success-text (accent vert) |
| src/views/admin/AdminHub.vue:302 | #3b82f6 | --blue-500 (fallback de var(--primary-color)) |
| src/views/admin/AdminHub.vue:389 | #3b82f6 | --blue-500 |
| src/views/admin/AdminHub.vue:393 | #f59e0b | ≈ --warning-text (accent ambre) |
| src/views/admin/AdminHub.vue:397 | #10b981 | ≈ --success-text (accent vert) |

### src/views/admin/AdminInstitutions.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/admin/AdminInstitutions.vue:92 | #3b82f6 | --blue-500 (fallback inline backgroundColor) |
| src/views/admin/AdminInstitutions.vue:232 | #3b82f6 | --blue-500 (placeholder) |
| src/views/admin/AdminInstitutions.vue:336 | #3b82f6 | --blue-500 (défaut JS) |
| src/views/admin/AdminInstitutions.vue:373 | #3b82f6 | --blue-500 (défaut JS) |
| src/views/admin/AdminInstitutions.vue:389 | #3b82f6 | --blue-500 (fallback JS) |
| src/views/admin/AdminInstitutions.vue:548 | #3b82f6 | --blue-500 |
| src/views/admin/AdminInstitutions.vue:548 | #2563eb | ≈ --blue-600 |
| src/views/admin/AdminInstitutions.vue:559 | rgba(59, 130, 246, 0.4) | ⚠ aucun token (ombre bleue translucide) |
| src/views/admin/AdminInstitutions.vue:597 | #6366f1 | ⚠ aucun token (indigo) |
| src/views/admin/AdminInstitutions.vue:597 | #4f46e5 | ⚠ aucun token (indigo) |
| src/views/admin/AdminInstitutions.vue:603 | #22c55e | ≈ --success-text (accent vert) |
| src/views/admin/AdminInstitutions.vue:603 | #16a34a | ≈ --success-text (accent vert) |
| src/views/admin/AdminInstitutions.vue:607 | #3b82f6 | --blue-500 |
| src/views/admin/AdminInstitutions.vue:607 | #2563eb | ≈ --blue-600 |
| src/views/admin/AdminInstitutions.vue:611 | #a855f7 | ⚠ aucun token (violet) |
| src/views/admin/AdminInstitutions.vue:611 | #9333ea | ⚠ aucun token (violet) |
| src/views/admin/AdminInstitutions.vue:665 | #3b82f6 | --blue-500 |
| src/views/admin/AdminInstitutions.vue:665 | #2563eb | ≈ --blue-600 |
| src/views/admin/AdminInstitutions.vue:787 | rgba(34, 197, 94, 0.1) | ⚠ aucun token (vert translucide) |
| src/views/admin/AdminInstitutions.vue:788 | #16a34a | ≈ --success-text (accent vert) |
| src/views/admin/AdminInstitutions.vue:792 | rgba(107, 114, 128, 0.1) | ⚠ aucun token (gris translucide) |
| src/views/admin/AdminInstitutions.vue:793 | #6b7280 | ≈ --text-tertiary |
| src/views/admin/AdminInstitutions.vue:831 | #16a34a | ≈ --success-text (accent vert) |
| src/views/admin/AdminInstitutions.vue:835 | #9ca3af | ≈ --text-disabled |
| src/views/admin/AdminInstitutions.vue:839 | #3b82f6 | --blue-500 |
| src/views/admin/AdminInstitutions.vue:846 | rgba(0, 0, 0, 0.5) | ⚠ aucun token (overlay modale) |
| src/views/admin/AdminInstitutions.vue:884 | #3b82f6 | --blue-500 |
| src/views/admin/AdminInstitutions.vue:949 | #3b82f6 | --blue-500 |
| src/views/admin/AdminInstitutions.vue:949 | #2563eb | ≈ --blue-600 |
| src/views/admin/AdminInstitutions.vue:955 | rgba(59, 130, 246, 0.4) | ⚠ aucun token (ombre bleue translucide) |
| src/views/admin/AdminInstitutions.vue:990 | #3b82f6 | --blue-500 (border-color) |
| src/views/admin/AdminInstitutions.vue:991 | rgba(59, 130, 246, 0.15) | ⚠ aucun token (focus-ring bleu translucide) |
| src/views/admin/AdminInstitutions.vue:1047 | #d1d5db | ≈ --border-secondary |
| src/views/admin/AdminInstitutions.vue:1063 | rgba(0,0,0,0.2) | --shadow-sm (box-shadow) |
| src/views/admin/AdminInstitutions.vue:1067 | #22c55e | ≈ --success-text (accent vert) |
| src/views/admin/AdminInstitutions.vue:1084 | rgba(239, 68, 68, 0.08) | ⚠ aucun token (rouge translucide) |
| src/views/admin/AdminInstitutions.vue:1085 | rgba(239, 68, 68, 0.2) | ⚠ aucun token (rouge translucide) |
| src/views/admin/AdminInstitutions.vue:1091 | #dc2626 | ≈ --error-text (accent) |
| src/views/admin/AdminInstitutions.vue:1111 | #22c55e | ≈ --success-text (accent vert) |
| src/views/admin/AdminInstitutions.vue:1115 | #ef4444 | ≈ --error-text (accent) |

### src/views/admin/AdminMatieres.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/admin/AdminMatieres.vue:101 | #6366f1 | ⚠ aucun token (indigo, fallback inline) |
| src/views/admin/AdminMatieres.vue:187 | #6366f1 | ⚠ aucun token (indigo, fallback inline) |
| src/views/admin/AdminMatieres.vue:538 | #6366f1 | ⚠ aucun token (indigo, fallback var) |
| src/views/admin/AdminMatieres.vue:659 | #4a90e2 | ≈ --blue-400 (bleu hors palette) |
| src/views/admin/AdminMatieres.vue:659 | #5a9df2 | ≈ --blue-400 (bleu hors palette) |
| src/views/admin/AdminMatieres.vue:671 | #ffffff | --btn-primary-text (texte sur fond foncé) |
| src/views/admin/AdminMatieres.vue:675 | rgba(255, 255, 255, 0.3) | ⚠ aucun token (overlay blanc hors sidebar) |
| src/views/admin/AdminMatieres.vue:858 | #4f46e5 | ⚠ aucun token (indigo) |
| src/views/admin/AdminMatieres.vue:868 | rgba(0, 0, 0, 0.6) | ⚠ aucun token (overlay modale) |
| src/views/admin/AdminMatieres.vue:885 | rgba(0, 0, 0, 0.3) | --shadow-xl (box-shadow modale) |
| src/views/admin/AdminMatieres.vue:997 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/views/admin/AdminMatieres.vue:1003 | rgba(0, 0, 0, 0.15) | --shadow-md (box-shadow) |
| src/views/admin/AdminMatieres.vue:1162 | rgba(99, 102, 241, 0.4) | ⚠ aucun token (ombre indigo translucide) |

### src/views/admin/AdminMatieres_backup.vue

> ⚠️ Fichier de sauvegarde encore suivi par git sur cette branche — **candidat à la suppression** plutôt qu'à la migration. Listé pour exhaustivité.

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/admin/AdminMatieres_backup.vue:105 | #6366f1 | ⚠ aucun token (indigo, fallback inline) |
| src/views/admin/AdminMatieres_backup.vue:193 | #6366f1 | ⚠ aucun token (indigo, fallback inline) |
| src/views/admin/AdminMatieres_backup.vue:705 | #6366f1 | ⚠ aucun token (indigo, fallback var) |
| src/views/admin/AdminMatieres_backup.vue:862 | #8b5cf6 | ⚠ aucun token (violet) |
| src/views/admin/AdminMatieres_backup.vue:890 | rgba(99, 102, 241, 0.15) | ⚠ aucun token (ombre indigo translucide) |
| src/views/admin/AdminMatieres_backup.vue:897 | #8b5cf6 | ⚠ aucun token (violet) |
| src/views/admin/AdminMatieres_backup.vue:951 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/views/admin/AdminMatieres_backup.vue:962 | rgba(0, 0, 0, 0.15) | --shadow-md (box-shadow) |
| src/views/admin/AdminMatieres_backup.vue:1036 | #4f46e5 | ⚠ aucun token (indigo) |
| src/views/admin/AdminMatieres_backup.vue:1046 | rgba(0, 0, 0, 0.6) | ⚠ aucun token (overlay modale) |
| src/views/admin/AdminMatieres_backup.vue:1063 | rgba(0, 0, 0, 0.3) | --shadow-xl (box-shadow modale) |
| src/views/admin/AdminMatieres_backup.vue:1244 | #3b82f6 | --blue-500 |
| src/views/admin/AdminMatieres_backup.vue:1253 | #10b981 | ≈ --success-text (accent vert) |

### src/views/admin/AdminMatieres_modern.vue

> ⚠️ Fichier de sauvegarde encore suivi par git — **candidat à la suppression**.

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/admin/AdminMatieres_modern.vue:99 | #6366f1 | ⚠ aucun token (indigo, fallback inline) |
| src/views/admin/AdminMatieres_modern.vue:101 | #6366f1 | ⚠ aucun token (indigo, fallback inline) |
| src/views/admin/AdminMatieres_modern.vue:218 | #6366f1 | ⚠ aucun token (indigo, fallback inline) |
| src/views/admin/AdminMatieres_modern.vue:552 | #6366f1 | ⚠ aucun token (indigo) |
| src/views/admin/AdminMatieres_modern.vue:552 | #8b5cf6 | ⚠ aucun token (violet) |
| src/views/admin/AdminMatieres_modern.vue:557 | rgba(99, 102, 241, 0.3) | ⚠ aucun token (ombre indigo translucide) |
| src/views/admin/AdminMatieres_modern.vue:569 | #6366f1 | ⚠ aucun token (indigo) |
| src/views/admin/AdminMatieres_modern.vue:601 | rgba(0, 0, 0, 0.05) | --shadow-sm (box-shadow) |
| src/views/admin/AdminMatieres_modern.vue:609 | rgba(99, 102, 241, 0.3) | ⚠ aucun token (ombre indigo translucide) |
| src/views/admin/AdminMatieres_modern.vue:626 | rgba(0, 0, 0, 0.05) | --shadow-sm (box-shadow) |
| src/views/admin/AdminMatieres_modern.vue:672 | rgba(99, 102, 241, 0.1) | ⚠ aucun token (focus-ring indigo translucide) |
| src/views/admin/AdminMatieres_modern.vue:677 | #ef4444 | ≈ --error-text (accent) |
| src/views/admin/AdminMatieres_modern.vue:686 | rgba(239, 68, 68, 0.3) | ⚠ aucun token (ombre rouge translucide) |
| src/views/admin/AdminMatieres_modern.vue:692 | #dc2626 | ≈ --error-text (accent) |
| src/views/admin/AdminMatieres_modern.vue:694 | rgba(239, 68, 68, 0.4) | ⚠ aucun token (ombre rouge translucide) |
| src/views/admin/AdminMatieres_modern.vue:714 | rgba(0, 0, 0, 0.05) | --shadow-sm (box-shadow) |
| src/views/admin/AdminMatieres_modern.vue:719 | rgba(0, 0, 0, 0.12) | --shadow-md (box-shadow) |
| src/views/admin/AdminMatieres_modern.vue:749 | rgba(0, 0, 0, 0.15) | --shadow-md (box-shadow) |
| src/views/admin/AdminMatieres_modern.vue:851 | #f59e0b | ≈ --warning-text (accent ambre) |
| src/views/admin/AdminMatieres_modern.vue:855 | #3b82f6 | --blue-500 |
| src/views/admin/AdminMatieres_modern.vue:859 | #10b981 | ≈ --success-text (accent vert) |
| src/views/admin/AdminMatieres_modern.vue:903 | #6366f1 | ⚠ aucun token (indigo) |
| src/views/admin/AdminMatieres_modern.vue:903 | #8b5cf6 | ⚠ aucun token (violet) |
| src/views/admin/AdminMatieres_modern.vue:905 | rgba(99, 102, 241, 0.3) | ⚠ aucun token (ombre indigo translucide) |
| src/views/admin/AdminMatieres_modern.vue:909 | #8b5cf6 | ⚠ aucun token (violet) |
| src/views/admin/AdminMatieres_modern.vue:909 | #a855f7 | ⚠ aucun token (violet) |
| src/views/admin/AdminMatieres_modern.vue:911 | rgba(139, 92, 246, 0.3) | ⚠ aucun token (ombre violette translucide) |
| src/views/admin/AdminMatieres_modern.vue:949 | rgba(99, 102, 241, 0.3) | ⚠ aucun token (ombre indigo translucide) |
| src/views/admin/AdminMatieres_modern.vue:991 | #ef4444 | ≈ --error-border (border) |
| src/views/admin/AdminMatieres_modern.vue:996 | #ef4444 | ≈ --error-text (accent) |
| src/views/admin/AdminMatieres_modern.vue:1028 | rgba(99, 102, 241, 0.3) | ⚠ aucun token (ombre indigo translucide) |
| src/views/admin/AdminMatieres_modern.vue:1032 | #4f46e5 | ⚠ aucun token (indigo) |
| src/views/admin/AdminMatieres_modern.vue:1034 | rgba(99, 102, 241, 0.4) | ⚠ aucun token (ombre indigo translucide) |
| src/views/admin/AdminMatieres_modern.vue:1044 | rgba(0, 0, 0, 0.7) | ⚠ aucun token (overlay modale) |
| src/views/admin/AdminMatieres_modern.vue:1072 | rgba(0, 0, 0, 0.5) | --shadow-xl (box-shadow modale) |
| src/views/admin/AdminMatieres_modern.vue:1110 | rgba(0, 0, 0, 0.15) | --shadow-md (box-shadow) |
| src/views/admin/AdminMatieres_modern.vue:1148 | #ef4444 | ≈ --error-text (accent, background) |
| src/views/admin/AdminMatieres_modern.vue:1149 | #ef4444 | ≈ --error-border (border-color) |
| src/views/admin/AdminMatieres_modern.vue:1198 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |

### src/views/admin/AdminProfile.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/admin/AdminProfile.vue:316 | rgba(139, 92, 246, 0.1) | ⚠ aucun token (violet translucide) |
| src/views/admin/AdminProfile.vue:316 | rgba(124, 58, 237, 0.05) | ⚠ aucun token (violet translucide) |
| src/views/admin/AdminProfile.vue:322 | #8b5cf6 | ⚠ aucun token (violet) |
| src/views/admin/AdminProfile.vue:350 | #8b5cf6 | ⚠ aucun token (violet) |
| src/views/admin/AdminProfile.vue:350 | #7c3aed | ⚠ aucun token (violet) |
| src/views/admin/AdminProfile.vue:354 | rgba(139, 92, 246, 0.3) | ⚠ aucun token (ombre violette translucide) |
| src/views/admin/AdminProfile.vue:405 | #8b5cf6 | ⚠ aucun token (violet) |
| src/views/admin/AdminProfile.vue:449 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/views/admin/AdminProfile.vue:484 | rgba(139, 92, 246, 0.1) | ⚠ aucun token (violet translucide) |
| src/views/admin/AdminProfile.vue:484 | rgba(124, 58, 237, 0.05) | ⚠ aucun token (violet translucide) |
| src/views/admin/AdminProfile.vue:485 | #8b5cf6 | ⚠ aucun token (violet, border) |
| src/views/admin/AdminProfile.vue:489 | #8b5cf6 | ⚠ aucun token (violet) |
| src/views/admin/AdminProfile.vue:512 | rgba(139, 92, 246, 0.1) | ⚠ aucun token (violet translucide) |
| src/views/admin/AdminProfile.vue:512 | rgba(124, 58, 237, 0.05) | ⚠ aucun token (violet translucide) |
| src/views/admin/AdminProfile.vue:513 | #8b5cf6 | ⚠ aucun token (violet, border-color) |
| src/views/admin/AdminProfile.vue:515 | rgba(139, 92, 246, 0.2) | ⚠ aucun token (ombre violette translucide) |
| src/views/admin/AdminProfile.vue:521 | #8b5cf6 | ⚠ aucun token (violet) |

### src/views/admin/AdminSeances.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/admin/AdminSeances.vue:436 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (focus-ring bleu translucide) |
| src/views/admin/AdminSeances.vue:503 | #dcfce7 | --success-bg |
| src/views/admin/AdminSeances.vue:504 | #166534 | --success-text |
| src/views/admin/AdminSeances.vue:508 | #dbeafe | --info-bg (--blue-100) |
| src/views/admin/AdminSeances.vue:509 | #1e40af | --info-text |
| src/views/admin/AdminSeances.vue:513 | #f3f4f6 | ≈ --bg-tertiary |
| src/views/admin/AdminSeances.vue:514 | #6b7280 | ≈ --text-tertiary |

### src/views/admin/AdminSettings.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/admin/AdminSettings.vue:456 | #ccc | ≈ --border-secondary |
| src/views/admin/AdminSettings.vue:474 | #3b82f6 | --blue-500 (background-color) |
| src/views/admin/AdminSettings.vue:505 | #ef4444 | ≈ --error-text (accent) |
| src/views/admin/AdminSettings.vue:505 | #dc2626 | ≈ --error-text (accent) |
| src/views/admin/AdminSettings.vue:510 | #dc2626 | ≈ --error-text (accent) |
| src/views/admin/AdminSettings.vue:510 | #b91c1c | ≈ --error-text (accent) |
| src/views/admin/AdminSettings.vue:540 | #3B82F6 | --blue-500 (border-color) |
| src/views/admin/AdminSettings.vue:558 | #3b82f6 | --blue-500 |
| src/views/admin/AdminSettings.vue:558 | #2563eb | ≈ --blue-600 |
| src/views/admin/AdminSettings.vue:563 | #2563eb | ≈ --blue-600 |
| src/views/admin/AdminSettings.vue:563 | #1d4ed8 | ≈ --blue-700 |
| src/views/admin/AdminSettings.vue:604 | #f0f9ff | ⚠ aucun token (sky-50) |
| src/views/admin/AdminSettings.vue:604 | #e0f2fe | ⚠ aucun token (cyan/sky) |
| src/views/admin/AdminSettings.vue:605 | #0369a1 | ⚠ aucun token (cyan) |
| src/views/admin/AdminSettings.vue:609 | #bae6fd | ⚠ aucun token (sky-200) |
| src/views/admin/AdminSettings.vue:614 | #e0f2fe | ⚠ aucun token (cyan/sky) |
| src/views/admin/AdminSettings.vue:614 | #bae6fd | ⚠ aucun token (sky) |
| src/views/admin/AdminSettings.vue:616 | rgba(3, 105, 161, 0.1) | ⚠ aucun token (cyan/sky translucide) |
| src/views/admin/AdminSettings.vue:624 | #0c4a6e | ⚠ aucun token (sky-900) |
| src/views/admin/AdminSettings.vue:624 | #075985 | ⚠ aucun token (sky-800) |
| src/views/admin/AdminSettings.vue:625 | #7dd3fc | ⚠ aucun token (cyan) |
| src/views/admin/AdminSettings.vue:626 | #0c4a6e | ⚠ aucun token (sky, border-color) |
| src/views/admin/AdminSettings.vue:630 | #075985 | ⚠ aucun token (sky) |
| src/views/admin/AdminSettings.vue:630 | #0369a1 | ⚠ aucun token (cyan) |
| src/views/admin/AdminSettings.vue:631 | rgba(125, 211, 252, 0.1) | ⚠ aucun token (cyan/sky translucide) |

### src/views/admin/AdminStats.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/admin/AdminStats.vue:369 | #3b82f6 | --blue-500 |
| src/views/admin/AdminStats.vue:373 | #8b5cf6 | ⚠ aucun token (violet) |
| src/views/admin/AdminStats.vue:377 | #10b981 | ≈ --success-text (accent vert) |
| src/views/admin/AdminStats.vue:381 | #f59e0b | ≈ --warning-text (accent ambre) |
| src/views/admin/AdminStats.vue:439 | #667eea | ⚠ aucun token (indigo/périwinkle hors palette) |
| src/views/admin/AdminStats.vue:439 | #764ba2 | ⚠ aucun token (violet hors palette) |

### src/views/admin/AdminUsers.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/admin/AdminUsers.vue:730 | #ef4444 | ≈ --error-text (accent) |
| src/views/admin/AdminUsers.vue:866 | #3b82f6 | --blue-500 |
| src/views/admin/AdminUsers.vue:866 | #2563eb | ≈ --blue-600 |
| src/views/admin/AdminUsers.vue:870 | #10b981 | ≈ --success-text (accent vert) |
| src/views/admin/AdminUsers.vue:870 | #059669 | ≈ --success-text (accent vert) |
| src/views/admin/AdminUsers.vue:898 | rgba(59, 130, 246, 0.15) | ⚠ aucun token (bleu translucide) |
| src/views/admin/AdminUsers.vue:899 | #3b82f6 | --blue-500 |
| src/views/admin/AdminUsers.vue:904 | rgba(16, 185, 129, 0.15) | ⚠ aucun token (vert translucide) |
| src/views/admin/AdminUsers.vue:905 | #10b981 | ≈ --success-text (accent vert) |
| src/views/admin/AdminUsers.vue:909 | rgba(245, 158, 11, 0.15) | ⚠ aucun token (ambre translucide) |
| src/views/admin/AdminUsers.vue:910 | #f59e0b | ≈ --warning-text (accent ambre) |
| src/views/admin/AdminUsers.vue:915 | rgba(139, 92, 246, 0.15) | ⚠ aucun token (violet translucide) |
| src/views/admin/AdminUsers.vue:916 | #8b5cf6 | ⚠ aucun token (violet) |
| src/views/admin/AdminUsers.vue:980 | rgba(0, 0, 0, 0.6) | ⚠ aucun token (overlay modale) |

### src/views/admin/AdminVisio.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/admin/AdminVisio.vue:485 | #dcfce7 | --success-bg |
| src/views/admin/AdminVisio.vue:489 | #dbeafe | --info-bg (--blue-100) |
| src/views/admin/AdminVisio.vue:493 | #f3f4f6 | ≈ --bg-tertiary |
| src/views/admin/AdminVisio.vue:497 | #fef3c7 | --warning-bg |
| src/views/admin/AdminVisio.vue:506 | #166534 | --success-text |
| src/views/admin/AdminVisio.vue:510 | #1e40af | --info-text |
| src/views/admin/AdminVisio.vue:514 | #6b7280 | ≈ --text-tertiary |
| src/views/admin/AdminVisio.vue:518 | #b45309 | ≈ --warning-text (accent ambre) |
| src/views/admin/AdminVisio.vue:589 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (focus-ring bleu translucide) |
| src/views/admin/AdminVisio.vue:656 | #dcfce7 | --success-bg |
| src/views/admin/AdminVisio.vue:657 | #166534 | --success-text |
| src/views/admin/AdminVisio.vue:661 | #dbeafe | --info-bg (--blue-100) |
| src/views/admin/AdminVisio.vue:662 | #1e40af | --info-text |
| src/views/admin/AdminVisio.vue:666 | #f3f4f6 | ≈ --bg-tertiary |
| src/views/admin/AdminVisio.vue:667 | #6b7280 | ≈ --text-tertiary |

> `src/views/admin/AdminEvaluationResults.vue` : aucune couleur en dur.
> **Total Admin : 266 occurrences — 109 sans équivalent.**

---

## Dashboards (src/views/dashboards)

### src/views/dashboards/AdminDashboard.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/dashboards/AdminDashboard.vue:592 | #6b7280 | ≈ --text-tertiary (JS backgroundColor) |
| src/views/dashboards/AdminDashboard.vue:597 | #10b981 | ≈ --success-text (JS backgroundColor) |
| src/views/dashboards/AdminDashboard.vue:600 | #3b82f6 | --blue-500 (JS backgroundColor) |
| src/views/dashboards/AdminDashboard.vue:603 | #8b5cf6 | ⚠ aucun token (violet) |
| src/views/dashboards/AdminDashboard.vue:699 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/dashboards/AdminDashboard.vue:704 | #3b82f6 | --blue-500 (border-left-color) |
| src/views/dashboards/AdminDashboard.vue:708 | #10b981 | ≈ --success-text (border-left-color) |
| src/views/dashboards/AdminDashboard.vue:712 | #8b5cf6 | ⚠ aucun token (violet) |
| src/views/dashboards/AdminDashboard.vue:716 | #f59e0b | ≈ --warning-text (border-left-color) |
| src/views/dashboards/AdminDashboard.vue:747 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/dashboards/AdminDashboard.vue:809 | #dbeafe | --info-bg (background) |
| src/views/dashboards/AdminDashboard.vue:810 | #1e40af | --info-text |
| src/views/dashboards/AdminDashboard.vue:823 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/dashboards/AdminDashboard.vue:832 | rgba(0, 0, 0, 0.15) | --shadow-* (box-shadow) |
| src/views/dashboards/AdminDashboard.vue:836 | #f59e0b | ≈ --warning-text (border) |
| src/views/dashboards/AdminDashboard.vue:862 | rgba(0, 0, 0, 0.05) | --shadow-* (box-shadow) |
| src/views/dashboards/AdminDashboard.vue:867 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/dashboards/AdminDashboard.vue:886 | #e0e7ff | ⚠ aucun token (indigo clair) |
| src/views/dashboards/AdminDashboard.vue:887 | #5b21b6 | ⚠ aucun token (violet) |
| src/views/dashboards/AdminDashboard.vue:918 | #dcfce7 | --success-bg |
| src/views/dashboards/AdminDashboard.vue:919 | #166534 | --success-text |
| src/views/dashboards/AdminDashboard.vue:929 | rgba(0, 0, 0, 0.05) | --shadow-* (box-shadow) |
| src/views/dashboards/AdminDashboard.vue:934 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/dashboards/AdminDashboard.vue:984 | #dbeafe | --info-bg (background) |
| src/views/dashboards/AdminDashboard.vue:991 | #1e40af | --info-text |
| src/views/dashboards/AdminDashboard.vue:996 | #1e3a8a | ≈ --blue-800 |
| src/views/dashboards/AdminDashboard.vue:1014 | #d1d5db | ≈ --border-secondary (border-left) |
| src/views/dashboards/AdminDashboard.vue:1020 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/dashboards/AdminDashboard.vue:1024 | #ef4444 | ≈ --error-text (border-left-color) |
| src/views/dashboards/AdminDashboard.vue:1025 | #fef2f2 | ≈ --error-bg (gradient) |
| src/views/dashboards/AdminDashboard.vue:1025 | #fee2e2 | --error-bg (gradient) |
| src/views/dashboards/AdminDashboard.vue:1037 | rgba(0, 0, 0, 0.05) | --shadow-* (box-shadow) |
| src/views/dashboards/AdminDashboard.vue:1059 | #dc2626 | ≈ --error-text (color) |
| src/views/dashboards/AdminDashboard.vue:1104 | #3b82f6 | --blue-500 (color) |
| src/views/dashboards/AdminDashboard.vue:1111 | #2563eb | ≈ --blue-600 (color) |
| src/views/dashboards/AdminDashboard.vue:1143 | #3b82f6 | --blue-500 (gradient) |
| src/views/dashboards/AdminDashboard.vue:1143 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/dashboards/AdminDashboard.vue:1189 | #dbeafe | --info-bg (background) |
| src/views/dashboards/AdminDashboard.vue:1190 | #1e40af | --info-text |
| src/views/dashboards/AdminDashboard.vue:1194 | #d1fae5 | ≈ --success-bg |
| src/views/dashboards/AdminDashboard.vue:1195 | #065f46 | ≈ --success-text |
| src/views/dashboards/AdminDashboard.vue:1199 | #fef3c7 | --warning-bg |
| src/views/dashboards/AdminDashboard.vue:1200 | #92400e | ≈ --warning-text |
| src/views/dashboards/AdminDashboard.vue:1204 | #fecaca | ≈ --error-border |
| src/views/dashboards/AdminDashboard.vue:1205 | #991b1b | --error-text |
| src/views/dashboards/AdminDashboard.vue:1209 | #e5e7eb | ≈ --border-primary (background) |
| src/views/dashboards/AdminDashboard.vue:1210 | #374151 | ≈ --text-primary (color) |

### src/views/dashboards/StudentDashboard.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/dashboards/StudentDashboard.vue:485 | #FEF2F2 | ≈ --error-bg |
| src/views/dashboards/StudentDashboard.vue:486 | #FCA5A5 | ≈ --error-border |
| src/views/dashboards/StudentDashboard.vue:493 | #DC2626 | ≈ --error-text |
| src/views/dashboards/StudentDashboard.vue:504 | #991B1B | --error-text |
| src/views/dashboards/StudentDashboard.vue:509 | #B91C1C | ≈ --error-text |
| src/views/dashboards/StudentDashboard.vue:515 | #DC2626 | ≈ --error-text (background) |
| src/views/dashboards/StudentDashboard.vue:526 | #B91C1C | ≈ --error-text (background) |

### src/views/dashboards/StudentDashboardModern.vue

> ⚠️ Variante « modern » encore suivie par git — vérifier si active ou candidate à la suppression.

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/dashboards/StudentDashboardModern.vue:45 | #0052cc | --blue-600 (gradient iconBg) |
| src/views/dashboards/StudentDashboardModern.vue:45 | #0747a6 | --blue-700 (gradient iconBg) |
| src/views/dashboards/StudentDashboardModern.vue:52 | #22c55e | ≈ --success-text (gradient) |
| src/views/dashboards/StudentDashboardModern.vue:52 | #16a34a | ≈ --success-text (gradient) |
| src/views/dashboards/StudentDashboardModern.vue:61 | #a855f7 | ⚠ aucun token (violet) |
| src/views/dashboards/StudentDashboardModern.vue:61 | #9333ea | ⚠ aucun token (violet) |
| src/views/dashboards/StudentDashboardModern.vue:69 | #f97316 | ⚠ aucun token (orange material) |
| src/views/dashboards/StudentDashboardModern.vue:69 | #ea580c | ⚠ aucun token (orange material) |
| src/views/dashboards/StudentDashboardModern.vue:190 | #0052cc | --blue-600 (gradient inline) |
| src/views/dashboards/StudentDashboardModern.vue:190 | #0747a6 | --blue-700 (gradient inline) |
| src/views/dashboards/StudentDashboardModern.vue:198 | #f97316 | ⚠ aucun token (orange material) |
| src/views/dashboards/StudentDashboardModern.vue:198 | #ea580c | ⚠ aucun token (orange material) |
| src/views/dashboards/StudentDashboardModern.vue:206 | #22c55e | ≈ --success-text (gradient) |
| src/views/dashboards/StudentDashboardModern.vue:206 | #16a34a | ≈ --success-text (gradient) |
| src/views/dashboards/StudentDashboardModern.vue:214 | #a855f7 | ⚠ aucun token (violet) |
| src/views/dashboards/StudentDashboardModern.vue:214 | #9333ea | ⚠ aucun token (violet) |

### src/views/dashboards/TeacherDashboard.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/dashboards/TeacherDashboard.vue:442 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/dashboards/TeacherDashboard.vue:473 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/dashboards/TeacherDashboard.vue:532 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/dashboards/TeacherDashboard.vue:595 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/dashboards/TeacherDashboard.vue:629 | #dcfce7 | --success-bg |
| src/views/dashboards/TeacherDashboard.vue:630 | #166534 | --success-text |
| src/views/dashboards/TeacherDashboard.vue:634 | #dbeafe | --info-bg |
| src/views/dashboards/TeacherDashboard.vue:635 | #1e40af | --info-text |
| src/views/dashboards/TeacherDashboard.vue:639 | #f3f4f6 | ≈ --bg-tertiary |
| src/views/dashboards/TeacherDashboard.vue:640 | #4b5563 | ≈ --text-secondary |
| src/views/dashboards/TeacherDashboard.vue:648 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/dashboards/TeacherDashboard.vue:657 | rgba(0, 0, 0, 0.15) | --shadow-* (box-shadow) |

> **Total Dashboards : 82 occurrences — 12 sans équivalent.**

---

## Student (src/views/student)

### src/views/student/StudentCourses.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/student/StudentCourses.vue:316 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (focus-ring bleu) |
| src/views/student/StudentCourses.vue:334 | #fee2e2 | --error-bg |
| src/views/student/StudentCourses.vue:335 | #dc2626 | ≈ --error-text |
| src/views/student/StudentCourses.vue:336 | #dc2626 | ≈ --error-border |
| src/views/student/StudentCourses.vue:376 | #dbeafe | --info-bg |
| src/views/student/StudentCourses.vue:377 | #1e40af | --info-text |
| src/views/student/StudentCourses.vue:381 | #dcfce7 | --success-bg |
| src/views/student/StudentCourses.vue:382 | #166534 | --success-text |
| src/views/student/StudentCourses.vue:386 | #fef3c7 | --warning-bg |
| src/views/student/StudentCourses.vue:387 | #92400e | ≈ --warning-text |
| src/views/student/StudentCourses.vue:391 | #f3e8ff | ⚠ aucun token (violet) |
| src/views/student/StudentCourses.vue:392 | #7c3aed | ⚠ aucun token (violet) |
| src/views/student/StudentCourses.vue:460 | #3b82f6 | --blue-500 (gradient) |
| src/views/student/StudentCourses.vue:460 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/student/StudentCourses.vue:477 | #3b82f6 | --blue-500 (gradient) |
| src/views/student/StudentCourses.vue:477 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/student/StudentCourses.vue:488 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/student/StudentCourses.vue:488 | #1d4ed8 | ≈ --blue-700 (gradient) |
| src/views/student/StudentCourses.vue:552 | #3b82f6 | --blue-500 (gradient) |
| src/views/student/StudentCourses.vue:552 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/student/StudentCourses.vue:557 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/student/StudentCourses.vue:557 | #1d4ed8 | ≈ --blue-700 (gradient) |
| src/views/student/StudentCourses.vue:577 | #FEF2F2 | ≈ --error-bg |
| src/views/student/StudentCourses.vue:578 | #FCA5A5 | ≈ --error-border |
| src/views/student/StudentCourses.vue:585 | #DC2626 | ≈ --error-text |
| src/views/student/StudentCourses.vue:596 | #991B1B | --error-text |
| src/views/student/StudentCourses.vue:601 | #B91C1C | ≈ --error-text |
| src/views/student/StudentCourses.vue:607 | #DC2626 | ≈ --error-text (bouton danger) |
| src/views/student/StudentCourses.vue:618 | #B91C1C | ≈ --error-text (bouton danger hover) |

### src/views/student/StudentEvaluationsList.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/student/StudentEvaluationsList.vue:550 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/student/StudentEvaluationsList.vue:555 | #8b5cf6 | ⚠ aucun token (violet, border-left) |
| src/views/student/StudentEvaluationsList.vue:594 | #dbeafe | --info-bg |
| src/views/student/StudentEvaluationsList.vue:595 | #1e40af | --info-text |
| src/views/student/StudentEvaluationsList.vue:599 | #dcfce7 | --success-bg |
| src/views/student/StudentEvaluationsList.vue:600 | #15803d | ≈ --success-text |
| src/views/student/StudentEvaluationsList.vue:604 | #fef3c7 | --warning-bg |
| src/views/student/StudentEvaluationsList.vue:605 | #92400e | ≈ --warning-text |
| src/views/student/StudentEvaluationsList.vue:609 | #f0fdf4 | ≈ --success-bg |
| src/views/student/StudentEvaluationsList.vue:610 | #166534 | --success-text |
| src/views/student/StudentEvaluationsList.vue:614 | #ede9fe | ⚠ aucun token (violet) |
| src/views/student/StudentEvaluationsList.vue:615 | #6d28d9 | ⚠ aucun token (violet) |
| src/views/student/StudentEvaluationsList.vue:625 | #e5e7eb | ≈ --border-primary |
| src/views/student/StudentEvaluationsList.vue:652 | #dcfce7 | --success-bg |
| src/views/student/StudentEvaluationsList.vue:653 | #166534 | --success-text |
| src/views/student/StudentEvaluationsList.vue:657 | #dbeafe | --info-bg |
| src/views/student/StudentEvaluationsList.vue:658 | #1e40af | --info-text |
| src/views/student/StudentEvaluationsList.vue:662 | #fef3c7 | --warning-bg |
| src/views/student/StudentEvaluationsList.vue:663 | #92400e | ≈ --warning-text |
| src/views/student/StudentEvaluationsList.vue:667 | #fee2e2 | --error-bg |
| src/views/student/StudentEvaluationsList.vue:668 | #991b1b | --error-text |
| src/views/student/StudentEvaluationsList.vue:684 | #fef3c7 | --warning-bg |
| src/views/student/StudentEvaluationsList.vue:685 | #92400e | ≈ --warning-text |
| src/views/student/StudentEvaluationsList.vue:689 | #dcfce7 | --success-bg |
| src/views/student/StudentEvaluationsList.vue:690 | #15803d | ≈ --success-text |
| src/views/student/StudentEvaluationsList.vue:694 | #fee2e2 | --error-bg |
| src/views/student/StudentEvaluationsList.vue:695 | #991b1b | --error-text |
| src/views/student/StudentEvaluationsList.vue:710 | #fef3c7 | --warning-bg |
| src/views/student/StudentEvaluationsList.vue:711 | #92400e | ≈ --warning-text |
| src/views/student/StudentEvaluationsList.vue:735 | #22c55e | ≈ --success-text (gradient) |
| src/views/student/StudentEvaluationsList.vue:735 | #16a34a | ≈ --success-text (gradient) |
| src/views/student/StudentEvaluationsList.vue:740 | #16a34a | ≈ --success-text (gradient) |
| src/views/student/StudentEvaluationsList.vue:740 | #15803d | ≈ --success-text (gradient) |
| src/views/student/StudentEvaluationsList.vue:745 | #f59e0b | ≈ --warning-text (gradient) |
| src/views/student/StudentEvaluationsList.vue:745 | #d97706 | ≈ --warning-text (gradient) |
| src/views/student/StudentEvaluationsList.vue:750 | #d97706 | ≈ --warning-text (gradient) |
| src/views/student/StudentEvaluationsList.vue:750 | #b45309 | ≈ --warning-text (gradient) |
| src/views/student/StudentEvaluationsList.vue:755 | #f3f4f6 | ≈ --bg-tertiary |
| src/views/student/StudentEvaluationsList.vue:757 | #e5e7eb | ≈ --border-primary |
| src/views/student/StudentEvaluationsList.vue:761 | #e5e7eb | ≈ --border-primary |
| src/views/student/StudentEvaluationsList.vue:765 | #8b5cf6 | ⚠ aucun token (violet) |
| src/views/student/StudentEvaluationsList.vue:765 | #7c3aed | ⚠ aucun token (violet) |
| src/views/student/StudentEvaluationsList.vue:770 | #7c3aed | ⚠ aucun token (violet) |
| src/views/student/StudentEvaluationsList.vue:770 | #6d28d9 | ⚠ aucun token (violet) |
| src/views/student/StudentEvaluationsList.vue:775 | #f3f4f6 | ≈ --bg-tertiary |
| src/views/student/StudentEvaluationsList.vue:776 | #9ca3af | ≈ --text-disabled |
| src/views/student/StudentEvaluationsList.vue:796 | #f3f4f6 | ≈ --bg-tertiary |
| src/views/student/StudentEvaluationsList.vue:832 | #FEF2F2 | ≈ --error-bg |
| src/views/student/StudentEvaluationsList.vue:833 | #FCA5A5 | ≈ --error-border |
| src/views/student/StudentEvaluationsList.vue:840 | #DC2626 | ≈ --error-text |
| src/views/student/StudentEvaluationsList.vue:851 | #991B1B | --error-text |
| src/views/student/StudentEvaluationsList.vue:856 | #B91C1C | ≈ --error-text |
| src/views/student/StudentEvaluationsList.vue:863 | #DC2626 | ≈ --error-text (bouton danger) |
| src/views/student/StudentEvaluationsList.vue:874 | #B91C1C | ≈ --error-text (bouton danger hover) |

### src/views/student/StudentGrades.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/student/StudentGrades.vue:448 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/student/StudentGrades.vue:454 | rgba(0, 0, 0, 0.15) | --shadow-* (box-shadow) |
| src/views/student/StudentGrades.vue:487 | rgba(0, 0, 0, 0.1) | ⚠ aucun token (overlay noir, pas une ombre) |
| src/views/student/StudentGrades.vue:494 | rgba(255, 255, 255, 0.3) | ⚠ aucun token (overlay blanc hors sidebar) |
| src/views/student/StudentGrades.vue:503 | #4caf50 | ≈ --success-text (material green) |
| src/views/student/StudentGrades.vue:504 | #8bc34a | ⚠ aucun token (material light-green) |
| src/views/student/StudentGrades.vue:505 | #ff9800 | ⚠ aucun token (material orange) |
| src/views/student/StudentGrades.vue:506 | #ff5722 | ⚠ aucun token (material deep-orange) |
| src/views/student/StudentGrades.vue:507 | #f44336 | ⚠ aucun token (material red) |
| src/views/student/StudentGrades.vue:519 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/student/StudentGrades.vue:551 | rgba(var(--primary-color-rgb), 0.1) | déjà variabilisé (focus-ring) |
| src/views/student/StudentGrades.vue:578 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/student/StudentGrades.vue:643 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/student/StudentGrades.vue:722 | #f44336 | ⚠ aucun token (material red) |
| src/views/student/StudentGrades.vue:766 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/student/StudentGrades.vue:817 | rgba(76, 175, 80, 0.05) | ⚠ aucun token (material green translucide) |
| src/views/student/StudentGrades.vue:858 | #4caf50 | ≈ --success-text (material green) |
| src/views/student/StudentGrades.vue:858 | #8bc34a | ⚠ aucun token (material light-green) |
| src/views/student/StudentGrades.vue:881 | rgba(33, 150, 243, 0.1) | ⚠ aucun token (material blue translucide) |
| src/views/student/StudentGrades.vue:882 | #2196f3 | ⚠ aucun token (material blue) |
| src/views/student/StudentGrades.vue:886 | rgba(156, 39, 176, 0.1) | ⚠ aucun token (material purple translucide) |
| src/views/student/StudentGrades.vue:887 | #9c27b0 | ⚠ aucun token (material purple) |
| src/views/student/StudentGrades.vue:891 | rgba(255, 152, 0, 0.1) | ⚠ aucun token (material orange translucide) |
| src/views/student/StudentGrades.vue:892 | #ff9800 | ⚠ aucun token (material orange) |
| src/views/student/StudentGrades.vue:896 | rgba(244, 67, 54, 0.1) | ⚠ aucun token (material red translucide) |
| src/views/student/StudentGrades.vue:897 | #f44336 | ⚠ aucun token (material red) |
| src/views/student/StudentGrades.vue:901 | rgba(0, 150, 136, 0.1) | ⚠ aucun token (material teal translucide) |
| src/views/student/StudentGrades.vue:902 | #009688 | ⚠ aucun token (material teal) |
| src/views/student/StudentGrades.vue:906 | rgba(103, 58, 183, 0.1) | ⚠ aucun token (material deep-purple translucide) |
| src/views/student/StudentGrades.vue:907 | #673ab7 | ⚠ aucun token (material deep-purple) |
| src/views/student/StudentGrades.vue:915 | #4caf50 | ≈ --success-text (material green) |
| src/views/student/StudentGrades.vue:916 | #8bc34a | ⚠ aucun token (material light-green) |
| src/views/student/StudentGrades.vue:917 | #ff9800 | ⚠ aucun token (material orange) |
| src/views/student/StudentGrades.vue:918 | #ff5722 | ⚠ aucun token (material deep-orange) |
| src/views/student/StudentGrades.vue:919 | #f44336 | ⚠ aucun token (material red) |
| src/views/student/StudentGrades.vue:989 | #ddd | ≈ --border-secondary |

### src/views/student/StudentLessonView.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/student/StudentLessonView.vue:496 | #0f172a | --text-primary (fallback, fond sombre) |
| src/views/student/StudentLessonView.vue:497 | #e2e8f0 | --border-primary (texte clair) |
| src/views/student/StudentLessonView.vue:505 | #1e293b | --navbar-text (fallback --card-bg dark) |
| src/views/student/StudentLessonView.vue:506 | #334155 | --border-primary (dark) |
| src/views/student/StudentLessonView.vue:517 | #334155 | --border-primary (dark) |
| src/views/student/StudentLessonView.vue:519 | #94a3b8 | --text-disabled |
| src/views/student/StudentLessonView.vue:526 | #1e293b | --navbar-text (fallback --bg-secondary dark) |
| src/views/student/StudentLessonView.vue:527 | #e2e8f0 | --border-primary (texte clair) |
| src/views/student/StudentLessonView.vue:554 | #334155 | --border-primary (dark) |
| src/views/student/StudentLessonView.vue:561 | #3b82f6 | --blue-500 (gradient) |
| src/views/student/StudentLessonView.vue:561 | #10b981 | ≈ --success-text (gradient) |
| src/views/student/StudentLessonView.vue:569 | #10b981 | ≈ --success-text |
| src/views/student/StudentLessonView.vue:598 | #94a3b8 | --text-disabled |
| src/views/student/StudentLessonView.vue:604 | #334155 | --border-primary (dark) |
| src/views/student/StudentLessonView.vue:605 | #3b82f6 | --blue-500 (border-top-color) |
| src/views/student/StudentLessonView.vue:621 | #3b82f6 | --blue-500 |
| src/views/student/StudentLessonView.vue:640 | #94a3b8 | --text-disabled |
| src/views/student/StudentLessonView.vue:661 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (bleu translucide badge) |
| src/views/student/StudentLessonView.vue:662 | #60a5fa | --blue-400 |
| src/views/student/StudentLessonView.vue:665 | rgba(239, 68, 68, 0.1) | ⚠ aucun token (rouge translucide badge) |
| src/views/student/StudentLessonView.vue:665 | #f87171 | ≈ --error-border |
| src/views/student/StudentLessonView.vue:666 | rgba(249, 115, 22, 0.1) | ⚠ aucun token (orange translucide) |
| src/views/student/StudentLessonView.vue:666 | #fb923c | ⚠ aucun token (orange) |
| src/views/student/StudentLessonView.vue:667 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (bleu translucide badge) |
| src/views/student/StudentLessonView.vue:667 | #60a5fa | --blue-400 |
| src/views/student/StudentLessonView.vue:668 | rgba(220, 38, 38, 0.1) | ⚠ aucun token (rouge translucide badge) |
| src/views/student/StudentLessonView.vue:668 | #f87171 | ≈ --error-border |
| src/views/student/StudentLessonView.vue:669 | rgba(139, 92, 246, 0.1) | ⚠ aucun token (violet translucide) |
| src/views/student/StudentLessonView.vue:669 | #a78bfa | ⚠ aucun token (violet) |
| src/views/student/StudentLessonView.vue:670 | rgba(16, 185, 129, 0.1) | ⚠ aucun token (vert translucide badge) |
| src/views/student/StudentLessonView.vue:670 | #34d399 | ≈ --success-border |
| src/views/student/StudentLessonView.vue:681 | #e2e8f0 | --border-primary (texte clair) |
| src/views/student/StudentLessonView.vue:689 | #e2e8f0 | --border-primary (texte clair) |
| src/views/student/StudentLessonView.vue:707 | #3b82f6 | --blue-500 (border-left) |
| src/views/student/StudentLessonView.vue:710 | rgba(59, 130, 246, 0.05) | ⚠ aucun token (bleu translucide) |
| src/views/student/StudentLessonView.vue:715 | #334155 | --border-primary (dark) |
| src/views/student/StudentLessonView.vue:722 | #334155 | --border-primary (dark) |
| src/views/student/StudentLessonView.vue:744 | #334155 | --border-primary (dark) |
| src/views/student/StudentLessonView.vue:749 | #334155 | --border-primary (dark) |
| src/views/student/StudentLessonView.vue:755 | #1e293b | --navbar-text (fallback --card-bg dark) |
| src/views/student/StudentLessonView.vue:758 | #334155 | --border-primary (dark) |
| src/views/student/StudentLessonView.vue:766 | #000 | ⚠ aucun token (fond noir lecteur vidéo) |
| src/views/student/StudentLessonView.vue:787 | #94a3b8 | --text-disabled |
| src/views/student/StudentLessonView.vue:797 | #3b82f6 | --blue-500 |
| src/views/student/StudentLessonView.vue:817 | #334155 | --border-primary (dark) |
| src/views/student/StudentLessonView.vue:823 | #60a5fa | --blue-400 |
| src/views/student/StudentLessonView.vue:835 | #94a3b8 | --text-disabled |
| src/views/student/StudentLessonView.vue:849 | #1e293b | --navbar-text (fallback --card-bg dark) |
| src/views/student/StudentLessonView.vue:850 | #334155 | --border-primary (dark) |
| src/views/student/StudentLessonView.vue:856 | #a78bfa | ⚠ aucun token (violet) |
| src/views/student/StudentLessonView.vue:871 | #94a3b8 | --text-disabled |
| src/views/student/StudentLessonView.vue:880 | #7c3aed | ⚠ aucun token (violet) |
| src/views/student/StudentLessonView.vue:893 | #6d28d9 | ⚠ aucun token (violet) |
| src/views/student/StudentLessonView.vue:900 | #1e293b | --navbar-text (fallback --card-bg dark) |
| src/views/student/StudentLessonView.vue:901 | #334155 | --border-primary (dark) |
| src/views/student/StudentLessonView.vue:907 | #34d399 | ≈ --success-border |
| src/views/student/StudentLessonView.vue:917 | #94a3b8 | --text-disabled |
| src/views/student/StudentLessonView.vue:941 | rgba(16, 185, 129, 0.15) | ⚠ aucun token (vert translucide) |
| src/views/student/StudentLessonView.vue:942 | #10b981 | ≈ --success-text |
| src/views/student/StudentLessonView.vue:943 | #10b981 | ≈ --success-text (border) |
| src/views/student/StudentLessonView.vue:947 | rgba(239, 68, 68, 0.15) | ⚠ aucun token (rouge translucide) |
| src/views/student/StudentLessonView.vue:948 | #ef4444 | ≈ --error-text |
| src/views/student/StudentLessonView.vue:949 | #ef4444 | ≈ --error-text (border) |
| src/views/student/StudentLessonView.vue:954 | #10b981 | ≈ --success-text (gradient) |
| src/views/student/StudentLessonView.vue:954 | #059669 | ≈ --success-text (gradient) |
| src/views/student/StudentLessonView.vue:974 | #94a3b8 | --text-disabled |
| src/views/student/StudentLessonView.vue:986 | #94a3b8 | --text-disabled |
| src/views/student/StudentLessonView.vue:1001 | #334155 | --border-primary (dark) |
| src/views/student/StudentLessonView.vue:1009 | #10b981 | ≈ --success-text (gradient) |
| src/views/student/StudentLessonView.vue:1009 | #059669 | ≈ --success-text (gradient) |
| src/views/student/StudentLessonView.vue:1023 | rgba(16, 185, 129, 0.3) | ⚠ aucun token (box-shadow teinté vert) |
| src/views/student/StudentLessonView.vue:1036 | rgba(16, 185, 129, 0.1) | ⚠ aucun token (vert translucide) |
| src/views/student/StudentLessonView.vue:1037 | #10b981 | ≈ --success-text |
| src/views/student/StudentLessonView.vue:1049 | #1e293b | --navbar-text (fallback --card-bg dark) |
| src/views/student/StudentLessonView.vue:1050 | #334155 | --border-primary (dark) |
| src/views/student/StudentLessonView.vue:1051 | #e2e8f0 | --border-primary (texte clair) |
| src/views/student/StudentLessonView.vue:1062 | #3b82f6 | --blue-500 |
| src/views/student/StudentLessonView.vue:1063 | #3b82f6 | --blue-500 (border-color) |
| src/views/student/StudentLessonView.vue:1073 | #3b82f6 | --blue-500 |
| src/views/student/StudentLessonView.vue:1074 | #3b82f6 | --blue-500 (border-color) |
| src/views/student/StudentLessonView.vue:1079 | #2563eb | ≈ --blue-600 |
| src/views/student/StudentLessonView.vue:1091 | #3b82f6 | --blue-500 |
| src/views/student/StudentLessonView.vue:1096 | rgba(59, 130, 246, 0.4) | ⚠ aucun token (box-shadow teinté bleu) |

### src/views/student/StudentSchedule.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/student/StudentSchedule.vue:110 | #2563eb | ≈ --blue-600 |
| src/views/student/StudentSchedule.vue:137 | #2563eb | ≈ --blue-600 |

### src/views/student/StudentSettings.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/student/StudentSettings.vue:435 | #ccc | ≈ --border-secondary (toggle off) |
| src/views/student/StudentSettings.vue:453 | #3b82f6 | --blue-500 |
| src/views/student/StudentSettings.vue:484 | #ef4444 | ≈ --error-text (gradient) |
| src/views/student/StudentSettings.vue:484 | #dc2626 | ≈ --error-text (gradient) |
| src/views/student/StudentSettings.vue:489 | #dc2626 | ≈ --error-text (gradient) |
| src/views/student/StudentSettings.vue:489 | #b91c1c | ≈ --error-text (gradient) |
| src/views/student/StudentSettings.vue:519 | #3B82F6 | --blue-500 (border-color) |
| src/views/student/StudentSettings.vue:537 | #3b82f6 | --blue-500 (gradient) |
| src/views/student/StudentSettings.vue:537 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/student/StudentSettings.vue:542 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/student/StudentSettings.vue:542 | #1d4ed8 | ≈ --blue-700 (gradient) |

> **Total Student : 215 occurrences — 54 sans équivalent.** `StudentGrades.vue` concentre l'essentiel des sans-équivalent (palette Material complète).

---

## Teacher (src/views/teacher)

### src/views/teacher/EvaluationCorrections.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/teacher/EvaluationCorrections.vue:425 | #fee | --error-bg |
| src/views/teacher/EvaluationCorrections.vue:426 | #fcc | ≈ --error-border |
| src/views/teacher/EvaluationCorrections.vue:450 | #c00 | --error-text |
| src/views/teacher/EvaluationCorrections.vue:456 | #900 | ≈ --error-text |
| src/views/teacher/EvaluationCorrections.vue:465 | #dc2626 | ≈ --error-text |
| src/views/teacher/EvaluationCorrections.vue:475 | #b91c1c | ≈ --error-text |
| src/views/teacher/EvaluationCorrections.vue:709 | #dcfce7 | --success-bg |
| src/views/teacher/EvaluationCorrections.vue:710 | #166534 | --success-text |
| src/views/teacher/EvaluationCorrections.vue:714 | #dbeafe | --info-bg |
| src/views/teacher/EvaluationCorrections.vue:715 | #1e40af | --info-text |
| src/views/teacher/EvaluationCorrections.vue:719 | #fef3c7 | --warning-bg |
| src/views/teacher/EvaluationCorrections.vue:720 | #92400e | ≈ --warning-text |
| src/views/teacher/EvaluationCorrections.vue:724 | #fee2e2 | --error-bg |
| src/views/teacher/EvaluationCorrections.vue:725 | #991b1b | --error-text |
| src/views/teacher/EvaluationCorrections.vue:743 | #dbeafe | --info-bg |
| src/views/teacher/EvaluationCorrections.vue:744 | #1e40af | --info-text |
| src/views/teacher/EvaluationCorrections.vue:748 | #dcfce7 | --success-bg |
| src/views/teacher/EvaluationCorrections.vue:749 | #166534 | --success-text |
| src/views/teacher/EvaluationCorrections.vue:753 | #fef3c7 | --warning-bg |
| src/views/teacher/EvaluationCorrections.vue:754 | #92400e | ≈ --warning-text |
| src/views/teacher/EvaluationCorrections.vue:758 | #f3f4f6 | ≈ --bg-tertiary |
| src/views/teacher/EvaluationCorrections.vue:759 | #6b7280 | ≈ --text-tertiary |

### src/views/teacher/TeacherClasses.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/teacher/TeacherClasses.vue:332 | #3b82f6 | --blue-500 (fallback border-color) |
| src/views/teacher/TeacherClasses.vue:333 | #3b82f6 | --blue-500 (fallback color) |
| src/views/teacher/TeacherClasses.vue:378 | #e0e7ff | ⚠ aucun token (indigo) |
| src/views/teacher/TeacherClasses.vue:379 | #5b21b6 | ⚠ aucun token (violet) |
| src/views/teacher/TeacherClasses.vue:390 | #dcfce7 | --success-bg |
| src/views/teacher/TeacherClasses.vue:391 | #15803d | ≈ --success-text |
| src/views/teacher/TeacherClasses.vue:401 | #22c55e | ≈ --success-text (background) |
| src/views/teacher/TeacherClasses.vue:535 | #3b82f6 | --blue-500 (gradient) |
| src/views/teacher/TeacherClasses.vue:535 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/teacher/TeacherClasses.vue:545 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/teacher/TeacherClasses.vue:545 | #1d4ed8 | ≈ --blue-700 (gradient) |
| src/views/teacher/TeacherClasses.vue:555 | #FEF2F2 | ≈ --error-bg |
| src/views/teacher/TeacherClasses.vue:556 | #FCA5A5 | ≈ --error-border |
| src/views/teacher/TeacherClasses.vue:563 | #DC2626 | ≈ --error-text |
| src/views/teacher/TeacherClasses.vue:574 | #991B1B | --error-text |
| src/views/teacher/TeacherClasses.vue:579 | #B91C1C | ≈ --error-text |
| src/views/teacher/TeacherClasses.vue:585 | #DC2626 | ≈ --error-text (background) |
| src/views/teacher/TeacherClasses.vue:596 | #B91C1C | ≈ --error-text (background) |

### src/views/teacher/TeacherHub.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/teacher/TeacherHub.vue:236 | rgba(0, 0, 0, 0.18) | --shadow-* (box-shadow) |
| src/views/teacher/TeacherHub.vue:237 | #3b82f6 | --blue-500 (fallback border-color) |
| src/views/teacher/TeacherHub.vue:241 | #3b82f6 | --blue-500 (fallback background) |
| src/views/teacher/TeacherHub.vue:266 | #3b82f6 | --blue-500 (gradient) |
| src/views/teacher/TeacherHub.vue:266 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/teacher/TeacherHub.vue:270 | #f59e0b | ≈ --warning-text (gradient) |
| src/views/teacher/TeacherHub.vue:270 | #d97706 | ≈ --warning-text (gradient) |
| src/views/teacher/TeacherHub.vue:274 | #10b981 | ≈ --success-text (gradient) |
| src/views/teacher/TeacherHub.vue:274 | #059669 | ≈ --success-text (gradient) |
| src/views/teacher/TeacherHub.vue:321 | #3b82f6 | --blue-500 (fallback color) |
| src/views/teacher/TeacherHub.vue:408 | #3b82f6 | --blue-500 (color) |
| src/views/teacher/TeacherHub.vue:412 | #f59e0b | ≈ --warning-text (color) |
| src/views/teacher/TeacherHub.vue:416 | #10b981 | ≈ --success-text (color) |

### src/views/teacher/TeacherMatieres.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/teacher/TeacherMatieres.vue:246 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/teacher/TeacherMatieres.vue:306 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (bleu translucide) |
| src/views/teacher/TeacherMatieres.vue:307 | rgb(37, 99, 235) | ≈ --blue-600 |

### src/views/teacher/TeacherProfile.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/teacher/TeacherProfile.vue:297 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (bleu translucide, gradient) |
| src/views/teacher/TeacherProfile.vue:297 | rgba(37, 99, 235, 0.05) | ⚠ aucun token (bleu translucide, gradient) |
| src/views/teacher/TeacherProfile.vue:303 | #3b82f6 | --blue-500 |
| src/views/teacher/TeacherProfile.vue:331 | #3b82f6 | --blue-500 (gradient) |
| src/views/teacher/TeacherProfile.vue:331 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/teacher/TeacherProfile.vue:335 | rgba(59, 130, 246, 0.3) | ⚠ aucun token (box-shadow teinté bleu) |
| src/views/teacher/TeacherProfile.vue:386 | #3b82f6 | --blue-500 |
| src/views/teacher/TeacherProfile.vue:430 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/teacher/TeacherProfile.vue:476 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (bleu translucide, gradient) |
| src/views/teacher/TeacherProfile.vue:476 | rgba(37, 99, 235, 0.05) | ⚠ aucun token (bleu translucide, gradient) |
| src/views/teacher/TeacherProfile.vue:477 | #3b82f6 | --blue-500 (border-color) |
| src/views/teacher/TeacherProfile.vue:479 | rgba(59, 130, 246, 0.2) | ⚠ aucun token (box-shadow teinté bleu) |
| src/views/teacher/TeacherProfile.vue:485 | #3b82f6 | --blue-500 |

### src/views/teacher/TeacherSchedule.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/teacher/TeacherSchedule.vue:175 | #2563eb | ≈ --blue-600 |

### src/views/teacher/TeacherSettings.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/teacher/TeacherSettings.vue:435 | #ccc | --border-secondary (background-color) |
| src/views/teacher/TeacherSettings.vue:453 | #3b82f6 | --blue-500 |
| src/views/teacher/TeacherSettings.vue:484 | #ef4444 | ≈ --error-text (gradient) |
| src/views/teacher/TeacherSettings.vue:484 | #dc2626 | ≈ --error-text (gradient) |
| src/views/teacher/TeacherSettings.vue:489 | #dc2626 | ≈ --error-text (gradient) |
| src/views/teacher/TeacherSettings.vue:489 | #b91c1c | ≈ --error-text (gradient) |
| src/views/teacher/TeacherSettings.vue:519 | #3B82F6 | --blue-500 (border-color) |
| src/views/teacher/TeacherSettings.vue:537 | #3b82f6 | --blue-500 (gradient) |
| src/views/teacher/TeacherSettings.vue:537 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/teacher/TeacherSettings.vue:542 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/teacher/TeacherSettings.vue:542 | #1d4ed8 | ≈ --blue-700 (gradient) |

### src/views/teacher/TeacherStats.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/teacher/TeacherStats.vue:366 | #dbeafe | --info-bg (--blue-100) |
| src/views/teacher/TeacherStats.vue:370 | #dcfce7 | --success-bg |
| src/views/teacher/TeacherStats.vue:374 | #ffedd5 | ⚠ aucun token (orange clair) |
| src/views/teacher/TeacherStats.vue:378 | #f3e8ff | ⚠ aucun token (violet clair) |
| src/views/teacher/TeacherStats.vue:561 | #e0e7ff | ⚠ aucun token (indigo clair) |
| src/views/teacher/TeacherStats.vue:562 | #5b21b6 | ⚠ aucun token (violet) |
| src/views/teacher/TeacherStats.vue:635 | #FEF2F2 | ≈ --error-bg |
| src/views/teacher/TeacherStats.vue:636 | #FCA5A5 | ≈ --error-border |
| src/views/teacher/TeacherStats.vue:643 | #DC2626 | ≈ --error-text |
| src/views/teacher/TeacherStats.vue:654 | #991B1B | --error-text |
| src/views/teacher/TeacherStats.vue:659 | #B91C1C | ≈ --error-text |
| src/views/teacher/TeacherStats.vue:665 | #DC2626 | ≈ --error-text (background) |
| src/views/teacher/TeacherStats.vue:676 | #B91C1C | ≈ --error-text (background) |

### src/views/teacher/TeacherVisioList.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/teacher/TeacherVisioList.vue:482 | #fee | --error-bg |
| src/views/teacher/TeacherVisioList.vue:483 | #fcc | ≈ --error-border |
| src/views/teacher/TeacherVisioList.vue:507 | #c00 | --error-text |
| src/views/teacher/TeacherVisioList.vue:513 | #900 | ≈ --error-text |
| src/views/teacher/TeacherVisioList.vue:522 | #dc2626 | ≈ --error-text (background) |
| src/views/teacher/TeacherVisioList.vue:532 | #b91c1c | ≈ --error-text (background) |
| src/views/teacher/TeacherVisioList.vue:611 | #22c55e | ≈ --success-text (background) |
| src/views/teacher/TeacherVisioList.vue:614 | rgba(34, 197, 94, 0.2) | ⚠ aucun token (box-shadow teinté vert) |
| src/views/teacher/TeacherVisioList.vue:648 | #22c55e | ≈ --success-text (border-color) |
| src/views/teacher/TeacherVisioList.vue:649 | rgba(34, 197, 94, 0.05) | ⚠ aucun token (vert translucide, gradient) |
| src/views/teacher/TeacherVisioList.vue:691 | #dcfce7 | --success-bg |
| src/views/teacher/TeacherVisioList.vue:692 | #166534 | --success-text |
| src/views/teacher/TeacherVisioList.vue:696 | #dbeafe | --info-bg |
| src/views/teacher/TeacherVisioList.vue:697 | #1e40af | --info-text |
| src/views/teacher/TeacherVisioList.vue:703 | #22c55e | ≈ --success-text (background) |
| src/views/teacher/TeacherVisioList.vue:751 | #22c55e | ≈ --success-text (gradient) |
| src/views/teacher/TeacherVisioList.vue:751 | #16a34a | ≈ --success-text (gradient) |
| src/views/teacher/TeacherVisioList.vue:756 | #16a34a | ≈ --success-text (gradient) |
| src/views/teacher/TeacherVisioList.vue:756 | #15803d | ≈ --success-text (gradient) |
| src/views/teacher/TeacherVisioList.vue:761 | #3b82f6 | --blue-500 (background) |
| src/views/teacher/TeacherVisioList.vue:766 | #2563eb | ≈ --blue-600 (background) |
| src/views/teacher/TeacherVisioList.vue:770 | #f59e0b | ≈ --warning-text (background) |
| src/views/teacher/TeacherVisioList.vue:775 | #d97706 | ≈ --warning-text (background) |
| src/views/teacher/TeacherVisioList.vue:779 | #ef4444 | ≈ --error-text (background) |
| src/views/teacher/TeacherVisioList.vue:784 | #dc2626 | ≈ --error-text (background) |

> **Total Teacher : 119 occurrences — 15 sans équivalent.**

---

## Vues pédagogiques (evaluations / lessons / attendance)

> `src/views/evaluations/CreateEvaluation.vue`, `CreateQuestions.vue`, `StudentEvaluations.vue` : aucune couleur en dur.

### src/views/evaluations/EvaluationResults.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/evaluations/EvaluationResults.vue:699 | #f59e0b | ≈ --warning-text (border) |
| src/views/evaluations/EvaluationResults.vue:707 | #f59e0b | ≈ --warning-text (color) |
| src/views/evaluations/EvaluationResults.vue:723 | #fbbf24 | ≈ --warning-border (border) |
| src/views/evaluations/EvaluationResults.vue:729 | #f59e0b | ≈ --warning-text (color) |
| src/views/evaluations/EvaluationResults.vue:734 | #d97706 | ≈ --warning-text (color) |
| src/views/evaluations/EvaluationResults.vue:754 | #f59e0b | ≈ --warning-bg (background) |
| src/views/evaluations/EvaluationResults.vue:762 | #d97706 | ≈ --warning-text (color) |
| src/views/evaluations/EvaluationResults.vue:780 | #60a5fa | --blue-400 (border) |
| src/views/evaluations/EvaluationResults.vue:792 | rgba(34, 197, 94, 0.15) | ≈ --success-bg (#22c55e@15%) |
| src/views/evaluations/EvaluationResults.vue:793 | #22c55e | ≈ --success-border (border) |
| src/views/evaluations/EvaluationResults.vue:798 | rgba(239, 68, 68, 0.15) | ≈ --error-bg (#ef4444@15%) |
| src/views/evaluations/EvaluationResults.vue:799 | #ef4444 | ≈ --error-border (border) |
| src/views/evaluations/EvaluationResults.vue:819 | #60a5fa | --blue-400 (color) |
| src/views/evaluations/EvaluationResults.vue:829 | #22c55e | ≈ --success-text (color) |
| src/views/evaluations/EvaluationResults.vue:834 | #ef4444 | ≈ --error-text (color) |

### src/views/evaluations/PreviewEvaluation.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/evaluations/PreviewEvaluation.vue:333 | #8b5cf6 | ⚠ aucun token (violet, gradient) |
| src/views/evaluations/PreviewEvaluation.vue:333 | #6366f1 | ⚠ aucun token (indigo, gradient) |
| src/views/evaluations/PreviewEvaluation.vue:337 | rgba(139, 92, 246, 0.1) | ⚠ aucun token (box-shadow violet) |
| src/views/evaluations/PreviewEvaluation.vue:337 | rgba(139, 92, 246, 0.06) | ⚠ aucun token (box-shadow violet) |
| src/views/evaluations/PreviewEvaluation.vue:350 | rgba(255, 255, 255, 0.2) | ⚠ aucun token (overlay blanc hors sidebar) |
| src/views/evaluations/PreviewEvaluation.vue:521 | #8b5cf6 | ⚠ aucun token (violet, gradient) |
| src/views/evaluations/PreviewEvaluation.vue:521 | #6366f1 | ⚠ aucun token (indigo, gradient) |
| src/views/evaluations/PreviewEvaluation.vue:576 | rgba(139, 92, 246, 0.1) | ⚠ aucun token (violet, background) |
| src/views/evaluations/PreviewEvaluation.vue:577 | #8b5cf6 | ⚠ aucun token (violet, color) |
| src/views/evaluations/PreviewEvaluation.vue:584 | #8b5cf6 | ⚠ aucun token (violet, color) |
| src/views/evaluations/PreviewEvaluation.vue:617 | #8b5cf6 | ⚠ aucun token (violet, border) |
| src/views/evaluations/PreviewEvaluation.vue:618 | rgba(139, 92, 246, 0.05) | ⚠ aucun token (violet, background) |
| src/views/evaluations/PreviewEvaluation.vue:622 | #8b5cf6 | ⚠ aucun token (violet, border) |
| src/views/evaluations/PreviewEvaluation.vue:623 | rgba(139, 92, 246, 0.1) | ⚠ aucun token (violet, background) |
| src/views/evaluations/PreviewEvaluation.vue:639 | #8b5cf6 | ⚠ aucun token (violet, border) |
| src/views/evaluations/PreviewEvaluation.vue:640 | #8b5cf6 | ⚠ aucun token (violet, background) |
| src/views/evaluations/PreviewEvaluation.vue:669 | #8b5cf6 | ⚠ aucun token (violet, border) |
| src/views/evaluations/PreviewEvaluation.vue:755 | #22c55e | ≈ --success-bg (background) |
| src/views/evaluations/PreviewEvaluation.vue:765 | #16a34a | ≈ --success-text (background) |

### src/views/evaluations/TakeEvaluation.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/evaluations/TakeEvaluation.vue:448 | #f3e8ff | ⚠ aucun token (violet clair, gradient) |
| src/views/evaluations/TakeEvaluation.vue:448 | #ede9fe | ⚠ aucun token (violet clair, gradient) |
| src/views/evaluations/TakeEvaluation.vue:449 | #8b5cf6 | ⚠ aucun token (violet, border) |
| src/views/evaluations/TakeEvaluation.vue:452 | #5b21b6 | ⚠ aucun token (violet, color) |
| src/views/evaluations/TakeEvaluation.vue:473 | #8b5cf6 | ⚠ aucun token (violet, border) |
| src/views/evaluations/TakeEvaluation.vue:474 | #f5f3ff | ⚠ aucun token (violet clair, background) |
| src/views/evaluations/TakeEvaluation.vue:479 | #7c3aed | ⚠ aucun token (violet, color) |
| src/views/evaluations/TakeEvaluation.vue:490 | #fee2e2 | --error-bg |
| src/views/evaluations/TakeEvaluation.vue:491 | #ef4444 | ≈ --error-border (border) |
| src/views/evaluations/TakeEvaluation.vue:495 | #991b1b | --error-text |
| src/views/evaluations/TakeEvaluation.vue:522 | #eff6ff | --blue-50 |
| src/views/evaluations/TakeEvaluation.vue:523 | #3b82f6 | --blue-500 (border) |
| src/views/evaluations/TakeEvaluation.vue:545 | #3b82f6 | --blue-500 (color) |
| src/views/evaluations/TakeEvaluation.vue:588 | #3b82f6 | --blue-500 (color) |
| src/views/evaluations/TakeEvaluation.vue:600 | #f59e0b | ≈ --warning-text (color) |
| src/views/evaluations/TakeEvaluation.vue:604 | #ef4444 | ≈ --error-text (color) |
| src/views/evaluations/TakeEvaluation.vue:628 | #e5e7eb | ≈ --border-primary |
| src/views/evaluations/TakeEvaluation.vue:635 | #3b82f6 | --blue-500 (gradient) |
| src/views/evaluations/TakeEvaluation.vue:635 | #8b5cf6 | ⚠ aucun token (violet, gradient) |
| src/views/evaluations/TakeEvaluation.vue:658 | #22c55e | ≈ --success-border (border) |
| src/views/evaluations/TakeEvaluation.vue:675 | #3b82f6 | --blue-500 (background) |
| src/views/evaluations/TakeEvaluation.vue:689 | #22c55e | ≈ --success-text (color) |
| src/views/evaluations/TakeEvaluation.vue:712 | #e5e7eb | ≈ --border-primary |
| src/views/evaluations/TakeEvaluation.vue:719 | #f9fafb | ≈ --bg-secondary |
| src/views/evaluations/TakeEvaluation.vue:720 | #3b82f6 | --blue-500 (border) |
| src/views/evaluations/TakeEvaluation.vue:724 | #3b82f6 | --blue-500 (border) |
| src/views/evaluations/TakeEvaluation.vue:725 | rgba(59, 130, 246, 0.08) | ⚠ aucun token (bleu translucide) |
| src/views/evaluations/TakeEvaluation.vue:729 | #3b82f6 | --blue-500 (accent-color) |
| src/views/evaluations/TakeEvaluation.vue:744 | #e5e7eb | ≈ --border-primary |
| src/views/evaluations/TakeEvaluation.vue:756 | #3b82f6 | --blue-500 (border) |
| src/views/evaluations/TakeEvaluation.vue:757 | rgba(59, 130, 246, 0.15) | ⚠ aucun token (box-shadow teinté bleu) |
| src/views/evaluations/TakeEvaluation.vue:780 | #d1d5db | ≈ --border-secondary |
| src/views/evaluations/TakeEvaluation.vue:791 | #f3f4f6 | ≈ --bg-tertiary |
| src/views/evaluations/TakeEvaluation.vue:802 | #3b82f6 | --blue-500 (gradient) |
| src/views/evaluations/TakeEvaluation.vue:802 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/evaluations/TakeEvaluation.vue:813 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/evaluations/TakeEvaluation.vue:813 | #1d4ed8 | ≈ --blue-700 (gradient) |
| src/views/evaluations/TakeEvaluation.vue:842 | #ef4444 | ≈ --error-text (color) |
| src/views/evaluations/TakeEvaluation.vue:857 | #ef4444 | ≈ --error-text (background) |
| src/views/evaluations/TakeEvaluation.vue:867 | #dc2626 | ≈ --error-text (background) |
| src/views/evaluations/TakeEvaluation.vue:874 | rgba(0, 0, 0, 0.5) | ⚠ aucun token (backdrop modale) |
| src/views/evaluations/TakeEvaluation.vue:885 | rgba(0, 0, 0, 0.3) | --shadow-* (box-shadow) |
| src/views/evaluations/TakeEvaluation.vue:913 | #fef3c7 | --warning-bg |
| src/views/evaluations/TakeEvaluation.vue:914 | #92400e | ≈ --warning-text |
| src/views/evaluations/TakeEvaluation.vue:939 | #22c55e | ≈ --success-text (color) |
| src/views/evaluations/TakeEvaluation.vue:944 | #eff6ff | --blue-50 |
| src/views/evaluations/TakeEvaluation.vue:959 | #3b82f6 | --blue-500 (color) |

### src/views/evaluations/TeacherEvaluations.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/evaluations/TeacherEvaluations.vue:554 | #fee | --error-bg |
| src/views/evaluations/TeacherEvaluations.vue:555 | #fcc | ≈ --error-border |
| src/views/evaluations/TeacherEvaluations.vue:579 | #c00 | --error-text |
| src/views/evaluations/TeacherEvaluations.vue:585 | #900 | ≈ --error-text |
| src/views/evaluations/TeacherEvaluations.vue:594 | #dc2626 | ≈ --error-text (background) |
| src/views/evaluations/TeacherEvaluations.vue:604 | #b91c1c | ≈ --error-text (background) |
| src/views/evaluations/TeacherEvaluations.vue:629 | rgba(245, 158, 11, 0.08) | ≈ --warning-bg (#f59e0b@8%) |
| src/views/evaluations/TeacherEvaluations.vue:630 | rgba(245, 158, 11, 0.2) | ≈ --warning-border (#f59e0b@20%) |
| src/views/evaluations/TeacherEvaluations.vue:704 | rgba(59, 130, 246, 0.1) | --shadow-* (glow bleu) |
| src/views/evaluations/TeacherEvaluations.vue:901 | rgba(0, 0, 0, 0.5) | ⚠ aucun token (backdrop modale) |
| src/views/evaluations/TeacherEvaluations.vue:912 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/evaluations/TeacherEvaluations.vue:912 | rgba(0, 0, 0, 0.04) | --shadow-* (box-shadow) |
| src/views/evaluations/TeacherEvaluations.vue:958 | #eff6ff | --blue-50 |
| src/views/evaluations/TeacherEvaluations.vue:959 | #bfdbfe | --blue-200 (border) |
| src/views/evaluations/TeacherEvaluations.vue:967 | #1e40af | --info-text |
| src/views/evaluations/TeacherEvaluations.vue:991 | #dc2626 | ≈ --error-text (color) |
| src/views/evaluations/TeacherEvaluations.vue:1012 | rgba(59, 130, 246, 0.1) | --shadow-* (glow bleu) |
| src/views/evaluations/TeacherEvaluations.vue:1053 | #3b82f6 | --blue-500 (background) |
| src/views/evaluations/TeacherEvaluations.vue:1058 | #2563eb | ≈ --blue-600 (background) |

### src/views/lessons/LessonChapters.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/lessons/LessonChapters.vue:225 | #dbeafe | --blue-100 / --info-bg (gradient) |
| src/views/lessons/LessonChapters.vue:225 | #e0e7ff | ⚠ aucun token (indigo clair) |
| src/views/lessons/LessonChapters.vue:226 | #3b82f6 | --blue-500 (border) |
| src/views/lessons/LessonChapters.vue:229 | rgba(59, 130, 246, 0.15) | --shadow-* (glow bleu) |
| src/views/lessons/LessonChapters.vue:243 | #1e40af | --info-text (color) |
| src/views/lessons/LessonChapters.vue:251 | #1e3a8a | ≈ --blue-800 (color) |
| src/views/lessons/LessonChapters.vue:275 | #3b82f6 | --blue-500 (color) |
| src/views/lessons/LessonChapters.vue:283 | #2563eb | ≈ --blue-600 (color) |
| src/views/lessons/LessonChapters.vue:293 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/lessons/LessonChapters.vue:335 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (bleu translucide) |
| src/views/lessons/LessonChapters.vue:336 | #3b82f6 | --blue-500 (color) |
| src/views/lessons/LessonChapters.vue:337 | rgba(59, 130, 246, 0.3) | ⚠ aucun token (bleu translucide, border) |
| src/views/lessons/LessonChapters.vue:341 | rgba(245, 158, 11, 0.1) | ≈ --warning-bg (background) |
| src/views/lessons/LessonChapters.vue:342 | #f59e0b | ≈ --warning-text (color) |
| src/views/lessons/LessonChapters.vue:343 | rgba(245, 158, 11, 0.3) | ≈ --warning-border (border) |
| src/views/lessons/LessonChapters.vue:347 | rgba(239, 68, 68, 0.1) | ≈ --error-bg (background) |
| src/views/lessons/LessonChapters.vue:348 | #ef4444 | ≈ --error-text (color) |
| src/views/lessons/LessonChapters.vue:349 | rgba(239, 68, 68, 0.3) | ≈ --error-border (border) |
| src/views/lessons/LessonChapters.vue:372 | rgba(16, 185, 129, 0.15) | ≈ --success-bg (background) |
| src/views/lessons/LessonChapters.vue:373 | #10b981 | ≈ --success-text (color) |
| src/views/lessons/LessonChapters.vue:374 | rgba(16, 185, 129, 0.3) | ≈ --success-border (border) |
| src/views/lessons/LessonChapters.vue:378 | rgba(245, 158, 11, 0.15) | ≈ --warning-bg (background) |
| src/views/lessons/LessonChapters.vue:379 | #f59e0b | ≈ --warning-text (color) |
| src/views/lessons/LessonChapters.vue:380 | rgba(245, 158, 11, 0.3) | ≈ --warning-border (border) |
| src/views/lessons/LessonChapters.vue:408 | #10b981 | ≈ --success-text (background) |
| src/views/lessons/LessonChapters.vue:454 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/lessons/LessonChapters.vue:461 | #3b82f6 | --blue-500 (border) |
| src/views/lessons/LessonChapters.vue:479 | rgba(239, 68, 68, 0.3) | ≈ --error-border (border) |
| src/views/lessons/LessonChapters.vue:486 | #dc2626 | ≈ --error-text (color) |
| src/views/lessons/LessonChapters.vue:493 | #3b82f6 | --blue-500 (background) |

### src/views/lessons/LessonEditor.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/lessons/LessonEditor.vue:726 | #3b82f6 | --blue-500 (border) |
| src/views/lessons/LessonEditor.vue:798 | #ef4444 | ≈ --error-text (color) |
| src/views/lessons/LessonEditor.vue:818 | #3b82f6 | --blue-500 (border) |
| src/views/lessons/LessonEditor.vue:819 | rgba(59, 130, 246, 0.1) | --shadow-* (glow bleu) |
| src/views/lessons/LessonEditor.vue:870 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (bleu translucide) |
| src/views/lessons/LessonEditor.vue:871 | #3b82f6 | --blue-500 (border) |
| src/views/lessons/LessonEditor.vue:914 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (bleu translucide) |
| src/views/lessons/LessonEditor.vue:915 | #3b82f6 | --blue-500 (border) |
| src/views/lessons/LessonEditor.vue:947 | #3b82f6 | --blue-500 (color) |
| src/views/lessons/LessonEditor.vue:948 | #3b82f6 | --blue-500 (border) |
| src/views/lessons/LessonEditor.vue:1000 | #fee2e2 | --error-bg (background) |
| src/views/lessons/LessonEditor.vue:1001 | #dc2626 | ≈ --error-text (color) |
| src/views/lessons/LessonEditor.vue:1002 | #fca5a5 | --error-border (border) |
| src/views/lessons/LessonEditor.vue:1011 | #fecaca | ≈ --error-border (background) |
| src/views/lessons/LessonEditor.vue:1055 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (bleu translucide) |
| src/views/lessons/LessonEditor.vue:1056 | #3b82f6 | --blue-500 (border) |
| src/views/lessons/LessonEditor.vue:1114 | #3b82f6 | --blue-500 (gradient) |
| src/views/lessons/LessonEditor.vue:1114 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/lessons/LessonEditor.vue:1119 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/lessons/LessonEditor.vue:1119 | #1d4ed8 | ≈ --blue-700 (gradient) |
| src/views/lessons/LessonEditor.vue:1129 | #fee2e2 | --error-bg (background) |
| src/views/lessons/LessonEditor.vue:1130 | #dc2626 | ≈ --error-text (color) |
| src/views/lessons/LessonEditor.vue:1131 | #fca5a5 | --error-border (border) |
| src/views/lessons/LessonEditor.vue:1135 | #fecaca | ≈ --error-border (background) |
| src/views/lessons/LessonEditor.vue:1145 | #dbeafe | --blue-100 / --info-bg (background) |
| src/views/lessons/LessonEditor.vue:1146 | #1d4ed8 | ≈ --blue-700 (color) |
| src/views/lessons/LessonEditor.vue:1147 | #93c5fd | --blue-300 / --info-border (border) |
| src/views/lessons/LessonEditor.vue:1151 | #bfdbfe | --blue-200 (background) |

### src/views/lessons/TeacherLessons.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/lessons/TeacherLessons.vue:578 | #3b82f6 | --blue-500 (gradient) |
| src/views/lessons/TeacherLessons.vue:578 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/lessons/TeacherLessons.vue:588 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/lessons/TeacherLessons.vue:588 | #1d4ed8 | ≈ --blue-700 (gradient) |
| src/views/lessons/TeacherLessons.vue:741 | #dcfce7 | --success-bg |
| src/views/lessons/TeacherLessons.vue:742 | #15803d | ≈ --success-text |
| src/views/lessons/TeacherLessons.vue:746 | #fef3c7 | --warning-bg |
| src/views/lessons/TeacherLessons.vue:747 | #92400e | ≈ --warning-text |
| src/views/lessons/TeacherLessons.vue:751 | #f3f4f6 | ≈ --bg-tertiary |
| src/views/lessons/TeacherLessons.vue:752 | #6b7280 | ≈ --text-tertiary |
| src/views/lessons/TeacherLessons.vue:811 | #3b82f6 | --blue-500 (gradient) |
| src/views/lessons/TeacherLessons.vue:811 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/lessons/TeacherLessons.vue:811 | #2563eb | ≈ --blue-600 (gradient hover) |
| src/views/lessons/TeacherLessons.vue:811 | #1d4ed8 | ≈ --blue-700 (gradient hover) |
| src/views/lessons/TeacherLessons.vue:811 | rgba(59, 130, 246, 0.3) | --shadow-* (glow bleu) |
| src/views/lessons/TeacherLessons.vue:823 | rgba(0, 0, 0, 0.5) | ⚠ aucun token (backdrop modale) |
| src/views/lessons/TeacherLessons.vue:834 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/lessons/TeacherLessons.vue:888 | #dc2626 | ≈ --error-text (color) |
| src/views/lessons/TeacherLessons.vue:907 | #3b82f6 | --blue-500 (border) |
| src/views/lessons/TeacherLessons.vue:908 | rgba(59, 130, 246, 0.1) | --shadow-* (glow bleu) |
| src/views/lessons/TeacherLessons.vue:940 | #3b82f6 | --blue-500 (gradient) |
| src/views/lessons/TeacherLessons.vue:945 | #2563eb | ≈ --blue-600 (gradient hover) |
| src/views/lessons/TeacherLessons.vue:945 | #1d4ed8 | ≈ --blue-700 (gradient hover) |
| src/views/lessons/TeacherLessons.vue:993 | #3b82f6 | --blue-500 (gradient) |
| src/views/lessons/TeacherLessons.vue:993 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/lessons/TeacherLessons.vue:1003 | #2563eb | ≈ --blue-600 (gradient hover) |
| src/views/lessons/TeacherLessons.vue:1003 | #1d4ed8 | ≈ --blue-700 (gradient hover) |
| src/views/lessons/TeacherLessons.vue:1013 | #FEF2F2 | ≈ --error-bg (background) |
| src/views/lessons/TeacherLessons.vue:1014 | #FCA5A5 | --error-border (border) |
| src/views/lessons/TeacherLessons.vue:1021 | #DC2626 | ≈ --error-text (color) |
| src/views/lessons/TeacherLessons.vue:1032 | #991B1B | --error-text (color) |
| src/views/lessons/TeacherLessons.vue:1037 | #B91C1C | ≈ --error-text (color) |
| src/views/lessons/TeacherLessons.vue:1043 | #DC2626 | ≈ --error-text (background) |
| src/views/lessons/TeacherLessons.vue:1054 | #B91C1C | ≈ --error-text (background) |

### src/views/attendance/AttendanceHistory.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/attendance/AttendanceHistory.vue:524 | #3b82f6 | --blue-500 (color) |
| src/views/attendance/AttendanceHistory.vue:551 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/attendance/AttendanceHistory.vue:555 | #3b82f6 | --blue-500 (border-left) |
| src/views/attendance/AttendanceHistory.vue:556 | #10b981 | ≈ --success-text (border-left) |
| src/views/attendance/AttendanceHistory.vue:557 | #f59e0b | ≈ --warning-text (border-left) |
| src/views/attendance/AttendanceHistory.vue:558 | #ef4444 | ≈ --error-text (border-left) |
| src/views/attendance/AttendanceHistory.vue:559 | #8b5cf6 | ⚠ aucun token (violet, border-left) |
| src/views/attendance/AttendanceHistory.vue:590 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/attendance/AttendanceHistory.vue:632 | #3b82f6 | --blue-500 (border) |
| src/views/attendance/AttendanceHistory.vue:633 | rgba(59, 130, 246, 0.1) | --shadow-* (glow bleu) |
| src/views/attendance/AttendanceHistory.vue:644 | #ef4444 | ≈ --error-text (background) |
| src/views/attendance/AttendanceHistory.vue:655 | #dc2626 | ≈ --error-text (background) |
| src/views/attendance/AttendanceHistory.vue:663 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/attendance/AttendanceHistory.vue:684 | #10b981 | ≈ --success-text (background) |
| src/views/attendance/AttendanceHistory.vue:695 | #059669 | ≈ --success-text (background) |
| src/views/attendance/AttendanceHistory.vue:772 | #3b82f6 | --blue-500 (color) |
| src/views/attendance/AttendanceHistory.vue:784 | #e0e7ff | ⚠ aucun token (indigo clair) |
| src/views/attendance/AttendanceHistory.vue:785 | #3730a3 | ⚠ aucun token (indigo) |
| src/views/attendance/AttendanceHistory.vue:800 | #d1fae5 | ≈ --success-bg (background) |
| src/views/attendance/AttendanceHistory.vue:801 | #065f46 | ≈ --success-text (color) |
| src/views/attendance/AttendanceHistory.vue:805 | #fee2e2 | --error-bg (background) |
| src/views/attendance/AttendanceHistory.vue:806 | #991b1b | --error-text (color) |
| src/views/attendance/AttendanceHistory.vue:815 | #10b981 | ≈ --success-text (color) |
| src/views/attendance/AttendanceHistory.vue:823 | #ef4444 | ≈ --error-text (color) |
| src/views/attendance/AttendanceHistory.vue:850 | #3b82f6 | --blue-500 (background) |
| src/views/attendance/AttendanceHistory.vue:861 | #2563eb | ≈ --blue-600 (background) |
| src/views/attendance/AttendanceHistory.vue:865 | #d1d5db | ≈ --border-secondary (background) |
| src/views/attendance/AttendanceHistory.vue:882 | #ef4444 | ≈ --error-text (color) |
| src/views/attendance/AttendanceHistory.vue:889 | #3b82f6 | --blue-500 (background) |
| src/views/attendance/AttendanceHistory.vue:900 | #2563eb | ≈ --blue-600 (background) |
| src/views/attendance/AttendanceHistory.vue:909 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/attendance/AttendanceHistory.vue:937 | rgba(0, 0, 0, 0.5) | ⚠ aucun token (backdrop modale) |
| src/views/attendance/AttendanceHistory.vue:948 | rgba(0, 0, 0, 0.15) | --shadow-* (box-shadow) |
| src/views/attendance/AttendanceHistory.vue:1030 | #6b7280 | ≈ --text-tertiary (background) |
| src/views/attendance/AttendanceHistory.vue:1041 | #4b5563 | ≈ --text-secondary (background) |

### src/views/attendance/SeanceAttendanceHistory.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/attendance/SeanceAttendanceHistory.vue:502 | rgba(0, 0, 0, 0.05) | --shadow-* (box-shadow) |
| src/views/attendance/SeanceAttendanceHistory.vue:509 | #3b82f6 | --blue-500 (color) |
| src/views/attendance/SeanceAttendanceHistory.vue:533 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/attendance/SeanceAttendanceHistory.vue:563 | #e5e7eb | ≈ --border-primary (border) |
| src/views/attendance/SeanceAttendanceHistory.vue:567 | #3b82f6 | --blue-500 (gradient) |
| src/views/attendance/SeanceAttendanceHistory.vue:567 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/attendance/SeanceAttendanceHistory.vue:569 | #3b82f6 | --blue-500 (border) |
| src/views/attendance/SeanceAttendanceHistory.vue:570 | rgba(59, 130, 246, 0.3) | --shadow-* (glow bleu) |
| src/views/attendance/SeanceAttendanceHistory.vue:617 | #3b82f6 | --blue-500 (border) |
| src/views/attendance/SeanceAttendanceHistory.vue:618 | rgba(59, 130, 246, 0.1) | --shadow-* (glow bleu) |
| src/views/attendance/SeanceAttendanceHistory.vue:623 | #3b82f6 | --blue-500 (gradient) |
| src/views/attendance/SeanceAttendanceHistory.vue:623 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/attendance/SeanceAttendanceHistory.vue:631 | rgba(59, 130, 246, 0.3) | --shadow-* (glow bleu) |
| src/views/attendance/SeanceAttendanceHistory.vue:635 | #2563eb | ≈ --blue-600 (gradient hover) |
| src/views/attendance/SeanceAttendanceHistory.vue:635 | #1d4ed8 | ≈ --blue-700 (gradient hover) |
| src/views/attendance/SeanceAttendanceHistory.vue:637 | rgba(59, 130, 246, 0.4) | --shadow-* (glow bleu) |
| src/views/attendance/SeanceAttendanceHistory.vue:675 | #3b82f6 | --blue-500 (border) |
| src/views/attendance/SeanceAttendanceHistory.vue:676 | rgba(59, 130, 246, 0.1) | --shadow-* (glow bleu) |
| src/views/attendance/SeanceAttendanceHistory.vue:708 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/attendance/SeanceAttendanceHistory.vue:717 | #FEF2F2 | ≈ --error-bg (background) |
| src/views/attendance/SeanceAttendanceHistory.vue:718 | #FCA5A5 | --error-border (border) |
| src/views/attendance/SeanceAttendanceHistory.vue:725 | #DC2626 | ≈ --error-text (color) |
| src/views/attendance/SeanceAttendanceHistory.vue:736 | #991B1B | --error-text (color) |
| src/views/attendance/SeanceAttendanceHistory.vue:741 | #B91C1C | ≈ --error-text (color) |
| src/views/attendance/SeanceAttendanceHistory.vue:751 | #DC2626 | ≈ --error-text (background) |
| src/views/attendance/SeanceAttendanceHistory.vue:763 | #B91C1C | ≈ --error-text (background) |
| src/views/attendance/SeanceAttendanceHistory.vue:771 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/attendance/SeanceAttendanceHistory.vue:805 | rgba(0, 0, 0, 0.02) | ≈ --bg-hover (fallback) |
| src/views/attendance/SeanceAttendanceHistory.vue:870 | #10B981 | ≈ --success-text (color) |
| src/views/attendance/SeanceAttendanceHistory.vue:874 | #F59E0B | ≈ --warning-text (color) |
| src/views/attendance/SeanceAttendanceHistory.vue:878 | #EF4444 | ≈ --error-text (color) |
| src/views/attendance/SeanceAttendanceHistory.vue:891 | #3b82f6 | --blue-500 (background) |
| src/views/attendance/SeanceAttendanceHistory.vue:902 | #2563eb | ≈ --blue-600 (background) |
| src/views/attendance/SeanceAttendanceHistory.vue:908 | #ef4444 | ≈ --error-text (background) |
| src/views/attendance/SeanceAttendanceHistory.vue:919 | #dc2626 | ≈ --error-text (background) |
| src/views/attendance/SeanceAttendanceHistory.vue:946 | #3b82f6 | --blue-500 (gradient) |
| src/views/attendance/SeanceAttendanceHistory.vue:946 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/attendance/SeanceAttendanceHistory.vue:948 | #3b82f6 | --blue-500 (border) |
| src/views/attendance/SeanceAttendanceHistory.vue:949 | rgba(59, 130, 246, 0.2) | --shadow-* (glow bleu) |
| src/views/attendance/SeanceAttendanceHistory.vue:970 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/attendance/SeanceAttendanceHistory.vue:996 | #3b82f6 | --blue-500 (gradient) |
| src/views/attendance/SeanceAttendanceHistory.vue:996 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/attendance/SeanceAttendanceHistory.vue:1004 | rgba(59, 130, 246, 0.3) | --shadow-* (glow bleu) |
| src/views/attendance/SeanceAttendanceHistory.vue:1008 | #2563eb | ≈ --blue-600 (gradient hover) |
| src/views/attendance/SeanceAttendanceHistory.vue:1008 | #1d4ed8 | ≈ --blue-700 (gradient hover) |
| src/views/attendance/SeanceAttendanceHistory.vue:1010 | rgba(59, 130, 246, 0.4) | --shadow-* (glow bleu) |

> **Total Vues pédagogiques : 273 occurrences — 40 sans équivalent** (violet/indigo majoritaire dans Preview/Take/Attendance ; backdrops `rgba(0,0,0,0.5)`).
> ⚠️ Dette de fidélité : les `rgba(59,130,246,α)` en **background**/**border** (TakeEvaluation, LessonChapters, LessonEditor) n'ont pas de token alpha — le hex de base est `--blue-500` mais l'opacité n'a pas d'équivalent.

---

## Autres vues (seances / matieres / coordinateur / classes / racine)

> `src/views/coordinateur/CoordinatorEvaluations.vue`, `src/views/Dashboard.vue`, `src/views/Login.vue`, `src/views/QuizTake.vue`, `src/views/Quizzes.vue` : aucune couleur en dur.

### src/views/seances/SeanceDetails.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/seances/SeanceDetails.vue:548 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/seances/SeanceDetails.vue:554 | rgba(0, 0, 0, 0.15) | --shadow-* (box-shadow hover) |
| src/views/seances/SeanceDetails.vue:563 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/seances/SeanceDetails.vue:582 | #10b981 | ≈ --success-text (fallback, background) |
| src/views/seances/SeanceDetails.vue:595 | rgba(0, 0, 0, 0.15) | --shadow-* (box-shadow) |
| src/views/seances/SeanceDetails.vue:606 | rgba(16, 185, 129, 0.1) | ≈ --success-bg (base #10b981) |
| src/views/seances/SeanceDetails.vue:607 | #10b981 | ≈ --success-text (color) |
| src/views/seances/SeanceDetails.vue:608 | rgba(16, 185, 129, 0.3) | ≈ --success-border (base #10b981) |
| src/views/seances/SeanceDetails.vue:613 | rgba(59, 130, 246, 0.1) | ≈ --info-bg (base --blue-500) |
| src/views/seances/SeanceDetails.vue:614 | #3b82f6 | --blue-500 (color) |
| src/views/seances/SeanceDetails.vue:615 | rgba(59, 130, 246, 0.3) | ≈ --info-border (base #3b82f6) |
| src/views/seances/SeanceDetails.vue:621 | rgba(245, 158, 11, 0.1) | ≈ --warning-bg (base #f59e0b) |
| src/views/seances/SeanceDetails.vue:622 | #f59e0b | ≈ --warning-text (color) |
| src/views/seances/SeanceDetails.vue:623 | rgba(245, 158, 11, 0.3) | ≈ --warning-border (base #f59e0b) |
| src/views/seances/SeanceDetails.vue:635 | rgba(16, 185, 129, 0.5) | ≈ --success-border (border-color) |
| src/views/seances/SeanceDetails.vue:639 | rgba(245, 158, 11, 0.5) | ≈ --warning-border (border-color) |
| src/views/seances/SeanceDetails.vue:648 | #c2410c | ⚠ aucun token (orange foncé ; ≈ --warning-text) |
| src/views/seances/SeanceDetails.vue:662 | rgba(239, 68, 68, 0.1) | ≈ --error-bg (base #ef4444) |
| src/views/seances/SeanceDetails.vue:663 | rgba(239, 68, 68, 0.3) | ≈ --error-border (base #ef4444) |
| src/views/seances/SeanceDetails.vue:667 | rgba(239, 68, 68, 0.3) | ≈ --error-border (border-color) |
| src/views/seances/SeanceDetails.vue:671 | #dc2626 | ≈ --error-text (color) |
| src/views/seances/SeanceDetails.vue:675 | #dc2626 | ≈ --error-text (bouton rouge) |
| src/views/seances/SeanceDetails.vue:679 | #b91c1c | ≈ --error-text (hover) |
| src/views/seances/SeanceDetails.vue:684 | #10b981 | ≈ --success-text (spinner) |

### src/views/matieres/MatiereDetails.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/matieres/MatiereDetails.vue:745 | rgba(251, 146, 60, 0.2) | ≈ --warning-bg (badge orange) |
| src/views/matieres/MatiereDetails.vue:749 | rgb(234, 88, 12) | ⚠ aucun token (#ea580c orange ; ≈ --warning-text) |
| src/views/matieres/MatiereDetails.vue:753 | rgba(34, 197, 94, 0.2) | ≈ --success-bg (base #22c55e) |
| src/views/matieres/MatiereDetails.vue:757 | rgb(21, 128, 61) | ≈ --success-text (#15803d) |
| src/views/matieres/MatiereDetails.vue:761 | rgba(59, 130, 246, 0.2) | ≈ --info-bg (base #3b82f6) |
| src/views/matieres/MatiereDetails.vue:765 | rgb(29, 78, 216) | ≈ --blue-700 (#1d4ed8) |
| src/views/matieres/MatiereDetails.vue:769 | rgba(239, 68, 68, 0.1) | ≈ --error-bg (base #ef4444) |
| src/views/matieres/MatiereDetails.vue:773 | rgba(239, 68, 68, 0.3) | ≈ --error-border (border-color) |
| src/views/matieres/MatiereDetails.vue:777 | rgb(220, 38, 38) | ≈ --error-text (#dc2626) |
| src/views/matieres/MatiereDetails.vue:920 | #3b82f6 | --blue-500 (color) |
| src/views/matieres/MatiereDetails.vue:921 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/matieres/MatiereDetails.vue:954 | rgba(0, 0, 0, 0.5) | ⚠ aucun token (backdrop modale) |
| src/views/matieres/MatiereDetails.vue:965 | rgba(0, 0, 0, 0.3) | --shadow-* (box-shadow modale) |
| src/views/matieres/MatiereDetails.vue:1032 | #ef4444 | ≈ --error-text (astérisque requis) |
| src/views/matieres/MatiereDetails.vue:1052 | #3b82f6 | --blue-500 (border-color focus) |
| src/views/matieres/MatiereDetails.vue:1053 | rgba(59, 130, 246, 0.1) | ≈ --info-bg (focus ring) |
| src/views/matieres/MatiereDetails.vue:1063 | #9ca3af | ≈ --text-disabled (placeholder) |
| src/views/matieres/MatiereDetails.vue:1092 | #3b82f6 | --blue-500 (bouton primaire) |
| src/views/matieres/MatiereDetails.vue:1097 | #2563eb | ≈ --blue-600 (hover) |
| src/views/matieres/MatiereDetails.vue:1137 | rgba(0, 0, 0, 0.15) | --shadow-* (toast) |
| src/views/matieres/MatiereDetails.vue:1176 | #10b981 | ≈ --success-text (gradient) |
| src/views/matieres/MatiereDetails.vue:1176 | #059669 | ≈ --success-text (gradient) |
| src/views/matieres/MatiereDetails.vue:1178 | #065f46 | ≈ --success-text (border-left) |
| src/views/matieres/MatiereDetails.vue:1183 | #ef4444 | ≈ --error-text (gradient) |
| src/views/matieres/MatiereDetails.vue:1183 | #dc2626 | ≈ --error-text (gradient) |
| src/views/matieres/MatiereDetails.vue:1185 | #991b1b | --error-text (border-left) |
| src/views/matieres/MatiereDetails.vue:1190 | #f59e0b | ≈ --warning-text (gradient) |
| src/views/matieres/MatiereDetails.vue:1190 | #d97706 | ≈ --warning-text (gradient) |
| src/views/matieres/MatiereDetails.vue:1192 | #92400e | ≈ --warning-text (border-left) |
| src/views/matieres/MatiereDetails.vue:1197 | #3b82f6 | --blue-500 (gradient) |
| src/views/matieres/MatiereDetails.vue:1197 | #2563eb | ≈ --blue-600 (gradient) |
| src/views/matieres/MatiereDetails.vue:1199 | #1e40af | --info-text (border-left) |

### src/views/coordinateur/SeanceManagement.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/coordinateur/SeanceManagement.vue:622 | #6366f1 | ⚠ aucun token (indigo, fallback) |
| src/views/coordinateur/SeanceManagement.vue:648 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/coordinateur/SeanceManagement.vue:672 | #6366f1 | ⚠ aucun token (indigo, toggle actif) |
| src/views/coordinateur/SeanceManagement.vue:685 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/coordinateur/SeanceManagement.vue:697 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/coordinateur/SeanceManagement.vue:734 | rgba(99, 102, 241, 0.1) | ⚠ aucun token (indigo, focus ring) |
| src/views/coordinateur/SeanceManagement.vue:784 | #4f46e5 | ⚠ aucun token (indigo, hover) |
| src/views/coordinateur/SeanceManagement.vue:800 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/coordinateur/SeanceManagement.vue:805 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow hover) |
| src/views/coordinateur/SeanceManagement.vue:883 | #f3e8ff | ⚠ aucun token (violet clair) |
| src/views/coordinateur/SeanceManagement.vue:884 | #7c3aed | ⚠ aucun token (violet) |
| src/views/coordinateur/SeanceManagement.vue:888 | #e9d5ff | ⚠ aucun token (violet clair) |
| src/views/coordinateur/SeanceManagement.vue:897 | #e5e7eb | ≈ --border-primary (hover gris) |
| src/views/coordinateur/SeanceManagement.vue:905 | #1f2937 | ≈ --text-primary (panel sombre) |
| src/views/coordinateur/SeanceManagement.vue:964 | #1f2937 | ≈ --text-primary (room-id) |
| src/views/coordinateur/SeanceManagement.vue:976 | rgba(255, 255, 255, 0.7) | ⚠ aucun token (texte blanc translucide hors sidebar) |
| src/views/coordinateur/SeanceManagement.vue:994 | #3b82f6 | --blue-500 (bouton participants) |
| src/views/coordinateur/SeanceManagement.vue:1008 | #2563eb | ≈ --blue-600 (hover) |
| src/views/coordinateur/SeanceManagement.vue:1013 | #16a34a | ≈ --success-text (bouton jitsi) |
| src/views/coordinateur/SeanceManagement.vue:1028 | #15803d | ≈ --success-text (hover) |
| src/views/coordinateur/SeanceManagement.vue:1036 | #fef3c7 | --warning-bg (waiting) |
| src/views/coordinateur/SeanceManagement.vue:1038 | #fcd34d | ≈ --warning-border (border) |
| src/views/coordinateur/SeanceManagement.vue:1049 | #92400e | ≈ --warning-text (color) |
| src/views/coordinateur/SeanceManagement.vue:1086 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/coordinateur/SeanceManagement.vue:1090 | #f3e8ff | ⚠ aucun token (violet clair, stat-card) |
| src/views/coordinateur/SeanceManagement.vue:1091 | #c084fc | ⚠ aucun token (violet, border-color) |
| src/views/coordinateur/SeanceManagement.vue:1101 | #7c3aed | ⚠ aucun token (violet, label) |
| src/views/coordinateur/SeanceManagement.vue:1112 | #6d28d9 | ⚠ aucun token (violet, valeur) |

### src/views/classes/ClasseDetails.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/classes/ClasseDetails.vue:574 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/classes/ClasseDetails.vue:578 | #10b981 | ≈ --success-text (border-left) |
| src/views/classes/ClasseDetails.vue:674 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow hover) |
| src/views/classes/ClasseDetails.vue:707 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/views/classes/ClasseDetails.vue:739 | #10b981 | ≈ --success-text (tab active border) |
| src/views/classes/ClasseDetails.vue:740 | #10b981 | ≈ --success-text (tab active color) |
| src/views/classes/ClasseDetails.vue:750 | #10b981 | ≈ --success-text (badge) |
| src/views/classes/ClasseDetails.vue:830 | #dbeafe | --blue-100 / --info-bg (badge bleu) |
| src/views/classes/ClasseDetails.vue:831 | #1e40af | --info-text (badge bleu) |
| src/views/classes/ClasseDetails.vue:839 | #dcfce7 | --success-bg (badge vert) |
| src/views/classes/ClasseDetails.vue:840 | #166534 | --success-text (badge vert) |
| src/views/classes/ClasseDetails.vue:848 | #f3e8ff | ⚠ aucun token (violet clair, badge) |
| src/views/classes/ClasseDetails.vue:849 | #6b21a8 | ⚠ aucun token (violet, badge) |
| src/views/classes/ClasseDetails.vue:865 | #fef3c7 | --warning-bg (badge jaune) |
| src/views/classes/ClasseDetails.vue:866 | #92400e | ≈ --warning-text (color) |
| src/views/classes/ClasseDetails.vue:878 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow hover) |
| src/views/classes/ClasseDetails.vue:905 | #10b981 | ≈ --success-text (text-green-600) |
| src/views/classes/ClasseDetails.vue:910 | #10b981 | ≈ --success-text (bouton) |
| src/views/classes/ClasseDetails.vue:919 | #059669 | ≈ --success-text (hover) |
| src/views/classes/ClasseDetails.vue:924 | #fef2f2 | ≈ --error-bg (bg-red-50) |
| src/views/classes/ClasseDetails.vue:925 | #fca5a5 | --error-border (border) |
| src/views/classes/ClasseDetails.vue:932 | #dc2626 | ≈ --error-text (bouton rouge) |
| src/views/classes/ClasseDetails.vue:943 | #b91c1c | ≈ --error-text (hover) |
| src/views/classes/ClasseDetails.vue:949 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |

### src/views/Forum.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/Forum.vue:210 | #2563eb | ≈ --blue-600 (h1 light) |
| src/views/Forum.vue:214 | #ffffff | --text-primary (h1 dark) |
| src/views/Forum.vue:222 | #ffffff | --input-bg (input light) |
| src/views/Forum.vue:223 | #1f2937 | ≈ --text-primary (input light) |
| src/views/Forum.vue:228 | #374151 | ≈ --text-primary (input dark) |
| src/views/Forum.vue:229 | #f3f4f6 | ≈ --bg-tertiary (input dark) |
| src/views/Forum.vue:236 | #9ca3af | ≈ --text-disabled (placeholder light) |
| src/views/Forum.vue:242 | #9ca3af | ≈ --text-disabled (placeholder dark) |
| src/views/Forum.vue:249 | #ffffff | --card-bg (.bg-white light) |
| src/views/Forum.vue:253 | #1f2937 | ≈ --text-primary (.bg-white dark) |
| src/views/Forum.vue:259 | #374151 | ≈ --text-primary (text-gray-700 light) |
| src/views/Forum.vue:263 | #e5e7eb | ≈ --border-primary (text-gray-700 dark) |

### src/views/ForumTopic.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/ForumTopic.vue:282 | #ffffff | --card-bg (light-mode-card light) |
| src/views/ForumTopic.vue:286 | #1f2937 | ≈ --text-primary (card dark) |
| src/views/ForumTopic.vue:291 | #2d3748 | ⚠ aucun token (gris-bleu sombre bg-gray-750) |
| src/views/ForumTopic.vue:297 | #f9fafb | ≈ --bg-secondary (bg-gray-50 light) |
| src/views/ForumTopic.vue:301 | #2d3748 | ⚠ aucun token (gris-bleu sombre) |
| src/views/ForumTopic.vue:307 | #ffffff | --input-bg (textarea light) |
| src/views/ForumTopic.vue:308 | #1f2937 | ≈ --text-primary (textarea light) |
| src/views/ForumTopic.vue:312 | #374151 | ≈ --text-primary (textarea dark) |
| src/views/ForumTopic.vue:313 | #f3f4f6 | ≈ --bg-tertiary (textarea dark) |
| src/views/ForumTopic.vue:318 | #9ca3af | ≈ --text-disabled (placeholder light) |
| src/views/ForumTopic.vue:323 | #9ca3af | ≈ --text-disabled (placeholder dark) |
| src/views/ForumTopic.vue:347 | #1f2937 | ≈ --text-primary (forum-title light) |
| src/views/ForumTopic.vue:351 | #ffffff | --text-primary (forum-title dark) |
| src/views/ForumTopic.vue:356 | #374151 | ≈ --text-primary (forum-text light) |
| src/views/ForumTopic.vue:360 | #e5e7eb | ≈ --border-primary (forum-text dark) |
| src/views/ForumTopic.vue:366 | #1f2937 | ≈ --text-primary (text-gray-800 light) |
| src/views/ForumTopic.vue:371 | #4b5563 | ≈ --text-secondary (text-gray-600 light) |
| src/views/ForumTopic.vue:376 | #6b7280 | ≈ --text-tertiary (text-gray-500 light) |
| src/views/ForumTopic.vue:381 | #9ca3af | ≈ --text-disabled (text-gray-400 light) |

### src/views/TeacherSeances.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/TeacherSeances.vue:450 | #3b82f6 | --blue-500 (page-icon) |
| src/views/TeacherSeances.vue:468 | #fee | ≈ --error-bg (error-state) |
| src/views/TeacherSeances.vue:469 | #fcc | ≈ --error-border (border) |
| src/views/TeacherSeances.vue:493 | #c00 | ≈ --error-text (error-title) |
| src/views/TeacherSeances.vue:499 | #900 | ≈ --error-text (error-message) |
| src/views/TeacherSeances.vue:508 | #dc2626 | ≈ --error-text (btn-retry) |
| src/views/TeacherSeances.vue:518 | #b91c1c | ≈ --error-text (hover) |
| src/views/TeacherSeances.vue:576 | rgba(59, 130, 246, 0.1) | ≈ --info-bg (focus ring) |
| src/views/TeacherSeances.vue:641 | #22c55e | ≈ --success-text (stat-icon-active) |
| src/views/TeacherSeances.vue:645 | #f59e0b | ≈ --warning-text (stat-icon-scheduled) |
| src/views/TeacherSeances.vue:649 | #6b7280 | ≈ --text-tertiary (stat-icon-finished) |

### src/views/VideoConference.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/views/VideoConference.vue:190 | #1a202c | ⚠ aucun token (neutre très sombre, conteneur Jitsi) |

> **Total Autres vues : 151 occurrences — 20 sans équivalent.**

---

## Components — lessons (src/components/lessons)

> `src/components/lessons/LessonProgress.vue` : aucune couleur en dur (100 % tokenisé). Les `*.vue.backup` sont hors périmètre.

### src/components/lessons/ChapterEditForm.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/lessons/ChapterEditForm.vue:189 | rgba(0, 0, 0, 0.03) | ≈ --bg-secondary (voile neutre) |
| src/components/lessons/ChapterEditForm.vue:191 | rgba(0, 0, 0, 0.06) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:191 | rgba(0, 0, 0, 0.05) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:197 | rgba(255, 255, 255, 0.05) | ⚠ aucun token (overlay blanc hors sidebar) |
| src/components/lessons/ChapterEditForm.vue:198 | rgba(0, 0, 0, 0.2) | --shadow-md (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:198 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:204 | #10b981 | ≈ --success-text (fallback border-color) |
| src/components/lessons/ChapterEditForm.vue:205 | rgba(16, 185, 129, 0.05) | ≈ --success-bg (teinte verte) |
| src/components/lessons/ChapterEditForm.vue:206 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:206 | rgba(16, 185, 129, 0.2) | ⚠ aucun token (anneau focus vert) |
| src/components/lessons/ChapterEditForm.vue:206 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:211 | #9ca3af | ≈ --text-disabled (color) |
| src/components/lessons/ChapterEditForm.vue:221 | rgba(0, 0, 0, 0.03) | ≈ --bg-secondary (voile neutre) |
| src/components/lessons/ChapterEditForm.vue:225 | rgba(0, 0, 0, 0.06) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:225 | rgba(0, 0, 0, 0.05) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:230 | #ffffff | --input-bg (champ) |
| src/components/lessons/ChapterEditForm.vue:231 | #111827 | ≈ --text-primary (color) |
| src/components/lessons/ChapterEditForm.vue:237 | rgba(255, 255, 255, 0.05) | ⚠ aucun token (overlay blanc hors sidebar) |
| src/components/lessons/ChapterEditForm.vue:238 | rgba(0, 0, 0, 0.2) | --shadow-md (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:238 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:242 | #1f2937 | ≈ --text-primary (background dark) |
| src/components/lessons/ChapterEditForm.vue:243 | #f9fafb | ≈ --bg-secondary (color clair dark) |
| src/components/lessons/ChapterEditForm.vue:249 | rgba(255, 255, 255, 0.05) | ⚠ aucun token (overlay blanc hors sidebar) |
| src/components/lessons/ChapterEditForm.vue:250 | rgba(0, 0, 0, 0.2) | --shadow-md (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:250 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:254 | #1f2937 | ≈ --text-primary (background dark) |
| src/components/lessons/ChapterEditForm.vue:255 | #f9fafb | ≈ --bg-secondary (color clair dark) |
| src/components/lessons/ChapterEditForm.vue:261 | #10b981 | ≈ --success-text (fallback border-color) |
| src/components/lessons/ChapterEditForm.vue:262 | rgba(16, 185, 129, 0.05) | ≈ --success-bg (teinte verte) |
| src/components/lessons/ChapterEditForm.vue:263 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:263 | rgba(16, 185, 129, 0.2) | ⚠ aucun token (halo focus vert) |
| src/components/lessons/ChapterEditForm.vue:263 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:275 | rgba(0, 0, 0, 0.03) | ≈ --bg-secondary (voile neutre) |
| src/components/lessons/ChapterEditForm.vue:278 | rgba(0, 0, 0, 0.06) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:278 | rgba(0, 0, 0, 0.05) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:283 | rgba(255, 255, 255, 0.05) | ⚠ aucun token (overlay blanc hors sidebar) |
| src/components/lessons/ChapterEditForm.vue:284 | rgba(0, 0, 0, 0.2) | --shadow-md (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:284 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:290 | #10b981 | ≈ --success-text (fallback border-color) |
| src/components/lessons/ChapterEditForm.vue:291 | rgba(16, 185, 129, 0.05) | ≈ --success-bg (teinte verte) |
| src/components/lessons/ChapterEditForm.vue:292 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:292 | rgba(16, 185, 129, 0.2) | ⚠ aucun token (halo focus vert) |
| src/components/lessons/ChapterEditForm.vue:292 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterEditForm.vue:297 | #9ca3af | ≈ --text-disabled (color) |
| src/components/lessons/ChapterEditForm.vue:322 | #3b82f6 | --blue-500 (background) |
| src/components/lessons/ChapterEditForm.vue:331 | #2563eb | ≈ --blue-600 (background) |
| src/components/lessons/ChapterEditForm.vue:341 | #6b7280 | ≈ --text-tertiary (color) |
| src/components/lessons/ChapterEditForm.vue:375 | #10b981 | ≈ --success-text (fallback background) |
| src/components/lessons/ChapterEditForm.vue:398 | rgba(99, 102, 241, 0.05) | ⚠ aucun token (indigo) |
| src/components/lessons/ChapterEditForm.vue:399 | rgba(99, 102, 241, 0.2) | ⚠ aucun token (indigo) |
| src/components/lessons/ChapterEditForm.vue:418 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/ChapterEditForm.vue:442 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/ChapterEditForm.vue:453 | #4f46e5 | ⚠ aucun token (indigo) |
| src/components/lessons/ChapterEditForm.vue:475 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/ChapterEditForm.vue:486 | #4f46e5 | ⚠ aucun token (indigo) |
| src/components/lessons/ChapterEditForm.vue:488 | rgba(99, 102, 241, 0.3) | ⚠ aucun token (indigo) |
| src/components/lessons/ChapterEditForm.vue:500 | rgba(245, 158, 11, 0.1) | ≈ --warning-bg (teinte ambre) |
| src/components/lessons/ChapterEditForm.vue:501 | rgba(245, 158, 11, 0.3) | ≈ --warning-border (teinte ambre) |
| src/components/lessons/ChapterEditForm.vue:503 | #b45309 | ≈ --warning-text (color) |

### src/components/lessons/ChapterManager.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/lessons/ChapterManager.vue:409 | rgba(0, 0, 0, 0.15) | --shadow-md (box-shadow) |
| src/components/lessons/ChapterManager.vue:442 | #10b981 | ≈ --success-text (fallback border-top) |
| src/components/lessons/ChapterManager.vue:460 | #10b981 | ≈ --success-text (fallback border-left) |
| src/components/lessons/ChapterManager.vue:464 | rgba(0, 0, 0, 0.12) | --shadow-md (box-shadow) |
| src/components/lessons/ChapterManager.vue:469 | rgba(0, 0, 0, 0.2) | --shadow-lg (box-shadow) |
| src/components/lessons/ChapterManager.vue:471 | #10b981 | ≈ --success-text (fallback border-color) |
| src/components/lessons/ChapterManager.vue:480 | #10b981 | ≈ --success-text (fallback border-bottom) |
| src/components/lessons/ChapterManager.vue:482 | rgba(0, 0, 0, 0.08) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterManager.vue:488 | #3b82f6 | --blue-500 (fallback color) |
| src/components/lessons/ChapterManager.vue:505 | rgba(0, 0, 0, 0.08) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterManager.vue:509 | #10b981 | ≈ --success-text (fallback color) |
| src/components/lessons/ChapterManager.vue:513 | rgba(16, 185, 129, 0.15) | ≈ --success-bg (teinte verte) |
| src/components/lessons/ChapterManager.vue:514 | #10b981 | ≈ --success-text (fallback border-color) |
| src/components/lessons/ChapterManager.vue:516 | rgba(16, 185, 129, 0.3) | ⚠ aucun token (ombre teintée verte) |
| src/components/lessons/ChapterManager.vue:520 | #dc2626 | ≈ --error-text (color) |
| src/components/lessons/ChapterManager.vue:524 | rgba(220, 38, 38, 0.15) | ≈ --error-bg (teinte rouge) |
| src/components/lessons/ChapterManager.vue:525 | #dc2626 | ≈ --error-text (border-color) |
| src/components/lessons/ChapterManager.vue:527 | rgba(220, 38, 38, 0.3) | ⚠ aucun token (ombre teintée rouge) |
| src/components/lessons/ChapterManager.vue:540 | #10b981 | ≈ --success-text (fallback color) |
| src/components/lessons/ChapterManager.vue:542 | #10b981 | ≈ --success-text (fallback border) |
| src/components/lessons/ChapterManager.vue:546 | rgba(0, 0, 0, 0.08) | --shadow-sm (box-shadow) |
| src/components/lessons/ChapterManager.vue:550 | rgba(16, 185, 129, 0.15) | ≈ --success-bg (teinte verte) |
| src/components/lessons/ChapterManager.vue:554 | rgba(16, 185, 129, 0.3) | ⚠ aucun token (ombre teintée verte) |
| src/components/lessons/ChapterManager.vue:564 | rgba(0, 0, 0, 0.5) | ⚠ aucun token (overlay modal noir) |
| src/components/lessons/ChapterManager.vue:599 | #10b981 | ≈ --success-text (fallback background) |
| src/components/lessons/ChapterManager.vue:623 | rgba(0, 0, 0, 0.6) | ⚠ aucun token (overlay modal noir) |

### src/components/lessons/ChapterViewMode.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/lessons/ChapterViewMode.vue:106 | rgba(59, 130, 246, 0.1) | ≈ --info-bg / --blue-100 (teinte bleue) |
| src/components/lessons/ChapterViewMode.vue:107 | #3b82f6 | --blue-500 (fallback color) |
| src/components/lessons/ChapterViewMode.vue:111 | rgba(59, 130, 246, 0.3) | ≈ --info-border / --blue-300 (teinte bleue) |
| src/components/lessons/ChapterViewMode.vue:133 | #f9fafb | ≈ --bg-secondary (fallback background) |
| src/components/lessons/ChapterViewMode.vue:135 | #e5e7eb | ≈ --border-primary (fallback border) |
| src/components/lessons/ChapterViewMode.vue:155 | rgba(99, 102, 241, 0.08) | ⚠ aucun token (indigo) |
| src/components/lessons/ChapterViewMode.vue:156 | rgba(99, 102, 241, 0.3) | ⚠ aucun token (indigo) |
| src/components/lessons/ChapterViewMode.vue:175 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/ChapterViewMode.vue:219 | #10b981 | ≈ --success-text (gradient) |
| src/components/lessons/ChapterViewMode.vue:219 | #059669 | ≈ --success-text (gradient) |
| src/components/lessons/ChapterViewMode.vue:227 | rgba(16, 185, 129, 0.3) | ⚠ aucun token (ombre teintée verte) |
| src/components/lessons/ChapterViewMode.vue:232 | rgba(16, 185, 129, 0.4) | ⚠ aucun token (ombre teintée verte) |
| src/components/lessons/ChapterViewMode.vue:265 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/ChapterViewMode.vue:265 | #4f46e5 | ⚠ aucun token (indigo) |
| src/components/lessons/ChapterViewMode.vue:273 | rgba(99, 102, 241, 0.3) | ⚠ aucun token (indigo) |
| src/components/lessons/ChapterViewMode.vue:278 | rgba(99, 102, 241, 0.4) | ⚠ aucun token (indigo) |

### src/components/lessons/KnowledgeCheckEditor.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/lessons/KnowledgeCheckEditor.vue:438 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckEditor.vue:509 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckEditor.vue:517 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckEditor.vue:528 | #4f46e5 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckEditor.vue:548 | rgba(245, 158, 11, 0.1) | ≈ --warning-bg (teinte ambre) |
| src/components/lessons/KnowledgeCheckEditor.vue:549 | rgba(245, 158, 11, 0.3) | ≈ --warning-border (teinte ambre) |
| src/components/lessons/KnowledgeCheckEditor.vue:551 | #b45309 | ≈ --warning-text (color) |
| src/components/lessons/KnowledgeCheckEditor.vue:583 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckEditor.vue:625 | #ef4444 | ≈ --error-text (color) |
| src/components/lessons/KnowledgeCheckEditor.vue:630 | rgba(239, 68, 68, 0.1) | ≈ --error-bg (teinte rouge) |
| src/components/lessons/KnowledgeCheckEditor.vue:674 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckEditor.vue:692 | #ef4444 | ≈ --error-text (color) |
| src/components/lessons/KnowledgeCheckEditor.vue:710 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckEditor.vue:711 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckEditor.vue:778 | rgba(245, 158, 11, 0.1) | ≈ --warning-bg (gradient ambre) |
| src/components/lessons/KnowledgeCheckEditor.vue:778 | rgba(234, 88, 12, 0.1) | ⚠ aucun token (orange material #ea580c) |
| src/components/lessons/KnowledgeCheckEditor.vue:779 | rgba(245, 158, 11, 0.3) | ≈ --warning-border (teinte ambre) |
| src/components/lessons/KnowledgeCheckEditor.vue:833 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckEditor.vue:844 | #4f46e5 | ⚠ aucun token (indigo) |

### src/components/lessons/KnowledgeCheckPlayer.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/lessons/KnowledgeCheckPlayer.vue:418 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckPlayer.vue:418 | #8b5cf6 | ⚠ aucun token (violet) |
| src/components/lessons/KnowledgeCheckPlayer.vue:463 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckPlayer.vue:475 | #fef3c7 | --warning-bg |
| src/components/lessons/KnowledgeCheckPlayer.vue:476 | #b45309 | ≈ --warning-text |
| src/components/lessons/KnowledgeCheckPlayer.vue:482 | #d1fae5 | ≈ --success-bg |
| src/components/lessons/KnowledgeCheckPlayer.vue:483 | #047857 | ≈ --success-text |
| src/components/lessons/KnowledgeCheckPlayer.vue:495 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckPlayer.vue:495 | #8b5cf6 | ⚠ aucun token (violet) |
| src/components/lessons/KnowledgeCheckPlayer.vue:507 | rgba(99, 102, 241, 0.3) | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckPlayer.vue:521 | #fee2e2 | --error-bg |
| src/components/lessons/KnowledgeCheckPlayer.vue:522 | #b91c1c | ≈ --error-text |
| src/components/lessons/KnowledgeCheckPlayer.vue:549 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckPlayer.vue:549 | #8b5cf6 | ⚠ aucun token (violet) |
| src/components/lessons/KnowledgeCheckPlayer.vue:575 | #fee2e2 | --error-bg |
| src/components/lessons/KnowledgeCheckPlayer.vue:576 | #b91c1c | ≈ --error-text |
| src/components/lessons/KnowledgeCheckPlayer.vue:616 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckPlayer.vue:620 | rgba(99, 102, 241, 0.1) | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckPlayer.vue:621 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckPlayer.vue:673 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckPlayer.vue:679 | #4f46e5 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckPlayer.vue:683 | #10b981 | ≈ --success-text (background) |
| src/components/lessons/KnowledgeCheckPlayer.vue:689 | #059669 | ≈ --success-text (background) |
| src/components/lessons/KnowledgeCheckPlayer.vue:717 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckPlayer.vue:718 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckPlayer.vue:723 | #10b981 | ≈ --success-text (border-color) |
| src/components/lessons/KnowledgeCheckPlayer.vue:724 | rgba(16, 185, 129, 0.1) | ≈ --success-bg (teinte verte) |
| src/components/lessons/KnowledgeCheckPlayer.vue:725 | #10b981 | ≈ --success-text (color) |
| src/components/lessons/KnowledgeCheckPlayer.vue:737 | #fef3c7 | --warning-bg (gradient) |
| src/components/lessons/KnowledgeCheckPlayer.vue:737 | #fde68a | ⚠ aucun token (ambre clair) |
| src/components/lessons/KnowledgeCheckPlayer.vue:741 | #d1fae5 | ≈ --success-bg (gradient) |
| src/components/lessons/KnowledgeCheckPlayer.vue:741 | #a7f3d0 | ≈ --success-border (vert clair) |
| src/components/lessons/KnowledgeCheckPlayer.vue:753 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/components/lessons/KnowledgeCheckPlayer.vue:758 | #b45309 | ≈ --warning-text |
| src/components/lessons/KnowledgeCheckPlayer.vue:762 | #047857 | ≈ --success-text |
| src/components/lessons/KnowledgeCheckPlayer.vue:768 | #92400e | ≈ --warning-text |
| src/components/lessons/KnowledgeCheckPlayer.vue:773 | #047857 | ≈ --success-text |
| src/components/lessons/KnowledgeCheckPlayer.vue:777 | #a16207 | ≈ --warning-text (ambre foncé) |
| src/components/lessons/KnowledgeCheckPlayer.vue:782 | #059669 | ≈ --success-text |
| src/components/lessons/KnowledgeCheckPlayer.vue:800 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckPlayer.vue:800 | #8b5cf6 | ⚠ aucun token (violet) |
| src/components/lessons/KnowledgeCheckPlayer.vue:809 | #10b981 | ≈ --success-text (gradient) |
| src/components/lessons/KnowledgeCheckPlayer.vue:809 | #34d399 | ≈ --success-border (vert clair) |
| src/components/lessons/KnowledgeCheckPlayer.vue:851 | rgba(16, 185, 129, 0.1) | ≈ --success-bg (teinte verte) |
| src/components/lessons/KnowledgeCheckPlayer.vue:852 | #10b981 | ≈ --success-text (border-color) |
| src/components/lessons/KnowledgeCheckPlayer.vue:856 | rgba(239, 68, 68, 0.1) | ≈ --error-bg (teinte rouge) |
| src/components/lessons/KnowledgeCheckPlayer.vue:857 | #ef4444 | ≈ --error-text (border-color) |
| src/components/lessons/KnowledgeCheckPlayer.vue:872 | #10b981 | ≈ --success-text (color) |
| src/components/lessons/KnowledgeCheckPlayer.vue:876 | #ef4444 | ≈ --error-text (color) |
| src/components/lessons/KnowledgeCheckPlayer.vue:900 | rgba(99, 102, 241, 0.1) | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckPlayer.vue:902 | #4f46e5 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckPlayer.vue:930 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/KnowledgeCheckPlayer.vue:936 | #4f46e5 | ⚠ aucun token (indigo) |

### src/components/lessons/LessonCard.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/lessons/LessonCard.vue:221 | rgba(0, 0, 0, 0.1) | --shadow-md (box-shadow) |
| src/components/lessons/LessonCard.vue:223 | #3b82f6 | --blue-500 (border-color) |
| src/components/lessons/LessonCard.vue:255 | #dbeafe | --blue-100 / --info-bg (background) |
| src/components/lessons/LessonCard.vue:256 | #1e40af | --info-text (color) |
| src/components/lessons/LessonCard.vue:260 | #e9d5ff | ⚠ aucun token (violet clair) |
| src/components/lessons/LessonCard.vue:261 | #7c3aed | ⚠ aucun token (violet) |
| src/components/lessons/LessonCard.vue:265 | #ddd6fe | ⚠ aucun token (violet/indigo clair) |
| src/components/lessons/LessonCard.vue:266 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/lessons/LessonCard.vue:270 | #fce7f3 | ⚠ aucun token (rose) |
| src/components/lessons/LessonCard.vue:271 | #be123c | ⚠ aucun token (rose/rouge foncé) |
| src/components/lessons/LessonCard.vue:281 | #fef3c7 | --warning-bg (background) |
| src/components/lessons/LessonCard.vue:282 | #92400e | ≈ --warning-text (color) |
| src/components/lessons/LessonCard.vue:286 | #d1fae5 | ≈ --success-bg (background) |
| src/components/lessons/LessonCard.vue:287 | #065f46 | ≈ --success-text (color) |
| src/components/lessons/LessonCard.vue:291 | #fee2e2 | --error-bg (background) |
| src/components/lessons/LessonCard.vue:292 | #991b1b | --error-text (color) |
| src/components/lessons/LessonCard.vue:363 | #dbeafe | --blue-100 / --info-bg (background) |
| src/components/lessons/LessonCard.vue:367 | #d1fae5 | ≈ --success-bg (background) |
| src/components/lessons/LessonCard.vue:371 | #e9d5ff | ⚠ aucun token (violet clair) |
| src/components/lessons/LessonCard.vue:380 | #1e40af | --info-text (color) |
| src/components/lessons/LessonCard.vue:384 | #065f46 | ≈ --success-text (color) |
| src/components/lessons/LessonCard.vue:388 | #7c3aed | ⚠ aucun token (violet) |
| src/components/lessons/LessonCard.vue:450 | #059669 | ≈ --success-text (color) |
| src/components/lessons/LessonCard.vue:451 | #059669 | ≈ --success-text (border-color) |
| src/components/lessons/LessonCard.vue:455 | #d1fae5 | ≈ --success-bg (background) |
| src/components/lessons/LessonCard.vue:459 | #d97706 | ≈ --warning-text (color) |
| src/components/lessons/LessonCard.vue:460 | #d97706 | ≈ --warning-text (border-color) |
| src/components/lessons/LessonCard.vue:464 | #fef3c7 | --warning-bg (background) |
| src/components/lessons/LessonCard.vue:468 | #3b82f6 | --blue-500 (color) |
| src/components/lessons/LessonCard.vue:469 | #3b82f6 | --blue-500 (border-color) |
| src/components/lessons/LessonCard.vue:473 | #dbeafe | --blue-100 / --info-bg (background) |
| src/components/lessons/LessonCard.vue:477 | #dc2626 | ≈ --error-text (color) |
| src/components/lessons/LessonCard.vue:478 | #dc2626 | ≈ --error-text (border-color) |
| src/components/lessons/LessonCard.vue:482 | #fee2e2 | --error-bg (background) |
| src/components/lessons/LessonCard.vue:486 | #3b82f6 | --blue-500 (gradient) |
| src/components/lessons/LessonCard.vue:486 | #8b5cf6 | ⚠ aucun token (violet) |
| src/components/lessons/LessonCard.vue:488 | rgba(59, 130, 246, 0.3) | ⚠ aucun token (ombre teintée bleue) |
| src/components/lessons/LessonCard.vue:492 | #2563eb | ≈ --blue-600 (gradient) |
| src/components/lessons/LessonCard.vue:492 | #7c3aed | ⚠ aucun token (violet) |
| src/components/lessons/LessonCard.vue:493 | rgba(59, 130, 246, 0.4) | ⚠ aucun token (ombre teintée bleue) |

### src/components/lessons/LessonChapterSidebar.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/lessons/LessonChapterSidebar.vue:78 | #1e293b | ⚠ aucun token exact (fallback --card-bg, surface dark) |
| src/components/lessons/LessonChapterSidebar.vue:79 | #334155 | --border-primary (dark) |
| src/components/lessons/LessonChapterSidebar.vue:98 | #334155 | --border-primary (dark) |
| src/components/lessons/LessonChapterSidebar.vue:105 | #e2e8f0 | --border-primary |
| src/components/lessons/LessonChapterSidebar.vue:111 | #94a3b8 | --text-disabled |
| src/components/lessons/LessonChapterSidebar.vue:119 | #334155 | --border-primary (dark) |
| src/components/lessons/LessonChapterSidebar.vue:130 | #94a3b8 | --text-disabled |
| src/components/lessons/LessonChapterSidebar.vue:136 | #3b82f6 | --blue-500 (color) |
| src/components/lessons/LessonChapterSidebar.vue:155 | #94a3b8 | --text-disabled |
| src/components/lessons/LessonChapterSidebar.vue:162 | rgba(59, 130, 246, 0.05) | ≈ --info-bg / --blue-100 (teinte bleue) |
| src/components/lessons/LessonChapterSidebar.vue:163 | #e2e8f0 | --border-primary |
| src/components/lessons/LessonChapterSidebar.vue:167 | rgba(59, 130, 246, 0.1) | ≈ --info-bg / --blue-100 (teinte bleue) |
| src/components/lessons/LessonChapterSidebar.vue:168 | #3b82f6 | --blue-500 (border-left-color) |
| src/components/lessons/LessonChapterSidebar.vue:169 | #e2e8f0 | --border-primary |
| src/components/lessons/LessonChapterSidebar.vue:173 | #10b981 | ≈ --success-text (color) |
| src/components/lessons/LessonChapterSidebar.vue:183 | #334155 | --border-primary (dark) |
| src/components/lessons/LessonChapterSidebar.vue:190 | #3b82f6 | --blue-500 (background) |
| src/components/lessons/LessonChapterSidebar.vue:195 | rgba(16, 185, 129, 0.15) | ≈ --success-bg (teinte verte) |
| src/components/lessons/LessonChapterSidebar.vue:236 | rgba(0, 0, 0, 0.3) | --shadow-lg (box-shadow) |

### src/components/lessons/SlidesViewer.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/lessons/SlidesViewer.vue:80 | #000 | ⚠ aucun token (fond noir lecteur slides) |
| src/components/lessons/SlidesViewer.vue:107 | #1e293b | ⚠ aucun token exact (fallback --card-bg, surface dark) |
| src/components/lessons/SlidesViewer.vue:108 | #334155 | --border-primary (dark) |
| src/components/lessons/SlidesViewer.vue:109 | #e2e8f0 | --border-primary |
| src/components/lessons/SlidesViewer.vue:118 | #3b82f6 | --blue-500 (background) |
| src/components/lessons/SlidesViewer.vue:119 | #3b82f6 | --blue-500 (border-color) |
| src/components/lessons/SlidesViewer.vue:131 | #94a3b8 | --text-disabled |
| src/components/lessons/SlidesViewer.vue:150 | #334155 | --border-primary (dark) |
| src/components/lessons/SlidesViewer.vue:155 | #3b82f6 | --blue-500 (border-color) |
| src/components/lessons/SlidesViewer.vue:171 | rgba(0,0,0,0.5) | ⚠ aucun token (text-shadow noir) |
| src/components/lessons/SlidesViewer.vue:177 | #94a3b8 | --text-disabled |

> **Total Components/lessons : 243 occurrences — 78 sans équivalent** (indigo/violet `#6366f1`/`#4f46e5`/`#8b5cf6` massif dans KnowledgeCheck*, rose, surfaces dark, halos colorés).

---

## Components — calendar / ui / Navbar

> `src/components/ui/ThemeToggle.vue`, `ToastContainer.vue` : aucune couleur en dur. Les déclarations de variables SCSS (`$lms-blue: #2563eb;`) sont comptées.

### src/components/calendar/CalendarFilters.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/calendar/CalendarFilters.vue:110 | #2563eb (SCSS $lms-blue) | ≈ --blue-600 |
| src/components/calendar/CalendarFilters.vue:111 | #3b82f6 (SCSS $lms-blue-light) | --blue-500 |
| src/components/calendar/CalendarFilters.vue:112 | #1e3a8a (SCSS $lms-blue-dark) | ≈ --blue-800 |
| src/components/calendar/CalendarFilters.vue:113 | #ffffff (SCSS $white) | --bg-primary |
| src/components/calendar/CalendarFilters.vue:114 | #1E293B (SCSS $text-primary) | --navbar-text |
| src/components/calendar/CalendarFilters.vue:115 | #64748B (SCSS $text-secondary) | --text-tertiary |
| src/components/calendar/CalendarFilters.vue:116 | #6B7280 (SCSS $text-tertiary) | ≈ --text-tertiary |
| src/components/calendar/CalendarFilters.vue:117 | #F8FAFC (SCSS $gray-light) | --bg-secondary |
| src/components/calendar/CalendarFilters.vue:118 | #E5E7EB (SCSS $gray-border) | ≈ --border-primary |
| src/components/calendar/CalendarFilters.vue:119 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/components/calendar/CalendarFilters.vue:227 | rgba($lms-blue, 0.1) | ⚠ aucun token (anneau focus teinté bleu) |

### src/components/calendar/EventDetailModal.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/calendar/EventDetailModal.vue:455 | rgba(0, 0, 0, 0.5) | ⚠ aucun token (overlay modale) |
| src/components/calendar/EventDetailModal.vue:466 | rgba(0, 0, 0, 0.2) | --shadow-* (box-shadow) |
| src/components/calendar/EventDetailModal.vue:480 | #e5e7eb | ≈ --border-primary |
| src/components/calendar/EventDetailModal.vue:493 | #111827 | ≈ --text-primary |
| src/components/calendar/EventDetailModal.vue:508 | #dcfce7 | --success-bg |
| src/components/calendar/EventDetailModal.vue:509 | #16a34a | ≈ --success-text |
| src/components/calendar/EventDetailModal.vue:513 | #dbeafe | --info-bg |
| src/components/calendar/EventDetailModal.vue:514 | #2563eb | ≈ --blue-600 |
| src/components/calendar/EventDetailModal.vue:518 | #f3f4f6 | ≈ --bg-tertiary |
| src/components/calendar/EventDetailModal.vue:519 | #6b7280 | ≈ --text-tertiary |
| src/components/calendar/EventDetailModal.vue:526 | #6b7280 | ≈ --text-tertiary |
| src/components/calendar/EventDetailModal.vue:534 | #f3f4f6 | ≈ --bg-tertiary |
| src/components/calendar/EventDetailModal.vue:535 | #111827 | ≈ --text-primary |
| src/components/calendar/EventDetailModal.vue:559 | #3b82f6 | --blue-500 |
| src/components/calendar/EventDetailModal.vue:567 | #6b7280 | ≈ --text-tertiary |
| src/components/calendar/EventDetailModal.vue:573 | #111827 | ≈ --text-primary |
| src/components/calendar/EventDetailModal.vue:581 | #e5e7eb | ≈ --border-primary |
| src/components/calendar/EventDetailModal.vue:590 | #111827 | ≈ --text-primary |
| src/components/calendar/EventDetailModal.vue:603 | #dcfce7 | --success-bg |
| src/components/calendar/EventDetailModal.vue:604 | #16a34a | ≈ --success-text |
| src/components/calendar/EventDetailModal.vue:608 | #dbeafe | --info-bg |
| src/components/calendar/EventDetailModal.vue:609 | #2563eb | ≈ --blue-600 |
| src/components/calendar/EventDetailModal.vue:613 | #f3f4f6 | ≈ --bg-tertiary |
| src/components/calendar/EventDetailModal.vue:614 | #6b7280 | ≈ --text-tertiary |
| src/components/calendar/EventDetailModal.vue:620 | #3b82f6 | --blue-500 |
| src/components/calendar/EventDetailModal.vue:626 | #3b82f6 | --blue-500 |
| src/components/calendar/EventDetailModal.vue:631 | #6b7280 | ≈ --text-tertiary |
| src/components/calendar/EventDetailModal.vue:636 | #e5e7eb | ≈ --border-primary |
| src/components/calendar/EventDetailModal.vue:637 | #f9fafb | ≈ --bg-secondary |
| src/components/calendar/EventDetailModal.vue:660 | #3b82f6 | --blue-500 |
| src/components/calendar/EventDetailModal.vue:665 | #2563eb | ≈ --blue-600 |
| src/components/calendar/EventDetailModal.vue:669 | #10b981 | ≈ --success-text |
| src/components/calendar/EventDetailModal.vue:674 | #059669 | ≈ --success-text |
| src/components/calendar/EventDetailModal.vue:678 | #ef4444 | ≈ --error-text |
| src/components/calendar/EventDetailModal.vue:683 | #dc2626 | ≈ --error-text |
| src/components/calendar/EventDetailModal.vue:687 | #f3f4f6 | ≈ --bg-tertiary |
| src/components/calendar/EventDetailModal.vue:688 | #111827 | ≈ --text-primary |
| src/components/calendar/EventDetailModal.vue:689 | #e5e7eb | ≈ --border-primary |
| src/components/calendar/EventDetailModal.vue:694 | #3b82f6 | --blue-500 |
| src/components/calendar/EventDetailModal.vue:699 | #3b82f6 | --blue-500 |
| src/components/calendar/EventDetailModal.vue:700 | #3b82f6 | --blue-500 |
| src/components/calendar/EventDetailModal.vue:704 | #3b82f6 | --blue-500 |
| src/components/calendar/EventDetailModal.vue:714 | #fef3c7 | --warning-bg |
| src/components/calendar/EventDetailModal.vue:715 | #92400e | ≈ --warning-text |

### src/components/calendar/UniversalCalendar.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/calendar/UniversalCalendar.vue:96 | #2563eb (inline) | ≈ --blue-600 |
| src/components/calendar/UniversalCalendar.vue:100 | #10b981 (inline) | ≈ --success-text |
| src/components/calendar/UniversalCalendar.vue:104 | #ea580c (inline) | ⚠ aucun token (orange material) |
| src/components/calendar/UniversalCalendar.vue:108 | #ef4444 (inline) | ≈ --error-text |
| src/components/calendar/UniversalCalendar.vue:371 | #2563eb (SCSS $lms-blue) | ≈ --blue-600 |
| src/components/calendar/UniversalCalendar.vue:372 | #3b82f6 (SCSS $lms-blue-light) | --blue-500 |
| src/components/calendar/UniversalCalendar.vue:373 | #1e3a8a (SCSS $lms-blue-dark) | ≈ --blue-800 |
| src/components/calendar/UniversalCalendar.vue:374 | #ea580c (SCSS $lms-orange) | ⚠ aucun token (orange material) |
| src/components/calendar/UniversalCalendar.vue:375 | #10b981 (SCSS $lms-green) | ≈ --success-text |
| src/components/calendar/UniversalCalendar.vue:376 | #ef4444 (SCSS $lms-red) | ≈ --error-text |
| src/components/calendar/UniversalCalendar.vue:379 | #ffffff (SCSS $white) | --bg-primary |
| src/components/calendar/UniversalCalendar.vue:380 | #1E293B (SCSS $text-primary) | --navbar-text |
| src/components/calendar/UniversalCalendar.vue:381 | #64748B (SCSS $text-secondary) | --text-tertiary |
| src/components/calendar/UniversalCalendar.vue:382 | #6B7280 (SCSS $text-tertiary) | ≈ --text-tertiary |
| src/components/calendar/UniversalCalendar.vue:383 | #F9FAFB (SCSS $gray-lightest) | ≈ --bg-secondary |
| src/components/calendar/UniversalCalendar.vue:384 | #F8FAFC (SCSS $gray-light) | --bg-secondary |
| src/components/calendar/UniversalCalendar.vue:385 | #E2E8F0 (SCSS $gray-medium) | --border-primary |
| src/components/calendar/UniversalCalendar.vue:386 | #E5E7EB (SCSS $gray-border) | ≈ --border-primary |
| src/components/calendar/UniversalCalendar.vue:387 | #374151 (SCSS $gray-dark) | ≈ --text-primary |
| src/components/calendar/UniversalCalendar.vue:390 | rgba(0, 0, 0, 0.1) (SCSS $shadow-light) | --shadow-* |
| src/components/calendar/UniversalCalendar.vue:391 | rgba(0, 0, 0, 0.1) (SCSS $shadow-medium) | --shadow-* |
| src/components/calendar/UniversalCalendar.vue:392 | rgba(0, 0, 0, 0.1) (SCSS $shadow-hover) | --shadow-* |
| src/components/calendar/UniversalCalendar.vue:503 | #10b981 (border) | ≈ --success-border |
| src/components/calendar/UniversalCalendar.vue:504 | #10b981 (color) | ≈ --success-text |
| src/components/calendar/UniversalCalendar.vue:513 | #10b981 (background) | ≈ --success-text |
| src/components/calendar/UniversalCalendar.vue:567 | rgba($lms-blue-dark, 0.2) | --shadow-* (box-shadow) |
| src/components/calendar/UniversalCalendar.vue:683 | rgba($lms-blue, 0.2) | ⚠ aucun token (anneau focus teinté bleu) |
| src/components/calendar/UniversalCalendar.vue:689 | #0052cc (gradient) | --blue-600 |
| src/components/calendar/UniversalCalendar.vue:689 | #0747a6 (gradient) | --blue-700 |
| src/components/calendar/UniversalCalendar.vue:690 | #0747a6 (border-color) | --blue-700 |
| src/components/calendar/UniversalCalendar.vue:715 | rgba($lms-blue, 0.15) | ⚠ aucun token (gradient bleu translucide) |
| src/components/calendar/UniversalCalendar.vue:715 | rgba($lms-blue, 0.08) | ⚠ aucun token (gradient bleu translucide) |
| src/components/calendar/UniversalCalendar.vue:740 | #2563eb (background) | ≈ --blue-600 |
| src/components/calendar/UniversalCalendar.vue:741 | #2563eb (border-color) | ≈ --blue-600 |
| src/components/calendar/UniversalCalendar.vue:745 | #06b6d4 (background) | ⚠ aucun token (cyan) |
| src/components/calendar/UniversalCalendar.vue:746 | #06b6d4 (border-color) | ⚠ aucun token (cyan) |
| src/components/calendar/UniversalCalendar.vue:750 | #ef4444 (background) | ≈ --error-text |
| src/components/calendar/UniversalCalendar.vue:751 | #ef4444 (border-color) | ≈ --error-text |
| src/components/calendar/UniversalCalendar.vue:812 | #2563eb (SCSS, bloc dark) | ≈ --blue-600 |
| src/components/calendar/UniversalCalendar.vue:813 | #3b82f6 (SCSS) | --blue-500 |
| src/components/calendar/UniversalCalendar.vue:814 | #1e3a8a (SCSS) | ≈ --blue-800 |
| src/components/calendar/UniversalCalendar.vue:815 | #ea580c (SCSS) | ⚠ aucun token (orange material) |
| src/components/calendar/UniversalCalendar.vue:816 | #10b981 (SCSS) | ≈ --success-text |
| src/components/calendar/UniversalCalendar.vue:817 | #ef4444 (SCSS) | ≈ --error-text |
| src/components/calendar/UniversalCalendar.vue:818 | #ffffff (SCSS) | --bg-primary |
| src/components/calendar/UniversalCalendar.vue:830 | rgba(0, 0, 0, 0.3) | --shadow-* (box-shadow) |
| src/components/calendar/UniversalCalendar.vue:836 | rgba($lms-blue-light, 0.5) | ⚠ aucun token (bordure bleue translucide) |
| src/components/calendar/UniversalCalendar.vue:845 | rgba($lms-blue-light, 0.3) | ⚠ aucun token (surface bleue translucide) |
| src/components/calendar/UniversalCalendar.vue:866 | rgba($lms-blue-light, 0.2) | ⚠ aucun token (surface bleue translucide) |
| src/components/calendar/UniversalCalendar.vue:883 | rgba($white, 0.7) | ⚠ aucun token (texte blanc translucide) |
| src/components/calendar/UniversalCalendar.vue:886 | rgba($lms-blue-light, 0.3) | ⚠ aucun token (surface bleue translucide) |
| src/components/calendar/UniversalCalendar.vue:915 | rgba($white, 0.7) | ⚠ aucun token (texte blanc translucide) |
| src/components/calendar/UniversalCalendar.vue:918 | rgba($lms-blue-light, 0.3) | ⚠ aucun token (surface bleue translucide) |
| src/components/calendar/UniversalCalendar.vue:925 | rgba($white, 0.8) | ⚠ aucun token (texte blanc translucide) |
| src/components/calendar/UniversalCalendar.vue:943 | rgba($lms-blue-light, 0.2) | ⚠ aucun token (anneau focus bleu translucide) |
| src/components/calendar/UniversalCalendar.vue:969 | rgba($white, 0.7) | ⚠ aucun token (texte blanc translucide) |
| src/components/calendar/UniversalCalendar.vue:976 | rgba($white, 0.7) | ⚠ aucun token (texte blanc translucide) |
| src/components/calendar/UniversalCalendar.vue:1015 | rgba($lms-blue-light, 0.3) | ⚠ aucun token (anneau focus bleu translucide) |
| src/components/calendar/UniversalCalendar.vue:1020 | #0a1929 (gradient dark) | --blue-900 |
| src/components/calendar/UniversalCalendar.vue:1020 | #001e3c (gradient dark) | ⚠ aucun token (bleu nuit hors palette) |
| src/components/calendar/UniversalCalendar.vue:1021 | #001e3c (border-color dark) | ⚠ aucun token (bleu nuit hors palette) |
| src/components/calendar/UniversalCalendar.vue:1041 | rgba($lms-blue-light, 0.3) | ⚠ aucun token (gradient bleu translucide) |
| src/components/calendar/UniversalCalendar.vue:1041 | rgba($lms-blue-light, 0.15) | ⚠ aucun token (gradient bleu translucide) |
| src/components/calendar/UniversalCalendar.vue:1074 | rgba($lms-blue, 0.9) | ⚠ aucun token (surface bleue translucide) |
| src/components/calendar/UniversalCalendar.vue:1080 | rgba($lms-blue, 0.5) | ⚠ aucun token (ombre bleue translucide) |
| src/components/calendar/UniversalCalendar.vue:1085 | rgba(#06b6d4, 0.9) | ⚠ aucun token (cyan) |
| src/components/calendar/UniversalCalendar.vue:1086 | #06b6d4 (border-color dark) | ⚠ aucun token (cyan) |
| src/components/calendar/UniversalCalendar.vue:1091 | #06b6d4 (background dark) | ⚠ aucun token (cyan) |
| src/components/calendar/UniversalCalendar.vue:1092 | rgba(#06b6d4, 0.5) | ⚠ aucun token (cyan) |
| src/components/calendar/UniversalCalendar.vue:1097 | #ef4444 (background dark) | ≈ --error-text |
| src/components/calendar/UniversalCalendar.vue:1098 | #ef4444 (border-color dark) | ≈ --error-text |
| src/components/calendar/UniversalCalendar.vue:1103 | rgba(#ef4444, 0.5) | ⚠ aucun token (ombre rouge translucide) |

### src/components/ui/BaseButton.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/ui/BaseButton.vue:71 | #4f46e5 (fallback) | ⚠ aucun token (indigo) |
| src/components/ui/BaseButton.vue:72 | #fff | --btn-primary-text |
| src/components/ui/BaseButton.vue:76 | #4338ca (fallback hover) | ⚠ aucun token (indigo) |
| src/components/ui/BaseButton.vue:80 | #f3f4f6 (fallback) | ≈ --bg-tertiary |
| src/components/ui/BaseButton.vue:81 | #111827 (fallback) | ≈ --text-primary |
| src/components/ui/BaseButton.vue:82 | #e5e7eb (fallback) | ≈ --border-primary |
| src/components/ui/BaseButton.vue:86 | #e5e7eb (fallback) | ≈ --bg-tertiary |
| src/components/ui/BaseButton.vue:90 | #dc2626 (fallback) | ≈ --error-text |
| src/components/ui/BaseButton.vue:91 | #fff | --btn-primary-text |
| src/components/ui/BaseButton.vue:95 | #b91c1c (fallback hover) | ≈ --error-text |
| src/components/ui/BaseButton.vue:100 | #6b7280 (fallback) | ≈ --text-tertiary |
| src/components/ui/BaseButton.vue:104 | #f3f4f6 (fallback) | ≈ --bg-tertiary |
| src/components/ui/BaseButton.vue:105 | #111827 (fallback) | ≈ --text-primary |

### src/components/ui/Modal.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/ui/Modal.vue:98 | rgba(0, 0, 0, 0.5) | ⚠ aucun token (overlay modale) |
| src/components/ui/Modal.vue:109 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/components/ui/Modal.vue:109 | rgba(0, 0, 0, 0.04) | --shadow-* (box-shadow) |

### src/components/ui/ProgressBar.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/ui/ProgressBar.vue:104 | rgba(0, 0, 0, 0.05) | --shadow-* (box-shadow inset) |
| src/components/ui/ProgressBar.vue:142 | rgba(255, 255, 255, 0.3) | ⚠ aucun token (overlay blanc, shimmer) |
| src/components/ui/ProgressBar.vue:177 | #22c55e (gradient) | ≈ --success-text |
| src/components/ui/ProgressBar.vue:177 | #16a34a (gradient) | ≈ --success-text |
| src/components/ui/ProgressBar.vue:181 | #facc15 (gradient) | ⚠ aucun token (jaune hors palette) |
| src/components/ui/ProgressBar.vue:181 | #eab308 (gradient) | ⚠ aucun token (jaune hors palette) |
| src/components/ui/ProgressBar.vue:185 | #ef4444 (gradient) | ≈ --error-text |
| src/components/ui/ProgressBar.vue:185 | #dc2626 (gradient) | ≈ --error-text |
| src/components/ui/ProgressBar.vue:189 | #a855f7 (gradient) | ⚠ aucun token (violet) |
| src/components/ui/ProgressBar.vue:189 | #9333ea (gradient) | ⚠ aucun token (violet) |
| src/components/ui/ProgressBar.vue:193 | #06b6d4 (gradient) | ⚠ aucun token (cyan) |
| src/components/ui/ProgressBar.vue:193 | #3b82f6 (gradient) | --blue-500 |
| src/components/ui/ProgressBar.vue:193 | #a855f7 (gradient) | ⚠ aucun token (violet) |

### src/components/ui/QuickActionButton.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/ui/QuickActionButton.vue:61 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/components/ui/QuickActionButton.vue:89 | #3b82f6 | --blue-500 (border-color) |
| src/components/ui/QuickActionButton.vue:90 | #3b82f6 | --blue-500 (background) |
| src/components/ui/QuickActionButton.vue:102 | #6b7280 | ≈ --text-tertiary (border-color) |
| src/components/ui/QuickActionButton.vue:103 | #6b7280 | ≈ --text-tertiary (background) |
| src/components/ui/QuickActionButton.vue:115 | #10b981 | ≈ --success-text (border-color) |
| src/components/ui/QuickActionButton.vue:116 | #10b981 | ≈ --success-text (background) |
| src/components/ui/QuickActionButton.vue:128 | #f59e0b | ≈ --warning-text (border-color) |
| src/components/ui/QuickActionButton.vue:129 | #f59e0b | ≈ --warning-text (background) |
| src/components/ui/QuickActionButton.vue:141 | #ef4444 | ≈ --error-text (border-color) |
| src/components/ui/QuickActionButton.vue:142 | #ef4444 | ≈ --error-text (background) |

### src/components/ui/SkeletonLoader.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/ui/SkeletonLoader.vue:42 | #E5E7EB (fallback) | ≈ --border-primary |
| src/components/ui/SkeletonLoader.vue:43 | #E5E7EB (fallback) | ≈ --border-primary |
| src/components/ui/SkeletonLoader.vue:44 | #F3F4F6 (fallback) | ≈ --bg-tertiary |
| src/components/ui/SkeletonLoader.vue:45 | #E5E7EB (fallback) | ≈ --border-primary |
| src/components/ui/SkeletonLoader.vue:46 | #E5E7EB (fallback) | ≈ --border-primary |
| src/components/ui/SkeletonLoader.vue:92 | #374151 (fallback dark) | ≈ --text-primary / --border-primary(dark) |
| src/components/ui/SkeletonLoader.vue:93 | #374151 (fallback dark) | ≈ --text-primary |
| src/components/ui/SkeletonLoader.vue:94 | #4B5563 (fallback dark) | ≈ --text-secondary |
| src/components/ui/SkeletonLoader.vue:95 | #374151 (fallback dark) | ≈ --text-primary |
| src/components/ui/SkeletonLoader.vue:96 | #374151 (fallback dark) | ≈ --text-primary |

### src/components/ui/StatCard.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/ui/StatCard.vue:155 | rgba(0, 0, 0, 0.15) | --shadow-* (box-shadow) |
| src/components/ui/StatCard.vue:199 | #22c55e | ≈ --success-text |
| src/components/ui/StatCard.vue:203 | #ef4444 | ≈ --error-text |

### src/components/ui/Toast.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/ui/Toast.vue:98 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/components/ui/Toast.vue:98 | rgba(0, 0, 0, 0.05) | --shadow-* (box-shadow) |
| src/components/ui/Toast.vue:157 | #10B981 | ≈ --success-text (border-left) |
| src/components/ui/Toast.vue:158 | #F0FDF4 | ≈ --success-bg |
| src/components/ui/Toast.vue:162 | #10B981 | ≈ --success-text |
| src/components/ui/Toast.vue:163 | #D1FAE5 | ≈ --success-bg |
| src/components/ui/Toast.vue:167 | #065F46 | ≈ --success-text |
| src/components/ui/Toast.vue:171 | #047857 | ≈ --success-text |
| src/components/ui/Toast.vue:176 | #EF4444 | ≈ --error-text (border-left) |
| src/components/ui/Toast.vue:177 | #FEF2F2 | ≈ --error-bg |
| src/components/ui/Toast.vue:181 | #EF4444 | ≈ --error-text |
| src/components/ui/Toast.vue:182 | #FEE2E2 | --error-bg |
| src/components/ui/Toast.vue:186 | #991B1B | --error-text |
| src/components/ui/Toast.vue:190 | #B91C1C | ≈ --error-text |
| src/components/ui/Toast.vue:195 | #F59E0B | ≈ --warning-text (border-left) |
| src/components/ui/Toast.vue:196 | #FFFBEB | ≈ --warning-bg |
| src/components/ui/Toast.vue:200 | #F59E0B | ≈ --warning-text |
| src/components/ui/Toast.vue:201 | #FEF3C7 | --warning-bg |
| src/components/ui/Toast.vue:205 | #92400E | ≈ --warning-text |
| src/components/ui/Toast.vue:209 | #B45309 | ≈ --warning-text |
| src/components/ui/Toast.vue:214 | #3B82F6 | --blue-500 (border-left) |
| src/components/ui/Toast.vue:215 | #EFF6FF | --blue-50 |
| src/components/ui/Toast.vue:219 | #3B82F6 | --blue-500 |
| src/components/ui/Toast.vue:220 | #DBEAFE | --info-bg |
| src/components/ui/Toast.vue:224 | #1E40AF | --info-text |
| src/components/ui/Toast.vue:228 | #2563EB | ≈ --blue-600 |

### src/components/Navbar.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/Navbar.vue:117 | #2563eb | ≈ --blue-600 (border-bottom) |
| src/components/Navbar.vue:118 | #2563eb | ≈ --blue-600 (color) |

> **Total Components/calendar+ui+Navbar : 208 occurrences — 43 sans équivalent** (concentrés dans le bloc dark de `UniversalCalendar.vue` : voiles `rgba($lms-blue-light/$white, α)`, cyan `#06b6d4`, bleu nuit `#001e3c`).

---

## Components — common / evaluations / modals

### src/components/common/ContentLoader.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/common/ContentLoader.vue:58 | #1B3B6F | ⚠ aucun token (bleu marine de marque KLASSCI) |
| src/components/common/ContentLoader.vue:59 | rgba(27, 59, 111, 0.3) | ⚠ aucun token (drop-shadow teinté marque) |
| src/components/common/ContentLoader.vue:76 | rgba(0, 0, 0, 0.2) | --shadow-* (text-shadow noir) |
| src/components/common/ContentLoader.vue:85 | #1B3B6F | ⚠ aucun token (bleu marine de marque) |
| src/components/common/ContentLoader.vue:92 | #FFB81C | ⚠ aucun token (or/jaune de marque) |
| src/components/common/ContentLoader.vue:99 | #2D5A9E | ⚠ aucun token (bleu marque intermédiaire) |
| src/components/common/ContentLoader.vue:147 | #475569 | --text-secondary (color) |
| src/components/common/ContentLoader.vue:166 | #60a5fa | --blue-400 (color) |
| src/components/common/ContentLoader.vue:167 | rgba(96, 165, 250, 0.5) | ⚠ aucun token (drop-shadow teinté bleu) |
| src/components/common/ContentLoader.vue:171 | #60a5fa | --blue-400 (color) |
| src/components/common/ContentLoader.vue:175 | #fbbf24 | ≈ --warning-border (color) |
| src/components/common/ContentLoader.vue:179 | #93c5fd | --blue-300 (color) |
| src/components/common/ContentLoader.vue:183 | #cbd5e1 | --border-secondary (color) |

### src/components/common/EditorToolbar.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/common/EditorToolbar.vue:86 | #000000 | n/a — attribut HTML value (input color) ; ≈ --text-primary |
| src/components/common/EditorToolbar.vue:93 | #ffff00 | ⚠ aucun token (jaune pur, défaut surligneur) |
| src/components/common/EditorToolbar.vue:398 | #10b981 (fallback) | ≈ --success-text (background) |
| src/components/common/EditorToolbar.vue:400 | #10b981 (fallback) | ≈ --success-text (border-color) |
| src/components/common/EditorToolbar.vue:426 | #10b981 (fallback) | ≈ --success-text (border-color) |
| src/components/common/EditorToolbar.vue:431 | #10b981 (fallback) | ≈ --success-text (border-color) |
| src/components/common/EditorToolbar.vue:432 | rgba(16, 185, 129, 0.2) | ⚠ aucun token (box-shadow focus teinté vert) |
| src/components/common/EditorToolbar.vue:447 | #10b981 (fallback) | ≈ --success-text (border-color) |

### src/components/common/PageLoader.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/common/PageLoader.vue:37 | rgba(27, 59, 111, 0.97) | ⚠ aucun token (gradient marque navy) |
| src/components/common/PageLoader.vue:37 | rgba(13, 37, 73, 0.98) | ⚠ aucun token (gradient marque navy foncé) |
| src/components/common/PageLoader.vue:66 | #ffffff | --btn-primary-text (color clair) |
| src/components/common/PageLoader.vue:67 | rgba(255, 255, 255, 0.4) | ⚠ aucun token (drop-shadow blanc/glow) |
| src/components/common/PageLoader.vue:74 | rgba(255, 255, 255, 0.4) | ⚠ aucun token (drop-shadow blanc/glow) |
| src/components/common/PageLoader.vue:78 | rgba(255, 255, 255, 0.6) | ⚠ aucun token (drop-shadow blanc/glow) |
| src/components/common/PageLoader.vue:96 | rgba(0, 0, 0, 0.3) | --shadow-* (text-shadow noir) |
| src/components/common/PageLoader.vue:104 | #93c5fd | --blue-300 (color) |
| src/components/common/PageLoader.vue:111 | #fbbf24 | ≈ --warning-border (color) |
| src/components/common/PageLoader.vue:118 | #60a5fa | --blue-400 (color) |
| src/components/common/PageLoader.vue:164 | rgba(255, 255, 255, 0.9) | ⚠ aucun token (texte blanc translucide sur fond marque) |

### src/components/common/TipTapEditor.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/common/TipTapEditor.vue:235 | rgba(16, 185, 129, 0.2) | ⚠ aucun token (box-shadow focus teinté vert) |
| src/components/common/TipTapEditor.vue:270 | rgba(0, 0, 0, 0.02) | ≈ --bg-secondary / --bg-tertiary (voile neutre) |
| src/components/common/TipTapEditor.vue:278 | rgba(255, 255, 255, 0.03) | ⚠ aucun token (voile blanc dark-mode) |
| src/components/common/TipTapEditor.vue:283 | rgba(255, 255, 255, 0.03) | ⚠ aucun token (voile blanc dark-mode) |
| src/components/common/TipTapEditor.vue:323 | rgba(0, 0, 0, 0.8) | ⚠ aucun token (overlay modale noir) |
| src/components/common/TipTapEditor.vue:341 | rgba(0, 0, 0, 0.5) | --shadow-* (box-shadow) |
| src/components/common/TipTapEditor.vue:384 | #10b981 (fallback) | ≈ --success-text (background) |
| src/components/common/TipTapEditor.vue:395 | #059669 | ≈ --success-text (background) |
| src/components/common/TipTapEditor.vue:397 | rgba(16, 185, 129, 0.3) | ⚠ aucun token (box-shadow teinté vert) |
| src/components/common/TipTapEditor.vue:479 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/components/common/TipTapEditor.vue:564 | rgba(0, 0, 0, 0.1) | ≈ --bg-tertiary (voile neutre) |
| src/components/common/TipTapEditor.vue:573 | rgba(255, 255, 255, 0.1) | ⚠ aucun token (voile blanc dark-mode) |
| src/components/common/TipTapEditor.vue:578 | rgba(255, 255, 255, 0.1) | ⚠ aucun token (voile blanc dark-mode) |
| src/components/common/TipTapEditor.vue:583 | rgba(0, 0, 0, 0.05) | ≈ --bg-secondary (voile neutre) |
| src/components/common/TipTapEditor.vue:592 | rgba(255, 255, 255, 0.05) | ⚠ aucun token (voile blanc dark-mode) |
| src/components/common/TipTapEditor.vue:597 | rgba(255, 255, 255, 0.05) | ⚠ aucun token (voile blanc dark-mode) |
| src/components/common/TipTapEditor.vue:609 | #10b981 (fallback) | ≈ --success-text (border-left) |
| src/components/common/TipTapEditor.vue:614 | rgba(16, 185, 129, 0.05) | ⚠ aucun token (fond teinté vert translucide) |
| src/components/common/TipTapEditor.vue:629 | #10b981 (fallback) | ≈ --success-text (color) |
| src/components/common/TipTapEditor.vue:646 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/components/common/TipTapEditor.vue:654 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/components/common/TipTapEditor.vue:682 | rgba(16, 185, 129, 0.15) | ⚠ aucun token (fond teinté vert translucide) |
| src/components/common/TipTapEditor.vue:689 | #9ca3af (fallback) | ≈ --text-disabled (color) |
| src/components/common/TipTapEditor.vue:791 | #10b981 (fallback) | ≈ --success-text (border) |
| src/components/common/TipTapEditor.vue:793 | rgba(0, 0, 0, 0.25) | --shadow-* (box-shadow) |
| src/components/common/TipTapEditor.vue:793 | rgba(16, 185, 129, 0.3) | ⚠ aucun token (box-shadow teinté vert) |
| src/components/common/TipTapEditor.vue:833 | #10b981 (fallback) | ≈ --success-text (background) |
| src/components/common/TipTapEditor.vue:835 | #10b981 (fallback) | ≈ --success-text (border-color) |
| src/components/common/TipTapEditor.vue:856 | #10b981 (fallback) | ≈ --success-text (border-color) |

### src/components/evaluations/EvaluationCard.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/evaluations/EvaluationCard.vue:300 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/components/evaluations/EvaluationCard.vue:304 | #dbeafe | --info-bg (background) |
| src/components/evaluations/EvaluationCard.vue:305 | #1e40af | --info-text (color) |
| src/components/evaluations/EvaluationCard.vue:306 | #bfdbfe | --blue-200 (border) |
| src/components/evaluations/EvaluationCard.vue:310 | #dcfce7 | --success-bg (background) |
| src/components/evaluations/EvaluationCard.vue:311 | #166534 | --success-text (color) |
| src/components/evaluations/EvaluationCard.vue:312 | #86efac | --success-border (border) |
| src/components/evaluations/EvaluationCard.vue:318 | rgba(34, 197, 94, 0.4) | ⚠ aucun token (keyframe pulse teinté vert) |
| src/components/evaluations/EvaluationCard.vue:321 | rgba(34, 197, 94, 0) | ⚠ aucun token (keyframe pulse teinté vert) |
| src/components/evaluations/EvaluationCard.vue:326 | #f3f4f6 | ≈ --bg-tertiary (background) |
| src/components/evaluations/EvaluationCard.vue:327 | #4b5563 | ≈ --text-secondary (color) |
| src/components/evaluations/EvaluationCard.vue:328 | #e5e7eb | ≈ --border-primary (border) |
| src/components/evaluations/EvaluationCard.vue:332 | #fef3c7 | --warning-bg (background) |
| src/components/evaluations/EvaluationCard.vue:333 | #92400e | ≈ --warning-text (color) |
| src/components/evaluations/EvaluationCard.vue:334 | #fde68a | ≈ --warning-border (border) |
| src/components/evaluations/EvaluationCard.vue:351 | #d1fae5 | ≈ --success-bg (background) |
| src/components/evaluations/EvaluationCard.vue:352 | #065f46 | ≈ --success-text (color) |
| src/components/evaluations/EvaluationCard.vue:353 | #6ee7b7 | ≈ --success-border (border) |
| src/components/evaluations/EvaluationCard.vue:360 | rgba(16, 185, 129, 0.2) | ⚠ aucun token (box-shadow teinté vert) |
| src/components/evaluations/EvaluationCard.vue:414 | #f59e0b | ≈ --warning-text (border-color) |
| src/components/evaluations/EvaluationCard.vue:415 | rgba(245, 158, 11, 0.05) | ⚠ aucun token (fond teinté ambre translucide) |
| src/components/evaluations/EvaluationCard.vue:419 | #f59e0b | ≈ --warning-text (color) |
| src/components/evaluations/EvaluationCard.vue:423 | #d97706 | ≈ --warning-text (color) |
| src/components/evaluations/EvaluationCard.vue:431 | #10b981 | ≈ --success-text (border-color) |
| src/components/evaluations/EvaluationCard.vue:432 | rgba(16, 185, 129, 0.05) | ⚠ aucun token (fond teinté vert translucide) |
| src/components/evaluations/EvaluationCard.vue:436 | #059669 | ≈ --success-text (color) |
| src/components/evaluations/EvaluationCard.vue:444 | #6b7280 | ≈ --text-tertiary (border-color) |
| src/components/evaluations/EvaluationCard.vue:445 | rgba(107, 114, 128, 0.05) | ⚠ aucun token (fond teinté gris translucide) |
| src/components/evaluations/EvaluationCard.vue:449 | #6b7280 | ≈ --text-tertiary (color) |
| src/components/evaluations/EvaluationCard.vue:453 | #4b5563 | ≈ --text-secondary (color) |
| src/components/evaluations/EvaluationCard.vue:469 | #22c55e | ≈ --success-text (background) |
| src/components/evaluations/EvaluationCard.vue:501 | #eff6ff | --blue-50 (background) |
| src/components/evaluations/EvaluationCard.vue:502 | #bfdbfe | --blue-200 (border) |
| src/components/evaluations/EvaluationCard.vue:510 | #2563eb | ≈ --blue-600 (color) |
| src/components/evaluations/EvaluationCard.vue:521 | #1e40af | --info-text (color) |
| src/components/evaluations/EvaluationCard.vue:536 | #1e40af | --info-text (color) |
| src/components/evaluations/EvaluationCard.vue:565 | #3b82f6 | --blue-500 (gradient) |
| src/components/evaluations/EvaluationCard.vue:565 | #2563eb | ≈ --blue-600 (gradient) |
| src/components/evaluations/EvaluationCard.vue:567 | rgba(59, 130, 246, 0.3) | ⚠ aucun token (box-shadow teinté bleu) |
| src/components/evaluations/EvaluationCard.vue:571 | #2563eb | ≈ --blue-600 (gradient) |
| src/components/evaluations/EvaluationCard.vue:571 | #1d4ed8 | ≈ --blue-700 (gradient) |
| src/components/evaluations/EvaluationCard.vue:573 | rgba(59, 130, 246, 0.4) | ⚠ aucun token (box-shadow teinté bleu) |
| src/components/evaluations/EvaluationCard.vue:577 | #f59e0b | ≈ --warning-text (background) |
| src/components/evaluations/EvaluationCard.vue:582 | #d97706 | ≈ --warning-text (background) |
| src/components/evaluations/EvaluationCard.vue:586 | #8b5cf6 | ⚠ aucun token (violet) |
| src/components/evaluations/EvaluationCard.vue:591 | #7c3aed | ⚠ aucun token (violet) |
| src/components/evaluations/EvaluationCard.vue:595 | #22c55e | ≈ --success-text (background) |
| src/components/evaluations/EvaluationCard.vue:600 | #16a34a | ≈ --success-text (background) |
| src/components/evaluations/EvaluationCard.vue:604 | #8b5cf6 | ⚠ aucun token (violet) |
| src/components/evaluations/EvaluationCard.vue:609 | #7c3aed | ⚠ aucun token (violet) |
| src/components/evaluations/EvaluationCard.vue:613 | #6366f1 | ⚠ aucun token (indigo) |
| src/components/evaluations/EvaluationCard.vue:618 | #4f46e5 | ⚠ aucun token (indigo) |
| src/components/evaluations/EvaluationCard.vue:622 | #ef4444 | ≈ --error-text (background) |
| src/components/evaluations/EvaluationCard.vue:627 | #dc2626 | ≈ --error-text (background) |

### src/components/modals/GenerateReportModal.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/modals/GenerateReportModal.vue:241 | #ef4444 | ≈ --error-text (color) |
| src/components/modals/GenerateReportModal.vue:258 | #3b82f6 | --blue-500 (border-color) |
| src/components/modals/GenerateReportModal.vue:259 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (box-shadow focus teinté bleu) |
| src/components/modals/GenerateReportModal.vue:264 | #fee2e2 | --error-bg (background) |
| src/components/modals/GenerateReportModal.vue:265 | #dc2626 | ≈ --error-text (color) |
| src/components/modals/GenerateReportModal.vue:272 | #dbeafe | --info-bg (background) |
| src/components/modals/GenerateReportModal.vue:273 | #3b82f6 | --blue-500 (border-left) |
| src/components/modals/GenerateReportModal.vue:280 | #1e40af | --info-text (color) |

### src/components/modals/GlobalSearchModal.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/modals/GlobalSearchModal.vue:359 | rgba(0, 0, 0, 0.5) | ⚠ aucun token (overlay modale noir) |
| src/components/modals/GlobalSearchModal.vue:372 | rgba(0, 0, 0, 0.1) | --shadow-* (box-shadow) |
| src/components/modals/GlobalSearchModal.vue:372 | rgba(0, 0, 0, 0.04) | --shadow-* (box-shadow) |
| src/components/modals/GlobalSearchModal.vue:510 | #dbeafe | --info-bg (background) |
| src/components/modals/GlobalSearchModal.vue:511 | #1e40af | --info-text (color) |
| src/components/modals/GlobalSearchModal.vue:515 | #d1fae5 | ≈ --success-bg (background) |
| src/components/modals/GlobalSearchModal.vue:516 | #065f46 | ≈ --success-text (color) |
| src/components/modals/GlobalSearchModal.vue:520 | #fef3c7 | --warning-bg (background) |
| src/components/modals/GlobalSearchModal.vue:521 | #92400e | ≈ --warning-text (color) |
| src/components/modals/GlobalSearchModal.vue:525 | #f3e8ff | ⚠ aucun token (violet clair) |
| src/components/modals/GlobalSearchModal.vue:526 | #6b21a8 | ⚠ aucun token (violet) |
| src/components/modals/GlobalSearchModal.vue:530 | #fee2e2 | --error-bg (background) |
| src/components/modals/GlobalSearchModal.vue:531 | #991b1b | --error-text (color) |

### src/components/modals/QuickAddTeacherModal.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/modals/QuickAddTeacherModal.vue:224 | #ef4444 | ≈ --error-text (color) |
| src/components/modals/QuickAddTeacherModal.vue:241 | #3b82f6 | --blue-500 (border-color) |
| src/components/modals/QuickAddTeacherModal.vue:242 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (box-shadow focus teinté bleu) |
| src/components/modals/QuickAddTeacherModal.vue:261 | #fee2e2 | --error-bg (background) |
| src/components/modals/QuickAddTeacherModal.vue:262 | #dc2626 | ≈ --error-text (color) |

### src/components/modals/QuickCreateClasseModal.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/modals/QuickCreateClasseModal.vue:228 | #ef4444 | ≈ --error-text (color) |
| src/components/modals/QuickCreateClasseModal.vue:245 | #3b82f6 | --blue-500 (border-color) |
| src/components/modals/QuickCreateClasseModal.vue:246 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (box-shadow focus teinté bleu) |
| src/components/modals/QuickCreateClasseModal.vue:275 | #fee2e2 | --error-bg (background) |
| src/components/modals/QuickCreateClasseModal.vue:276 | #dc2626 | ≈ --error-text (color) |

> **Total Components/common+evaluations+modals : 146 occurrences — 46 sans équivalent.**
> ⚠️ Couleurs de marque KLASSCI (`#1B3B6F`, `#2D5A9E`, `#FFB81C`) dans ContentLoader/PageLoader : aucun équivalent → nécessitent des tokens `--brand-*` dédiés (décision #T2).

---

## Components — autres (attendance / charts / enseignants / layout / seances / visio / widgets)

> `src/components/layout/DashboardLayout.vue`, `src/components/visio/ParticipantsModal.vue`, `src/components/visio/VisioManager.vue` : aucune couleur en dur.

### src/components/attendance/AttendanceDetailModal.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/attendance/AttendanceDetailModal.vue:187 | rgba(0, 0, 0, 0.6) | ⚠ aucun token (overlay backdrop) |
| src/components/attendance/AttendanceDetailModal.vue:199 | rgba(0, 0, 0, 0.3) | --shadow-lg (box-shadow) |
| src/components/attendance/AttendanceDetailModal.vue:312 | #3b82f6 | --blue-500 (border-top-color) |
| src/components/attendance/AttendanceDetailModal.vue:323 | #DBEAFE | --info-bg (background) |
| src/components/attendance/AttendanceDetailModal.vue:324 | #93C5FD | --info-border (border) |
| src/components/attendance/AttendanceDetailModal.vue:325 | #1E40AF | --info-text (color) |
| src/components/attendance/AttendanceDetailModal.vue:367 | rgba(0, 0, 0, 0.02) | ⚠ aucun token (fallback background-hover) |
| src/components/attendance/AttendanceDetailModal.vue:404 | #D1FAE5 | ≈ --success-bg (background) |
| src/components/attendance/AttendanceDetailModal.vue:405 | #065F46 | ≈ --success-text (color) |
| src/components/attendance/AttendanceDetailModal.vue:410 | #FED7AA | ⚠ aucun token (orange material, background) |
| src/components/attendance/AttendanceDetailModal.vue:411 | #92400E | ≈ --warning-text (color) |
| src/components/attendance/AttendanceDetailModal.vue:416 | #FECACA | ≈ --error-border (background) |
| src/components/attendance/AttendanceDetailModal.vue:417 | #7F1D1D | ≈ --error-text (color, plus foncé) |
| src/components/attendance/AttendanceDetailModal.vue:422 | #FEE2E2 | --error-bg (background) |
| src/components/attendance/AttendanceDetailModal.vue:423 | #991B1B | --error-text (color) |
| src/components/attendance/AttendanceDetailModal.vue:428 | #DBEAFE | --info-bg (background) |
| src/components/attendance/AttendanceDetailModal.vue:429 | #1E40AF | --info-text (color) |
| src/components/attendance/AttendanceDetailModal.vue:486 | #EF4444 | ≈ --error-text (color) |
| src/components/attendance/AttendanceDetailModal.vue:491 | #3b82f6 | --blue-500 (fallback background) |
| src/components/attendance/AttendanceDetailModal.vue:502 | #2563eb | ≈ --blue-600 (background) |
| src/components/attendance/AttendanceDetailModal.vue:520 | #dc2626 | ≈ --error-text (gradient) |
| src/components/attendance/AttendanceDetailModal.vue:520 | #b91c1c | ≈ --error-text (gradient) |
| src/components/attendance/AttendanceDetailModal.vue:528 | rgba(220, 38, 38, 0.3) | ⚠ aucun token (box-shadow teinté rouge) |
| src/components/attendance/AttendanceDetailModal.vue:532 | #b91c1c | ≈ --error-text (gradient) |
| src/components/attendance/AttendanceDetailModal.vue:532 | #991b1b | --error-text (gradient) |
| src/components/attendance/AttendanceDetailModal.vue:534 | rgba(220, 38, 38, 0.4) | ⚠ aucun token (box-shadow teinté rouge) |
| src/components/attendance/AttendanceDetailModal.vue:548 | #10b981 | ≈ --success-text (gradient) |
| src/components/attendance/AttendanceDetailModal.vue:548 | #059669 | ≈ --success-text (gradient) |
| src/components/attendance/AttendanceDetailModal.vue:556 | rgba(16, 185, 129, 0.3) | ⚠ aucun token (box-shadow teinté vert) |
| src/components/attendance/AttendanceDetailModal.vue:560 | #059669 | ≈ --success-text (gradient) |
| src/components/attendance/AttendanceDetailModal.vue:560 | #047857 | ≈ --success-text (gradient) |
| src/components/attendance/AttendanceDetailModal.vue:562 | rgba(16, 185, 129, 0.4) | ⚠ aucun token (box-shadow teinté vert) |

### src/components/charts/ActivityChart.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/charts/ActivityChart.vue:82 | rgba(0, 0, 0, 0.8) | ⚠ aucun token (option JS Chart.js tooltip, hors CSS) |
| src/components/charts/ActivityChart.vue:84 | rgba(255, 255, 255, 0.1) | ⚠ aucun token (option JS Chart.js, hors CSS) |
| src/components/charts/ActivityChart.vue:118 | rgba(0, 0, 0, 0.05) | ⚠ aucun token (option JS Chart.js grid, hors CSS) |

### src/components/enseignants/EnseignantsListExample.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/enseignants/EnseignantsListExample.vue:195 | #ef4444 | ≈ --error-text (color) |
| src/components/enseignants/EnseignantsListExample.vue:196 | #ef4444 | ≈ --error-border (border-color) |
| src/components/enseignants/EnseignantsListExample.vue:216 | rgba(0, 0, 0, 0.1) | --shadow-md (box-shadow) |
| src/components/enseignants/EnseignantsListExample.vue:217 | #3b82f6 | --blue-500 (border-color) |
| src/components/enseignants/EnseignantsListExample.vue:236 | #3b82f6 | --blue-500 (gradient) |
| src/components/enseignants/EnseignantsListExample.vue:236 | #8b5cf6 | ⚠ aucun token (violet) |

### src/components/layout/BottomNavigation.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/layout/BottomNavigation.vue:91 | rgba(0, 0, 0, 0.1) | --shadow-md (box-shadow) |
| src/components/layout/BottomNavigation.vue:149 | rgba(0, 0, 0, 0.3) | --shadow-lg (box-shadow, dark) |

### src/components/layout/MobileHeader.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/layout/MobileHeader.vue:174 | rgba(0, 0, 0, 0.1) | --shadow-sm (box-shadow) |
| src/components/layout/MobileHeader.vue:249 | #ef4444 | ≈ --error-text (badge background) |
| src/components/layout/MobileHeader.vue:289 | rgba(0, 0, 0, 0.1) | --shadow-md (box-shadow) |
| src/components/layout/MobileHeader.vue:388 | #ef4444 | ≈ --error-text (color) |
| src/components/layout/MobileHeader.vue:402 | rgba(0, 0, 0, 0.3) | ⚠ aucun token (overlay backdrop) |
| src/components/layout/MobileHeader.vue:425 | rgba(0, 0, 0, 0.3) | --shadow-md (box-shadow, dark) |
| src/components/layout/MobileHeader.vue:430 | rgba(0, 0, 0, 0.5) | --shadow-lg (box-shadow, dark) |

### src/components/layout/MobileSidebar.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/layout/MobileSidebar.vue:193 | rgba(0, 0, 0, 0.5) | ⚠ aucun token (overlay backdrop) |
| src/components/layout/MobileSidebar.vue:208 | rgba(0, 0, 0, 0.15) | --shadow-md (box-shadow) |
| src/components/layout/MobileSidebar.vue:334 | #ef4444 | ≈ --error-text (color) |
| src/components/layout/MobileSidebar.vue:379 | rgba(0, 0, 0, 0.3) | --shadow-md (box-shadow, dark) |

### src/components/layout/Navbar.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/layout/Navbar.vue:426 | #ef4444 | ≈ --error-text (badge background) |
| src/components/layout/Navbar.vue:600 | rgba(59, 130, 246, 0.05) | ⚠ aucun token (background bleu translucide) |

### src/components/layout/Sidebar.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/layout/Sidebar.vue:478 | #1E6FD9 | ≈ --blue-600 (fill SVG logo) |
| src/components/layout/Sidebar.vue:486 | #1E6FD9 | ≈ --blue-600 (fill SVG logo) |
| src/components/layout/Sidebar.vue:491 | #3B82F6 | --blue-500 (fill SVG logo) |
| src/components/layout/Sidebar.vue:495 | #1F2937 | ≈ --text-primary (fill SVG logo) |
| src/components/layout/Sidebar.vue:499 | #60A5FA | --blue-400 (fill SVG logo) |

### src/components/seances/SeanceCard.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/seances/SeanceCard.vue:252 | #3b82f6 | --blue-500 (color) |
| src/components/seances/SeanceCard.vue:285 | #dbeafe | --info-bg (background) |
| src/components/seances/SeanceCard.vue:286 | #1e40af | --info-text (color) |
| src/components/seances/SeanceCard.vue:290 | #dcfce7 | --success-bg (background) |
| src/components/seances/SeanceCard.vue:291 | #166534 | --success-text (color) |
| src/components/seances/SeanceCard.vue:295 | #f3f4f6 | ≈ --bg-tertiary (background) |
| src/components/seances/SeanceCard.vue:296 | #4b5563 | ≈ --text-secondary (color) |
| src/components/seances/SeanceCard.vue:377 | #1f2937 | ≈ --text-primary (fallback card-bg-dark) |
| src/components/seances/SeanceCard.vue:382 | #1f2937 | ≈ --text-primary (fallback card-bg-dark) |
| src/components/seances/SeanceCard.vue:395 | rgba(255, 255, 255, 0.8) | ⚠ aucun token (texte clair sur fond sombre) |
| src/components/seances/SeanceCard.vue:425 | #3b82f6 | --blue-500 (color) |
| src/components/seances/SeanceCard.vue:467 | #1f2937 | ≈ --text-primary (fallback card-bg-dark) |
| src/components/seances/SeanceCard.vue:478 | #22c55e | ≈ --success-text (background) |
| src/components/seances/SeanceCard.vue:489 | rgba(255, 255, 255, 0.7) | ⚠ aucun token (texte clair sur fond sombre) |
| src/components/seances/SeanceCard.vue:531 | #3b82f6 | --blue-500 (background) |
| src/components/seances/SeanceCard.vue:536 | #2563eb | ≈ --blue-600 (background) |
| src/components/seances/SeanceCard.vue:540 | #22c55e | ≈ --success-text (background) |
| src/components/seances/SeanceCard.vue:545 | #16a34a | ≈ --success-text (background) |
| src/components/seances/SeanceCard.vue:549 | #ef4444 | ≈ --error-text (background) |
| src/components/seances/SeanceCard.vue:554 | #dc2626 | ≈ --error-text (background) |

### src/components/visio/JitsiMeet.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/visio/JitsiMeet.vue:316 | #000 | ⚠ aucun token (fond noir conteneur) |
| src/components/visio/JitsiMeet.vue:330 | rgba(0, 0, 0, 0.9) | ⚠ aucun token (overlay opaque) |
| src/components/visio/JitsiMeet.vue:342 | rgba(255, 255, 255, 0.1) | ⚠ aucun token (border spinner sur fond sombre) |
| src/components/visio/JitsiMeet.vue:344 | #3b82f6 | --blue-500 (border-top) |
| src/components/visio/JitsiMeet.vue:362 | rgba(0, 0, 0, 0.9) | ⚠ aucun token (overlay opaque) |

### src/components/visio/JitsiModal.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/visio/JitsiModal.vue:133 | rgba(0, 0, 0, 0.95) | ⚠ aucun token (overlay backdrop opaque) |
| src/components/visio/JitsiModal.vue:146 | #1f2937 | ≈ --text-primary (background sombre) |
| src/components/visio/JitsiModal.vue:151 | rgba(0, 0, 0, 0.5) | --shadow-lg (box-shadow) |
| src/components/visio/JitsiModal.vue:160 | #111827 | ≈ --text-primary (background sombre) |
| src/components/visio/JitsiModal.vue:161 | #374151 | --border-primary (dark) |
| src/components/visio/JitsiModal.vue:166 | #ef4444 | ≈ --error-text (background) |
| src/components/visio/JitsiModal.vue:178 | #dc2626 | ≈ --error-text (hover) |
| src/components/visio/JitsiModal.vue:185 | #000 | ⚠ aucun token (fond noir) |

### src/components/widgets/CalendarWidget.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/widgets/CalendarWidget.vue:178 | #3b82f6 | --blue-500 (eventColor JS) |
| src/components/widgets/CalendarWidget.vue:249 | rgba(0, 0, 0, 0.1) | --shadow-md (box-shadow) |
| src/components/widgets/CalendarWidget.vue:359 | rgba(59, 130, 246, 0.1) | ⚠ aucun token (background bleu translucide) |
| src/components/widgets/CalendarWidget.vue:368 | #3b82f6 | --blue-500 (background) |
| src/components/widgets/CalendarWidget.vue:369 | #2563eb | ≈ --blue-600 (border-color) |
| src/components/widgets/CalendarWidget.vue:373 | #f59e0b | ≈ --warning-text (background) |
| src/components/widgets/CalendarWidget.vue:374 | #d97706 | ≈ --warning-text (border-color) |
| src/components/widgets/CalendarWidget.vue:378 | #10b981 | ≈ --success-text (background) |
| src/components/widgets/CalendarWidget.vue:379 | #059669 | ≈ --success-text (border-color) |
| src/components/widgets/CalendarWidget.vue:389 | rgba(0, 0, 0, 0.2) | --shadow-md (box-shadow) |
| src/components/widgets/CalendarWidget.vue:414 | #3b82f6 | --blue-500 (background) |
| src/components/widgets/CalendarWidget.vue:418 | #f59e0b | ≈ --warning-text (background) |
| src/components/widgets/CalendarWidget.vue:422 | #10b981 | ≈ --success-text (background) |
| src/components/widgets/CalendarWidget.vue:435 | rgba(0, 0, 0, 0.5) | ⚠ aucun token (overlay backdrop) |
| src/components/widgets/CalendarWidget.vue:448 | rgba(0, 0, 0, 0.1) | --shadow-lg (box-shadow) |
| src/components/widgets/CalendarWidget.vue:448 | rgba(0, 0, 0, 0.04) | --shadow-lg (box-shadow) |
| src/components/widgets/CalendarWidget.vue:540 | #2563eb | ≈ --blue-600 (background) |
| src/components/widgets/CalendarWidget.vue:542 | rgba(59, 130, 246, 0.3) | ⚠ aucun token (box-shadow teinté bleu) |

### src/components/widgets/NotificationsWidget.vue

| fichier:ligne | valeur | token proposé |
|---|---|---|
| src/components/widgets/NotificationsWidget.vue:249 | rgba(0, 0, 0, 0.1) | --shadow-md (box-shadow) |
| src/components/widgets/NotificationsWidget.vue:275 | #f59e0b | ≈ --warning-text (color) |
| src/components/widgets/NotificationsWidget.vue:299 | #ef4444 | ≈ --error-text (badge background) |
| src/components/widgets/NotificationsWidget.vue:384 | #eff6ff | --blue-50 (gradient) |
| src/components/widgets/NotificationsWidget.vue:385 | #3b82f6 | --blue-500 (border-left) |
| src/components/widgets/NotificationsWidget.vue:399 | #dbeafe | --info-bg (background) |
| src/components/widgets/NotificationsWidget.vue:400 | #1e40af | --info-text (color) |
| src/components/widgets/NotificationsWidget.vue:404 | #d1fae5 | ≈ --success-bg (background) |
| src/components/widgets/NotificationsWidget.vue:405 | #065f46 | ≈ --success-text (color) |
| src/components/widgets/NotificationsWidget.vue:409 | #fef3c7 | --warning-bg (background) |
| src/components/widgets/NotificationsWidget.vue:410 | #92400e | ≈ --warning-text (color) |
| src/components/widgets/NotificationsWidget.vue:414 | #fee2e2 | --error-bg (background) |
| src/components/widgets/NotificationsWidget.vue:415 | #991b1b | --error-text (color) |
| src/components/widgets/NotificationsWidget.vue:472 | #10b981 | ≈ --success-text (color) |
| src/components/widgets/NotificationsWidget.vue:476 | #d1fae5 | ≈ --success-bg (background) |
| src/components/widgets/NotificationsWidget.vue:477 | #10b981 | ≈ --success-border (border-color) |
| src/components/widgets/NotificationsWidget.vue:481 | #ef4444 | ≈ --error-text (color) |
| src/components/widgets/NotificationsWidget.vue:485 | #fee2e2 | --error-bg (background) |
| src/components/widgets/NotificationsWidget.vue:486 | #ef4444 | ≈ --error-border (border-color) |
| src/components/widgets/NotificationsWidget.vue:534 | #2563eb | ≈ --blue-600 (color) |

> **Total Components/autres : 132 occurrences — 25 sans équivalent** (backdrops, box-shadows teintés, violet `#8b5cf6`, options JS Chart.js, surfaces sombres visio).

---

## Synthèse — familles « sans équivalent » & recommandations pour #T2/#T3/#T4

Les ~378 occurrences sans token exact se regroupent en familles homogènes. Décision à prendre en #T2 **avant** toute migration :

| Famille | Exemples | Volume | Recommandation #T2 |
|---|---|---|---|
| **Violet / indigo** | `#6366f1`, `#4f46e5`, `#8b5cf6`, `#7c3aed`, `#a855f7`, `#5b21b6`, `#e0e7ff`, `#f3e8ff`, `#e9d5ff` | très élevé (KnowledgeCheck*, EvaluationCard, AdminProfile, Preview/Take) | Créer une échelle `--violet-*` / `--accent-*`, OU bannir le violet et basculer ces usages sur `--blue-*`. **Décision produit requise.** |
| **Cyan / sky** | `#06b6d4`, `#0369a1`, `#7dd3fc`, `#e0f2fe`, `#0c4a6e` | moyen (AdminSettings, AdminEnseignants, UniversalCalendar dark) | Idem : échelle `--cyan-*` ou rebascule sur `--info-*`/`--blue-*`. |
| **Orange / material** | `#ea580c`, `#f97316`, `#ff9800`, `#f44336`, `#4caf50`, `#c2410c` | moyen (StudentGrades, UniversalCalendar, dashboards) | `StudentGrades.vue` utilise une palette Material complète distincte du thème → harmoniser (tokens dédiés ou rebascule statut). |
| **Marque KLASSCI** | `#1B3B6F`, `#2D5A9E`, `#FFB81C` | faible (ContentLoader, PageLoader) | Créer `--brand-navy`, `--brand-navy-mid`, `--brand-gold` dans `themes.css`. |
| **Voiles `rgba` translucides** | `rgba(255,255,255,α)`, `rgba($lms-blue-light,α)`, halos colorés | élevé (UniversalCalendar dark, TipTap, ProgressBar) | Pas de token alpha aujourd'hui. Définir des tokens d'overlay/halo, OU accepter comme dette tracée (fidélité visuelle). |
| **Box-shadow / glow teintés** | `rgba(59,130,246,α)`, `rgba(16,185,129,α)` en box-shadow | élevé | `--shadow-*` est neutre (noir). Soit créer `--shadow-primary/-success/...`, soit migrer vers `--shadow-*` en assumant la perte de teinte. |
| **Overlays/backdrops** | `rgba(0,0,0,0.5/0.6/0.95)` (modales, visio) | moyen | Créer `--overlay-backdrop` (et variantes opaques pour visio). Ne PAS mapper vers `--shadow-*`. |
| **Surfaces très sombres** | `#000`, `#1a202c`, `#2d3748` (lecteurs vidéo/slides, Jitsi) | faible | Tokens de surface dédiés `--surface-player` / `--video-bg`, ou conserver (contexte média). |

### Points d'attention transverses

1. **Fallbacks `var(--token, #hex)`** (ChapterManager, TipTap, SeanceDetails, TakeEvaluation…) : le token existe déjà ; seul le `#fallback` reste en dur. Migration #T3 = garantir la définition du token partout puis supprimer le fallback hex.
2. **Variables SCSS de `UniversalCalendar.vue` / `CalendarFilters.vue`** (`$lms-blue`, `$white`, `$gray-*`) : redéfinissent localement des couleurs déjà présentes dans `themes.css`. Candidat #T3 prioritaire — remplacer les `$lms-*` par les `var(--…)` correspondants.
3. **Couleurs assignées en JS** (AdminDashboard 592-603, CalendarWidget eventColor, ActivityChart Chart.js, UniversalCalendar inline) : ne sont pas dans `<style>` ; migration via mapping JS→token (objet de correspondance) plutôt que CSS.
4. **Fichiers candidats à la suppression** (pollués de couleurs en dur mais probablement morts) : `AdminMatieres_backup.vue`, `AdminMatieres_modern.vue`, `StudentDashboardModern.vue` — à confirmer avant de les inclure dans un lot de migration.
5. **`StudentGrades.vue`** : cas isolé avec une palette Material entière (50 occurrences, 24 sans équivalent) — mérite un sous-lot dédié.

### Découpage proposé

- **#T2 (fondation)** : décisions sur les familles violet/cyan/orange/marque ; ajout des tokens manquants (`--brand-*`, overlays, shadows teintés si retenus) dans `themes.css`.
- **#T3 (correspondances exactes + fallbacks)** : migrer toutes les lignes `--token` exact et `≈` neutres (statuts, bleus, gris) — gros volume, faible risque ; nettoyer les `$lms-*` SCSS du calendrier.
- **#T4 (cas résiduels)** : couleurs JS, surfaces sombres média, et les `⚠` tranchés en #T2.
