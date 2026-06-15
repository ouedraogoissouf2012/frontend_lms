# Requirements Document — Store d'authentification Pinia (`useAuthStore`)

## Introduction

Cette fonctionnalité crée un **store Pinia unique d'authentification** (`useAuthStore`) pour le frontend Vue 3 (`lms-frontend`), afin de centraliser tout l'état d'authentification (`user`, `token`, `role` brut + normalisé, `institution`, `institutionName`, `meta`) et de mettre fin à l'accès dispersé et **incohérent** au storage navigateur.

Il s'agit de l'issue GitHub **#19**, classée **TIER 0 CRITICAL** de la roadmap d'audit (épique **#16**). Elle recoupe les issues **#2** et **#6** (token en `localStorage` = risque XSS) et **#11** (token lu depuis `localStorage` dans les composants visio).

### Contexte vérifié sur le code réel (grep, 2026-06-14)

Treize emplacements répartis sur douze fichiers accèdent au storage d'authentification. Deux familles de défauts confirmées :

**Incohérence du token (`sessionStorage` vs `localStorage`)** — vérifiée par grep :

| Fichier | Emplacement | Storage lu/écrit |
| --- | --- | --- |
| `src/services/api.js` | l.28 (intercepteur, lecture), l.71 (login, écriture), l.51/86 (logout, suppression) | **`sessionStorage`** |
| `src/stores/visio.js` | l.248 (`sendLeaveVisioBeacon`, lecture token) | **`localStorage`** (incohérent — l'intercepteur écrit en `sessionStorage`, donc ce token y est probablement absent/périmé) |
| `src/composables/useVisioParticipation.js` | l.223 (`sendLeaveVisioBeacon`, lecture token) | `sessionStorage` (contourne `api.js`) |
| `src/components/visio/ParticipantsModal.vue` | l.429, l.478 (lecture token) | `sessionStorage` (contourne `api.js`) |
| `src/components/visio/VisioManager.vue` | l.398 (lecture token) | `sessionStorage` (contourne `api.js`) |
| `src/views/attendance/SeanceAttendanceHistory.vue` | l.537, l.586 (lecture token) | `sessionStorage` (contourne `api.js`) |

**Bug latent `user` (`sessionStorage` vs `localStorage`)** — vérifié par grep :

- `api.js` **écrit** `user` en `sessionStorage` (l.72) et le **lit** en `sessionStorage` (`getUser`, l.98).
- Mais **6 emplacements lisent `user` en `localStorage`** (clé que `api.js` ne remplit jamais), où `JSON.parse(localStorage.getItem('user') || '{}')` vaut donc probablement `{}` (bug réel) :
  - `src/stores/visio.js:347` (`handleTeacherExit`)
  - `src/views/TeacherSeances.vue:357`
  - `src/views/student/StudentSchedule.vue:34`
  - `src/views/teacher/TeacherSchedule.vue:36`
  - `src/views/ForumTopic.vue:199`
  - `src/views/coordinateur/SeanceManagement.vue:309`

> Correction du contexte d'entrée : la lecture de `localStorage('user')` concerne **6 emplacements** (1 store visio + 5 vues), pas 5. Confirmé par grep le 2026-06-14.

### État existant vérifié

- **Pinia est déjà configuré** : `src/main.js:2` (`import { createPinia }`), l.43 (`app.use(createPinia())`). Un store existe déjà : `src/stores/visio.js` (`useVisioStore`, `defineStore` en style composition).
- Le bloc `auth` de `api.js` expose déjà une API publique large, consommée par **88 occurrences dans 32 fichiers** (grep confirmé) : `login`, `logout`, `me`, `getUser`, `getMeta`, `isAuthenticated`, `getUserRole`, `getInstitution`, `getInstitutionName`, `setInstitution`, `getActiveInstitutions`, `hasRole`, `isAdmin`, `isTeacher`, `isStudent`, `isSupradmin`.
- `src/constants/roles.js` (livré en #18) fournit `normalizeRole`, `hasRole`, `isAdmin`, `isSupradmin`, `isTeacher`, `isStudent`, `isAdminScope`, `getDashboardRoute`, `getRoleDisplayName`, `canActivate`. Les getters d'autorisation du store **doivent en dériver** (ne pas réimplémenter la logique de rôle). `api.js` délègue déjà à ce module depuis #18.
- **Vitest est installé** (#21). Le store doit être testable en isolation (`setActivePinia` / `createTestingPinia`).
- `src/services/cache.js:10` lit `auth.getInstitution() || 'default'` pour scoper le cache par tenant : le store doit préserver cette capacité.
- **Hors périmètre confirmé** : `src/views/student/StudentSettings.vue:233/239` utilise `localStorage('userPreferences')`, qui est une **préférence UI** et non de l'état d'auth — à ne pas confondre avec ce store.

### Décisions laissées au design (le présent document pose le QUOI, pas le COMMENT)

Le document de conception tranchera : (a) le mécanisme exact de persistance (`sessionStorage` confirmé ? plugin de persistance Pinia ou écriture manuelle ?) ; (b) façade fine `api.js` *vs* migration des appelants vers le store ; (c) si le store **remplace** le bloc `auth` de `api.js` ou **coexiste** avec lui.

---

## Requirements

### Requirement 1 — Store Pinia unique, source de vérité de l'état d'auth

**User Story:** En tant que développeur frontend, je veux un store Pinia unique `useAuthStore` qui détient tout l'état d'authentification, afin de disposer d'une source de vérité unique au lieu d'accès dispersés au storage.

#### Acceptance Criteria

1. WHERE le module `src/stores/auth.js` est défini, le store `useAuthStore` SHALL être créé via `defineStore` (cohérent avec le style du store existant `src/stores/visio.js`).
2. WHERE le store `useAuthStore` expose son état, il SHALL contenir au minimum : `user`, `token`, `role` (rôle brut tel que reçu du backend), `institution` (slug), `institutionName`, et `meta`.
3. WHERE le store expose un rôle, il SHALL fournir à la fois le rôle **brut** (tel que renvoyé par le backend dans `data.user.role`) et le rôle **normalisé** dérivé via `normalizeRole` de `src/constants/roles.js`.
4. WHERE le store expose des comportements, il SHALL fournir les actions `login`, `logout`, `setSession`, et `setInstitution`.
5. WHEN un composant ou un service a besoin de l'état d'authentification, THEN il SHALL pouvoir l'obtenir depuis `useAuthStore` sans lire directement `localStorage` ni `sessionStorage`.

### Requirement 2 — Getters dérivés, autorisation déléguée à `roles.js`

**User Story:** En tant que développeur frontend, je veux des getters d'authentification et d'autorisation exposés par le store, afin de prendre des décisions d'accès cohérentes sans réimplémenter la logique de rôle.

#### Acceptance Criteria

1. WHERE le store expose des getters d'état, il SHALL fournir `isAuthenticated`, `currentUser`, et `userRole` (rôle brut).
2. WHERE le store expose des getters d'autorisation (`isAdmin`, `isSupradmin`, `isTeacher`, `isStudent`), ils SHALL être **dérivés** des fonctions correspondantes de `src/constants/roles.js` et NE SHALL PAS réimplémenter de comparaison de chaîne de rôle.
3. WHEN le rôle de l'utilisateur est inconnu, `null`, ou non reconnu par la table d'alias de `roles.js`, THEN tout getter d'autorisation SHALL renvoyer `false` (comportement fail-secure, conforme à `roles.js`).
4. WHEN l'état `user` ou `token` du store change (login/logout/`setSession`), THEN `isAuthenticated`, `currentUser` et les getters d'autorisation SHALL refléter immédiatement la nouvelle valeur (réactivité Pinia).
5. WHERE le périmètre admin strict est évalué (`isAdmin`), il SHALL rester aligné sur le backend (`admin | supradmin`) tel que déjà implémenté par `roleIsAdmin`.

### Requirement 3 — Mécanisme de persistance unique et cohérent

**User Story:** En tant qu'ingénieur sécurité/mainteneur, je veux un mécanisme de persistance unique du token et de l'état d'auth, afin d'éliminer l'accès mixte `localStorage`/`sessionStorage` actuel et de réduire la surface XSS.

#### Acceptance Criteria

1. WHERE le store persiste l'état d'authentification, il SHALL utiliser **un seul et unique mécanisme de persistance** (le design tranche le mécanisme exact).
2. WHERE le token est persisté, il NE SHALL PAS être écrit dans `localStorage` (atténuation du risque XSS, recoupe #2 et #6).
3. WHEN le token est persisté puis relu, THEN l'emplacement d'écriture et l'emplacement de lecture SHALL être identiques (plus aucun mismatch `localStorage` écrit / `localStorage` lu vs `sessionStorage`).
4. WHERE le code accède au token d'authentification après cette fonctionnalité, il NE SHALL PAS exister d'accès direct au token mêlant `localStorage` et `sessionStorage` (les incohérences `visio.js:248` en `localStorage` vs `api.js` en `sessionStorage` SHALL être supprimées).
5. WHERE le compromis du mécanisme retenu (par ex. `sessionStorage` = pas de persistance multi-onglets, perte au refresh selon le mécanisme) existe, il SHALL être documenté comme choix de sécurité assumé.

### Requirement 4 — Correction du bug `user` lu en `localStorage`

**User Story:** En tant qu'utilisateur, je veux que mon profil (`currentUser`) soit toujours correctement résolu dans les vues, afin de ne plus subir d'écrans qui le considèrent vide à cause d'une mauvaise clé de storage.

#### Acceptance Criteria

1. WHERE un composant ou un store lit l'utilisateur courant, il SHALL l'obtenir depuis `useAuthStore` et NE SHALL PAS exécuter `JSON.parse(localStorage.getItem('user') || '{}')`.
2. WHEN les 6 emplacements identifiés (`src/stores/visio.js:347`, `src/views/TeacherSeances.vue:357`, `src/views/student/StudentSchedule.vue:34`, `src/views/teacher/TeacherSchedule.vue:36`, `src/views/ForumTopic.vue:199`, `src/views/coordinateur/SeanceManagement.vue:309`) sont migrés, THEN aucun d'eux NE SHALL lire `user` depuis `localStorage`.
3. WHEN un utilisateur est authentifié et qu'un composant lit `currentUser` via le store, THEN la valeur retournée NE SHALL PAS être un objet vide `{}` causé par une erreur de clé ou de storage.
4. IF aucun utilisateur n'est authentifié, THEN `currentUser` SHALL renvoyer une valeur d'absence explicite et cohérente (`null`), et non un objet `{}` ambigu.

### Requirement 5 — Préservation de l'API publique `auth` (pas de régression)

**User Story:** En tant que mainteneur, je veux que les 88 appels existants à l'API `auth.*` continuent de fonctionner, afin que l'introduction du store ne casse aucun des 32 fichiers consommateurs.

#### Acceptance Criteria

1. WHERE le bloc `auth` de `api.js` est consommé (88 occurrences dans 32 fichiers, grep 2026-06-14), l'ensemble des méthodes publiques actuelles (`login`, `logout`, `me`, `getUser`, `getMeta`, `isAuthenticated`, `getUserRole`, `getInstitution`, `getInstitutionName`, `setInstitution`, `getActiveInstitutions`, `hasRole`, `isAdmin`, `isTeacher`, `isStudent`, `isSupradmin`) SHALL rester appelables avec une sémantique inchangée OU les appelants SHALL être migrés vers le store sans perte de comportement (le design tranche entre façade et migration).
2. WHEN un appelant existant invoque une méthode de l'API publique `auth`, THEN le résultat SHALL provenir (directement ou indirectement) du store comme source de vérité unique.
3. WHERE l'API publique `auth` est conservée comme façade, elle SHALL être une façade fine déléguant au store et NE SHALL PAS dupliquer la logique d'état ou de rôle.
4. WHEN la fonctionnalité est livrée, THEN aucun fichier consommateur ne SHALL voir son comportement d'authentification régresser par rapport au comportement correct attendu (les comportements actuellement *bogués*, ex. lecture `localStorage('user')`, étant corrigés et non préservés).

### Requirement 6 — Visio : token et user lus via le store

**User Story:** En tant qu'utilisateur d'une séance visio, je veux que les fonctionnalités visio lisent le token et l'utilisateur depuis le store, afin que la visioconférence ne tombe plus en panne à cause d'un token absent/périmé (issue #11).

#### Acceptance Criteria

1. WHERE `src/stores/visio.js` lit le token (l.248) ou l'utilisateur (l.347), il SHALL obtenir ces valeurs depuis `useAuthStore` et NE SHALL PAS lire `localStorage`/`sessionStorage` directement.
2. WHERE `src/composables/useVisioParticipation.js` lit le token (l.223), il SHALL l'obtenir depuis `useAuthStore`.
3. WHERE les composants visio `src/components/visio/ParticipantsModal.vue` (l.429, l.478), `src/components/visio/VisioManager.vue` (l.398), et la vue `src/views/attendance/SeanceAttendanceHistory.vue` (l.537, l.586) lisent le token, ils SHALL l'obtenir depuis `useAuthStore`.
4. WHEN une fonctionnalité visio a besoin du token (y compris pour l'API Beacon de `sendLeaveVisioBeacon`), THEN le token fourni SHALL être celui détenu par le store, garantissant la cohérence avec le token utilisé par l'intercepteur axios.
5. WHEN le token est requis mais absent du store, THEN la fonctionnalité visio SHALL gérer ce cas explicitement (comportement existant : ne pas envoyer le Beacon, journaliser) sans accéder à un storage de secours incohérent.

### Requirement 7 — Intercepteur axios lit le token depuis le store

**User Story:** En tant que développeur frontend, je veux que l'intercepteur axios lise le token depuis le store, afin que tout le code utilise une abstraction unique du stockage du token.

#### Acceptance Criteria

1. WHERE l'intercepteur de requête axios de `api.js` (l.26-37) attache l'en-tête `Authorization`, il SHALL obtenir le token depuis `useAuthStore` (directement ou via la façade) et NE SHALL PAS lire `sessionStorage.getItem('token')` en direct.
2. WHEN une requête sortante est émise et qu'un token existe dans le store, THEN l'intercepteur SHALL ajouter l'en-tête `Authorization: Bearer <token>`.
3. WHEN une requête sortante est émise et qu'aucun token n'existe dans le store, THEN l'intercepteur NE SHALL PAS ajouter d'en-tête `Authorization`.
4. WHEN une réponse `401` est reçue (intercepteur de réponse, l.49-59), THEN le store SHALL être purgé de son état d'authentification (le storage suivant le store), conservant le comportement de redirection vers `/login` hors page de login.

### Requirement 8 — Multi-tenant et purge complète au logout

**User Story:** En tant qu'utilisateur multi-tenant, je veux que le slug d'institution reste disponible pour scoper le cache et que la déconnexion purge tout, afin d'éviter toute fuite de données entre tenants ou entre sessions.

#### Acceptance Criteria

1. WHERE `src/services/cache.js:10` appelle `auth.getInstitution() || 'default'` pour scoper le cache par tenant, la résolution du slug d'institution SHALL rester fonctionnelle via le store (directement ou via la façade), retournant la même valeur qu'aujourd'hui pour une session donnée.
2. WHEN `login` réussit et que `meta.institution` est présent, THEN le store SHALL exposer ce slug via son getter d'institution.
3. WHEN `setInstitution(slug)` est invoqué, THEN le store SHALL mettre à jour le slug d'institution courant et le persister selon le mécanisme unique retenu.
4. WHEN `logout` est invoqué, THEN le store SHALL purger l'intégralité de son état d'auth (`user`, `token`, `role`, `institution`, `institutionName`, `meta`), purger le storage persistant correspondant, ET invoquer `clearAllCache()` (comportement actuel de `api.js` l.90).
5. WHEN `logout` est terminé, THEN `isAuthenticated` SHALL renvoyer `false` et `currentUser` SHALL renvoyer `null`.

### Requirement 9 — Réactivité de l'état d'authentification

**User Story:** En tant qu'utilisateur, je veux que l'interface réagisse immédiatement à ma connexion et à ma déconnexion, afin de ne pas voir d'état d'authentification périmé qui nécessiterait un rechargement.

#### Acceptance Criteria

1. WHEN `login` peuple le store, THEN tout composant lisant l'état d'auth via le store SHALL observer la mise à jour de manière réactive, sans rechargement de page.
2. WHEN `logout` purge le store, THEN tout composant lisant l'état d'auth via le store SHALL observer le passage à l'état non authentifié de manière réactive.
3. WHERE l'état d'auth est consommé dans un composant Vue, il SHALL l'être via les getters réactifs du store (et non via une lecture ponctuelle de storage brut qui ne déclenche aucune réactivité).

### Requirement 10 — Tests Vitest du store et des régressions

**User Story:** En tant que mainteneur, je veux une couverture de tests unitaires du store, afin de garantir la non-régression des bugs corrigés (#11, bug `user`) et le comportement attendu de l'authentification.

#### Acceptance Criteria

1. WHERE le store est testé, il SHALL l'être en isolation avec Pinia (`setActivePinia(createPinia())` ou `createTestingPinia`), sans dépendance à un navigateur réel.
2. WHEN un test simule un `login` réussi, THEN il SHALL vérifier que le store est peuplé (`user`, `token`, `role`, `institution`, `meta`) ET que l'état est persisté selon le mécanisme retenu.
3. WHEN un test simule un `logout`, THEN il SHALL vérifier que le store et le storage sont entièrement purgés, que `clearAllCache` est invoqué, que `isAuthenticated === false` et `currentUser === null`.
4. WHERE les getters d'autorisation sont testés, ils SHALL être vérifiés comme dérivant de `src/constants/roles.js` (y compris la normalisation d'alias et le fail-secure sur rôle inconnu).
5. WHEN un test reproduit le scénario de l'issue #11, THEN il SHALL vérifier que le token lu par l'intercepteur axios est **identique** au token écrit au login (plus aucun mismatch `localStorage`/`sessionStorage`).
6. WHEN un test reproduit le bug `user`, THEN il SHALL vérifier que `currentUser` n'est jamais `{}` par erreur de clé/storage, mais bien l'utilisateur authentifié (ou `null` si non authentifié).

### Requirement 11 — Exigences de sécurité (non fonctionnelles)

**User Story:** En tant qu'ingénieur sécurité, je veux que le store respecte les standards de sécurité de l'audit, afin de réduire l'exposition du token et des secrets côté client (issues #2, #6 ; PRODUCTION_STANDARDS §1.6).

#### Acceptance Criteria

1. WHERE le token d'authentification est stocké, il NE SHALL PAS l'être dans `localStorage`.
2. WHERE le code du store et de sa façade est livré, il NE SHALL PAS exposer de secret en clair (clé API, mot de passe, secret de signature) côté client.
3. WHERE le mécanisme de persistance retenu implique un compromis (par ex. `sessionStorage` : absence de persistance multi-onglets et perte de session au rechargement complet selon le mécanisme), ce compromis SHALL être documenté explicitement comme décision de sécurité assumée.
4. WHEN une erreur d'authentification (`401`) survient, THEN aucune donnée d'auth sensible NE SHALL être journalisée (cohérent avec `logRoleDecision` de `roles.js` qui exclut nom et email, et avec la désactivation des `console.log` en production, #15).

### Requirement 12 — Exigences non fonctionnelles de conception et de structure

**User Story:** En tant que mainteneur, je veux que le store respecte les standards de production du projet, afin de garder une base maintenable et conforme à `CONTRIBUTING` et `PRODUCTION_STANDARDS`.

#### Acceptance Criteria

1. WHERE le store est conçu, il SHALL respecter PRODUCTION_STANDARDS §1.6 (SOLID/DIP) : le store est la source de vérité, les helpers de rôle sont injectés/dérivés depuis `roles.js` (pas de duplication de logique d'autorisation).
2. WHERE le store et la façade sont dimensionnés, ils SHALL respecter les limites de taille de PRODUCTION_STANDARDS §5 (store/service focalisés, pas de god-module) ; si une responsabilité déborde, elle SHALL être extraite.
3. WHERE des modifications sont apportées, elles NE SHALL PAS toucher au backend (aucune modification backend autorisée).
4. WHERE le code est livré, il SHALL respecter les conventions de `CONTRIBUTING` du dépôt.

### Requirement 13 — Périmètre exclu (hors scope explicite)

**User Story:** En tant que mainteneur, je veux que le périmètre de cette fonctionnalité soit délimité sans ambiguïté, afin d'éviter le glissement de périmètre vers d'autres issues.

#### Acceptance Criteria

1. WHERE la refonte de la gestion d'erreurs est concernée (issue #20), elle SHALL être considérée hors périmètre de cette fonctionnalité.
2. WHERE des comparaisons de rôle brutes résiduelles `role === '...'` subsistent dans les vues (dette #18-FE-2), leur migration complète SHALL être considérée hors périmètre (sauf pour les emplacements directement modifiés par les exigences 4 et 6).
3. WHERE `src/views/student/StudentSettings.vue:233/239` utilise `localStorage('userPreferences')`, cela SHALL être reconnu comme une préférence UI et NON comme de l'état d'auth, donc hors périmètre de ce store.
