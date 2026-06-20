# Convergence des formatters (#23-FE-1) — constat & stratégie

## Constat (vérifié 2026-06-19)

L'audit listait des dizaines de `formatDate`/`formatTime`/`formatDuration`/`getInitials`
locaux comme « duplication » à converger vers `src/utils/formatters.js`.

**Vérification fine : une grande partie n'est PAS une vraie duplication.** Les
formatters locaux ont des **formats et des replis intentionnellement différents** :

| Site | Constat parité vs canonique |
|---|---|
| `AttendanceDetailModal.formatDate` (`toLocaleDateString('fr-FR')`, repli `-`) | **Identique** → convergé via `formatDate(_, { fallback: '-' })` |
| `AttendanceDetailModal.formatTime` (HH:mm, repli `-`) | **Identique** → convergé via `formatTime(_, { fallback: '-' })` |
| `AttendanceDetailModal.formatDuration` | **Différent** : `Math.round` (≠ `Math.floor`) + « 45 min » (espace, ≠ « 45min ») → **gardé local** |
| `SeanceCard.formatTime` (HH:mm, repli `N/A`) | **Identique** → convergé via `formatTime(_, { fallback: 'N/A' })` |
| `SeanceCard.formatDate` (`weekday:'short', day:'numeric', month:'short'`) | **Aucun canonique strictement identique** → gardé local |
| `MatiereSeancesTab` / `MatiereEvaluationsTab` `formatDate`/`formatTime` | **Double repli** (`'Non défini'` pour null vs `'Date invalide'` pour date invalide) irreproductible avec un seul `fallback` → **gardé local** |
| `EvaluationCard.formatDate` (`toLocaleDateString` AVEC heure → virgule ICU) | Rendu « 19/06/2026, 14:30 » ≠ `formatDateTime` « 19/06/2026 14:30 » → **gardé local** |

## Règle de convergence (sûreté avant DRY)

- **Converger UNIQUEMENT** quand le format (options Intl + locale) ET le repli
  sont strictement reproductibles via le canonique + l'option `{ fallback }`.
- **Ne jamais homogénéiser** un format/repli différent (changerait l'affichage,
  aucune couverture de test visuel).
- Le repli local distinct est porté par `{ fallback }` ; le format reste défini
  une seule fois dans `utils/formatters.js` (gain DRY réel : la définition du
  format est centralisée).

## Portée livrée (PR1)

Convergence **strictement à parité** : `AttendanceDetailModal` (date + heure),
`SeanceCard` (heure). Le reste des sites est, après vérification, soit déjà
canonique, soit légitimement spécifique → **la dette #23-FE-1 est plus petite
qu'estimée** (beaucoup de faux positifs).

## Suite (à la demande)

Audit site par site des autres `formatDate/Time` : converger les rares cas à
parité exacte ; documenter les formats spécifiques restants comme intentionnels.
