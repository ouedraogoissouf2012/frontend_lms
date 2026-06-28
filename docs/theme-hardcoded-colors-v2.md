# Audit v2 des couleurs en dur dans `src/components/**/*.vue` (issue #135)

> **Type :** analyse en lecture seule. Aucun fichier `.vue` n'a été modifié.
> **Remplace :** `docs/theme-hardcoded-colors.md` (#106), snapshot pris AVANT la décomposition des god components (#28) et donc périmé.
> **Périmètre :** re-grep exhaustif de `src/components/**/*.vue` sur le `dev` courant (`#hexa`, `rgb()`, `rgba()`).

## Méthode

1. Extraction par `grep -nE '#[0-9a-fA-F]{3,8}|rgba?\('` sur chaque `.vue` (numéro de ligne + valeur exacte ; une entrée par couleur, gradients/box-shadow multi-couches éclatés).
2. Choix du token cible selon la **propriété CSS** : `color:` → token texte ; `background`/`background-color` → token surface ; `border` → token bordure ; `box-shadow` noire → `--shadow-*`.
3. Statut par occurrence :
   - **remplaçable** = la valeur littérale est exactement égale à une valeur de token de `src/assets/styles/themes.css`, et un token sémantiquement adapté existe → migrable immédiatement.
   - **besoin token #136** = aucun token de `themes.css` n'a cette valeur exacte (dégradé custom, couleur de rôle/marque, overlay alpha, ombre non standard, palette Material/Tailwind one-off) → nécessite un token sémantique à créer (cf. #136).

## Règles d'exclusion appliquées

- `transparent`, `currentColor`, `inherit` : ignorés (non-couleurs tokenisables).
- Valeurs déjà en `var(--…)` et fallbacks `var(--token, #hex)` : ignorés (déjà tokenisés). Les fallbacks notables sont listés en note de section.
- `:style` bindings sur données dynamiques et attributs `placeholder=` : ignorés (non tokenisables statiquement).

> ⚠️ Note de fiabilité : les totaux de la section « Synthèse » sont calculés par comptage automatique des lignes du présent document (`grep`), pas par estimation. `charts/ActivityChart.vue` contient des couleurs dans des options JS Chart.js (pas du CSS) — tokenisables seulement via `getComputedStyle`, signalées comme telles.

---

## Synthèse

**Total : 1280 occurrences** réparties sur 194 fichiers `.vue` (hors fallbacks `var(--…, #hex)` et valeurs déjà tokenisées).

| | nombre | part |
|---|---|---|
| **remplaçable** (token exact existe dans themes.css) | **379** | 30 % |
| **besoin token #136** (token sémantique à créer) | **901** | 70 % |

### Par sous-dossier (trié par volume)

| sous-dossier | total | remplaçable | besoin token #136 |
|---|---|---|---|
| lessons/ | 302 | 79 | 223 |
| admin/ | 156 | 38 | 118 |
| evaluations/ | 124 | 24 | 100 |
| calendar/ | 89 | 33 | 56 |
| attendance/ | 88 | 24 | 64 |
| student/ | 77 | 19 | 58 |
| teacher/ | 70 | 32 | 38 |
| ui/ | 58 | 20 | 38 |
| dashboard/ | 47 | 27 | 20 |
| seances/ | 44 | 16 | 28 |
| forum/ | 39 | 7 | 32 |
| widgets/ | 37 | 14 | 23 |
| common/ | 32 | 8 | 24 |
| visio/ | 32 | 7 | 25 |
| layout/ | 22 | 6 | 16 |
| matieres/ | 22 | 7 | 15 |
| modals/ | 21 | 11 | 10 |
| search/ | 10 | 5 | 5 |
| classes/ | 5 | 2 | 3 |
| charts/ | 3 | 0 | 3 |
| (racine) Navbar.vue | 2 | 0 | 2 |

### Familles de tokens à créer en priorité (#136)

Les couleurs « besoin token #136 » les plus fréquentes (donc les meilleurs candidats à de nouveaux tokens sémantiques) :

- **Bleu de marque `#2563eb` / `#1d4ed8`** — stops de dégradés de boutons primaires, omniprésents (themes.css n'a que `--blue-600 #0052cc`).
- **Succès plein `#10b981` / `#059669` / `#22c55e` / `#16a34a`** — badges, stats, légendes (themes.css n'a que des fonds/bordures `--success-*`).
- **Warning plein `#f59e0b` / `#d97706` / `#92400e`** — idem côté avertissement.
- **Danger plein `#ef4444` / `#dc2626` / `#b91c1c`** — boutons/icônes de suppression.
- **Violet / indigo `#8b5cf6` / `#7c3aed` / `#6366f1` / `#4f46e5`** — quiz, évaluations, profils, badges (aucune famille violette dans themes.css).
- **Échelle de gris neutre `#6b7280` / `#4b5563` / `#374151` / `#1f2937` / `#9ca3af` / `#e5e7eb` / `#f3f4f6`** — forum et coordinateur surtout (themes.css a une échelle `--text-*`/`--bg-*` mais pas ces valeurs Tailwind exactes).
- **Palette « notes » Material `#4caf50` / `#8bc34a` / `#ff9800` / `#ff5722` / `#f44336`** — barèmes de notes (`student/Grades*`).
- **Overlays modaux `rgba(0,0,0,0.5/0.6/0.9/0.95)`** — fonds de modales/visio (aucun token d'overlay).
- **Couleurs de marque loader `#1B3B6F` / `#FFB81C` / `#2D5A9E`** (`common/`).

---

## Détail par sous-dossier

### admin/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/admin/ClassCard.vue:78 | rgba(0, 0, 0, 0.1) | --shadow-md/--card-shadow | remplaçable |
| src/components/admin/ClassCard.vue:82 | rgba(0, 0, 0, 0.15) | (à créer) | besoin token #136 |
| src/components/admin/ClassCard.vue:115 | #e0e7ff | (à créer) | besoin token #136 |
| src/components/admin/ClassCard.vue:116 | #5b21b6 | (à créer) | besoin token #136 |
| src/components/admin/ClassCard.vue:119 | #fef3c7 | --warning-bg | remplaçable |
| src/components/admin/ClassCard.vue:120 | #92400e | (à créer) | besoin token #136 |
| src/components/admin/ClassCard.vue:127 | #dcfce7 | --success-bg | remplaçable |
| src/components/admin/ClassCard.vue:128 | #15803d | (à créer) | besoin token #136 |
| src/components/admin/ClassCard.vue:137 | #22c55e | (à créer) | besoin token #136 |
| src/components/admin/ClassCard.vue:214 | #3b82f6 | --blue-500 | remplaçable |
| src/components/admin/ClassCard.vue:214 | #2563eb | (à créer) | besoin token #136 |
| src/components/admin/ClassCard.vue:216 | rgba(59, 130, 246, 0.3) | (à créer) | besoin token #136 |
| src/components/admin/ClassCard.vue:219 | #2563eb | (à créer) | besoin token #136 |
| src/components/admin/ClassCard.vue:219 | #1d4ed8 | (à créer) | besoin token #136 |
| src/components/admin/ClassCard.vue:221 | rgba(59, 130, 246, 0.4) | (à créer) | besoin token #136 |
| src/components/admin/ClassesFilters.vue:85 | rgba(0, 0, 0, 0.1) | --shadow-md/--card-shadow | remplaçable |
| src/components/admin/ClassesFilters.vue:135 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/admin/ClassesStatsCards.vue:63 | rgba(0, 0, 0, 0.1) | --shadow-md/--card-shadow | remplaçable |
| src/components/admin/ClassesStatsCards.vue:70 | rgba(0, 0, 0, 0.15) | (à créer) | besoin token #136 |
| src/components/admin/ClassesStatsCards.vue:74 | #3b82f6 | --blue-500 | remplaçable |
| src/components/admin/ClassesStatsCards.vue:78 | #10b981 | (à créer) | besoin token #136 |
| src/components/admin/ClassesStatsCards.vue:82 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/admin/ClassesStatsCards.vue:86 | #f59e0b | (à créer) | besoin token #136 |
| src/components/admin/ConnectionResultModal.vue:63 | #22c55e | (à créer) | besoin token #136 |
| src/components/admin/ConnectionResultModal.vue:66 | #ef4444 | (à créer) | besoin token #136 |
| src/components/admin/EnseignantCard.vue:193 | #e0f2fe | (à créer) | besoin token #136 |
| src/components/admin/EnseignantCard.vue:194 | #0369a1 | (à créer) | besoin token #136 |
| src/components/admin/EnseignantCard.vue:198 | rgba(14, 165, 233, 0.2) | (à créer) | besoin token #136 |
| src/components/admin/EnseignantCard.vue:199 | #7dd3fc | (à créer) | besoin token #136 |
| src/components/admin/EnseignantCard.vue:203 | #f0fdf4 | (à créer) | besoin token #136 |
| src/components/admin/EnseignantCard.vue:204 | #15803d | (à créer) | besoin token #136 |
| src/components/admin/EnseignantCard.vue:208 | rgba(34, 197, 94, 0.2) | (à créer) | besoin token #136 |
| src/components/admin/EnseignantCard.vue:209 | #86efac | --success-border | remplaçable |
| src/components/admin/EnseignantCard.vue:229 | #3b82f6 | --blue-500 | remplaçable |
| src/components/admin/EnseignantClassesList.vue:64 | #dbeafe | --blue-100/--info-bg | remplaçable |
| src/components/admin/EnseignantClassesList.vue:65 | #1e40af | --info-text | remplaçable |
| src/components/admin/EnseignantClassesList.vue:69 | #fef3c7 | --warning-bg | remplaçable |
| src/components/admin/EnseignantClassesList.vue:70 | #92400e | (à créer) | besoin token #136 |
| src/components/admin/EnseignantDetailModal.vue:107 | rgba(0, 0, 0, 0.5) | (à créer) | besoin token #136 |
| src/components/admin/EvaluationResultsTable.vue:194 | #10b981 | (à créer) | besoin token #136 |
| src/components/admin/EvaluationResultsTable.vue:198 | #3b82f6 | --blue-500 | remplaçable |
| src/components/admin/EvaluationResultsTable.vue:202 | #f59e0b | (à créer) | besoin token #136 |
| src/components/admin/EvaluationResultsTable.vue:206 | #ef4444 | (à créer) | besoin token #136 |
| src/components/admin/HubCard.vue:58 | rgba(0, 0, 0, 0.18) | (à créer) | besoin token #136 |
| src/components/admin/HubCard.vue:88 | #3b82f6 | --blue-500 | remplaçable |
| src/components/admin/HubCard.vue:88 | #2563eb | (à créer) | besoin token #136 |
| src/components/admin/HubCard.vue:92 | #f59e0b | (à créer) | besoin token #136 |
| src/components/admin/HubCard.vue:92 | #d97706 | (à créer) | besoin token #136 |
| src/components/admin/HubCard.vue:96 | #10b981 | (à créer) | besoin token #136 |
| src/components/admin/HubCard.vue:96 | #059669 | (à créer) | besoin token #136 |
| src/components/admin/InstitutionFormModal.vue:174 | #3b82f6 | --blue-500/--border-focus(dark) | remplaçable |
| src/components/admin/InstitutionFormModal.vue:175 | rgba(59, 130, 246, 0.15) | (à créer) | besoin token #136 |
| src/components/admin/InstitutionFormModal.vue:222 | #d1d5db | (à créer) | besoin token #136 |
| src/components/admin/InstitutionFormModal.vue:237 | rgba(0,0,0,0.2) | (à créer) | besoin token #136 |
| src/components/admin/InstitutionFormModal.vue:240 | #22c55e | (à créer) | besoin token #136 |
| src/components/admin/InstitutionFormModal.vue:254 | rgba(239, 68, 68, 0.08) | (à créer) | besoin token #136 |
| src/components/admin/InstitutionFormModal.vue:255 | rgba(239, 68, 68, 0.2) | (à créer) | besoin token #136 |
| src/components/admin/InstitutionFormModal.vue:260 | #dc2626 | (à créer) | besoin token #136 |
| src/components/admin/InstitutionsStatsCards.vue:62 | #6366f1 | (à créer) | besoin token #136 |
| src/components/admin/InstitutionsStatsCards.vue:62 | #4f46e5 | (à créer) | besoin token #136 |
| src/components/admin/InstitutionsStatsCards.vue:68 | #22c55e | (à créer) | besoin token #136 |
| src/components/admin/InstitutionsStatsCards.vue:68 | #16a34a | (à créer) | besoin token #136 |
| src/components/admin/InstitutionsStatsCards.vue:72 | #3b82f6 | --blue-500 | remplaçable |
| src/components/admin/InstitutionsStatsCards.vue:72 | #2563eb | (à créer) | besoin token #136 |
| src/components/admin/InstitutionsStatsCards.vue:76 | #a855f7 | (à créer) | besoin token #136 |
| src/components/admin/InstitutionsStatsCards.vue:76 | #9333ea | (à créer) | besoin token #136 |
| src/components/admin/InstitutionsTable.vue:198 | rgba(34, 197, 94, 0.1) | (à créer) | besoin token #136 |
| src/components/admin/InstitutionsTable.vue:199 | #16a34a | (à créer) | besoin token #136 |
| src/components/admin/InstitutionsTable.vue:203 | rgba(107, 114, 128, 0.1) | (à créer) | besoin token #136 |
| src/components/admin/InstitutionsTable.vue:204 | #6b7280 | (à créer) | besoin token #136 |
| src/components/admin/InstitutionsTable.vue:242 | #16a34a | (à créer) | besoin token #136 |
| src/components/admin/InstitutionsTable.vue:246 | #9ca3af | (à créer) | besoin token #136 |
| src/components/admin/InstitutionsTable.vue:250 | #3b82f6 | --blue-500 | remplaçable |
| src/components/admin/MatieresTable.vue:82 | #4a90e2 | (à créer) | besoin token #136 |
| src/components/admin/MatieresTable.vue:82 | #5a9df2 | (à créer) | besoin token #136 |
| src/components/admin/MatieresTable.vue:94 | #ffffff | --bg-primary/--btn-primary-text | remplaçable |
| src/components/admin/MatieresTable.vue:98 | rgba(255, 255, 255, 0.3) | .glass border | remplaçable |
| src/components/admin/NiveauDetailModal.vue:156 | rgba(0, 0, 0, 0.1) | --shadow-md/--card-shadow | remplaçable |
| src/components/admin/NiveauDetailModal.vue:235 | rgba(99, 102, 241, 0.4) | (à créer) | besoin token #136 |
| src/components/admin/ProfileActionsCard.vue:73 | rgba(139, 92, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/admin/ProfileActionsCard.vue:73 | rgba(124, 58, 237, 0.05) | (à créer) | besoin token #136 |
| src/components/admin/ProfileActionsCard.vue:79 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/admin/ProfileActionsCard.vue:113 | rgba(139, 92, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/admin/ProfileActionsCard.vue:113 | rgba(124, 58, 237, 0.05) | (à créer) | besoin token #136 |
| src/components/admin/ProfileActionsCard.vue:114 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/admin/ProfileActionsCard.vue:116 | rgba(139, 92, 246, 0.2) | (à créer) | besoin token #136 |
| src/components/admin/ProfileActionsCard.vue:122 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/admin/ProfileInfoCard.vue:91 | rgba(139, 92, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/admin/ProfileInfoCard.vue:91 | rgba(124, 58, 237, 0.05) | (à créer) | besoin token #136 |
| src/components/admin/ProfileInfoCard.vue:97 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/admin/ProfileInfoCard.vue:125 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/admin/ProfileInfoCard.vue:125 | #7c3aed | (à créer) | besoin token #136 |
| src/components/admin/ProfileInfoCard.vue:129 | rgba(139, 92, 246, 0.3) | (à créer) | besoin token #136 |
| src/components/admin/ProfileInfoCard.vue:180 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/admin/ProfilePermissionsCard.vue:47 | rgba(139, 92, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/admin/ProfilePermissionsCard.vue:47 | rgba(124, 58, 237, 0.05) | (à créer) | besoin token #136 |
| src/components/admin/ProfilePermissionsCard.vue:53 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/admin/ProfilePermissionsCard.vue:76 | rgba(139, 92, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/admin/ProfilePermissionsCard.vue:76 | rgba(124, 58, 237, 0.05) | (à créer) | besoin token #136 |
| src/components/admin/ProfilePermissionsCard.vue:77 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/admin/ProfilePermissionsCard.vue:81 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/admin/ProfileStatsCard.vue:80 | rgba(139, 92, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/admin/ProfileStatsCard.vue:80 | rgba(124, 58, 237, 0.05) | (à créer) | besoin token #136 |
| src/components/admin/ProfileStatsCard.vue:86 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/admin/ProfileStatsCard.vue:120 | rgba(0, 0, 0, 0.1) | --shadow-md/--card-shadow | remplaçable |
| src/components/admin/SeancesFilters.vue:113 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/admin/SeancesList.vue:195 | #dcfce7 | --success-bg | remplaçable |
| src/components/admin/SeancesList.vue:196 | #166534 | --success-text | remplaçable |
| src/components/admin/SeancesList.vue:200 | #dbeafe | --blue-100/--info-bg | remplaçable |
| src/components/admin/SeancesList.vue:201 | #1e40af | --info-text | remplaçable |
| src/components/admin/SeancesList.vue:205 | #f3f4f6 | (à créer) | besoin token #136 |
| src/components/admin/SeancesList.vue:206 | #6b7280 | (à créer) | besoin token #136 |
| src/components/admin/SettingsNotifications.vue:139 | #ccc | (à créer) | besoin token #136 |
| src/components/admin/SettingsNotifications.vue:157 | #3b82f6 | --blue-500 | remplaçable |
| src/components/admin/SettingsPasswordModal.vue:94 | #3B82F6 | --blue-500 | remplaçable |
| src/components/admin/SettingsPasswordModal.vue:112 | #3b82f6 | --blue-500 | remplaçable |
| src/components/admin/SettingsPasswordModal.vue:112 | #2563eb | (à créer) | besoin token #136 |
| src/components/admin/SettingsPasswordModal.vue:117 | #2563eb | (à créer) | besoin token #136 |
| src/components/admin/SettingsPasswordModal.vue:117 | #1d4ed8 | (à créer) | besoin token #136 |
| src/components/admin/SettingsPermissions.vue:78 | #f0f9ff | (à créer) | besoin token #136 |
| src/components/admin/SettingsPermissions.vue:78 | #e0f2fe | (à créer) | besoin token #136 |
| src/components/admin/SettingsPermissions.vue:79 | #0369a1 | (à créer) | besoin token #136 |
| src/components/admin/SettingsPermissions.vue:83 | #bae6fd | (à créer) | besoin token #136 |
| src/components/admin/SettingsPermissions.vue:88 | #e0f2fe | (à créer) | besoin token #136 |
| src/components/admin/SettingsPermissions.vue:88 | #bae6fd | (à créer) | besoin token #136 |
| src/components/admin/SettingsPermissions.vue:90 | rgba(3, 105, 161, 0.1) | (à créer) | besoin token #136 |
| src/components/admin/SettingsPermissions.vue:98 | #0c4a6e | (à créer) | besoin token #136 |
| src/components/admin/SettingsPermissions.vue:99 | #7dd3fc | (à créer) | besoin token #136 |
| src/components/admin/SettingsPermissions.vue:100 | #0c4a6e | (à créer) | besoin token #136 |
| src/components/admin/SettingsPermissions.vue:104 | #075985 | (à créer) | besoin token #136 |
| src/components/admin/SettingsPermissions.vue:104 | #0369a1 | (à créer) | besoin token #136 |
| src/components/admin/SettingsPermissions.vue:105 | rgba(125, 211, 252, 0.1) | (à créer) | besoin token #136 |
| src/components/admin/SettingsSession.vue:78 | #ef4444 | (à créer) | besoin token #136 |
| src/components/admin/SettingsSession.vue:78 | #dc2626 | (à créer) | besoin token #136 |
| src/components/admin/SettingsSession.vue:83 | #dc2626 | (à créer) | besoin token #136 |
| src/components/admin/SettingsSession.vue:83 | #b91c1c | (à créer) | besoin token #136 |
| src/components/admin/StatsMainGrid.vue:132 | #3b82f6 | --blue-500 | remplaçable |
| src/components/admin/StatsMainGrid.vue:136 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/admin/StatsMainGrid.vue:140 | #10b981 | (à créer) | besoin token #136 |
| src/components/admin/StatsMainGrid.vue:144 | #f59e0b | (à créer) | besoin token #136 |
| src/components/admin/UserDetailModal.vue:93 | rgba(0, 0, 0, 0.6) | (à créer) | besoin token #136 |
| src/components/admin/VisioFilters.vue:103 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/admin/VisioGrid.vue:162 | #dcfce7 | --success-bg | remplaçable |
| src/components/admin/VisioGrid.vue:163 | #166534 | --success-text | remplaçable |
| src/components/admin/VisioGrid.vue:167 | #dbeafe | --blue-100/--info-bg | remplaçable |
| src/components/admin/VisioGrid.vue:168 | #1e40af | --info-text | remplaçable |
| src/components/admin/VisioGrid.vue:172 | #f3f4f6 | (à créer) | besoin token #136 |
| src/components/admin/VisioGrid.vue:173 | #6b7280 | (à créer) | besoin token #136 |
| src/components/admin/VisioStatsCards.vue:91 | #dcfce7 | --success-bg | remplaçable |
| src/components/admin/VisioStatsCards.vue:95 | #dbeafe | --blue-100/--info-bg | remplaçable |
| src/components/admin/VisioStatsCards.vue:99 | #f3f4f6 | (à créer) | besoin token #136 |
| src/components/admin/VisioStatsCards.vue:103 | #fef3c7 | --warning-bg | remplaçable |
| src/components/admin/VisioStatsCards.vue:112 | #166534 | --success-text | remplaçable |
| src/components/admin/VisioStatsCards.vue:116 | #1e40af | --info-text | remplaçable |
| src/components/admin/VisioStatsCards.vue:120 | #6b7280 | (à créer) | besoin token #136 |
| src/components/admin/VisioStatsCards.vue:124 | #b45309 | (à créer) | besoin token #136 |

> Note admin/ : ignorés (fallback `var(--…, #hex)` ou non-CSS) : HubCard.vue:59/63/143, InstitutionFormModal.vue:92 (`placeholder=`), InstitutionsTable.vue:20, MatieresTable.vue:16, NiveauDetailModal.vue:48 (`:style` dynamiques).

### attendance/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/attendance/AttendanceDetailModal.vue:78 | rgba(0, 0, 0, 0.6) | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceDetailModal.vue:90 | rgba(0, 0, 0, 0.3) | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceDetailModal.vue:120 | #3b82f6 | --blue-500 | remplaçable |
| src/components/attendance/AttendanceDetailModal.vue:156 | #EF4444 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceDetailModal.vue:172 | #2563eb | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceHistoryFilters.vue:77 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/attendance/AttendanceHistoryFilters.vue:119 | #3b82f6 | --blue-500 | remplaçable |
| src/components/attendance/AttendanceHistoryFilters.vue:120 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceHistoryFilters.vue:131 | #ef4444 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceHistoryFilters.vue:142 | #dc2626 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceHistoryPagination.vue:51 | #3b82f6 | --blue-500 | remplaçable |
| src/components/attendance/AttendanceHistoryPagination.vue:62 | #2563eb | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceHistoryPagination.vue:66 | #d1d5db | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceHistoryRows.vue:164 | #3b82f6 | --blue-500 | remplaçable |
| src/components/attendance/AttendanceHistoryRows.vue:176 | #e0e7ff | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceHistoryRows.vue:177 | #3730a3 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceHistoryRows.vue:192 | #d1fae5 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceHistoryRows.vue:193 | #065f46 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceHistoryRows.vue:197 | #fee2e2 | --error-bg | remplaçable |
| src/components/attendance/AttendanceHistoryRows.vue:198 | #991b1b | --error-text | remplaçable |
| src/components/attendance/AttendanceHistoryRows.vue:207 | #10b981 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceHistoryStats.vue:63 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/attendance/AttendanceHistoryStats.vue:67 | #3b82f6 | --blue-500 | remplaçable |
| src/components/attendance/AttendanceHistoryStats.vue:68 | #10b981 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceHistoryStats.vue:69 | #f59e0b | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceHistoryStats.vue:70 | #ef4444 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceHistoryStats.vue:71 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceHistoryTable.vue:55 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/attendance/AttendanceHistoryTable.vue:76 | #10b981 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceHistoryTable.vue:87 | #059669 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalFooter.vue:53 | #dc2626 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalFooter.vue:53 | #b91c1c | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalFooter.vue:61 | rgba(220, 38, 38, 0.3) | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalFooter.vue:65 | #b91c1c | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalFooter.vue:65 | #991b1b | --error-text | remplaçable |
| src/components/attendance/AttendanceModalFooter.vue:67 | rgba(220, 38, 38, 0.4) | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalFooter.vue:81 | #10b981 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalFooter.vue:81 | #059669 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalFooter.vue:89 | rgba(16, 185, 129, 0.3) | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalFooter.vue:93 | #059669 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalFooter.vue:93 | #047857 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalFooter.vue:95 | rgba(16, 185, 129, 0.4) | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalTable.vue:100 | #DBEAFE | --info-bg | remplaçable |
| src/components/attendance/AttendanceModalTable.vue:101 | #93C5FD | --info-border | remplaçable |
| src/components/attendance/AttendanceModalTable.vue:102 | #1E40AF | --info-text | remplaçable |
| src/components/attendance/AttendanceModalTable.vue:181 | #D1FAE5 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalTable.vue:182 | #065F46 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalTable.vue:187 | #FED7AA | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalTable.vue:188 | #92400E | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalTable.vue:193 | #FECACA | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalTable.vue:194 | #7F1D1D | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceModalTable.vue:199 | #FEE2E2 | --error-bg | remplaçable |
| src/components/attendance/AttendanceModalTable.vue:200 | #991B1B | --error-text | remplaçable |
| src/components/attendance/AttendanceModalTable.vue:205 | #DBEAFE | --info-bg | remplaçable |
| src/components/attendance/AttendanceModalTable.vue:206 | #1E40AF | --info-text | remplaçable |
| src/components/attendance/AttendanceParticipationModal.vue:90 | rgba(0, 0, 0, 0.5) | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceParticipationModal.vue:101 | rgba(0, 0, 0, 0.15) | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceParticipationModal.vue:175 | #10b981 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceParticipationModal.vue:179 | #ef4444 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceParticipationModal.vue:191 | #6b7280 | (à créer) | besoin token #136 |
| src/components/attendance/AttendanceParticipationModal.vue:202 | #4b5563 | (à créer) | besoin token #136 |
| src/components/attendance/SeancePeriodFilters.vue:77 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/attendance/SeancePeriodFilters.vue:107 | #e5e7eb | (à créer) | besoin token #136 |
| src/components/attendance/SeancePeriodFilters.vue:111 | #3b82f6 | (à créer) | besoin token #136 |
| src/components/attendance/SeancePeriodFilters.vue:111 | #2563eb | (à créer) | besoin token #136 |
| src/components/attendance/SeancePeriodFilters.vue:113 | #3b82f6 | --blue-500 | remplaçable |
| src/components/attendance/SeancePeriodFilters.vue:114 | rgba(59, 130, 246, 0.3) | (à créer) | besoin token #136 |
| src/components/attendance/SeancePeriodFilters.vue:161 | #3b82f6 | --blue-500 | remplaçable |
| src/components/attendance/SeancePeriodFilters.vue:162 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/attendance/SeancePeriodFilters.vue:167 | #3b82f6 | (à créer) | besoin token #136 |
| src/components/attendance/SeancePeriodFilters.vue:167 | #2563eb | (à créer) | besoin token #136 |
| src/components/attendance/SeancePeriodFilters.vue:175 | rgba(59, 130, 246, 0.3) | (à créer) | besoin token #136 |
| src/components/attendance/SeancePeriodFilters.vue:179 | #2563eb | (à créer) | besoin token #136 |
| src/components/attendance/SeancePeriodFilters.vue:179 | #1d4ed8 | (à créer) | besoin token #136 |
| src/components/attendance/SeancePeriodFilters.vue:181 | rgba(59, 130, 246, 0.4) | (à créer) | besoin token #136 |
| src/components/attendance/SeancePeriodFilters.vue:219 | #3b82f6 | --blue-500 | remplaçable |
| src/components/attendance/SeancePeriodFilters.vue:220 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/attendance/SeancesPagination.vue:62 | #3b82f6 | (à créer) | besoin token #136 |
| src/components/attendance/SeancesPagination.vue:62 | #2563eb | (à créer) | besoin token #136 |
| src/components/attendance/SeancesPagination.vue:64 | #3b82f6 | --blue-500 | remplaçable |
| src/components/attendance/SeancesPagination.vue:65 | rgba(59, 130, 246, 0.2) | (à créer) | besoin token #136 |
| src/components/attendance/SeancesTable.vue:110 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/attendance/SeancesTable.vue:209 | #10B981 | (à créer) | besoin token #136 |
| src/components/attendance/SeancesTable.vue:213 | #F59E0B | (à créer) | besoin token #136 |
| src/components/attendance/SeancesTable.vue:217 | #EF4444 | (à créer) | besoin token #136 |
| src/components/attendance/SeancesTable.vue:241 | #2563eb | (à créer) | besoin token #136 |
| src/components/attendance/SeancesTable.vue:247 | #ef4444 | (à créer) | besoin token #136 |
| src/components/attendance/SeancesTable.vue:258 | #dc2626 | (à créer) | besoin token #136 |

> Note attendance/ : ignorés (fallback `var(--…, #hex)`) : AttendanceModalTable.vue:144, AttendanceDetailModal.vue:161, SeancesTable.vue:144/230.

### calendar/

> Beaucoup de valeurs sont des définitions de variables SCSS (`$lms-blue`, etc.) dupliquées (blocs light + dark). Les `rgba($var, …)` sur variables SCSS sont classés « besoin token #136 » (pas un token CSS de themes.css). Occurrences en `var(--…, #fallback)` ignorées.

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/calendar/CalendarFilters.vue:110 | #2563eb | (à créer) | besoin token #136 |
| src/components/calendar/CalendarFilters.vue:111 | #3b82f6 | --blue-500 | remplaçable |
| src/components/calendar/CalendarFilters.vue:112 | #1e3a8a | (à créer) | besoin token #136 |
| src/components/calendar/CalendarFilters.vue:113 | #ffffff | --bg-primary | remplaçable |
| src/components/calendar/CalendarFilters.vue:114 | #1E293B | --text-primary | remplaçable |
| src/components/calendar/CalendarFilters.vue:115 | #64748B | --text-tertiary | remplaçable |
| src/components/calendar/CalendarFilters.vue:116 | #6B7280 | (à créer) | besoin token #136 |
| src/components/calendar/CalendarFilters.vue:117 | #F8FAFC | --bg-secondary | remplaçable |
| src/components/calendar/CalendarFilters.vue:118 | #E5E7EB | (à créer) | besoin token #136 |
| src/components/calendar/CalendarFilters.vue:119 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/calendar/CalendarFilters.vue:227 | rgba($lms-blue, 0.1) | (à créer) | besoin token #136 |
| src/components/calendar/CalendarLegend.vue:9 | #2563eb | (à créer) | besoin token #136 |
| src/components/calendar/CalendarLegend.vue:13 | #10b981 | (à créer) | besoin token #136 |
| src/components/calendar/CalendarLegend.vue:17 | #ea580c | (à créer) | besoin token #136 |
| src/components/calendar/CalendarLegend.vue:21 | #ef4444 | (à créer) | besoin token #136 |
| src/components/calendar/CalendarLegend.vue:38 | #2563eb | (à créer) | besoin token #136 |
| src/components/calendar/CalendarLegend.vue:39 | #ffffff | --bg-primary | remplaçable |
| src/components/calendar/CalendarLegend.vue:40 | #1E293B | --text-primary | remplaçable |
| src/components/calendar/CalendarLegend.vue:41 | #F9FAFB | (à créer) | besoin token #136 |
| src/components/calendar/CalendarLegend.vue:42 | #E5E7EB | (à créer) | besoin token #136 |
| src/components/calendar/CalendarLegend.vue:43 | #374151 | (à créer) | besoin token #136 |
| src/components/calendar/CalendarLegend.vue:44 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/calendar/CalendarLegend.vue:107 | #3b82f6 | --blue-500 | remplaçable |
| src/components/calendar/CalendarLegend.vue:108 | #ffffff | --bg-primary | remplaçable |
| src/components/calendar/CalendarNavigation.vue:53 | #2563eb | (à créer) | besoin token #136 |
| src/components/calendar/CalendarNavigation.vue:54 | #ffffff | --bg-primary | remplaçable |
| src/components/calendar/CalendarNavigation.vue:55 | #1E293B | --text-primary | remplaçable |
| src/components/calendar/CalendarNavigation.vue:56 | #6B7280 | (à créer) | besoin token #136 |
| src/components/calendar/CalendarNavigation.vue:57 | #F8FAFC | --bg-secondary | remplaçable |
| src/components/calendar/CalendarNavigation.vue:58 | #E5E7EB | (à créer) | besoin token #136 |
| src/components/calendar/CalendarNavigation.vue:59 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/calendar/CalendarNavigation.vue:157 | #10b981 | (à créer) | besoin token #136 |
| src/components/calendar/CalendarNavigation.vue:158 | #10b981 | (à créer) | besoin token #136 |
| src/components/calendar/CalendarNavigation.vue:167 | #10b981 | (à créer) | besoin token #136 |
| src/components/calendar/CalendarNavigation.vue:214 | #2563eb | (à créer) | besoin token #136 |
| src/components/calendar/CalendarNavigation.vue:215 | #3b82f6 | --blue-500 | remplaçable |
| src/components/calendar/CalendarNavigation.vue:216 | #ffffff | --bg-primary | remplaçable |
| src/components/calendar/CalendarNavigation.vue:222 | rgba($lms-blue-light, 0.5) | (à créer) | besoin token #136 |
| src/components/calendar/CalendarNavigation.vue:231 | rgba($lms-blue-light, 0.3) | (à créer) | besoin token #136 |
| src/components/calendar/CalendarNavigation.vue:252 | rgba($lms-blue-light, 0.2) | (à créer) | besoin token #136 |
| src/components/calendar/CalendarView.vue:41 | #2563eb | (à créer) | besoin token #136 |
| src/components/calendar/CalendarView.vue:42 | #3b82f6 | --blue-500 | remplaçable |
| src/components/calendar/CalendarView.vue:43 | #ffffff | --bg-primary | remplaçable |
| src/components/calendar/CalendarView.vue:44 | #1E293B | --text-primary | remplaçable |
| src/components/calendar/CalendarView.vue:45 | #64748B | --text-tertiary | remplaçable |
| src/components/calendar/CalendarView.vue:46 | #6B7280 | (à créer) | besoin token #136 |
| src/components/calendar/CalendarView.vue:47 | #E5E7EB | (à créer) | besoin token #136 |
| src/components/calendar/CalendarView.vue:48 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/calendar/CalendarView.vue:49 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/calendar/CalendarView.vue:123 | rgba($lms-blue, 0.2) | (à créer) | besoin token #136 |
| src/components/calendar/CalendarView.vue:129 | #0052cc | --blue-600 | remplaçable |
| src/components/calendar/CalendarView.vue:129 | #0747a6 | --blue-700 | remplaçable |
| src/components/calendar/CalendarView.vue:130 | #0747a6 | --blue-700 | remplaçable |
| src/components/calendar/CalendarView.vue:155 | rgba($lms-blue, 0.15) | (à créer) | besoin token #136 |
| src/components/calendar/CalendarView.vue:155 | rgba($lms-blue, 0.08) | (à créer) | besoin token #136 |
| src/components/calendar/CalendarView.vue:180 | #2563eb | (à créer) | besoin token #136 |
| src/components/calendar/CalendarView.vue:181 | #2563eb | (à créer) | besoin token #136 |
| src/components/calendar/CalendarView.vue:185 | #06b6d4 | (à créer) | besoin token #136 |
| src/components/calendar/CalendarView.vue:186 | #06b6d4 | (à créer) | besoin token #136 |
| src/components/calendar/CalendarView.vue:190 | #ef4444 | (à créer) | besoin token #136 |
| src/components/calendar/CalendarView.vue:191 | #ef4444 | (à créer) | besoin token #136 |
| src/components/calendar/CalendarViewSelector.vue:46 | #2563eb | (à créer) | besoin token #136 |
| src/components/calendar/CalendarViewSelector.vue:47 | #1e3a8a | (à créer) | besoin token #136 |
| src/components/calendar/CalendarViewSelector.vue:48 | #ffffff | --bg-primary | remplaçable |
| src/components/calendar/CalendarViewSelector.vue:49 | #6B7280 | (à créer) | besoin token #136 |
| src/components/calendar/CalendarViewSelector.vue:50 | #F9FAFB | (à créer) | besoin token #136 |
| src/components/calendar/CalendarViewSelector.vue:51 | #E2E8F0 | --border-primary | remplaçable |
| src/components/calendar/CalendarViewSelector.vue:52 | #E5E7EB | (à créer) | besoin token #136 |
| src/components/calendar/CalendarViewSelector.vue:53 | #374151 | (à créer) | besoin token #136 |
| src/components/calendar/CalendarViewSelector.vue:89 | rgba($lms-blue-dark, 0.2) | (à créer) | besoin token #136 |
| src/components/calendar/CalendarViewSelector.vue:108 | #2563eb | (à créer) | besoin token #136 |
| src/components/calendar/CalendarViewSelector.vue:109 | #3b82f6 | --blue-500 | remplaçable |
| src/components/calendar/CalendarViewSelector.vue:110 | #ffffff | --bg-primary | remplaçable |
| src/components/calendar/CalendarViewSelector.vue:119 | rgba($white, 0.7) | (à créer) | besoin token #136 |
| src/components/calendar/CalendarViewSelector.vue:122 | rgba($lms-blue-light, 0.3) | (à créer) | besoin token #136 |
| src/components/calendar/EventDetailActions.vue:168 | #10b981 | (à créer) | besoin token #136 |
| src/components/calendar/EventDetailActions.vue:173 | #059669 | (à créer) | besoin token #136 |
| src/components/calendar/EventDetailActions.vue:177 | #ef4444 | (à créer) | besoin token #136 |
| src/components/calendar/EventDetailActions.vue:182 | #dc2626 | (à créer) | besoin token #136 |
| src/components/calendar/EventDetailActions.vue:213 | #fef3c7 | --warning-bg | remplaçable |
| src/components/calendar/EventDetailActions.vue:214 | #92400e | (à créer) | besoin token #136 |
| src/components/calendar/EventDetailModal.vue:105 | rgba(0, 0, 0, 0.5) | (à créer) | besoin token #136 |
| src/components/calendar/EventDetailModal.vue:116 | rgba(0, 0, 0, 0.2) | (à créer) | besoin token #136 |
| src/components/calendar/EventDetailModal.vue:158 | #dcfce7 | --success-bg | remplaçable |
| src/components/calendar/EventDetailModal.vue:159 | #16a34a | (à créer) | besoin token #136 |
| src/components/calendar/EventDetailModal.vue:163 | #dbeafe | --info-bg | remplaçable |
| src/components/calendar/EventDetailModal.vue:164 | #2563eb | (à créer) | besoin token #136 |
| src/components/calendar/EventDetailModal.vue:168 | #f3f4f6 | (à créer) | besoin token #136 |
| src/components/calendar/EventDetailModal.vue:169 | #6b7280 | (à créer) | besoin token #136 |

> Note calendar/ : occurrences `var(--…, #fallback)` (EventDetailModal, EventDetailActions, EventSeanceDetails, EventEvaluationDetails) et lignes de commentaire (UniversalCalendar) ignorées. `rgba(0,0,0,0.1)` d'ombres → remplaçable `--shadow-*` ; overlays `rgba(0,0,0,0.5/0.2)` → besoin token #136.

### charts/

> ⚠️ Valeurs dans des options JS Chart.js (pas du CSS) : tokenisables seulement via `getComputedStyle`/var injectée. `rgba(255,255,255,0.1)` matche `--sidebar-border` mais le contexte (bordure de tooltip) rend ce token inapproprié → en pratique « besoin token #136 ».

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/charts/ActivityChart.vue:82 | rgba(0, 0, 0, 0.8) | (à créer) | besoin token #136 |
| src/components/charts/ActivityChart.vue:84 | rgba(255, 255, 255, 0.1) | (à créer / contexte tooltip) | besoin token #136 |
| src/components/charts/ActivityChart.vue:118 | rgba(0, 0, 0, 0.05) | (à créer) | besoin token #136 |

### classes/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/classes/ClasseDetailsHeader.vue:89 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/classes/ClasseDetailsHeader.vue:189 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/classes/ClasseTabsNav.vue:70 | #10b981 | (à créer) | besoin token #136 |
| src/components/classes/ClasseTabsNav.vue:71 | #10b981 | (à créer) | besoin token #136 |
| src/components/classes/ClasseTabsNav.vue:81 | #10b981 | (à créer) | besoin token #136 |

> Note classes/ : fallback `var(--color-primary, #10b981)` (ClasseDetailsHeader.vue:93) ignoré. (Les ombres `rgba(0,0,0,0.1)` sont classées remplaçable `--shadow-*`.)

### common/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/common/ContentLoader.vue:58 | #1B3B6F | (à créer) | besoin token #136 |
| src/components/common/ContentLoader.vue:59 | rgba(27, 59, 111, 0.3) | (à créer) | besoin token #136 |
| src/components/common/ContentLoader.vue:76 | rgba(0, 0, 0, 0.2) | (à créer) | besoin token #136 |
| src/components/common/ContentLoader.vue:85 | #1B3B6F | (à créer) | besoin token #136 |
| src/components/common/ContentLoader.vue:92 | #FFB81C | (à créer) | besoin token #136 |
| src/components/common/ContentLoader.vue:99 | #2D5A9E | (à créer) | besoin token #136 |
| src/components/common/ContentLoader.vue:147 | #475569 | --text-secondary | remplaçable |
| src/components/common/ContentLoader.vue:166 | #60a5fa | --blue-400 | remplaçable |
| src/components/common/ContentLoader.vue:167 | rgba(96, 165, 250, 0.5) | (à créer) | besoin token #136 |
| src/components/common/ContentLoader.vue:171 | #60a5fa | --blue-400 | remplaçable |
| src/components/common/ContentLoader.vue:175 | #fbbf24 | (à créer) | besoin token #136 |
| src/components/common/ContentLoader.vue:179 | #93c5fd | --blue-300 | remplaçable |
| src/components/common/ContentLoader.vue:183 | #cbd5e1 | --border-secondary | remplaçable |
| src/components/common/EditorBubbleMenu.vue:104 | rgba(0, 0, 0, 0.25) | (à créer) | besoin token #136 |
| src/components/common/EditorBubbleMenu.vue:104 | rgba(16, 185, 129, 0.3) | (à créer) | besoin token #136 |
| src/components/common/EditorTextGroup.vue:81 | #000000 | (à créer) | besoin token #136 |
| src/components/common/EditorTextGroup.vue:88 | #ffff00 | (à créer) | besoin token #136 |
| src/components/common/PageLoader.vue:37 | rgba(27, 59, 111, 0.97) | (à créer) | besoin token #136 |
| src/components/common/PageLoader.vue:37 | rgba(13, 37, 73, 0.98) | (à créer) | besoin token #136 |
| src/components/common/PageLoader.vue:66 | #ffffff | --bg-primary | remplaçable |
| src/components/common/PageLoader.vue:67 | rgba(255, 255, 255, 0.4) | (à créer) | besoin token #136 |
| src/components/common/PageLoader.vue:74 | rgba(255, 255, 255, 0.4) | (à créer) | besoin token #136 |
| src/components/common/PageLoader.vue:78 | rgba(255, 255, 255, 0.6) | (à créer) | besoin token #136 |
| src/components/common/PageLoader.vue:96 | rgba(0, 0, 0, 0.3) | (à créer) | besoin token #136 |
| src/components/common/PageLoader.vue:104 | #93c5fd | --blue-300 | remplaçable |
| src/components/common/PageLoader.vue:111 | #fbbf24 | (à créer) | besoin token #136 |
| src/components/common/PageLoader.vue:118 | #60a5fa | --blue-400 | remplaçable |
| src/components/common/PageLoader.vue:164 | rgba(255, 255, 255, 0.9) | (à créer) | besoin token #136 |
| src/components/common/TipTapEditor.vue:91 | rgba(16, 185, 129, 0.2) | (à créer) | besoin token #136 |
| src/components/common/TipTapEditor.vue:126 | rgba(0, 0, 0, 0.02) | (à créer) | besoin token #136 |
| src/components/common/TipTapEditor.vue:134 | rgba(255, 255, 255, 0.03) | (à créer) | besoin token #136 |
| src/components/common/TipTapEditor.vue:139 | rgba(255, 255, 255, 0.03) | (à créer) | besoin token #136 |

> Note common/ : fallbacks `var(--color-primary, #10b981)` (EditorBubbleMenu.vue:102/144/146/167) ignorés.

### dashboard/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/dashboard/DashboardActivityChart.vue:27 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/dashboard/DashboardClasses.vue:62 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/dashboard/DashboardClasses.vue:95 | rgba(0, 0, 0, 0.05) | --shadow-sm | remplaçable |
| src/components/dashboard/DashboardClasses.vue:100 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/dashboard/DashboardClasses.vue:119 | #e0e7ff | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardClasses.vue:120 | #5b21b6 | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardClasses.vue:151 | #dcfce7 | --success-bg | remplaçable |
| src/components/dashboard/DashboardClasses.vue:152 | #166534 | --success-text | remplaçable |
| src/components/dashboard/DashboardInfoBanner.vue:26 | #dbeafe | --info-bg | remplaçable |
| src/components/dashboard/DashboardInfoBanner.vue:33 | #1e40af | --info-text | remplaçable |
| src/components/dashboard/DashboardInfoBanner.vue:38 | #1e3a8a | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardMatieres.vue:46 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/dashboard/DashboardMatieres.vue:79 | rgba(0, 0, 0, 0.05) | --shadow-sm | remplaçable |
| src/components/dashboard/DashboardMatieres.vue:84 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/dashboard/DashboardPendingTasks.vue:74 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/dashboard/DashboardPendingTasks.vue:111 | #d1d5db | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardPendingTasks.vue:117 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/dashboard/DashboardPendingTasks.vue:121 | #ef4444 | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardPendingTasks.vue:122 | #fef2f2 | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardPendingTasks.vue:122 | #fee2e2 | --error-bg | remplaçable |
| src/components/dashboard/DashboardPendingTasks.vue:134 | rgba(0, 0, 0, 0.05) | --shadow-sm | remplaçable |
| src/components/dashboard/DashboardPendingTasks.vue:156 | #dc2626 | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardQuickActions.vue:66 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/dashboard/DashboardRecentUsers.vue:58 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/dashboard/DashboardRecentUsers.vue:102 | #3b82f6 | --blue-500 | remplaçable |
| src/components/dashboard/DashboardRecentUsers.vue:109 | #2563eb | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardRecentUsers.vue:141 | #3b82f6 | --blue-500 | remplaçable |
| src/components/dashboard/DashboardRecentUsers.vue:141 | #2563eb | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardRecentUsers.vue:187 | #dbeafe | --info-bg/--blue-100 | remplaçable |
| src/components/dashboard/DashboardRecentUsers.vue:188 | #1e40af | --info-text | remplaçable |
| src/components/dashboard/DashboardRecentUsers.vue:192 | #d1fae5 | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardRecentUsers.vue:193 | #065f46 | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardRecentUsers.vue:197 | #fef3c7 | --warning-bg | remplaçable |
| src/components/dashboard/DashboardRecentUsers.vue:198 | #92400e | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardRecentUsers.vue:202 | #fecaca | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardRecentUsers.vue:203 | #991b1b | --error-text | remplaçable |
| src/components/dashboard/DashboardRecentUsers.vue:207 | #e5e7eb | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardRecentUsers.vue:208 | #374151 | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardRoleActions.vue:62 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/dashboard/DashboardRoleActions.vue:71 | rgba(0, 0, 0, 0.15) | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardRoleActions.vue:75 | #f59e0b | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardStatsCards.vue:65 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/dashboard/DashboardStatsCards.vue:70 | #3b82f6 | --blue-500 | remplaçable |
| src/components/dashboard/DashboardStatsCards.vue:74 | #10b981 | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardStatsCards.vue:78 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardStatsCards.vue:82 | #f59e0b | (à créer) | besoin token #136 |
| src/components/dashboard/DashboardSystemWidgets.vue:67 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |

### evaluations/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/evaluations/EvalResultCountdown.vue:61 | #f59e0b | (à créer) | besoin token #136 |
| src/components/evaluations/EvalResultCountdown.vue:69 | #f59e0b | (à créer) | besoin token #136 |
| src/components/evaluations/EvalResultCountdown.vue:85 | #fbbf24 | (à créer) | besoin token #136 |
| src/components/evaluations/EvalResultCountdown.vue:91 | #f59e0b | (à créer) | besoin token #136 |
| src/components/evaluations/EvalResultCountdown.vue:96 | #d97706 | (à créer) | besoin token #136 |
| src/components/evaluations/EvalResultCountdown.vue:116 | #f59e0b | (à créer) | besoin token #136 |
| src/components/evaluations/EvalResultCountdown.vue:124 | #d97706 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:121 | #3b82f6 | --blue-500 | remplaçable |
| src/components/evaluations/EvaluationCardActions.vue:121 | #2563eb | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:123 | rgba(59, 130, 246, 0.3) | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:127 | #2563eb | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:127 | #1d4ed8 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:129 | rgba(59, 130, 246, 0.4) | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:133 | #f59e0b | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:138 | #d97706 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:142 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:147 | #7c3aed | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:151 | #22c55e | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:156 | #16a34a | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:160 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:165 | #7c3aed | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:169 | #6366f1 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:174 | #4f46e5 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:178 | #ef4444 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardActions.vue:183 | #dc2626 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardHeader.vue:99 | rgba(0, 0, 0, 0.1) | --shadow-md/--card-shadow | remplaçable |
| src/components/evaluations/EvaluationCardHeader.vue:103 | #dbeafe | --blue-100/--info-bg | remplaçable |
| src/components/evaluations/EvaluationCardHeader.vue:104 | #1e40af | --info-text | remplaçable |
| src/components/evaluations/EvaluationCardHeader.vue:105 | #bfdbfe | --blue-200 | remplaçable |
| src/components/evaluations/EvaluationCardHeader.vue:109 | #dcfce7 | --success-bg | remplaçable |
| src/components/evaluations/EvaluationCardHeader.vue:110 | #166534 | --success-text | remplaçable |
| src/components/evaluations/EvaluationCardHeader.vue:111 | #86efac | --success-border | remplaçable |
| src/components/evaluations/EvaluationCardHeader.vue:117 | rgba(34, 197, 94, 0.4) | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardHeader.vue:120 | rgba(34, 197, 94, 0) | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardHeader.vue:125 | #f3f4f6 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardHeader.vue:126 | #4b5563 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardHeader.vue:127 | #e5e7eb | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardHeader.vue:131 | #fef3c7 | --warning-bg | remplaçable |
| src/components/evaluations/EvaluationCardHeader.vue:132 | #92400e | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardHeader.vue:133 | #fde68a | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardHeader.vue:150 | #d1fae5 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardHeader.vue:151 | #065f46 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardHeader.vue:152 | #6ee7b7 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardHeader.vue:159 | rgba(16, 185, 129, 0.2) | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardStatus.vue:86 | #f59e0b | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardStatus.vue:87 | rgba(245, 158, 11, 0.05) | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardStatus.vue:91 | #f59e0b | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardStatus.vue:95 | #d97706 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardStatus.vue:103 | #10b981 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardStatus.vue:104 | rgba(16, 185, 129, 0.05) | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardStatus.vue:108 | #059669 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardStatus.vue:116 | #6b7280 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardStatus.vue:117 | rgba(107, 114, 128, 0.05) | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardStatus.vue:121 | #6b7280 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardStatus.vue:125 | #4b5563 | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardStatus.vue:141 | #22c55e | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardStatus.vue:173 | #eff6ff | --blue-50 | remplaçable |
| src/components/evaluations/EvaluationCardStatus.vue:174 | #bfdbfe | --blue-200 | remplaçable |
| src/components/evaluations/EvaluationCardStatus.vue:182 | #2563eb | (à créer) | besoin token #136 |
| src/components/evaluations/EvaluationCardStatus.vue:193 | #1e40af | --info-text | remplaçable |
| src/components/evaluations/EvaluationCardStatus.vue:208 | #1e40af | --info-text | remplaçable |
| src/components/evaluations/PreviewActionsFooter.vue:127 | #22c55e | (à créer) | besoin token #136 |
| src/components/evaluations/PreviewActionsFooter.vue:137 | #16a34a | (à créer) | besoin token #136 |
| src/components/evaluations/PreviewProgress.vue:54 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/evaluations/PreviewProgress.vue:54 | #6366f1 | (à créer) | besoin token #136 |
| src/components/evaluations/PreviewQuestionsList.vue:120 | rgba(139, 92, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/evaluations/PreviewQuestionsList.vue:121 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/evaluations/PreviewQuestionsList.vue:128 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/evaluations/PreviewQuestionsList.vue:161 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/evaluations/PreviewQuestionsList.vue:162 | rgba(139, 92, 246, 0.05) | (à créer) | besoin token #136 |
| src/components/evaluations/PreviewQuestionsList.vue:166 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/evaluations/PreviewQuestionsList.vue:167 | rgba(139, 92, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/evaluations/PreviewQuestionsList.vue:183 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/evaluations/PreviewQuestionsList.vue:184 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/evaluations/PreviewQuestionsList.vue:213 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/evaluations/ResultChoiceOptions.vue:168 | #60a5fa | --blue-400 | remplaçable |
| src/components/evaluations/ResultChoiceOptions.vue:180 | rgba(34, 197, 94, 0.15) | (à créer) | besoin token #136 |
| src/components/evaluations/ResultChoiceOptions.vue:181 | #22c55e | (à créer) | besoin token #136 |
| src/components/evaluations/ResultChoiceOptions.vue:186 | rgba(239, 68, 68, 0.15) | (à créer) | besoin token #136 |
| src/components/evaluations/ResultChoiceOptions.vue:187 | #ef4444 | (à créer) | besoin token #136 |
| src/components/evaluations/ResultChoiceOptions.vue:207 | #60a5fa | --blue-400 | remplaçable |
| src/components/evaluations/ResultChoiceOptions.vue:217 | #22c55e | (à créer) | besoin token #136 |
| src/components/evaluations/ResultChoiceOptions.vue:222 | #ef4444 | (à créer) | besoin token #136 |
| src/components/evaluations/TakeEvaluationActions.vue:71 | #2563eb | (à créer) | besoin token #136 |
| src/components/evaluations/TakeEvaluationActions.vue:82 | #2563eb | (à créer) | besoin token #136 |
| src/components/evaluations/TakeEvaluationActions.vue:82 | #1d4ed8 | (à créer) | besoin token #136 |
| src/components/evaluations/TakeEvaluationHeader.vue:96 | #f59e0b | (à créer) | besoin token #136 |
| src/components/evaluations/TakeEvaluationHeader.vue:100 | #ef4444 | (à créer) | besoin token #136 |
| src/components/evaluations/TakeEvaluationHeader.vue:136 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/evaluations/TakeEvaluationBanners.vue:54 | #f3e8ff | (à créer) | besoin token #136 |
| src/components/evaluations/TakeEvaluationBanners.vue:54 | #ede9fe | (à créer) | besoin token #136 |
| src/components/evaluations/TakeEvaluationBanners.vue:55 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/evaluations/TakeEvaluationBanners.vue:58 | #5b21b6 | (à créer) | besoin token #136 |
| src/components/evaluations/TakeEvaluationBanners.vue:84 | #fee2e2 | --error-bg | remplaçable |
| src/components/evaluations/TakeEvaluationBanners.vue:85 | #ef4444 | (à créer) | besoin token #136 |
| src/components/evaluations/TakeEvaluationBanners.vue:89 | #991b1b | --error-text | remplaçable |
| src/components/evaluations/TakeResultModals.vue:94 | #2563eb | (à créer) | besoin token #136 |
| src/components/evaluations/TakeResultModals.vue:105 | #2563eb | (à créer) | besoin token #136 |
| src/components/evaluations/TakeResultModals.vue:105 | #1d4ed8 | (à créer) | besoin token #136 |
| src/components/evaluations/TakeResultModals.vue:120 | #8b5cf6 | (à créer) | besoin token #136 |
| src/components/evaluations/TakeResultModals.vue:121 | #f5f3ff | (à créer) | besoin token #136 |
| src/components/evaluations/TakeResultModals.vue:126 | #7c3aed | (à créer) | besoin token #136 |
| src/components/evaluations/TakeResultModals.vue:135 | rgba(0, 0, 0, 0.5) | (à créer) | besoin token #136 |
| src/components/evaluations/TakeResultModals.vue:146 | rgba(0, 0, 0, 0.3) | (à créer) | besoin token #136 |
| src/components/evaluations/TakeResultModals.vue:174 | #fef3c7 | --warning-bg | remplaçable |
| src/components/evaluations/TakeResultModals.vue:175 | #92400e | (à créer) | besoin token #136 |
| src/components/evaluations/TakeResultModals.vue:200 | #22c55e | (à créer) | besoin token #136 |
| src/components/evaluations/TeacherEvalCreateModal.vue:114 | rgba(0, 0, 0, 0.5) | (à créer) | besoin token #136 |
| src/components/evaluations/TeacherEvalCreateModal.vue:125 | rgba(0, 0, 0, 0.1) | --shadow-md/--card-shadow | remplaçable |
| src/components/evaluations/TeacherEvalCreateModal.vue:125 | rgba(0, 0, 0, 0.04) | --shadow-sm | remplaçable |
| src/components/evaluations/TeacherEvalCreateModal.vue:171 | #eff6ff | --blue-50 | remplaçable |
| src/components/evaluations/TeacherEvalCreateModal.vue:172 | #bfdbfe | --blue-200 | remplaçable |
| src/components/evaluations/TeacherEvalCreateModal.vue:180 | #1e40af | --info-text | remplaçable |
| src/components/evaluations/TeacherEvalCreateModal.vue:204 | #dc2626 | (à créer) | besoin token #136 |
| src/components/evaluations/TeacherEvalCreateModal.vue:225 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/evaluations/TeacherEvalCreateModal.vue:266 | #3b82f6 | --blue-500 | remplaçable |
| src/components/evaluations/TeacherEvalCreateModal.vue:271 | #2563eb | (à créer) | besoin token #136 |
| src/components/evaluations/TeacherEvalFilters.vue:137 | rgba(245, 158, 11, 0.08) | (à créer) | besoin token #136 |
| src/components/evaluations/TeacherEvalFilters.vue:138 | rgba(245, 158, 11, 0.2) | (à créer) | besoin token #136 |
| src/components/evaluations/TeacherEvalFilters.vue:212 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/evaluations/TakeQuestionCard.vue:114 | #22c55e | (à créer) | besoin token #136 |
| src/components/evaluations/TakeQuestionCard.vue:145 | #22c55e | (à créer) | besoin token #136 |
| src/components/evaluations/TakeQuestionCard.vue:181 | rgba(59, 130, 246, 0.08) | (à créer) | besoin token #136 |
| src/components/evaluations/TakeQuestionCard.vue:213 | rgba(59, 130, 246, 0.15) | (à créer) | besoin token #136 |

> Note evaluations/ : nombreux fallbacks `var(--…, #hex)` ignorés (TakeEvaluationActions/Header/Banners, TakeResultModals, TakeQuestionCard) ; seuls les littéraux hors `var()` sont inventoriés.

### forum/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/forum/ForumPostList.vue:91 | #ffffff | --card-bg/--bg-primary | remplaçable |
| src/components/forum/ForumPostList.vue:95 | #1f2937 | (à créer) | besoin token #136 |
| src/components/forum/ForumPostList.vue:100 | #2d3748 | (à créer) | besoin token #136 |
| src/components/forum/ForumPostList.vue:106 | #f9fafb | (à créer) | besoin token #136 |
| src/components/forum/ForumPostList.vue:110 | #2d3748 | (à créer) | besoin token #136 |
| src/components/forum/ForumPostList.vue:116 | #1f2937 | (à créer) | besoin token #136 |
| src/components/forum/ForumPostList.vue:120 | #ffffff | --bg-primary/--btn-primary-text | remplaçable |
| src/components/forum/ForumPostList.vue:125 | #374151 | (à créer) | besoin token #136 |
| src/components/forum/ForumPostList.vue:129 | #e5e7eb | (à créer) | besoin token #136 |
| src/components/forum/ForumPostList.vue:135 | #1f2937 | (à créer) | besoin token #136 |
| src/components/forum/ForumPostList.vue:140 | #4b5563 | (à créer) | besoin token #136 |
| src/components/forum/ForumPostList.vue:145 | #6b7280 | (à créer) | besoin token #136 |
| src/components/forum/ForumPostList.vue:150 | #9ca3af | (à créer) | besoin token #136 |
| src/components/forum/ForumReplyForm.vue:63 | #ffffff | --card-bg/--bg-primary | remplaçable |
| src/components/forum/ForumReplyForm.vue:67 | #1f2937 | (à créer) | besoin token #136 |
| src/components/forum/ForumReplyForm.vue:73 | #ffffff | --input-bg/--bg-primary | remplaçable |
| src/components/forum/ForumReplyForm.vue:74 | #1f2937 | (à créer) | besoin token #136 |
| src/components/forum/ForumReplyForm.vue:78 | #374151 | (à créer) | besoin token #136 |
| src/components/forum/ForumReplyForm.vue:79 | #f3f4f6 | (à créer) | besoin token #136 |
| src/components/forum/ForumReplyForm.vue:84 | #9ca3af | (à créer) | besoin token #136 |
| src/components/forum/ForumReplyForm.vue:89 | #9ca3af | (à créer) | besoin token #136 |
| src/components/forum/ForumReplyForm.vue:113 | #1f2937 | (à créer) | besoin token #136 |
| src/components/forum/ForumReplyForm.vue:117 | #ffffff | --bg-primary/--btn-primary-text | remplaçable |
| src/components/forum/ForumReplyForm.vue:122 | #374151 | (à créer) | besoin token #136 |
| src/components/forum/ForumReplyForm.vue:126 | #e5e7eb | (à créer) | besoin token #136 |
| src/components/forum/ForumReplyForm.vue:132 | #1f2937 | (à créer) | besoin token #136 |
| src/components/forum/ForumReplyForm.vue:137 | #4b5563 | (à créer) | besoin token #136 |
| src/components/forum/ForumReplyForm.vue:142 | #6b7280 | (à créer) | besoin token #136 |
| src/components/forum/ForumReplyForm.vue:147 | #9ca3af | (à créer) | besoin token #136 |
| src/components/forum/ForumTopicHeader.vue:63 | #ffffff | --card-bg/--bg-primary | remplaçable |
| src/components/forum/ForumTopicHeader.vue:67 | #1f2937 | (à créer) | besoin token #136 |
| src/components/forum/ForumTopicHeader.vue:73 | #1f2937 | (à créer) | besoin token #136 |
| src/components/forum/ForumTopicHeader.vue:77 | #ffffff | --bg-primary | remplaçable |
| src/components/forum/ForumTopicHeader.vue:82 | #374151 | (à créer) | besoin token #136 |
| src/components/forum/ForumTopicHeader.vue:86 | #e5e7eb | (à créer) | besoin token #136 |
| src/components/forum/ForumTopicHeader.vue:92 | #1f2937 | (à créer) | besoin token #136 |
| src/components/forum/ForumTopicHeader.vue:97 | #4b5563 | (à créer) | besoin token #136 |
| src/components/forum/ForumTopicHeader.vue:102 | #6b7280 | (à créer) | besoin token #136 |
| src/components/forum/ForumTopicHeader.vue:107 | #9ca3af | (à créer) | besoin token #136 |

### layout/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/layout/BottomNavigation.vue:57 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/layout/BottomNavigation.vue:129 | rgba(0, 0, 0, 0.3) | (à créer) | besoin token #136 |
| src/components/layout/MobileHeader.vue:89 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/layout/MobileHeader.vue:164 | #ef4444 | (à créer) | besoin token #136 |
| src/components/layout/MobileHeader.vue:191 | rgba(0, 0, 0, 0.3) | (à créer) | besoin token #136 |
| src/components/layout/MobileHeader.vue:198 | rgba(0, 0, 0, 0.3) | (à créer) | besoin token #136 |
| src/components/layout/MobileSidebar.vue:78 | rgba(0, 0, 0, 0.5) | (à créer) | besoin token #136 |
| src/components/layout/MobileSidebar.vue:93 | rgba(0, 0, 0, 0.15) | (à créer) | besoin token #136 |
| src/components/layout/MobileSidebar.vue:186 | rgba(0, 0, 0, 0.3) | (à créer) | besoin token #136 |
| src/components/layout/mobile/MobileNotificationsPanel.vue:38 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/layout/mobile/MobileNotificationsPanel.vue:108 | rgba(0, 0, 0, 0.5) | (à créer) | besoin token #136 |
| src/components/layout/mobile/MobileSidebarNav.vue:140 | #ef4444 | (à créer) | besoin token #136 |
| src/components/layout/mobile/MobileUserMenuPanel.vue:60 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/layout/mobile/MobileUserMenuPanel.vue:161 | #ef4444 | (à créer) | besoin token #136 |
| src/components/layout/mobile/MobileUserMenuPanel.vue:187 | rgba(0, 0, 0, 0.5) | (à créer) | besoin token #136 |
| src/components/layout/navbar/NavbarNotifications.vue:105 | #ef4444 | (à créer) | besoin token #136 |
| src/components/layout/navbar/NavbarNotifications.vue:214 | rgba(59, 130, 246, 0.05) | (à créer) | besoin token #136 |
| src/components/layout/sidebar/SidebarHeader.vue:69 | #1E6FD9 | (à créer) | besoin token #136 |
| src/components/layout/sidebar/SidebarHeader.vue:77 | #1E6FD9 | (à créer) | besoin token #136 |
| src/components/layout/sidebar/SidebarHeader.vue:82 | #3B82F6 | --blue-500 | remplaçable |
| src/components/layout/sidebar/SidebarHeader.vue:86 | #1F2937 | (à créer) | besoin token #136 |
| src/components/layout/sidebar/SidebarHeader.vue:90 | #60A5FA | --blue-400 | remplaçable |

### lessons/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/lessons/ChapterContent.vue:143 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContent.vue:144 | #60a5fa | --blue-400 | remplaçable |
| src/components/lessons/ChapterContent.vue:147 | rgba(239, 68, 68, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContent.vue:147 | #f87171 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContent.vue:148 | rgba(249, 115, 22, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContent.vue:148 | #fb923c | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContent.vue:149 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContent.vue:149 | #60a5fa | --blue-400 | remplaçable |
| src/components/lessons/ChapterContent.vue:150 | rgba(220, 38, 38, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContent.vue:150 | #f87171 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContent.vue:151 | rgba(139, 92, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContent.vue:151 | #a78bfa | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContent.vue:152 | rgba(16, 185, 129, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContent.vue:152 | #34d399 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContent.vue:186 | linear-gradient(135deg, #10b981, #059669) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContent.vue:200 | rgba(16, 185, 129, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContent.vue:213 | rgba(16, 185, 129, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContent.vue:214 | #10b981 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContent.vue:239 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/ChapterContent.vue:240 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/ChapterContent.vue:250 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/ChapterContent.vue:251 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/ChapterContent.vue:256 | #2563eb | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContentField.vue:100 | rgba(0, 0, 0, 0.03) | --shadow-sm/md | remplaçable |
| src/components/lessons/ChapterContentField.vue:103 | rgba(0, 0, 0, 0.06) | --shadow-sm/md | remplaçable |
| src/components/lessons/ChapterContentField.vue:103 | rgba(0, 0, 0, 0.05) | --shadow-sm/md | remplaçable |
| src/components/lessons/ChapterContentField.vue:108 | rgba(255, 255, 255, 0.05) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContentField.vue:109 | rgba(0, 0, 0, 0.2) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContentField.vue:109 | rgba(0, 0, 0, 0.1) | --shadow-md/lg | remplaçable |
| src/components/lessons/ChapterContentField.vue:116 | rgba(16, 185, 129, 0.05) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContentField.vue:117 | rgba(0, 0, 0, 0.1) | --shadow-md/lg | remplaçable |
| src/components/lessons/ChapterContentField.vue:117 | rgba(16, 185, 129, 0.2) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContentField.vue:117 | rgba(0, 0, 0, 0.1) | --shadow-md/lg | remplaçable |
| src/components/lessons/ChapterContentField.vue:147 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/ChapterContentField.vue:156 | #2563eb | (à créer) | besoin token #136 |
| src/components/lessons/ChapterContentField.vue:166 | #6b7280 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:102 | rgba(0, 0, 0, 0.03) | --shadow-sm/md | remplaçable |
| src/components/lessons/ChapterEditForm.vue:104 | rgba(0, 0, 0, 0.06) | --shadow-sm/md | remplaçable |
| src/components/lessons/ChapterEditForm.vue:104 | rgba(0, 0, 0, 0.05) | --shadow-sm/md | remplaçable |
| src/components/lessons/ChapterEditForm.vue:110 | rgba(255, 255, 255, 0.05) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:111 | rgba(0, 0, 0, 0.2) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:111 | rgba(0, 0, 0, 0.1) | --shadow-md/lg | remplaçable |
| src/components/lessons/ChapterEditForm.vue:117 | rgba(16, 185, 129, 0.05) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:118 | rgba(16, 185, 129, 0.05) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:119 | rgba(0, 0, 0, 0.1) | --shadow-md/lg | remplaçable |
| src/components/lessons/ChapterEditForm.vue:119 | rgba(16, 185, 129, 0.2) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:119 | rgba(0, 0, 0, 0.1) | --shadow-md/lg | remplaçable |
| src/components/lessons/ChapterEditForm.vue:134 | rgba(0, 0, 0, 0.03) | --shadow-sm/md | remplaçable |
| src/components/lessons/ChapterEditForm.vue:138 | rgba(0, 0, 0, 0.06) | --shadow-sm/md | remplaçable |
| src/components/lessons/ChapterEditForm.vue:138 | rgba(0, 0, 0, 0.05) | --shadow-sm/md | remplaçable |
| src/components/lessons/ChapterEditForm.vue:143 | #ffffff | --bg-primary/--card-bg | remplaçable |
| src/components/lessons/ChapterEditForm.vue:144 | #111827 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:150 | rgba(255, 255, 255, 0.05) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:151 | rgba(0, 0, 0, 0.2) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:151 | rgba(0, 0, 0, 0.1) | --shadow-md/lg | remplaçable |
| src/components/lessons/ChapterEditForm.vue:155 | #1f2937 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:156 | #f9fafb | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:162 | rgba(255, 255, 255, 0.05) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:163 | rgba(0, 0, 0, 0.2) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:163 | rgba(0, 0, 0, 0.1) | --shadow-md/lg | remplaçable |
| src/components/lessons/ChapterEditForm.vue:167 | #1f2937 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:168 | #f9fafb | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:175 | rgba(16, 185, 129, 0.05) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:176 | rgba(0, 0, 0, 0.1) | --shadow-md/lg | remplaçable |
| src/components/lessons/ChapterEditForm.vue:176 | rgba(16, 185, 129, 0.2) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterEditForm.vue:176 | rgba(0, 0, 0, 0.1) | --shadow-md/lg | remplaçable |
| src/components/lessons/ChapterList.vue:87 | rgba(0, 0, 0, 0.12) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterList.vue:92 | rgba(0, 0, 0, 0.2) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterList.vue:105 | rgba(0, 0, 0, 0.08) | --shadow-sm/md | remplaçable |
| src/components/lessons/ChapterList.vue:128 | rgba(0, 0, 0, 0.08) | --shadow-sm/md | remplaçable |
| src/components/lessons/ChapterList.vue:136 | rgba(16, 185, 129, 0.15) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterList.vue:139 | rgba(16, 185, 129, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterList.vue:143 | #dc2626 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterList.vue:147 | rgba(220, 38, 38, 0.15) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterList.vue:148 | #dc2626 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterList.vue:150 | rgba(220, 38, 38, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterList.vue:169 | rgba(0, 0, 0, 0.08) | --shadow-sm/md | remplaçable |
| src/components/lessons/ChapterList.vue:173 | rgba(16, 185, 129, 0.15) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterList.vue:177 | rgba(16, 185, 129, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterManager.vue:100 | rgba(0, 0, 0, 0.15) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterManager.vue:152 | rgba(0, 0, 0, 0.5) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterManager.vue:211 | rgba(0, 0, 0, 0.6) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterMediaRenderer.vue:84 | #000 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterMediaRenderer.vue:105 | #94a3b8 | --text-disabled | remplaçable |
| src/components/lessons/ChapterMediaRenderer.vue:115 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/ChapterMediaRenderer.vue:139 | #60a5fa | --blue-400 | remplaçable |
| src/components/lessons/ChapterMediaRenderer.vue:172 | #a78bfa | (à créer) | besoin token #136 |
| src/components/lessons/ChapterMediaRenderer.vue:196 | #7c3aed | (à créer) | besoin token #136 |
| src/components/lessons/ChapterMediaRenderer.vue:209 | #6d28d9 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizField.vue:57 | rgba(99, 102, 241, 0.05) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizField.vue:58 | rgba(99, 102, 241, 0.2) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizField.vue:77 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizField.vue:101 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizField.vue:112 | #4f46e5 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizField.vue:134 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizField.vue:145 | #4f46e5 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizField.vue:147 | rgba(99, 102, 241, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizField.vue:159 | rgba(245, 158, 11, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizField.vue:160 | rgba(245, 158, 11, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizField.vue:162 | #b45309 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizRenderer.vue:49 | #34d399 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizRenderer.vue:83 | rgba(16, 185, 129, 0.15) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizRenderer.vue:84 | #10b981 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizRenderer.vue:85 | #10b981 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizRenderer.vue:89 | rgba(239, 68, 68, 0.15) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizRenderer.vue:90 | #ef4444 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizRenderer.vue:91 | #ef4444 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterQuizRenderer.vue:96 | linear-gradient(135deg, #10b981, #059669) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterTextRenderer.vue:61 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/ChapterTextRenderer.vue:64 | rgba(59, 130, 246, 0.05) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterViewMode.vue:106 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterViewMode.vue:111 | rgba(59, 130, 246, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterViewMode.vue:155 | rgba(99, 102, 241, 0.08) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterViewMode.vue:156 | rgba(99, 102, 241, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterViewMode.vue:175 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/ChapterViewMode.vue:219 | linear-gradient(135deg, #10b981 0%, #059669 100%) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterViewMode.vue:227 | rgba(16, 185, 129, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterViewMode.vue:232 | rgba(16, 185, 129, 0.4) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterViewMode.vue:265 | linear-gradient(135deg, #6366f1 0%, #4f46e5 100%) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterViewMode.vue:273 | rgba(99, 102, 241, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/ChapterViewMode.vue:278 | rgba(99, 102, 241, 0.4) | (à créer) | besoin token #136 |
| src/components/lessons/KnowledgeCheckEditor.vue:125 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/KnowledgeCheckEditor.vue:185 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/KnowledgeCheckEditor.vue:218 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/KnowledgeCheckEditor.vue:229 | #4f46e5 | (à créer) | besoin token #136 |
| src/components/lessons/LessonBasicInfoFields.vue:162 | #ef4444 | (à créer) | besoin token #136 |
| src/components/lessons/LessonBasicInfoFields.vue:182 | #3b82f6 | --blue-500/--border-focus(dark) | remplaçable |
| src/components/lessons/LessonBasicInfoFields.vue:183 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/LessonCard.vue:102 | rgba(0, 0, 0, 0.1) | --shadow-md/lg | remplaçable |
| src/components/lessons/LessonCard.vue:104 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/LessonCardActions.vue:88 | #059669 | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardActions.vue:89 | #059669 | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardActions.vue:93 | #d1fae5 | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardActions.vue:97 | #d97706 | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardActions.vue:98 | #d97706 | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardActions.vue:102 | #fef3c7 | --warning-bg | remplaçable |
| src/components/lessons/LessonCardActions.vue:106 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/LessonCardActions.vue:107 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/LessonCardActions.vue:111 | #dbeafe | --blue-100/--info-bg | remplaçable |
| src/components/lessons/LessonCardActions.vue:115 | #dc2626 | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardActions.vue:116 | #dc2626 | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardActions.vue:120 | #fee2e2 | --error-bg | remplaçable |
| src/components/lessons/LessonCardActions.vue:124 | linear-gradient(135deg, #3b82f6, #8b5cf6) | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardActions.vue:126 | rgba(59, 130, 246, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardActions.vue:130 | linear-gradient(135deg, #2563eb, #7c3aed) | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardActions.vue:131 | rgba(59, 130, 246, 0.4) | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardBadges.vue:49 | #dbeafe | --blue-100/--info-bg | remplaçable |
| src/components/lessons/LessonCardBadges.vue:50 | #1e40af | --info-text | remplaçable |
| src/components/lessons/LessonCardBadges.vue:54 | #e9d5ff | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardBadges.vue:55 | #7c3aed | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardBadges.vue:59 | #ddd6fe | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardBadges.vue:60 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardBadges.vue:64 | #fce7f3 | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardBadges.vue:65 | #be123c | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardBadges.vue:75 | #fef3c7 | --warning-bg | remplaçable |
| src/components/lessons/LessonCardBadges.vue:76 | #92400e | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardBadges.vue:80 | #d1fae5 | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardBadges.vue:81 | #065f46 | (à créer) | besoin token #136 |
| src/components/lessons/LessonCardBadges.vue:85 | #fee2e2 | --error-bg | remplaçable |
| src/components/lessons/LessonCardBadges.vue:86 | #991b1b | --error-text | remplaçable |
| src/components/lessons/LessonChapterSidebar.vue:136 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/LessonChapterSidebar.vue:162 | rgba(59, 130, 246, 0.05) | (à créer) | besoin token #136 |
| src/components/lessons/LessonChapterSidebar.vue:167 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/LessonChapterSidebar.vue:168 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/LessonChapterSidebar.vue:173 | #10b981 | (à créer) | besoin token #136 |
| src/components/lessons/LessonChapterSidebar.vue:190 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/LessonChapterSidebar.vue:195 | rgba(16, 185, 129, 0.15) | (à créer) | besoin token #136 |
| src/components/lessons/LessonChapterSidebar.vue:236 | rgba(0, 0, 0, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/LessonContentFields.vue:179 | #ef4444 | (à créer) | besoin token #136 |
| src/components/lessons/LessonContentFields.vue:199 | #3b82f6 | --blue-500/--border-focus(dark) | remplaçable |
| src/components/lessons/LessonContentFields.vue:200 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/LessonContentFields.vue:238 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/LessonContentFields.vue:239 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/LessonContentTypePicker.vue:79 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/LessonContentTypePicker.vue:80 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/LessonEditorActions.vue:69 | linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) | (à créer) | besoin token #136 |
| src/components/lessons/LessonEditorActions.vue:74 | linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) | (à créer) | besoin token #136 |
| src/components/lessons/LessonEditorActions.vue:84 | #fee2e2 | --error-bg | remplaçable |
| src/components/lessons/LessonEditorActions.vue:85 | #dc2626 | (à créer) | besoin token #136 |
| src/components/lessons/LessonEditorActions.vue:86 | #fca5a5 | --error-border | remplaçable |
| src/components/lessons/LessonEditorActions.vue:90 | #fecaca | (à créer) | besoin token #136 |
| src/components/lessons/LessonFormModal.vue:110 | rgba(0, 0, 0, 0.5) | (à créer) | besoin token #136 |
| src/components/lessons/LessonFormModal.vue:121 | rgba(0, 0, 0, 0.1) | --shadow-md/lg | remplaçable |
| src/components/lessons/LessonFormModal.vue:175 | #dc2626 | (à créer) | besoin token #136 |
| src/components/lessons/LessonFormModal.vue:194 | #3b82f6 | --blue-500/--border-focus(dark) | remplaçable |
| src/components/lessons/LessonFormModal.vue:195 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/LessonFormModal.vue:227 | linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) | (à créer) | besoin token #136 |
| src/components/lessons/LessonFormModal.vue:232 | linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) | (à créer) | besoin token #136 |
| src/components/lessons/LessonInfoCard.vue:124 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/LessonInfoCard.vue:125 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/LessonInfoCard.vue:126 | rgba(59, 130, 246, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/LessonInfoCard.vue:130 | rgba(245, 158, 11, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/LessonInfoCard.vue:131 | #f59e0b | (à créer) | besoin token #136 |
| src/components/lessons/LessonInfoCard.vue:132 | rgba(245, 158, 11, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/LessonInfoCard.vue:136 | rgba(239, 68, 68, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/LessonInfoCard.vue:137 | #ef4444 | (à créer) | besoin token #136 |
| src/components/lessons/LessonInfoCard.vue:138 | rgba(239, 68, 68, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/LessonInfoCard.vue:161 | rgba(16, 185, 129, 0.15) | (à créer) | besoin token #136 |
| src/components/lessons/LessonInfoCard.vue:162 | #10b981 | (à créer) | besoin token #136 |
| src/components/lessons/LessonInfoCard.vue:163 | rgba(16, 185, 129, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/LessonInfoCard.vue:167 | rgba(245, 158, 11, 0.15) | (à créer) | besoin token #136 |
| src/components/lessons/LessonInfoCard.vue:168 | #f59e0b | (à créer) | besoin token #136 |
| src/components/lessons/LessonInfoCard.vue:169 | rgba(245, 158, 11, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/LessonResourcesFields.vue:175 | #3b82f6 | --blue-500/--border-focus(dark) | remplaçable |
| src/components/lessons/LessonResourcesFields.vue:176 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/LessonResourcesFields.vue:217 | #fee2e2 | --error-bg | remplaçable |
| src/components/lessons/LessonResourcesFields.vue:218 | #dc2626 | (à créer) | besoin token #136 |
| src/components/lessons/LessonResourcesFields.vue:219 | #fca5a5 | --error-border | remplaçable |
| src/components/lessons/LessonResourcesFields.vue:228 | #fecaca | (à créer) | besoin token #136 |
| src/components/lessons/LessonResourcesFields.vue:247 | #dbeafe | --blue-100/--info-bg | remplaçable |
| src/components/lessons/LessonResourcesFields.vue:248 | #1d4ed8 | (à créer) | besoin token #136 |
| src/components/lessons/LessonResourcesFields.vue:249 | #93c5fd | --blue-300/--info-border | remplaçable |
| src/components/lessons/LessonResourcesFields.vue:257 | #bfdbfe | --blue-200 | remplaçable |
| src/components/lessons/LessonRichTextEditor.vue:73 | #3b82f6 | --blue-500/--border-focus(dark) | remplaçable |
| src/components/lessons/LessonRichTextEditor.vue:74 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/LessonRichTextEditor.vue:117 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/LessonRichTextEditor.vue:118 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/LessonStatsGrid.vue:42 | #dbeafe | --blue-100/--info-bg | remplaçable |
| src/components/lessons/LessonStatsGrid.vue:46 | #d1fae5 | (à créer) | besoin token #136 |
| src/components/lessons/LessonStatsGrid.vue:50 | #e9d5ff | (à créer) | besoin token #136 |
| src/components/lessons/LessonStatsGrid.vue:59 | #1e40af | --info-text | remplaçable |
| src/components/lessons/LessonStatsGrid.vue:63 | #065f46 | (à créer) | besoin token #136 |
| src/components/lessons/LessonStatsGrid.vue:67 | #7c3aed | (à créer) | besoin token #136 |
| src/components/lessons/LessonStatusPicker.vue:92 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/LessonStatusPicker.vue:93 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/LessonsEmptyState.vue:68 | linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) | (à créer) | besoin token #136 |
| src/components/lessons/LessonsEmptyState.vue:78 | linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) | (à créer) | besoin token #136 |
| src/components/lessons/QuestionEditorCard.vue:116 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/QuestionEditorCard.vue:129 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/QuestionEditorCard.vue:171 | #ef4444 | (à créer) | besoin token #136 |
| src/components/lessons/QuestionEditorCard.vue:176 | rgba(239, 68, 68, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/QuestionOptionsEditor.vue:142 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/QuestionOptionsEditor.vue:160 | #ef4444 | (à créer) | besoin token #136 |
| src/components/lessons/QuestionOptionsEditor.vue:178 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/QuestionOptionsEditor.vue:179 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/QuestionsSection.vue:92 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/QuestionsSection.vue:103 | #4f46e5 | (à créer) | besoin token #136 |
| src/components/lessons/QuestionsSection.vue:123 | rgba(245, 158, 11, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/QuestionsSection.vue:124 | rgba(245, 158, 11, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/QuestionsSection.vue:126 | #b45309 | (à créer) | besoin token #136 |
| src/components/lessons/QuizConfigForm.vue:147 | rgba(245, 158, 11, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/QuizConfigForm.vue:147 | rgba(234, 88, 12, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/QuizConfigForm.vue:148 | rgba(245, 158, 11, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerCorrections.vue:73 | rgba(16, 185, 129, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerCorrections.vue:74 | #10b981 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerCorrections.vue:78 | rgba(239, 68, 68, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerCorrections.vue:79 | #ef4444 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerCorrections.vue:94 | #10b981 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerCorrections.vue:98 | #ef4444 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerCorrections.vue:122 | rgba(99, 102, 241, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerCorrections.vue:124 | #4f46e5 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerIntro.vue:79 | linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerIntro.vue:124 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerIntro.vue:136 | #fef3c7 | --warning-bg | remplaçable |
| src/components/lessons/QuizPlayerIntro.vue:137 | #b45309 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerIntro.vue:143 | #d1fae5 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerIntro.vue:144 | #047857 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerIntro.vue:156 | linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerIntro.vue:168 | rgba(99, 102, 241, 0.3) | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerIntro.vue:182 | #fee2e2 | --error-bg | remplaçable |
| src/components/lessons/QuizPlayerIntro.vue:183 | #b91c1c | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerQuestion.vue:130 | linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerQuestion.vue:156 | #fee2e2 | --error-bg | remplaçable |
| src/components/lessons/QuizPlayerQuestion.vue:157 | #b91c1c | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerQuestion.vue:197 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerQuestion.vue:201 | rgba(99, 102, 241, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerQuestion.vue:202 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerResults.vue:75 | linear-gradient(135deg, #fef3c7 0%, #fde68a 100%) | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerResults.vue:79 | linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%) | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerResults.vue:91 | rgba(0, 0, 0, 0.1) | --shadow-md/lg | remplaçable |
| src/components/lessons/QuizPlayerResults.vue:96 | #b45309 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerResults.vue:100 | #047857 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerResults.vue:106 | #92400e | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerResults.vue:111 | #047857 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerResults.vue:115 | #a16207 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerResults.vue:120 | #059669 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerResults.vue:138 | linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%) | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerResults.vue:147 | linear-gradient(135deg, #10b981 0%, #34d399 100%) | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerResults.vue:190 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/QuizPlayerResults.vue:196 | #4f46e5 | (à créer) | besoin token #136 |
| src/components/lessons/QuizQuestionNav.vue:103 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/QuizQuestionNav.vue:109 | #4f46e5 | (à créer) | besoin token #136 |
| src/components/lessons/QuizQuestionNav.vue:113 | #10b981 | (à créer) | besoin token #136 |
| src/components/lessons/QuizQuestionNav.vue:119 | #059669 | (à créer) | besoin token #136 |
| src/components/lessons/QuizQuestionNav.vue:147 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/QuizQuestionNav.vue:148 | #6366f1 | (à créer) | besoin token #136 |
| src/components/lessons/QuizQuestionNav.vue:153 | #10b981 | (à créer) | besoin token #136 |
| src/components/lessons/QuizQuestionNav.vue:154 | rgba(16, 185, 129, 0.1) | (à créer) | besoin token #136 |
| src/components/lessons/QuizQuestionNav.vue:155 | #10b981 | (à créer) | besoin token #136 |
| src/components/lessons/SlidesViewer.vue:80 | #000 | (à créer) | besoin token #136 |
| src/components/lessons/SlidesViewer.vue:118 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/SlidesViewer.vue:119 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/SlidesViewer.vue:155 | #3b82f6 | --blue-500 | remplaçable |
| src/components/lessons/TeacherLessonCard.vue:143 | #dcfce7 | --success-bg | remplaçable |
| src/components/lessons/TeacherLessonCard.vue:144 | #15803d | (à créer) | besoin token #136 |
| src/components/lessons/TeacherLessonCard.vue:148 | #fef3c7 | --warning-bg | remplaçable |
| src/components/lessons/TeacherLessonCard.vue:149 | #92400e | (à créer) | besoin token #136 |
| src/components/lessons/TeacherLessonCard.vue:153 | #f3f4f6 | (à créer) | besoin token #136 |
| src/components/lessons/TeacherLessonCard.vue:154 | #6b7280 | (à créer) | besoin token #136 |
| src/components/lessons/TeacherLessonCard.vue:213 | linear-gradient(135deg, #3b82f6 0%, #2563eb 100%) | (à créer) | besoin token #136 |
| src/components/lessons/TeacherLessonCard.vue:213 | linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%) | (à créer) | besoin token #136 |
| src/components/lessons/TeacherLessonCard.vue:213 | rgba(59, 130, 246, 0.3) | (à créer) | besoin token #136 |

### matieres/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/matieres/CreateLessonModal.vue:134 | rgba(0, 0, 0, 0.5) | (à créer) | besoin token #136 |
| src/components/matieres/CreateLessonModal.vue:145 | rgba(0, 0, 0, 0.3) | (à créer) | besoin token #136 |
| src/components/matieres/CreateLessonModal.vue:212 | #ef4444 | (à créer) | besoin token #136 |
| src/components/matieres/CreateLessonModal.vue:232 | #3b82f6 | --blue-500 | remplaçable |
| src/components/matieres/CreateLessonModal.vue:233 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/matieres/CreateLessonModal.vue:272 | #3b82f6 | --blue-500 | remplaçable |
| src/components/matieres/CreateLessonModal.vue:277 | #2563eb | (à créer) | besoin token #136 |
| src/components/matieres/MatiereLessonsTab.vue:137 | #3b82f6 | --blue-500 | remplaçable |
| src/components/matieres/MatiereLessonsTab.vue:138 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/matieres/MatiereNotifications.vue:62 | rgba(0, 0, 0, 0.15) | (à créer) | besoin token #136 |
| src/components/matieres/MatiereNotifications.vue:101 | #10b981 | (à créer) | besoin token #136 |
| src/components/matieres/MatiereNotifications.vue:101 | #059669 | (à créer) | besoin token #136 |
| src/components/matieres/MatiereNotifications.vue:103 | #065f46 | (à créer) | besoin token #136 |
| src/components/matieres/MatiereNotifications.vue:108 | #ef4444 | (à créer) | besoin token #136 |
| src/components/matieres/MatiereNotifications.vue:108 | #dc2626 | (à créer) | besoin token #136 |
| src/components/matieres/MatiereNotifications.vue:110 | #991b1b | --error-text | remplaçable |
| src/components/matieres/MatiereNotifications.vue:115 | #f59e0b | (à créer) | besoin token #136 |
| src/components/matieres/MatiereNotifications.vue:115 | #d97706 | (à créer) | besoin token #136 |
| src/components/matieres/MatiereNotifications.vue:117 | #92400e | (à créer) | besoin token #136 |
| src/components/matieres/MatiereNotifications.vue:122 | #3b82f6 | --blue-500 | remplaçable |
| src/components/matieres/MatiereNotifications.vue:122 | #2563eb | (à créer) | besoin token #136 |
| src/components/matieres/MatiereNotifications.vue:124 | #1e40af | --info-text | remplaçable |

> Note matieres/ : fallback `var(--text-muted, #9ca3af)` (CreateLessonModal.vue:243) ignoré.

### modals/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/modals/GenerateReportModal.vue:241 | #ef4444 | (à créer) | besoin token #136 |
| src/components/modals/GenerateReportModal.vue:258 | #3b82f6 | --blue-500 | remplaçable |
| src/components/modals/GenerateReportModal.vue:259 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/modals/GenerateReportModal.vue:264 | #fee2e2 | --error-bg | remplaçable |
| src/components/modals/GenerateReportModal.vue:265 | #dc2626 | (à créer) | besoin token #136 |
| src/components/modals/GenerateReportModal.vue:272 | #dbeafe | --info-bg | remplaçable |
| src/components/modals/GenerateReportModal.vue:273 | #3b82f6 | --blue-500 | remplaçable |
| src/components/modals/GenerateReportModal.vue:280 | #1e40af | --info-text | remplaçable |
| src/components/modals/GlobalSearchModal.vue:94 | rgba(0, 0, 0, 0.5) | (à créer) | besoin token #136 |
| src/components/modals/GlobalSearchModal.vue:107 | rgba(0, 0, 0, 0.1) | --shadow-* | remplaçable |
| src/components/modals/GlobalSearchModal.vue:107 | rgba(0, 0, 0, 0.04) | --shadow-* | remplaçable |
| src/components/modals/QuickAddTeacherModal.vue:224 | #ef4444 | (à créer) | besoin token #136 |
| src/components/modals/QuickAddTeacherModal.vue:241 | #3b82f6 | --blue-500 | remplaçable |
| src/components/modals/QuickAddTeacherModal.vue:242 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/modals/QuickAddTeacherModal.vue:261 | #fee2e2 | --error-bg | remplaçable |
| src/components/modals/QuickAddTeacherModal.vue:262 | #dc2626 | (à créer) | besoin token #136 |
| src/components/modals/QuickCreateClasseModal.vue:228 | #ef4444 | (à créer) | besoin token #136 |
| src/components/modals/QuickCreateClasseModal.vue:245 | #3b82f6 | --blue-500 | remplaçable |
| src/components/modals/QuickCreateClasseModal.vue:246 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/modals/QuickCreateClasseModal.vue:275 | #fee2e2 | --error-bg | remplaçable |
| src/components/modals/QuickCreateClasseModal.vue:276 | #dc2626 | (à créer) | besoin token #136 |

### (racine)/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/Navbar.vue:117 | #2563eb | (à créer) | besoin token #136 |
| src/components/Navbar.vue:118 | #2563eb | (à créer) | besoin token #136 |

### search/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/search/SearchResultsList.vue:127 | #dbeafe | --info-bg | remplaçable |
| src/components/search/SearchResultsList.vue:128 | #1e40af | --info-text | remplaçable |
| src/components/search/SearchResultsList.vue:132 | #d1fae5 | (à créer) | besoin token #136 |
| src/components/search/SearchResultsList.vue:133 | #065f46 | (à créer) | besoin token #136 |
| src/components/search/SearchResultsList.vue:137 | #fef3c7 | --warning-bg | remplaçable |
| src/components/search/SearchResultsList.vue:138 | #92400e | (à créer) | besoin token #136 |
| src/components/search/SearchResultsList.vue:142 | #f3e8ff | (à créer) | besoin token #136 |
| src/components/search/SearchResultsList.vue:143 | #6b21a8 | (à créer) | besoin token #136 |
| src/components/search/SearchResultsList.vue:147 | #fee2e2 | --error-bg | remplaçable |
| src/components/search/SearchResultsList.vue:148 | #991b1b | --error-text | remplaçable |

### seances/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/seances/CoordinatorSeanceCard.vue:114 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/seances/CoordinatorSeanceCard.vue:119 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/seances/CoordinatorSeanceCard.vue:197 | #f3e8ff | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorSeanceCard.vue:198 | #7c3aed | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorSeanceCard.vue:202 | #e9d5ff | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorSeanceCard.vue:211 | #e5e7eb | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorSeanceFilters.vue:84 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/seances/CoordinatorSeanceFilters.vue:121 | rgba(99, 102, 241, 0.1) | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorSeanceHeader.vue:61 | #6366f1 | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorSeanceHeader.vue:87 | rgba(0, 0, 0, 0.1) | --shadow-sm | remplaçable |
| src/components/seances/CoordinatorSeanceHeader.vue:111 | #6366f1 | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorSeanceStats.vue:46 | rgba(0, 0, 0, 0.1) | --shadow-sm | remplaçable |
| src/components/seances/CoordinatorSeanceStats.vue:50 | #f3e8ff | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorSeanceStats.vue:51 | #c084fc | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorSeanceStats.vue:61 | #7c3aed | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorSeanceStats.vue:72 | #6d28d9 | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorVisioPanel.vue:69 | #1f2937 | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorVisioPanel.vue:128 | #1f2937 | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorVisioPanel.vue:140 | rgba(255, 255, 255, 0.7) | .glass bg | remplaçable |
| src/components/seances/CoordinatorVisioPanel.vue:158 | #3b82f6 | --blue-500 | remplaçable |
| src/components/seances/CoordinatorVisioPanel.vue:172 | #2563eb | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorVisioPanel.vue:177 | #16a34a | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorVisioPanel.vue:192 | #15803d | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorVisioPanel.vue:200 | #fef3c7 | --warning-bg | remplaçable |
| src/components/seances/CoordinatorVisioPanel.vue:202 | #fcd34d | (à créer) | besoin token #136 |
| src/components/seances/CoordinatorVisioPanel.vue:213 | #92400e | (à créer) | besoin token #136 |
| src/components/seances/SeanceCardActions.vue:154 | #1f2937 | (à créer) | besoin token #136 |
| src/components/seances/SeanceCardActions.vue:159 | #1f2937 | (à créer) | besoin token #136 |
| src/components/seances/SeanceCardActions.vue:172 | rgba(255, 255, 255, 0.8) | --sidebar-text-secondary | remplaçable |
| src/components/seances/SeanceCardActions.vue:202 | #3b82f6 | --blue-500 | remplaçable |
| src/components/seances/SeanceCardActions.vue:244 | #1f2937 | (à créer) | besoin token #136 |
| src/components/seances/SeanceCardActions.vue:255 | #22c55e | (à créer) | besoin token #136 |
| src/components/seances/SeanceCardActions.vue:266 | rgba(255, 255, 255, 0.7) | .glass bg | remplaçable |
| src/components/seances/SeanceCardHeader.vue:74 | #3b82f6 | --blue-500 | remplaçable |
| src/components/seances/SeanceCardHeader.vue:107 | #dbeafe | --info-bg/--blue-100 | remplaçable |
| src/components/seances/SeanceCardHeader.vue:108 | #1e40af | --info-text | remplaçable |
| src/components/seances/SeanceCardHeader.vue:112 | #dcfce7 | --success-bg | remplaçable |
| src/components/seances/SeanceCardHeader.vue:113 | #166534 | --success-text | remplaçable |
| src/components/seances/SeanceCardHeader.vue:117 | #f3f4f6 | (à créer) | besoin token #136 |
| src/components/seances/SeanceCardHeader.vue:118 | #4b5563 | (à créer) | besoin token #136 |
| src/components/seances/TeacherSeancesFilters.vue:131 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/seances/TeacherSeancesStats.vue:87 | #22c55e | (à créer) | besoin token #136 |
| src/components/seances/TeacherSeancesStats.vue:91 | #f59e0b | (à créer) | besoin token #136 |
| src/components/seances/TeacherSeancesStats.vue:95 | #6b7280 | (à créer) | besoin token #136 |

> Note seances/ : la note #28 sur `coordinateur/` (vide) — les composants coordinateur résident sous `seances/` (Coordinator*). Fallbacks `var(--…, #hex)` ignorés.

### student/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/student/CourseCard.vue:115 | #dbeafe | --blue-100/--info-bg | remplaçable |
| src/components/student/CourseCard.vue:116 | #1e40af | --info-text | remplaçable |
| src/components/student/CourseCard.vue:120 | #dcfce7 | --success-bg | remplaçable |
| src/components/student/CourseCard.vue:121 | #166534 | --success-text | remplaçable |
| src/components/student/CourseCard.vue:125 | #fef3c7 | --warning-bg | remplaçable |
| src/components/student/CourseCard.vue:126 | #92400e | (à créer) | besoin token #136 |
| src/components/student/CourseCard.vue:130 | #f3e8ff | (à créer) | besoin token #136 |
| src/components/student/CourseCard.vue:131 | #7c3aed | (à créer) | besoin token #136 |
| src/components/student/CourseCard.vue:199 | #3b82f6 | --blue-500 | remplaçable |
| src/components/student/CourseCard.vue:199 | #2563eb | (à créer) | besoin token #136 |
| src/components/student/CourseCard.vue:216 | #3b82f6 | --blue-500 | remplaçable |
| src/components/student/CourseCard.vue:216 | #2563eb | (à créer) | besoin token #136 |
| src/components/student/CourseCard.vue:227 | #2563eb | (à créer) | besoin token #136 |
| src/components/student/CourseCard.vue:227 | #1d4ed8 | (à créer) | besoin token #136 |
| src/components/student/CoursesFilters.vue:97 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/student/CoursesFilters.vue:115 | #fee2e2 | --error-bg | remplaçable |
| src/components/student/CoursesFilters.vue:116 | #dc2626 | (à créer) | besoin token #136 |
| src/components/student/CoursesFilters.vue:117 | #dc2626 | (à créer) | besoin token #136 |
| src/components/student/GradesFilters.vue:82 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/student/GradesStatsCards.vue:69 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/student/GradesStatsCards.vue:75 | rgba(0, 0, 0, 0.15) | (à créer) | besoin token #136 |
| src/components/student/GradesStatsCards.vue:108 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/student/GradesStatsCards.vue:115 | rgba(255, 255, 255, 0.3) | .glass border | remplaçable |
| src/components/student/GradesStatsCards.vue:124 | #4caf50 | (à créer) | besoin token #136 |
| src/components/student/GradesStatsCards.vue:125 | #8bc34a | (à créer) | besoin token #136 |
| src/components/student/GradesStatsCards.vue:126 | #ff9800 | (à créer) | besoin token #136 |
| src/components/student/GradesStatsCards.vue:127 | #ff5722 | (à créer) | besoin token #136 |
| src/components/student/GradesStatsCards.vue:128 | #f44336 | (à créer) | besoin token #136 |
| src/components/student/GradesStatsCards.vue:131 | #4caf50 | (à créer) | besoin token #136 |
| src/components/student/GradesStatsCards.vue:132 | #8bc34a | (à créer) | besoin token #136 |
| src/components/student/GradesStatsCards.vue:133 | #ff9800 | (à créer) | besoin token #136 |
| src/components/student/GradesStatsCards.vue:134 | #ff5722 | (à créer) | besoin token #136 |
| src/components/student/GradesStatsCards.vue:135 | #f44336 | (à créer) | besoin token #136 |
| src/components/student/GradesStatsCards.vue:148 | #ddd | (à créer) | besoin token #136 |
| src/components/student/GradesSummary.vue:86 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/student/GradesSummary.vue:151 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/student/GradesSummary.vue:213 | #4caf50 | (à créer) | besoin token #136 |
| src/components/student/GradesSummary.vue:214 | #8bc34a | (à créer) | besoin token #136 |
| src/components/student/GradesSummary.vue:215 | #ff9800 | (à créer) | besoin token #136 |
| src/components/student/GradesSummary.vue:216 | #ff5722 | (à créer) | besoin token #136 |
| src/components/student/GradesSummary.vue:217 | #f44336 | (à créer) | besoin token #136 |
| src/components/student/GradesSummary.vue:223 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/student/GradesSummary.vue:235 | #4caf50 | (à créer) | besoin token #136 |
| src/components/student/GradesSummary.vue:236 | #8bc34a | (à créer) | besoin token #136 |
| src/components/student/GradesSummary.vue:237 | #ff9800 | (à créer) | besoin token #136 |
| src/components/student/GradesSummary.vue:238 | #ff5722 | (à créer) | besoin token #136 |
| src/components/student/GradesSummary.vue:239 | #f44336 | (à créer) | besoin token #136 |
| src/components/student/GradesSummary.vue:261 | #ddd | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:110 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/student/GradesTable.vue:152 | rgba(76, 175, 80, 0.05) | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:184 | #4caf50 | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:184 | #8bc34a | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:201 | rgba(33, 150, 243, 0.1) | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:202 | #2196f3 | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:205 | rgba(156, 39, 176, 0.1) | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:206 | #9c27b0 | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:209 | rgba(255, 152, 0, 0.1) | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:210 | #ff9800 | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:213 | rgba(244, 67, 54, 0.1) | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:214 | #f44336 | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:217 | rgba(0, 150, 136, 0.1) | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:218 | #009688 | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:221 | rgba(103, 58, 183, 0.1) | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:222 | #673ab7 | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:228 | #4caf50 | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:229 | #8bc34a | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:230 | #ff9800 | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:231 | #ff5722 | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:232 | #f44336 | (à créer) | besoin token #136 |
| src/components/student/GradesTable.vue:296 | #ddd | (à créer) | besoin token #136 |
| src/components/student/SettingsNotifications.vue:73 | #ccc | (à créer) | besoin token #136 |
| src/components/student/SettingsNotifications.vue:91 | #3b82f6 | --blue-500 | remplaçable |
| src/components/student/SettingsPasswordModal.vue:122 | #3B82F6 | --blue-500 | remplaçable |
| src/components/student/SettingsPasswordModal.vue:140 | #3b82f6 | --blue-500 | remplaçable |
| src/components/student/SettingsPasswordModal.vue:140 | #2563eb | (à créer) | besoin token #136 |
| src/components/student/SettingsPasswordModal.vue:145 | #2563eb | (à créer) | besoin token #136 |
| src/components/student/SettingsPasswordModal.vue:145 | #1d4ed8 | (à créer) | besoin token #136 |

> Note student/ : fallback `rgba(var(--primary-color-rgb), 0.1)` (GradesFilters.vue:114) ignoré.

### teacher/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/teacher/DashboardActivityWidgets.vue:65 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/teacher/DashboardClassesList.vue:44 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/teacher/DashboardClassesList.vue:78 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/teacher/DashboardEvaluationsList.vue:50 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/teacher/DashboardEvaluationsList.vue:84 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/teacher/DashboardEvaluationsList.vue:118 | #dcfce7 | --success-bg | remplaçable |
| src/components/teacher/DashboardEvaluationsList.vue:119 | #166534 | --success-text | remplaçable |
| src/components/teacher/DashboardEvaluationsList.vue:123 | #dbeafe | --blue-100/--info-bg | remplaçable |
| src/components/teacher/DashboardEvaluationsList.vue:124 | #1e40af | --info-text | remplaçable |
| src/components/teacher/DashboardEvaluationsList.vue:128 | #f3f4f6 | (à créer) | besoin token #136 |
| src/components/teacher/DashboardEvaluationsList.vue:129 | #4b5563 | (à créer) | besoin token #136 |
| src/components/teacher/DashboardMatieresList.vue:57 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/teacher/DashboardMatieresList.vue:91 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/teacher/DashboardQuickActions.vue:53 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/teacher/DashboardQuickActions.vue:62 | rgba(0, 0, 0, 0.15) | (à créer) | besoin token #136 |
| src/components/teacher/DashboardStatCards.vue:61 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/teacher/HubNavCards.vue:97 | rgba(0, 0, 0, 0.18) | (à créer) | besoin token #136 |
| src/components/teacher/HubNavCards.vue:127 | #3b82f6 | --blue-500 | remplaçable |
| src/components/teacher/HubNavCards.vue:127 | #2563eb | (à créer) | besoin token #136 |
| src/components/teacher/HubNavCards.vue:131 | #f59e0b | (à créer) | besoin token #136 |
| src/components/teacher/HubNavCards.vue:131 | #d97706 | (à créer) | besoin token #136 |
| src/components/teacher/HubNavCards.vue:135 | #10b981 | (à créer) | besoin token #136 |
| src/components/teacher/HubNavCards.vue:135 | #059669 | (à créer) | besoin token #136 |
| src/components/teacher/HubQuickStats.vue:103 | #3b82f6 | --blue-500 | remplaçable |
| src/components/teacher/HubQuickStats.vue:107 | #f59e0b | (à créer) | besoin token #136 |
| src/components/teacher/HubQuickStats.vue:111 | #10b981 | (à créer) | besoin token #136 |
| src/components/teacher/MatiereCourseCard.vue:86 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/teacher/MatiereCourseCard.vue:146 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/teacher/MatiereCourseCard.vue:147 | rgb(37, 99, 235) | (à créer) | besoin token #136 |
| src/components/teacher/PasswordChangeModal.vue:88 | #3B82F6 | --blue-500 | remplaçable |
| src/components/teacher/PasswordChangeModal.vue:106 | #3b82f6 | --blue-500 | remplaçable |
| src/components/teacher/PasswordChangeModal.vue:106 | #2563eb | (à créer) | besoin token #136 |
| src/components/teacher/PasswordChangeModal.vue:111 | #2563eb | (à créer) | besoin token #136 |
| src/components/teacher/PasswordChangeModal.vue:111 | #1d4ed8 | (à créer) | besoin token #136 |
| src/components/teacher/ProfileInfoCard.vue:82 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/teacher/ProfileInfoCard.vue:82 | rgba(37, 99, 235, 0.05) | (à créer) | besoin token #136 |
| src/components/teacher/ProfileInfoCard.vue:88 | #3b82f6 | --blue-500 | remplaçable |
| src/components/teacher/ProfileInfoCard.vue:116 | #3b82f6 | --blue-500 | remplaçable |
| src/components/teacher/ProfileInfoCard.vue:116 | #2563eb | (à créer) | besoin token #136 |
| src/components/teacher/ProfileInfoCard.vue:120 | rgba(59, 130, 246, 0.3) | (à créer) | besoin token #136 |
| src/components/teacher/ProfileInfoCard.vue:171 | #3b82f6 | --blue-500 | remplaçable |
| src/components/teacher/ProfileQuickActions.vue:65 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/teacher/ProfileQuickActions.vue:65 | rgba(37, 99, 235, 0.05) | (à créer) | besoin token #136 |
| src/components/teacher/ProfileQuickActions.vue:71 | #3b82f6 | --blue-500 | remplaçable |
| src/components/teacher/ProfileQuickActions.vue:105 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/teacher/ProfileQuickActions.vue:105 | rgba(37, 99, 235, 0.05) | (à créer) | besoin token #136 |
| src/components/teacher/ProfileQuickActions.vue:106 | #3b82f6 | --blue-500 | remplaçable |
| src/components/teacher/ProfileQuickActions.vue:108 | rgba(59, 130, 246, 0.2) | (à créer) | besoin token #136 |
| src/components/teacher/ProfileQuickActions.vue:114 | #3b82f6 | --blue-500 | remplaçable |
| src/components/teacher/ProfileStatsCard.vue:69 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/teacher/ProfileStatsCard.vue:69 | rgba(37, 99, 235, 0.05) | (à créer) | besoin token #136 |
| src/components/teacher/ProfileStatsCard.vue:75 | #3b82f6 | --blue-500 | remplaçable |
| src/components/teacher/ProfileStatsCard.vue:109 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/teacher/SettingsNotifications.vue:135 | #ccc | (à créer) | besoin token #136 |
| src/components/teacher/SettingsNotifications.vue:153 | #3b82f6 | --blue-500 | remplaçable |
| src/components/teacher/TeacherClassCard.vue:128 | #e0e7ff | (à créer) | besoin token #136 |
| src/components/teacher/TeacherClassCard.vue:129 | #5b21b6 | (à créer) | besoin token #136 |
| src/components/teacher/TeacherClassCard.vue:140 | #dcfce7 | --success-bg | remplaçable |
| src/components/teacher/TeacherClassCard.vue:141 | #15803d | (à créer) | besoin token #136 |
| src/components/teacher/TeacherClassCard.vue:151 | #22c55e | (à créer) | besoin token #136 |
| src/components/teacher/TeacherStatsActivity.vue:116 | #dbeafe | --blue-100/--info-bg | remplaçable |
| src/components/teacher/TeacherStatsActivity.vue:120 | #dcfce7 | --success-bg | remplaçable |
| src/components/teacher/TeacherStatsActivity.vue:124 | #ffedd5 | (à créer) | besoin token #136 |
| src/components/teacher/TeacherStatsActivity.vue:128 | #f3e8ff | (à créer) | besoin token #136 |
| src/components/teacher/TeacherStatsGlobalCards.vue:84 | #dbeafe | --blue-100/--info-bg | remplaçable |
| src/components/teacher/TeacherStatsGlobalCards.vue:88 | #dcfce7 | --success-bg | remplaçable |
| src/components/teacher/TeacherStatsGlobalCards.vue:92 | #ffedd5 | (à créer) | besoin token #136 |
| src/components/teacher/TeacherStatsGlobalCards.vue:96 | #f3e8ff | (à créer) | besoin token #136 |
| src/components/teacher/TeacherStatsParClasse.vue:107 | #e0e7ff | (à créer) | besoin token #136 |
| src/components/teacher/TeacherStatsParClasse.vue:108 | #5b21b6 | (à créer) | besoin token #136 |

> Note teacher/ : fallbacks `var(--primary-color, #3b82f6)` (HubNavCards.vue:98/102/182) ignorés.

### ui/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/ui/ProgressBar.vue:104 | rgba(0, 0, 0, 0.05) | --shadow-sm | remplaçable |
| src/components/ui/ProgressBar.vue:142 | rgba(255, 255, 255, 0.3) | .glass border | remplaçable |
| src/components/ui/ProgressBar.vue:177 | #22c55e | (à créer) | besoin token #136 |
| src/components/ui/ProgressBar.vue:177 | #16a34a | (à créer) | besoin token #136 |
| src/components/ui/ProgressBar.vue:181 | #facc15 | (à créer) | besoin token #136 |
| src/components/ui/ProgressBar.vue:181 | #eab308 | (à créer) | besoin token #136 |
| src/components/ui/ProgressBar.vue:185 | #ef4444 | (à créer) | besoin token #136 |
| src/components/ui/ProgressBar.vue:185 | #dc2626 | (à créer) | besoin token #136 |
| src/components/ui/ProgressBar.vue:189 | #a855f7 | (à créer) | besoin token #136 |
| src/components/ui/ProgressBar.vue:189 | #9333ea | (à créer) | besoin token #136 |
| src/components/ui/ProgressBar.vue:193 | #06b6d4 | (à créer) | besoin token #136 |
| src/components/ui/ProgressBar.vue:193 | #3b82f6 | --blue-500 | remplaçable |
| src/components/ui/ProgressBar.vue:193 | #a855f7 | (à créer) | besoin token #136 |
| src/components/ui/Modal.vue:98 | rgba(0, 0, 0, 0.5) | (à créer) | besoin token #136 |
| src/components/ui/Modal.vue:109 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/ui/Modal.vue:109 | rgba(0, 0, 0, 0.04) | --shadow-* | remplaçable |
| src/components/ui/QuickActionButton.vue:61 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/ui/QuickActionButton.vue:89 | #3b82f6 | --blue-500 | remplaçable |
| src/components/ui/QuickActionButton.vue:90 | #3b82f6 | --blue-500 | remplaçable |
| src/components/ui/QuickActionButton.vue:102 | #6b7280 | (à créer) | besoin token #136 |
| src/components/ui/QuickActionButton.vue:103 | #6b7280 | (à créer) | besoin token #136 |
| src/components/ui/QuickActionButton.vue:115 | #10b981 | (à créer) | besoin token #136 |
| src/components/ui/QuickActionButton.vue:116 | #10b981 | (à créer) | besoin token #136 |
| src/components/ui/QuickActionButton.vue:128 | #f59e0b | (à créer) | besoin token #136 |
| src/components/ui/QuickActionButton.vue:129 | #f59e0b | (à créer) | besoin token #136 |
| src/components/ui/QuickActionButton.vue:141 | #ef4444 | (à créer) | besoin token #136 |
| src/components/ui/QuickActionButton.vue:142 | #ef4444 | (à créer) | besoin token #136 |
| src/components/ui/StatCard.vue:155 | rgba(0, 0, 0, 0.15) | (à créer) | besoin token #136 |
| src/components/ui/StatCard.vue:199 | #22c55e | (à créer) | besoin token #136 |
| src/components/ui/StatCard.vue:203 | #ef4444 | (à créer) | besoin token #136 |
| src/components/ui/Toast.vue:98 | rgba(0, 0, 0, 0.1) | --shadow-*/--card-shadow | remplaçable |
| src/components/ui/Toast.vue:98 | rgba(0, 0, 0, 0.05) | --shadow-sm | remplaçable |
| src/components/ui/Toast.vue:157 | #10B981 | (à créer) | besoin token #136 |
| src/components/ui/Toast.vue:158 | #F0FDF4 | (à créer) | besoin token #136 |
| src/components/ui/Toast.vue:162 | #10B981 | (à créer) | besoin token #136 |
| src/components/ui/Toast.vue:163 | #D1FAE5 | (à créer) | besoin token #136 |
| src/components/ui/Toast.vue:167 | #065F46 | (à créer) | besoin token #136 |
| src/components/ui/Toast.vue:171 | #047857 | (à créer) | besoin token #136 |
| src/components/ui/Toast.vue:176 | #EF4444 | (à créer) | besoin token #136 |
| src/components/ui/Toast.vue:177 | #FEF2F2 | (à créer) | besoin token #136 |
| src/components/ui/Toast.vue:181 | #EF4444 | (à créer) | besoin token #136 |
| src/components/ui/Toast.vue:182 | #FEE2E2 | --error-bg | remplaçable |
| src/components/ui/Toast.vue:186 | #991B1B | --error-text | remplaçable |
| src/components/ui/Toast.vue:190 | #B91C1C | (à créer) | besoin token #136 |
| src/components/ui/Toast.vue:195 | #F59E0B | (à créer) | besoin token #136 |
| src/components/ui/Toast.vue:196 | #FFFBEB | (à créer) | besoin token #136 |
| src/components/ui/Toast.vue:200 | #F59E0B | (à créer) | besoin token #136 |
| src/components/ui/Toast.vue:201 | #FEF3C7 | --warning-bg | remplaçable |
| src/components/ui/Toast.vue:205 | #92400E | (à créer) | besoin token #136 |
| src/components/ui/Toast.vue:209 | #B45309 | (à créer) | besoin token #136 |
| src/components/ui/Toast.vue:214 | #3B82F6 | --blue-500 | remplaçable |
| src/components/ui/Toast.vue:215 | #EFF6FF | --blue-50 | remplaçable |
| src/components/ui/Toast.vue:219 | #3B82F6 | --blue-500 | remplaçable |
| src/components/ui/Toast.vue:220 | #DBEAFE | --blue-100/--info-bg | remplaçable |
| src/components/ui/Toast.vue:224 | #1E40AF | --info-text | remplaçable |
| src/components/ui/Toast.vue:228 | #2563EB | (à créer) | besoin token #136 |
| src/components/ui/BaseButton.vue:72 | #fff | --bg-primary/--btn-primary-text | remplaçable |
| src/components/ui/BaseButton.vue:91 | #fff | --bg-primary/--btn-primary-text | remplaçable |

> Note ui/ : fallbacks `var(--…, #hex)` (SkeletonLoader.vue:42-46/92-96, BaseButton.vue lignes var()) ignorés.

### visio/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/visio/JitsiErrorOverlay.vue:33 | rgba(0, 0, 0, 0.9) | (à créer) | besoin token #136 |
| src/components/visio/JitsiLoadingOverlay.vue:24 | rgba(0, 0, 0, 0.9) | (à créer) | besoin token #136 |
| src/components/visio/JitsiLoadingOverlay.vue:36 | rgba(255, 255, 255, 0.1) | --sidebar-border | remplaçable |
| src/components/visio/JitsiLoadingOverlay.vue:38 | #3b82f6 | --blue-500 | remplaçable |
| src/components/visio/JitsiMeet.vue:70 | #000 | (à créer) | besoin token #136 |
| src/components/visio/JitsiModal.vue:133 | rgba(0, 0, 0, 0.95) | (à créer) | besoin token #136 |
| src/components/visio/JitsiModal.vue:146 | #1f2937 | (à créer) | besoin token #136 |
| src/components/visio/JitsiModal.vue:151 | rgba(0, 0, 0, 0.5) | (à créer) | besoin token #136 |
| src/components/visio/JitsiModal.vue:160 | #111827 | (à créer) | besoin token #136 |
| src/components/visio/JitsiModal.vue:161 | #374151 | (à créer) | besoin token #136 |
| src/components/visio/JitsiModal.vue:166 | #ef4444 | (à créer) | besoin token #136 |
| src/components/visio/JitsiModal.vue:178 | #dc2626 | (à créer) | besoin token #136 |
| src/components/visio/JitsiModal.vue:185 | #000 | (à créer) | besoin token #136 |
| src/components/visio/VisioSeanceCard.vue:137 | #22c55e | (à créer) | besoin token #136 |
| src/components/visio/VisioSeanceCard.vue:138 | rgba(34, 197, 94, 0.05) | (à créer) | besoin token #136 |
| src/components/visio/VisioSeanceCard.vue:180 | #dcfce7 | --success-bg | remplaçable |
| src/components/visio/VisioSeanceCard.vue:181 | #166534 | --success-text | remplaçable |
| src/components/visio/VisioSeanceCard.vue:185 | #dbeafe | --info-bg | remplaçable |
| src/components/visio/VisioSeanceCard.vue:186 | #1e40af | --info-text | remplaçable |
| src/components/visio/VisioSeanceCard.vue:192 | #22c55e | (à créer) | besoin token #136 |
| src/components/visio/VisioSeanceCard.vue:249 | #22c55e | (à créer) | besoin token #136 |
| src/components/visio/VisioSeanceCard.vue:249 | #16a34a | (à créer) | besoin token #136 |
| src/components/visio/VisioSeanceCard.vue:254 | #16a34a | (à créer) | besoin token #136 |
| src/components/visio/VisioSeanceCard.vue:254 | #15803d | (à créer) | besoin token #136 |
| src/components/visio/VisioSeanceCard.vue:259 | #3b82f6 | --blue-500 | remplaçable |
| src/components/visio/VisioSeanceCard.vue:264 | #2563eb | (à créer) | besoin token #136 |
| src/components/visio/VisioSeanceCard.vue:268 | #f59e0b | (à créer) | besoin token #136 |
| src/components/visio/VisioSeanceCard.vue:273 | #d97706 | (à créer) | besoin token #136 |
| src/components/visio/VisioSeanceCard.vue:277 | #ef4444 | (à créer) | besoin token #136 |
| src/components/visio/VisioSeanceCard.vue:282 | #dc2626 | (à créer) | besoin token #136 |
| src/components/visio/VisioSeanceSection.vue:72 | #22c55e | (à créer) | besoin token #136 |
| src/components/visio/VisioSeanceSection.vue:75 | rgba(34, 197, 94, 0.2) | (à créer) | besoin token #136 |

### widgets/

| fichier:ligne | valeur | token cible | statut |
|---|---|---|---|
| src/components/widgets/CalendarEventModal.vue:104 | rgba(0, 0, 0, 0.5) | (à créer) | besoin token #136 |
| src/components/widgets/CalendarEventModal.vue:117 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/widgets/CalendarEventModal.vue:117 | rgba(0, 0, 0, 0.04) | --shadow-sm | remplaçable |
| src/components/widgets/CalendarEventModal.vue:209 | #2563eb | (à créer) | besoin token #136 |
| src/components/widgets/CalendarEventModal.vue:211 | rgba(59, 130, 246, 0.3) | (à créer) | besoin token #136 |
| src/components/widgets/CalendarWidget.vue:95 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/widgets/CalendarWidget.vue:205 | rgba(59, 130, 246, 0.1) | (à créer) | besoin token #136 |
| src/components/widgets/CalendarWidget.vue:214 | #3b82f6 | --blue-500 | remplaçable |
| src/components/widgets/CalendarWidget.vue:215 | #2563eb | (à créer) | besoin token #136 |
| src/components/widgets/CalendarWidget.vue:219 | #f59e0b | (à créer) | besoin token #136 |
| src/components/widgets/CalendarWidget.vue:220 | #d97706 | (à créer) | besoin token #136 |
| src/components/widgets/CalendarWidget.vue:224 | #10b981 | (à créer) | besoin token #136 |
| src/components/widgets/CalendarWidget.vue:225 | #059669 | (à créer) | besoin token #136 |
| src/components/widgets/CalendarWidget.vue:235 | rgba(0, 0, 0, 0.2) | (à créer) | besoin token #136 |
| src/components/widgets/CalendarWidgetLegend.vue:48 | #3b82f6 | --blue-500 | remplaçable |
| src/components/widgets/CalendarWidgetLegend.vue:52 | #f59e0b | (à créer) | besoin token #136 |
| src/components/widgets/CalendarWidgetLegend.vue:56 | #10b981 | (à créer) | besoin token #136 |
| src/components/widgets/NotificationItem.vue:104 | #eff6ff | --blue-50 | remplaçable |
| src/components/widgets/NotificationItem.vue:105 | #3b82f6 | --blue-500 | remplaçable |
| src/components/widgets/NotificationItem.vue:119 | #dbeafe | --info-bg/--blue-100 | remplaçable |
| src/components/widgets/NotificationItem.vue:120 | #1e40af | --info-text | remplaçable |
| src/components/widgets/NotificationItem.vue:124 | #d1fae5 | (à créer) | besoin token #136 |
| src/components/widgets/NotificationItem.vue:125 | #065f46 | (à créer) | besoin token #136 |
| src/components/widgets/NotificationItem.vue:129 | #fef3c7 | --warning-bg | remplaçable |
| src/components/widgets/NotificationItem.vue:130 | #92400e | (à créer) | besoin token #136 |
| src/components/widgets/NotificationItem.vue:134 | #fee2e2 | --error-bg | remplaçable |
| src/components/widgets/NotificationItem.vue:135 | #991b1b | --error-text | remplaçable |
| src/components/widgets/NotificationItem.vue:192 | #10b981 | (à créer) | besoin token #136 |
| src/components/widgets/NotificationItem.vue:196 | #d1fae5 | (à créer) | besoin token #136 |
| src/components/widgets/NotificationItem.vue:197 | #10b981 | (à créer) | besoin token #136 |
| src/components/widgets/NotificationItem.vue:201 | #ef4444 | (à créer) | besoin token #136 |
| src/components/widgets/NotificationItem.vue:205 | #fee2e2 | --error-bg | remplaçable |
| src/components/widgets/NotificationItem.vue:206 | #ef4444 | (à créer) | besoin token #136 |
| src/components/widgets/NotificationsWidget.vue:109 | rgba(0, 0, 0, 0.1) | --shadow-md | remplaçable |
| src/components/widgets/NotificationsWidget.vue:135 | #f59e0b | (à créer) | besoin token #136 |
| src/components/widgets/NotificationsWidget.vue:159 | #ef4444 | (à créer) | besoin token #136 |
| src/components/widgets/NotificationsWidget.vue:275 | #2563eb | (à créer) | besoin token #136 |

---

## #150 — Résolution des valeurs hex SANS token

> **Périmètre :** touche UNIQUEMENT `src/assets/styles/themes.css` (ajout de tokens) et le présent doc (mappings). **Aucun `.vue` modifié.** Les cibles ci-dessous seront appliquées dans une passe `.vue` ultérieure de #114.
> **Méthode :** fréquences re-comptées sur `dev` courant par `rg -oiN -g 'src/**/*.vue'` (valeurs exactes, insensible à la casse). Décision avec jugement — pas de mécanique : un token n'est créé que si la palette est *réellement* réutilisée et absente ; sinon mapping documenté vers le token sémantique #136 le plus proche, sans dupliquer de valeur.

### Tokens AJOUTÉS dans themes.css

1. **`--purple-*` (échelle Tailwind « purple » complète, `:root`).** Justifié par une réutilisation multi-fichiers réelle : `#f3e8ff` (8 occ.) en fond de badge + `#6b21a8` (2) en texte (type « quiz / évaluation »), `#e9d5ff` (3), `#c084fc` (1), plus les pleins `#a855f7`/`#9333ea` des stats institutions (déjà relevés « à créer » dans l'audit admin/). Teinte distincte du `--violet-*` existant (purple est plus magenta) → pas de fusion. Le commentaire « recurring purple tones consolidate here » du bloc violet a été retiré (n'est plus vrai).
2. **`--black` / `--white` (primitives neutres pures, `:root`).** `#000`/`#000000` (5 occ.) n'avaient aucun token : `--gray-900` vaut `#111827`, pas du noir pur. Ajout du couple invariant ; les surfaces doivent préférer `--bg-*`/`--text-*` adaptatifs.

> **Theme light + dark :** comme `--emerald-*`, `--violet-*`, `--sky-*`, `--gray-*` déjà en place, ces accents/neutres bruts sont **theme-invariant** et déclarés une seule fois dans `:root` (cf. bloc « RAW ACCENT PALETTE », l.58-68). L'adaptation light/dark reste portée par les tokens de surface sémantiques (`--success-*`, `--error-*`…), donc aucun bloc dupliqué dans `[data-theme="dark"]`. C'est la convention du fichier, suivie ici à dessein.

### Mappings documentés (aucun token créé — proche d'un sémantique #136)

| valeur | occ. | famille | décision | cible |
|---|---|---|---|---|
| #22c55e | 8 | vert (green-500, = accent success dark) | mapping | --color-success |
| #16a34a | 7 | vert (green-600) | mapping | --color-success-strong |
| #15803d | 5 | vert (green-700) | mapping | --color-success-strong |
| #4caf50 | 6 | vert (Material 500) | mapping | --color-success |
| #8bc34a | 6 | vert clair (Material, barème de notes) | mapping | --color-success (≈) |
| #f0fdf4 | 1 | vert (green-50, fond) | mapping | --color-success-bg |
| #f3e8ff | 8 | purple-100 | **token ajouté** | --purple-100 |
| #e9d5ff | 3 | purple-200 | **token ajouté** | --purple-200 |
| #c084fc | 1 | purple-400 | **token ajouté** | --purple-400 |
| #6b21a8 | 2 | purple-800 | **token ajouté** | --purple-800 |
| #9c27b0 | 1 | purple (Material 500) | mapping | --purple-500 (≈) |
| #673ab7 | 1 | deep purple (Material) | mapping | --violet-700 (≈) |
| #ff9800 | 6 | orange (Material 500) | mapping | --color-warning |
| #ff5722 | 5 | deep orange (Material, barème « insuffisant ») | mapping | --color-warning-strong (≈) |
| #fb923c | 1 | orange-400 | mapping | --color-warning |
| #ea580c | 1 | orange-600 | mapping | --color-warning-strong |
| #ffedd5 | 2 | orange-50 (fond) | mapping | --color-warning-bg |
| #fed7aa | 1 | orange-200 (fond) | mapping | --color-warning-bg |
| #ffb81c | 1 | or (brand loader) | mapping | --color-warning (≈, marque) |
| #f44336 | 7 | rouge (Material 500) | mapping | --color-danger |
| #be123c | 1 | rose-700 | mapping | --color-danger-strong |
| #06b6d4 | 3 | cyan-500 | mapping (pas de scale) | --sky-500 (≈) |
| #009688 | 1 | teal (Material) | mapping (pas de scale) | --sky-600 (≈) |
| #1e3a8a | 4 | navy (blue-900 TW) | mapping | --info-text (≈) |
| #1e6fd9 | 2 | bleu | mapping | --color-info (≈) |
| #1b3b6f | 2 | navy (brand loader) | mapping | --blue-700 (≈, marque) |
| #5a9df2 | 1 | bleu clair | mapping | --blue-400 (≈) |
| #4a90e2 | 1 | bleu | mapping | --blue-500 (≈) |
| #2d5a9e | 1 | bleu (brand loader) | mapping | --blue-600 (≈, marque) |
| #2196f3 | 1 | bleu (Material 500) | mapping | --color-info (≈) |
| #ffff00 | 1 | jaune pur (surbrillance) | mapping | --color-warning (≈) |
| #facc15 | 1 | yellow-400 | mapping | --color-warning |
| #eab308 | 1 | yellow-500 | mapping | --color-warning-strong |
| #a16207 | 1 | yellow-700 | mapping | --color-warning-text (≈) |
| #000 / #000000 | 5 | noir pur | **token ajouté** | --black |
| #ddd | 3 | gris clair | mapping | --gray-200 (≈) |
| #ccc | 3 | gris clair | mapping | --gray-300 (≈) |
| #2d3748 | 4 | gris foncé (ancien TW gray-800) | mapping | --gray-700 (≈) |
| #fce7f3 | 1 | rose (pink-100) | **one-off, non résolu** | aucune famille rose ; à inliner ou future `--pink-*` si réutilisé |

### Écarts de jugement (assumés, à challenger en revue)

- **Pas de scale `--teal-*`/`--cyan-*`** malgré la suggestion de l'issue : les données montrent 4 occurrences seulement (`#06b6d4` ×3, surtout en dégradés d'`EventDot`/éval ; `#009688` ×1 Material), réparties sur ~2 fichiers — réutilisation insuffisante pour justifier 10 tokens quasi-redondants avec `--sky-*`. Mapping vers `--sky-*` (cyan/info-adjacent) à la place. Si une famille cyan distincte émerge, créer `--cyan-*` à ce moment-là.
- **`#fce7f3` (pink-100, 1 occ.)** laissé non tokenisé : non récurrent, aucune famille rose et en créer une pour une occurrence serait de l'abstraction prématurée. Candidat à inliner ou à une famille `--pink-*` future.
- **`#8bc34a` / `#ff5722`** (Material light-green / deep-orange des barèmes de notes) mappés au sémantique le plus proche (success / warning-strong) : la teinte exacte diffère légèrement ; un design ultérieur pourra introduire une rampe de barème dédiée si nécessaire.

### Vérification #104 / #110 (faux positifs)

Confirmé non-couleurs : `#104` = `// Source UNIQUE du menu (#104)` (référence d'issue en commentaire) ; `#110` ne matche aucune occurrence dans `src/**/*.vue`. **Ignorés**, conformément à l'issue.

> **Note de comptage :** le titre de #150 annonce « 41 » valeurs ; le re-grep sur `dev` courant en identifie **40 distinctes** (toutes traitées ci-dessus). L'écart d'une unité vient probablement d'une valeur disparue depuis le relevé initial ou d'un double-comptage casse — aucune valeur récurrente n'est laissée sans résolution.
