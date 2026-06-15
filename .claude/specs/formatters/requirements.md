# Requirements Document — Centralisation des formatters et de la logique de plage de dates

## Introduction

Le frontend Vue 3 (`lms-frontend`) souffre d'une duplication massive de fonctions de
formatage et de logique de plage de dates, identifiée par l'audit (épique #16, issue #23,
TIER 1). Cette fonctionnalité vise à **éliminer cette duplication (DRY)** en centralisant :

1. les fonctions de formatage **pures et sans état** (date, heure, durée, initiales,
   troncature) dans un module utilitaire `src/utils/formatters.js` ;
2. la logique de plage de dates **avec état réactif** (période sélectionnée + bornes
   dérivées) dans un composable `src/composables/useDateRange.js`.

Cette séparation respecte le paradigme Vue (`vuejs.org/guide/reusability/composables.html`) :
une fonction pure relève d'un utilitaire, une logique stateful relève d'un composable.

### Contexte vérifié dans le code réel (grep + lecture, 2026-06-15)

Les chiffres de l'issue #23 ont été **revus à la hausse** après vérification directe :

| Symbole | Issue #23 | Constaté (définitions réelles) | Fichiers de référence lus |
|---|---|---|---|
| `formatDate` | 16 | **~32 définitions locales** | `evaluations/TeacherEvaluations.vue:742`, `admin/AdminSeances.vue:291`, `attendance/SeanceAttendanceHistory.vue:639`, `TeacherSeances.vue:636`, `seances/SeanceDetails.vue:493`, `admin/AdminInstitutions.vue:477` |
| `formatTime` | 7 | **~17 définitions locales** | `admin/AdminSeances.vue:301`, `seances/SeanceDetails.vue:523`, `QuizTake.vue:178`, `attendance/SeanceAttendanceHistory.vue:644` |
| `getInitials` | 4 | **6 définitions locales** | `attendance/SeanceAttendanceHistory.vue:674`, `admin/AdminEnseignants.vue:347`, `admin/AdminUsers.vue:376` |
| `formatDuration` | à vérifier | **5 occurrences** (2 méthodes de service + 3 composants) | `services/chapter.js:135`, `services/lesson.js:256`, `attendance/SeanceAttendanceHistory.vue:659`, `components/lessons/LessonCard.vue:153`, `components/visio/ParticipantsModal.vue:395` |
| `truncate` | présent | **1 occurrence avérée** (`truncateText`) | `student/StudentCourses.vue:235` |

**Constats déterminants relevés à la lecture (et qui conditionnent les exigences) :**

- **Variantes de format divergentes pour `formatDate`** : date courte `toLocaleDateString('fr-FR')`
  sans options ; date+heure (`day/month/year` 2-digit + `hour/minute`) ;
  long littéral (`day: 'numeric', month: 'long', year: 'numeric'`) ;
  `weekday: 'long'` complet ; `2-digit`/`short`. Les **chaînes de repli pour valeur nulle
  diffèrent selon les fichiers** : `'-'`, `'N/A'`, `'Aucune'`, `'Non définie'`, `'Non défini'`.
  La centralisation ne doit **pas** régresser le rendu visuel existant.
- **`formatTime` recouvre DEUX sémantiques distinctes** : (a) **heure de la journée** extraite
  d'une date (`toLocaleTimeString('fr-FR', { hour, minute })`) ; (b) **durée écoulée en
  secondes** formatée `mm:ss` dans les minuteurs (`QuizTake.vue:178`, `TakeEvaluation.vue`,
  `KnowledgeCheckPlayer.vue`). Ce sont **deux fonctions différentes** à ne pas fusionner.
- **`getInitials` recouvre DEUX signatures distinctes** : (a) `(name: string)` qui découpe sur
  les espaces (`SeanceAttendanceHistory.vue:674`, `dashboards/AdminDashboard.vue`) ;
  (b) `(objet)` qui lit `prenom`/`nom`/`name` (`admin/AdminEnseignants.vue:347`,
  `admin/AdminUsers.vue:376`).
- **Logique de plage de dates dupliquée mais SÉMANTIQUEMENT DIVERGENTE** :
  - `attendance/SeanceAttendanceHistory.vue` (`getPeriodDates`/`selectPeriod`, l.408/437) :
    presets `today/week/month/custom` ; **semaine débutant le dimanche** (`now.getDay()`) ;
    fin de plage = aujourd'hui ; bornes au **format local** via `formatDateInput`
    (`YYYY-MM-DD` construit à la main, sans décalage UTC).
  - `components/calendar/UniversalCalendar.vue` (`getDateRangeStart`/`getDateRangeEnd`, l.555/571) :
    presets `today/week/month/7days/30days/90days` ; **semaine débutant le lundi**
    (`getDay() + 1`) ; fin de plage = en avant ; bornes via `toISOString().split('T')[0]`
    (**UTC — bug de fuseau latent**). Embarque aussi son propre état de navigation
    (`currentDate`, `currentView`). La réconciliation de ces divergences est un **point de
    décision** que le design devra trancher ; les requirements l'imposent comme exigence.

### État de l'environnement (vérifié)

- `src/utils/` ne contient **aucun module métier** (le module rôles a migré en `src/constants/`
  lors de #18). `src/constants/` contient `roles.js` et `errorMessages.js` (gelés, hors périmètre).
  `src/composables/` contient `useNotifications`, `useTheme`, `useVisioParticipation`.
- **Vitest installé (#21)**. `vitest.config.js` : `include: ['tests/**/*.test.{js,mjs}',
  'src/**/*.test.{js,mjs}']`, `environment: 'jsdom'`, `globals: true`, alias `@` ; la
  **couverture inclut déjà `src/utils/**`, `src/composables/**`, `src/services/**`**.
  Convention de test observée (`tests/unit/roles.test.js`) : `import { describe, it, expect }
  from 'vitest'`, imports applicatifs via l'alias `@/`.

### Hors périmètre explicite

- `getStatusColor` / `getStatusBadgeClass` (logique de statut métier, pas du formatage pur).
- Les god components (#28) ; les comparaisons de rôle (#18-FE-2).
- **Aucune modification backend.**

### Conformité

Respect de `PRODUCTION_STANDARDS` (§1.1 tailles, §1.3 tests, §5 hardening, DRY/Q5) et de
`CONTRIBUTING`. La migration peut être **incrémentale** (fichiers les plus dupliqués d'abord),
toute dette de portée étant **explicitement tracée** ; le design tranchera l'ampleur.

---

## Requirements

### Requirement 1 — Module utilitaire pur de formatage

**User Story:** En tant que développeur frontend, je veux un module unique `src/utils/formatters.js`
exposant les fonctions de formatage centralisées, afin de supprimer la duplication et de disposer
d'une seule source de vérité testable en isolation.

#### Acceptance Criteria

1. WHERE le formatage est une transformation pure sans état, le système SHALL exposer ces
   fonctions depuis `src/utils/formatters.js` et NON depuis un composable.
2. WHEN le module est importé, le système SHALL exposer au minimum `formatDate`, `formatTime`,
   `formatDuration`, `getInitials` et `truncate` en exports nommés.
3. WHEN une fonction de `formatters.js` est appelée plusieurs fois avec la même entrée
   (entrée non dépendante de l'horloge), le système SHALL retourner un résultat identique
   (fonctions pures et déterministes).
4. WHERE une fonction de formatage ne dépend d'aucun état réactif Vue, le système SHALL
   l'implémenter sans `ref`/`reactive`/`computed` ni cycle de vie de composant.
5. WHEN le module est écrit, le système SHALL respecter les contraintes de taille de
   PRODUCTION_STANDARDS §1.1 (fichier et fonctions de taille raisonnable, une responsabilité
   par fonction) ; IF le fichier dépasse le seuil, THEN le système SHALL scinder en
   sous-modules cohérents (ex. dates vs texte) ré-exportés.

### Requirement 2 — Couverture des variantes de format sans perte de fonctionnalité

**User Story:** En tant que développeur frontend, je veux que l'API centralisée couvre toutes les
variantes de format réellement utilisées, afin de migrer sans régression visuelle pour l'utilisateur.

#### Acceptance Criteria

1. WHEN le design est rédigé, le système SHALL recenser les variantes existantes de `formatDate`
   et `formatTime` (date courte ; date+heure ; littéral long `month: 'long'` ; `weekday` ;
   `2-digit`/`short`/`numeric`) à partir des fichiers de référence cités en introduction.
2. WHERE plusieurs variantes de date coexistent, le système SHALL fournir une API qui les couvre
   toutes (paramètre d'options et/ou fonctions dédiées) SANS perte de fonctionnalité.
3. WHEN `formatDate`/`formatTime`/`formatDuration`/`getInitials`/`truncate` reçoit une valeur
   `null`, `undefined`, une date invalide ou une chaîne non parsable, le système SHALL retourner
   une chaîne de repli sûre et NE SHALL PAS lever d'exception ni produire `"Invalid Date"`/`"NaN"`.
4. WHERE les composants d'origine utilisent des chaînes de repli différentes (`'-'`, `'N/A'`,
   `'Aucune'`, `'Non définie'`, `'Non défini'`), le système SHALL permettre de préserver le repli
   d'affichage attendu par chaque appelant (ex. repli paramétrable avec défaut documenté), afin
   de garantir la non-régression.
5. WHERE `formatTime` recouvre deux sémantiques distinctes (heure de la journée vs durée écoulée
   en secondes `mm:ss`), le système SHALL les exposer comme **deux fonctions séparées et nommées
   distinctement**, sans conflation.
6. WHERE `getInitials` recouvre deux signatures (chaîne `name` vs objet `{prenom, nom, name}`),
   le système SHALL couvrir les deux usages sans perte de comportement (signature unifiée
   documentée ou variantes explicites), avec repli sûr (`'?'`) sur entrée vide.
7. WHEN `formatDate`/`formatTime` formate une valeur valide, le système SHALL produire une sortie
   en locale française (`fr-FR`), conforme au rendu actuel.

### Requirement 3 — Composable stateful `useDateRange`

**User Story:** En tant que développeur frontend, je veux un composable `useDateRange` encapsulant
la logique réactive de plage de dates, afin que `SeanceAttendanceHistory.vue` et
`UniversalCalendar.vue` partagent une seule implémentation au lieu de deux divergentes.

#### Acceptance Criteria

1. WHERE la logique de plage de dates est stateful (période sélectionnée réactive + bornes
   dérivées), le système SHALL l'encapsuler dans `src/composables/useDateRange.js` et NON dans
   `src/utils/`.
2. WHEN `useDateRange` est invoqué, le système SHALL retourner un état réactif (refs) de la
   période sélectionnée et des bornes dérivées (début / fin), conformément aux conventions Vue
   des composables (préfixe `use`, retour de refs).
3. WHEN la période sélectionnée change, le système SHALL recalculer les bornes dérivées de façon
   réactive (`watch`/`computed`), sans appel manuel impératif de la part de l'appelant.
4. WHEN le design est rédigé, le système SHALL **réconcilier explicitement les divergences
   sémantiques** entre les deux implémentations existantes : (a) début de semaine
   dimanche vs lundi ; (b) calcul des bornes en heure **locale** (`formatDateInput`) vs **UTC**
   (`toISOString().split('T')[0]`) ; (c) ensembles de presets différents
   (`today/week/month/custom` vs `today/week/month/7days/30days/90days`). La décision retenue
   SHALL être documentée et justifiée.
5. WHERE le calcul de bornes via `toISOString().split('T')[0]` introduit un décalage de fuseau
   (bug latent constaté dans `UniversalCalendar.vue`), le système SHALL produire des bornes
   correctes dans le fuseau de l'utilisateur (pas de glissement de jour).
6. WHEN `useDateRange` supporte une période personnalisée (`custom`), le système SHALL exposer
   un moyen de fournir les bornes de début/fin et les refléter dans les bornes dérivées.
7. IF le composable alloue des ressources nécessitant un nettoyage (timers/watchers), THEN le
   système SHALL libérer ces ressources via le cycle de vie approprié (`onScopeDispose`/`onUnmounted`).

### Requirement 4 — Migration des appelants vers le module centralisé (non-régression)

**User Story:** En tant que mainteneur, je veux que les redéfinitions locales soient remplacées par
des imports du module centralisé, afin que la duplication disparaisse réellement tout en préservant
l'affichage existant.

#### Acceptance Criteria

1. WHEN un composant qui redéfinissait localement `formatDate`/`formatTime`/`formatDuration`/
   `getInitials`/`truncate` est migré, le système SHALL importer la fonction depuis le module
   centralisé et SHALL supprimer la définition locale correspondante.
2. WHEN un composant migré rend une même entrée, le système SHALL produire **le même rendu
   d'affichage** qu'avant la migration (non-régression comportementale).
3. WHERE `formatDuration` existe comme méthode d'objet de service (`services/chapter.js:135`,
   `services/lesson.js:256`), le système SHALL faire déléguer ces méthodes à la fonction
   centralisée OU les remplacer par celle-ci, sans changer la sortie observable des appelants.
4. IF le périmètre complet de migration (tous les fichiers identifiés) ne peut être couvert dans
   l'itération, THEN le système SHALL prioriser les fichiers les plus dupliqués et SHALL **tracer
   explicitement la dette résiduelle** (fichiers restants, raison), conformément à
   PRODUCTION_STANDARDS, le design fixant l'ampleur exacte.
5. WHEN la migration est terminée pour un symbole donné dans son périmètre, le système SHALL ne
   laisser subsister **aucune** définition locale dupliquée de ce symbole dans les fichiers
   couverts (vérifiable par grep).
6. WHEN un composant est migré, le système SHALL préserver la chaîne de repli d'affichage que ce
   composant utilisait pour les valeurs nulles/invalides (cf. Requirement 2.4).

### Requirement 5 — Tests Vitest (utils purs + composable)

**User Story:** En tant que mainteneur, je veux des tests automatisés couvrant chaque fonction et le
composable, afin de garantir le comportement et de prévenir les régressions futures.

#### Acceptance Criteria

1. WHERE une fonction est exposée par `formatters.js`, le système SHALL fournir des tests Vitest
   couvrant le **happy path** ET les **cas limites** (`null`, `undefined`, date invalide, chaîne
   non parsable, chaîne vide, entrée plus courte que la troncature).
2. WHEN les minuteurs `formatTime` (durée en secondes) sont testés, le système SHALL vérifier le
   format `mm:ss` y compris le rembourrage des secondes (ex. `5` → `0:05`).
3. WHERE `getInitials` couvre deux usages (chaîne / objet), le système SHALL tester les deux,
   y compris nom unique, nom composé et entrée vide (repli `'?'`).
4. WHEN `useDateRange` est testé, le système SHALL vérifier que chaque preset produit des bornes
   début/fin correctes ET que la sélection d'une nouvelle période met à jour réactivement les
   bornes dérivées.
5. WHEN le calcul de bornes est testé, le système SHALL inclure un test du **comportement de
   fuseau** garantissant l'absence de glissement de jour (cf. Requirement 3.5).
6. WHERE le projet impose une convention de tests, le système SHALL nommer les fichiers
   `*.test.{js,mjs}` (collectés par `vitest.config.js`), utiliser `import { describe, it, expect }
   from 'vitest'` et l'alias `@/` pour les imports applicatifs, conformément à
   `tests/unit/roles.test.js`.
7. WHEN la suite de tests est exécutée, le système SHALL passer entièrement (aucun test échouant,
   aucune régression sur les suites existantes).

### Requirement 6 — Conformité au paradigme Vue (pur → utils, stateful → composable)

**User Story:** En tant qu'architecte, je veux que la séparation pur/stateful soit strictement
respectée, afin que le code reste cohérent avec le paradigme Vue et facilement réutilisable.

#### Acceptance Criteria

1. WHERE une fonction est sans état et déterministe (formatage de date/heure/durée, initiales,
   troncature), le système SHALL la placer dans `src/utils/` et NE SHALL PAS la placer dans un
   composable.
2. WHERE la logique est stateful et réactive (plage de dates), le système SHALL la placer dans un
   composable `use*` et NE SHALL PAS la dupliquer en utilitaire pur.
3. WHEN les modules sont créés, le système SHALL n'introduire **aucune** dépendance des utils purs
   envers l'API de réactivité Vue (`ref`/`reactive`/`computed`/cycle de vie).
4. WHERE un symbole hors périmètre est rencontré (`getStatusColor`, `getStatusBadgeClass`,
   comparaisons de rôle, god components), le système SHALL le laisser inchangé et NE SHALL PAS
   l'intégrer à ce module.

---

## Traçabilité (objectifs de l'issue #23 → exigences)

| Objectif #23 | Exigence(s) |
|---|---|
| 1. Module pur `formatters.js` (formatDate/Time/Duration/getInitials/truncate) | R1, R6.1, R6.3 |
| 2. Couvrir les variantes de format + cas limites null/invalide | R2 |
| 3. Composable `useDateRange` stateful réutilisable | R3, R6.2 |
| 4. Remplacer les redéfinitions locales sans régression | R4 |
| 5. Tests Vitest (fonctions + composable) | R5 |
| 6. Conformité paradigme (pur→utils, stateful→composable) | R6 |
| Contraintes (no backend, DRY, tailles, dette tracée) | R1.5, R4.4, intro Conformité |
| Hors périmètre (statut, god components, rôles) | R6.4, intro Hors périmètre |
