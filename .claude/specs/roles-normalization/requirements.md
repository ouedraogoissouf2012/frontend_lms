# Requirements Document — Normalisation des rôles (frontend)

> Issue GitHub #18 — TIER 0 CRITICAL de la roadmap d'audit (épique #16).
> Recoupe #8 (superAdmin voyait le menu enseignant) et #12 (guard router trop permissif).
> Dépôt : `lms-frontend` (Vue 3). Aucune modification backend autorisée.

## Introduction

Le contrôle d'accès du frontend repose aujourd'hui sur des comparaisons de chaînes
de rôles **brutes**, dispersées et incohérentes. Le presenter de login backend
(`AuthResponsePresenter.php`) renvoie `data.user.role` = la valeur DB **non
normalisée** : l'enum backend `Role` documente que `users.role` peut contenir
n'importe quel alias (`'supradmin'` ou `'superAdmin'`, `'etudiant'`/`'student'`/
`'étudiant'`, `'enseignant'`/`'teacher'`, `'coordinateur'`/`'coordinator'`,
`'admin'`/`'administrateur'`). Le frontend reçoit donc une valeur **imprévisible**
et la compare telle quelle.

État vérifié sur le code réel (par lecture + grep, 2026-06-13) :

- **55** comparaisons inline `role === '...'` réparties sur **19** fichiers ; **179**
  occurrences liées aux rôles sur **33** fichiers (`src/`).
- `src/utils/roles.js` : `ROLES` **n'est PAS gelé** (mutable) ; **incomplet** — définit
  `SUPER_ADMIN: 'superAdmin'` mais **aucune** clé canonique `supradmin`, `admin` ni
  `coordinateur` ; **n'accepte aucun alias** (zéro normalisation) ; **largement ignoré**
  (les 55 comparaisons inline ne l'utilisent pas).
- Incohérence `supradmin` vs `superAdmin` :
  - `src/router/index.js` ne connaît que `'supradmin'` (lignes 66, 83, 226, 675, 704, 725).
  - `src/components/layout/MobileSidebar.vue` mélange `'superAdmin'` (l.160, 381) et
    `'supradmin'` (l.150, 381).
  - `src/components/layout/Navbar.vue` teste les **deux** (l.146, 160).
  - `src/components/layout/Sidebar.vue` mélange les deux.
  - `src/components/layout/MobileHeader.vue` ne connaît que `'superAdmin'` (l.122).
  - `src/components/layout/BottomNavigation.vue` ne connaît ni l'un ni l'autre pour l'admin.
- `src/services/api.js` (bloc `auth`) : `getUserRole`, `hasRole`, `isAdmin`
  (`['superAdmin','coordinateur','secretaire']`), `isTeacher`, `isStudent`,
  `isSupradmin` (`['supradmin']`) — tous comparent des chaînes **brutes** sans
  normalisation.
- Le guard `router.beforeEach` **duplique 4×** la logique de redirection par rôle
  (l. 66-75, 83-84, 704-714, 728-738) et applique un **bypass supradmin** (l. 725)
  sur la chaîne brute `'supradmin'` — un utilisateur renvoyé `'superAdmin'` ne
  bénéficie pas de ce bypass, et inversement les routes `roles: ['superAdmin', ...]`
  ne matchent jamais un `'supradmin'`.

**Booléens serveur — anti-prémisse-fausse (vérifié sur `AuthResponsePresenter.php`) :**
les deux booléens serveur ne sont **pas** une source fiable unique.

- Flux LOGIN LOCAL (`successfulLocal`, l. 36-59) : expose `meta.is_supradmin`
  (calculé serveur via l'enum, l. 54) **mais aucun** `is_admin`.
- Flux LOGIN KLASSCI (`successfulKlassci`, l. 68-108) : expose `data.user.is_admin`
  (l. 93) **mais brut** (`$klassciUser['is_admin'] ?? false`, **non** enum-dérivé)
  **et aucun** `is_supradmin`.

Conséquence : les deux booléens sont à des **emplacements différents** (`meta` vs
`data.user`), **ne sont pas tous deux présents** dans chaque flux, et `is_admin`
**n'est pas** enum-dérivé. Le frontend **NE PEUT PAS** fonder le contrôle d'accès
sur un unique booléen serveur. La **source canonique** côté frontend doit donc être
un **enum gelé** + une fonction `normalizeRole(raw)` qui reproduit **exactement** la
table d'alias de `Role::tryFromString` du backend. Les booléens serveur ne sont
qu'un signal **secondaire** de cohérence, là où ils existent.

Cette fonctionnalité **pose le QUOI** (exigences vérifiables). Le **COMMENT**
(emplacement exact de l'enum — `utils` vs `constants` —, big-bang vs migration
incrémentale des 55 sites) relève du document de design.

### Périmètre

**Inclus :** enum de rôles gelé, `normalizeRole`, helpers dérivés, refonte du guard
router, correction de l'incohérence `supradmin`/`superAdmin` dans le router et les
6 composants de layout, tests Vitest de non-régression (#8, #12).

**Exclu :** toute modification backend ; toute correction de l'incohérence backend
(`is_admin` non enum-dérivé) — à signaler comme dette/issue séparée, pas à corriger ici.

### Glossaire

- **Rôle brut** : valeur reçue du backend dans `data.user.role`, potentiellement un alias.
- **Rôle canonique** : l'une des 5 valeurs gelées (`etudiant`, `enseignant`,
  `coordinateur`, `admin`, `supradmin`) — casse alignée sur le backend (`'supradmin'`
  minuscule).
- **Rôle normalisé** : résultat de `normalizeRole(brut)` ∈ {valeurs canoniques} ∪ {`null`}.
- **Fail-secure** : un rôle non reconnu n'octroie **aucun** privilège.

---

## Requirements

### Requirement 1 — Enum de rôles canonique, gelé et unique

**User Story:** En tant que développeur du frontend, je veux une source unique et
immuable des rôles canoniques alignée sur l'enum backend, afin qu'aucune partie du
code ne puisse muter la liste des rôles ni diverger des valeurs autorisées.

#### Acceptance Criteria

1. WHERE le frontend définit les rôles, le système SHALL exposer un objet enum unique
   contenant exactement les 5 valeurs canoniques : `etudiant`, `enseignant`,
   `coordinateur`, `admin`, `supradmin`.
2. WHERE la casse canonique du super-administrateur plateforme est définie, le système
   SHALL utiliser `'supradmin'` (minuscule) pour s'aligner sur l'enum backend `Role`.
3. WHEN l'objet enum est défini, le système SHALL le geler via `Object.freeze` de sorte
   qu'aucune réassignation ni ajout de propriété ne soit possible à l'exécution.
4. IF du code tente de muter une propriété de l'enum en mode strict, THEN le système
   SHALL lever une erreur (et en mode non strict, l'écriture SHALL être silencieusement
   ignorée sans altérer l'enum).
5. WHERE les rôles canoniques sont consommés (router, services, composants), le système
   SHALL référencer cet enum unique et NE SHALL PAS redéfinir de liste de rôles
   concurrente ailleurs.
6. WHERE l'enum est défini, le système SHALL documenter la correspondance 1:1 avec
   `app/Enums/Role.php` du backend et la contrainte « aucune modification backend ».

### Requirement 2 — Fonction `normalizeRole(raw)` reproduisant la table d'alias backend

**User Story:** En tant que système de contrôle d'accès, je veux convertir toute valeur
de rôle brute reçue du backend en rôle canonique, afin que la décision d'accès soit
identique quelle que soit la variante d'alias renvoyée.

#### Acceptance Criteria

1. WHEN `normalizeRole(raw)` reçoit `'supradmin'` ou `'superAdmin'`, THEN le système
   SHALL retourner le rôle canonique `supradmin`.
2. WHEN `normalizeRole(raw)` reçoit `'etudiant'`, `'student'` ou `'étudiant'`, THEN le
   système SHALL retourner le rôle canonique `etudiant`.
3. WHEN `normalizeRole(raw)` reçoit `'enseignant'` ou `'teacher'`, THEN le système SHALL
   retourner le rôle canonique `enseignant`.
4. WHEN `normalizeRole(raw)` reçoit `'coordinateur'` ou `'coordinator'`, THEN le système
   SHALL retourner le rôle canonique `coordinateur`.
5. WHEN `normalizeRole(raw)` reçoit `'admin'` ou `'administrateur'`, THEN le système
   SHALL retourner le rôle canonique `admin`.
6. WHEN `normalizeRole(raw)` reçoit une valeur non reconnue (toute chaîne hors table
   d'alias), THEN le système SHALL retourner `null` (fail-soft) et NE SHALL PAS lever
   d'exception.
7. WHEN `normalizeRole(raw)` reçoit `null`, `undefined`, une chaîne vide ou une valeur
   non-chaîne, THEN le système SHALL retourner `null` sans lever d'exception.
8. WHERE la table d'alias est implémentée, le système SHALL la maintenir **identique**
   à `Role::tryFromString` du backend ; toute divergence constatée SHALL être tracée
   comme dette et NE SHALL PAS être résolue par une modification backend.
9. WHILE `normalizeRole` traite une valeur, le système SHALL traiter la casse de manière
   déterministe et documentée (la table couvre explicitement les variantes connues
   `superAdmin`/`supradmin` ; toute autre variante de casse hors table retombe en
   `null`).

### Requirement 3 — Helpers d'autorisation dérivés du rôle normalisé

**User Story:** En tant que développeur, je veux des helpers (`isAdmin`, `isSupradmin`,
`isTeacher`, `isStudent`, `hasRole`, `getDashboardRoute`) qui raisonnent sur le rôle
**normalisé**, afin de ne plus jamais comparer de chaîne brute pour décider d'un accès.

#### Acceptance Criteria

1. WHEN un helper d'autorisation évalue un utilisateur, THEN le système SHALL d'abord
   normaliser le rôle via `normalizeRole` puis décider sur la valeur canonique.
2. WHEN `hasRole(user, roles)` est appelé, THEN le système SHALL comparer le rôle
   **normalisé** de l'utilisateur aux rôles **canoniques** attendus (eux-mêmes
   normalisés si exprimés par alias).
3. WHEN `isSupradmin` est évalué, THEN le système SHALL retourner vrai si et seulement
   si le rôle normalisé est `supradmin`.
4. WHEN `isAdmin` est évalué, THEN le système SHALL retourner vrai pour les rôles
   normalisés correspondant au périmètre administratif défini, et le système SHALL
   documenter explicitement quels rôles canoniques composent ce périmètre.
5. WHEN `isTeacher` est évalué, THEN le système SHALL retourner vrai si et seulement si
   le rôle normalisé est `enseignant`.
6. WHEN `isStudent` est évalué, THEN le système SHALL retourner vrai si et seulement si
   le rôle normalisé est `etudiant`.
7. WHEN `getDashboardRoute(user)` est appelé pour un rôle normalisé connu, THEN le
   système SHALL retourner la route de dashboard correspondant à ce rôle.
8. IF un helper reçoit un utilisateur sans rôle, avec un rôle inconnu ou `null`, THEN le
   système SHALL retourner une décision **fail-secure** (faux pour les helpers booléens ;
   route neutre login/dashboard pour `getDashboardRoute`).
9. WHERE un helper existant de `src/utils/roles.js` ou `src/services/api.js` est conservé
   (`getDashboardRoute`, `hasRole`, `isAdmin`, `isTeacher`, `isStudent`, `isSupradmin`,
   `getUserRole`, `getRoleDisplayName`), le système SHALL préserver sa signature publique
   ou fournir un chemin de migration documenté, sans casser les appelants existants.

### Requirement 4 — Élimination des comparaisons de rôles brutes (router + layout)

**User Story:** En tant que mainteneur, je veux que les comparaisons de rôles en dur
soient remplacées par l'enum et les helpers, afin de supprimer la dérive et de
centraliser la logique d'accès.

#### Acceptance Criteria

1. WHERE le router (`src/router/index.js`) décide d'un accès ou d'une redirection par
   rôle, le système SHALL utiliser l'enum et les helpers normalisés et NE SHALL PAS
   comparer de chaîne de rôle en dur.
2. WHERE les composants de layout `Sidebar.vue`, `MobileSidebar.vue`, `MobileHeader.vue`,
   `Navbar.vue` et `BottomNavigation.vue` conditionnent l'affichage selon le rôle, le
   système SHALL utiliser l'enum et les helpers normalisés.
3. WHEN un libellé de rôle est affiché à l'utilisateur, THEN le système SHALL dériver ce
   libellé du rôle **normalisé** via une fonction unique (`getRoleDisplayName`), et NE
   SHALL PAS recourir à des tables de libellés locales divergentes par composant.
4. WHERE des comparaisons inline `role === '...'` subsistent après migration, le système
   SHALL les avoir réduites depuis l'état initial vérifié (55 occurrences sur 19 fichiers)
   au moins dans le router et les 6 composants de layout ; tout site non encore migré
   SHALL être tracé explicitement comme dette résiduelle.
5. WHILE la migration est partielle, le système SHALL garantir que les sites migrés et
   non migrés produisent la **même** décision d'accès pour un même utilisateur (pas de
   régression d'autorisation pendant la transition).

### Requirement 5 — Cohérence `supradmin`/`superAdmin` résolue partout (#8, #12)

**User Story:** En tant que super-administrateur plateforme, je veux que mon rôle soit
reconnu de manière identique quelle que soit la variante d'alias renvoyée, afin que les
menus et les accès soient corrects et cohérents.

#### Acceptance Criteria

1. WHEN le backend renvoie le rôle sous la forme `'superAdmin'` ou `'supradmin'`, THEN le
   système SHALL produire la **même** décision d'accès et le **même** rendu de menu après
   normalisation.
2. WHEN un utilisateur supradmin est connecté (régression #8), THEN le système SHALL NE
   PAS afficher le menu/les entrées réservés à l'enseignant à moins que l'enseignant ne
   fasse explicitement partie du périmètre supradmin documenté.
3. WHEN un coordinateur tente d'accéder à une route réservée au supradmin (régression
   #12), THEN le système SHALL refuser l'accès et rediriger vers son dashboard approprié.
4. WHERE le bypass d'accès supradmin du router est appliqué, le système SHALL fonder ce
   bypass sur le rôle **normalisé** `supradmin` et NON sur la chaîne brute `'supradmin'`.
5. WHERE une route déclare `roles: [...]` mélangeant variantes (`'superAdmin'` ailleurs,
   `'supradmin'` dans le router), le système SHALL évaluer l'appartenance après
   normalisation de part et d'autre, de sorte qu'aucune route ne soit inatteignable à
   cause d'une variante de casse.

### Requirement 6 — Guard du router centralisé et non dupliqué

**User Story:** En tant que mainteneur, je veux que la logique d'autorisation et de
redirection du guard router soit centralisée et non dupliquée, afin d'éliminer les 4
copies de la logique de rôle et leurs divergences.

#### Acceptance Criteria

1. WHERE `router.beforeEach` décide l'accès à une route protégée, le système SHALL
   déléguer la décision aux helpers normalisés (`hasRole`/`isSupradmin`/…) et NE SHALL
   PAS dupliquer la logique de rôle inline.
2. WHERE le guard calcule la redirection par défaut d'un utilisateur (entrée racine,
   utilisateur connecté arrivant sur login, accès refusé), le système SHALL utiliser une
   **seule** fonction (`getDashboardRoute` ou équivalent) et NE SHALL PAS répéter la
   cascade de `if (role === ...)` (aujourd'hui dupliquée 4×).
3. WHEN une route déclare `meta.roles` et qu'un utilisateur authentifié y navigue, THEN
   le système SHALL autoriser l'accès si et seulement si le rôle normalisé appartient aux
   rôles requis (normalisés) ou satisfait le bypass supradmin normalisé.
4. WHEN un utilisateur authentifié dont le rôle est requis est absent navigue vers une
   route protégée, THEN le système SHALL le rediriger vers son dashboard approprié sans
   le déconnecter.
5. WHILE le guard s'exécute, le système SHALL produire une décision déterministe et
   identique pour deux requêtes équivalentes ne différant que par la variante d'alias du
   rôle.

### Requirement 7 — Booléens serveur en signal secondaire uniquement

**User Story:** En tant qu'architecte sécurité, je veux que les booléens serveur
(`meta.is_supradmin`, `data.user.is_admin`) ne servent jamais d'unique source
d'autorisation, afin que le contrôle d'accès reste fiable malgré leur incohérence
backend documentée.

#### Acceptance Criteria

1. WHERE une décision d'accès est prise, le système SHALL fonder cette décision sur le
   rôle **normalisé** comme source canonique, et NE SHALL PAS fonder une décision d'accès
   sur un unique booléen serveur.
2. WHERE le flux login local fournit `meta.is_supradmin` (déjà stocké en session par
   `api.js`), le système MAY l'utiliser comme signal **secondaire** de cohérence/
   vérification, sans en faire la source d'autorisation.
3. WHEN le booléen serveur disponible **contredit** le rôle normalisé, THEN le système
   SHALL privilégier le rôle normalisé pour la décision d'accès et SHALL journaliser
   l'incohérence pour diagnostic.
4. WHERE le flux KLASSCI fournit `data.user.is_admin` brut (non enum-dérivé), le système
   SHALL NE PAS s'y fier comme preuve d'autorisation et SHALL tracer cette incohérence
   backend comme dette/issue séparée sans la corriger côté backend.
5. WHERE un booléen serveur attendu est **absent** dans un flux (pas de `is_admin` en
   local, pas de `is_supradmin` en KLASSCI), le système SHALL fonctionner normalement en
   s'appuyant sur le rôle normalisé, sans dégradation ni élargissement d'accès.

### Requirement 8 — Fail-secure sur rôle inconnu (sécurité, PRODUCTION_STANDARDS §1.6)

**User Story:** En tant que responsable sécurité, je veux qu'un rôle non reconnu n'octroie
jamais d'accès, afin qu'une valeur inattendue (corruption, nouvel alias backend non mappé,
altération) ne puisse pas élargir les privilèges.

#### Acceptance Criteria

1. WHEN `normalizeRole` retourne `null` (rôle inconnu), THEN le système SHALL traiter
   l'utilisateur comme **n'ayant aucun privilège** de rôle.
2. WHEN un utilisateur au rôle inconnu navigue vers une route protégée par `meta.roles`,
   THEN le système SHALL refuser l'accès et rediriger vers une destination neutre
   (login ou dashboard générique) sans octroyer d'accès administratif.
3. IF un rôle inconnu est rencontré, THEN le système SHALL NE JAMAIS élargir l'accès par
   défaut (pas de « fallback permissif ») et SHALL appliquer le principe du moindre
   privilège.
4. WHEN un rôle inconnu est détecté, THEN le système SHALL journaliser l'événement de
   manière exploitable (sans exposer de données sensibles) pour permettre l'ajout
   ultérieur d'un alias manquant.
5. WHERE l'affichage dépend du rôle, le système SHALL masquer par défaut les éléments
   réservés lorsqu'aucun rôle normalisé n'est déterminé.

### Requirement 9 — Couverture de tests Vitest et non-régression (PRODUCTION_STANDARDS §1.3)

**User Story:** En tant qu'équipe, je veux des tests automatisés couvrant la normalisation
et les régressions connues, afin de garantir que #8 et #12 ne réapparaissent pas et que
tout alias est correctement mappé.

#### Acceptance Criteria

1. WHERE la suite de tests est exécutée, le système SHALL s'appuyer sur Vitest (#21) et
   sur le fichier existant `tests/unit/roles.test.js`, en le **mettant à jour** sans
   casser les cas valides existants.
2. WHEN les tests de `normalizeRole` s'exécutent, THEN le système SHALL vérifier que
   **chaque** alias de la table (`supradmin`/`superAdmin`, `etudiant`/`student`/`étudiant`,
   `enseignant`/`teacher`, `coordinateur`/`coordinator`, `admin`/`administrateur`) mappe
   vers le rôle canonique attendu.
3. WHEN les tests des cas limites s'exécutent, THEN le système SHALL vérifier que `null`,
   `undefined`, chaîne vide, valeur non-chaîne et alias inconnu retournent `null`.
4. WHEN le test de régression #8 s'exécute, THEN le système SHALL vérifier qu'un
   utilisateur supradmin (renvoyé en `supradmin` **et** en `superAdmin`) NE voit PAS les
   entrées de menu réservées à l'enseignant (sauf périmètre documenté).
5. WHEN le test de régression #12 s'exécute, THEN le système SHALL vérifier qu'un
   coordinateur est **refusé** sur une route réservée au supradmin et redirigé vers son
   dashboard.
6. WHEN le test multi-variant s'exécute, THEN le système SHALL vérifier qu'un même
   utilisateur renvoyé tantôt `superAdmin` tantôt `supradmin` produit la **même** décision
   d'accès et la **même** route de dashboard.
7. WHEN les tests des helpers s'exécutent, THEN le système SHALL vérifier `isAdmin`,
   `isSupradmin`, `isTeacher`, `isStudent`, `hasRole` et `getDashboardRoute` sur des
   rôles exprimés par **alias** (pas seulement par valeur canonique).

---

## Exigences non fonctionnelles

### NFR-1 — Conformité aux standards de production

1. WHERE du code est ajouté ou modifié, le système SHALL respecter PRODUCTION_STANDARDS
   §1.1 (limites de lignes par fichier/fonction), §1.6 (SOLID, sécurité, moindre
   privilège) et §5, ainsi que le guide CONTRIBUTING du dépôt.
2. WHERE un raccourci est techniquement inévitable, le système SHALL le déclarer
   explicitement comme **dette tracée** (issue/commentaire) et NE SHALL PAS le masquer.

### NFR-2 — Aucune modification backend

1. WHERE une incohérence backend gêne le frontend (`is_admin` non enum-dérivé, alias
   multiples), le système SHALL aligner le **frontend** sur le backend et SHALL signaler
   l'incohérence comme dette/issue séparée, sans modifier le backend dans cette
   fonctionnalité.

### NFR-3 — Déterminisme et observabilité

1. WHEN une décision d'accès est calculée, le système SHALL être déterministe pour une
   même entrée (rôle + route).
2. WHERE une incohérence de rôle ou un rôle inconnu est rencontré, le système SHALL
   journaliser un message exploitable et sans donnée sensible (en cohérence avec la
   désactivation des `console.log` en production, #15).

### NFR-4 — Compatibilité ascendante de la migration

1. WHILE la migration des 55 sites est en cours, le système SHALL préserver le
   comportement d'accès observable pour les utilisateurs légitimes et NE SHALL PAS
   introduire de régression d'autorisation entre sites migrés et non migrés.

---

## Traçabilité

| Exigence | Objectif source | Issues |
|----------|-----------------|--------|
| R1 | Enum gelé, valeurs canoniques alignées backend | #18 |
| R2 | `normalizeRole` = table d'alias `Role::tryFromString` | #18 |
| R3 | Helpers dérivés du rôle normalisé | #18 |
| R4 | Remplacement des 55 comparaisons inline / 179 occurrences | #18 |
| R5 | Cohérence `supradmin`/`superAdmin` | #8, #12, #18 |
| R6 | Guard router centralisé (4× dédupliqué) | #12, #18 |
| R7 | Booléens serveur en signal secondaire (anti-prémisse-fausse) | #18 |
| R8 | Fail-secure sur rôle inconnu | §1.6, #18 |
| R9 | Tests Vitest + régressions #8/#12 + multi-variant | §1.3, #8, #12, #18, #21 |

> Le design tranchera : (a) emplacement de l'enum (`src/constants/roles.js` neuf vs
> refonte de `src/utils/roles.js`) ; (b) stratégie de migration des 55 sites (big-bang
> vs incrémentale) ; (c) périmètre exact de `isAdmin` (quels rôles canoniques inclure).
> Ces décisions sont **hors périmètre** des présentes exigences (le QUOI, pas le COMMENT).
