# Requirements Document — Centralisation des constantes et de la configuration (#24)

## Introduction

Le frontend Vue 3 (`lms-frontend`) contient de nombreuses valeurs de configuration et
valeurs « magiques » codées en dur, dispersées à travers services, composables, vues et
composants. Cette fonctionnalité (issue GitHub **#24**, TIER 1 de l'épique d'audit **#16**)
vise à **éliminer ce hardcoding** en centralisant ces valeurs dans des modules **gelés**
(`Object.freeze`) sous `src/constants/`, cohérents avec le pattern déjà établi par
`src/constants/roles.js` et `src/constants/errorMessages.js`.

Périmètre vérifié par grep (2026-06-16) :

- **URL/domaine Jitsi `meet.jit.si` en dur — 16 occurrences sur 10 fichiers** (le brief
  annonçait 17 ; recompte ci-dessous, écart tracé en NB) :
  `src/services/jitsi.js` (L15, constante locale), `src/components/visio/JitsiMeet.vue`
  (L58 commentaire, L82 `external_api.js`, L110 `domain`), `src/components/visio/VisioManager.vue`
  (L337, L462), `src/views/VideoConference.vue` (L73 `external_api.js`, L88 `domain`),
  `src/views/TeacherSeances.vue` (L594), `src/views/coordinateur/SeanceManagement.vue`
  (L493, L533), `src/views/seances/SeanceDetails.vue` (L381, L431),
  `src/views/teacher/TeacherSchedule.vue` (L49, L63), `src/views/teacher/TeacherVisioList.vue`
  (L119), `src/views/student/StudentSchedule.vue` (L51). Non configurable par institution,
  risque de lock-in.
- **Fallback `localhost:8000` dangereux — 7 occurrences** via
  `import.meta.env.VITE_API_URL || 'http://localhost:8000(/api)'` :
  `src/components/visio/VisioManager.vue` (L400), `src/components/visio/ParticipantsModal.vue`
  (L431, L480), `src/views/attendance/SeanceAttendanceHistory.vue` (L537, L586),
  `src/views/student/StudentLessonView.vue` (L495, L503, ces deux-là sans `/api`). Un build
  prod sans `VITE_API_URL` pointerait silencieusement sur `localhost`.
- **Clés de storage en chaînes magiques (HORS store auth)** : `adminPreferences`
  (`AdminSettings.vue` L254/L260), `teacherPreferences` (`TeacherSettings.vue` L233/L239),
  `userPreferences` (`StudentSettings.vue` L233/L239), thème
  (`lms-theme-preference-${institution}` dans `useTheme.js` ; **mais** `main.js` L10 utilise
  `lms-theme-preference` NON scopé — incohérence réelle, cf. R2/R5), sidebar collapse
  (`sidebar-collapsed-${institution}` dans `Sidebar.vue` L396), participation visio
  (`visio_participation_${seanceId}_${userId}` + préfixe `visio_participation_` dans
  `jitsi.js`).
- **Magic numbers** : heartbeat visio `30000` ms (`useVisioParticipation.js` L56/L82,
  `stores/visio.js` L66/L92, `VisioManager.vue` L243, `JitsiMeet.vue` L253), limite upload
  `30 * 1024 * 1024` (`ChapterManager.vue` L472, libellé « 30 MB » L105/L473), expiration
  participations `7 jours` (`jitsi.js` L325), TTL cache `5 min` (`cache.js` L3, déjà isolé).

État existant : `src/constants/` contient `roles.js` et `errorMessages.js`, tous deux gelés.
`import.meta.env.VITE_API_URL` est le mécanisme de config Vite. Vitest est installé (#21).

**HORS PÉRIMÈTRE (ne pas toucher)** : les clés du store auth `token`/`user`/`meta`/`institution`,
déjà encapsulées dans l'objet gelé `KEYS` de `src/stores/auth.js` (#19) ; les couleurs hex de
charts ; les god components (#28) ; l'i18n ; toute modification backend.

---

## Requirements

### Requirement 1 — Domaine/URL Jitsi configurable et centralisé

**User Story:** En tant qu'administrateur de déploiement (DevOps), je veux que le domaine du
serveur Jitsi provienne d'une configuration unique et soit configurable par déploiement, afin
de pouvoir pointer vers un serveur Jitsi auto-hébergé sans modifier le code, et d'éliminer les
16 occurrences codées en dur de `meet.jit.si`.

#### Acceptance Criteria

1. WHERE la valeur du domaine Jitsi est requise, le système SHALL la lire depuis une source de
   configuration unique alimentée par `import.meta.env.VITE_JITSI_DOMAIN`.
2. IF `VITE_JITSI_DOMAIN` n'est pas définie au build, THEN le système SHALL utiliser la valeur
   par défaut documentée `meet.jit.si` (préservation du comportement actuel).
3. WHEN un code applicatif construit une URL de salle Jitsi, le système SHALL exposer le domaine
   (et/ou l'URL de base) via un module de constantes/helper unique sous `src/constants/`, sans
   réintroduire de littéral `meet.jit.si`.
4. WHEN le helper Jitsi produit l'URL du script `external_api.js` ou l'URL de base d'une salle,
   le système SHALL utiliser le schéma `https` et le domaine configuré, sans casser le format
   d'URL actuel (`https://{domaine}/{room}[#params]`).
5. WHERE le domaine Jitsi est exposé comme constante, le module SHALL être gelé (`Object.freeze`),
   cohérent avec `roles.js`/`errorMessages.js`.

> NB (dette/écart tracé #24-NOTE-1) : le brief annonçait 17 occurrences ; le grep du 2026-06-16
> en recense 16 (dont 1 ligne de commentaire `JitsiMeet.vue:58` et 2 URL `external_api.js`). Le
> design tranchera le traitement du commentaire et le périmètre exact (helper vs constante simple).

### Requirement 2 — Clés de storage centralisées (hors store auth)

**User Story:** En tant que développeur, je veux un registre unique et gelé des clés de
`localStorage` non gérées par le store auth, afin d'éliminer les chaînes magiques dupliquées et
de garantir leur cohérence entre `useTheme.js`, `Sidebar.vue`, `jitsi.js` et les vues de
préférences.

#### Acceptance Criteria

1. WHERE une clé de storage figure dans le périmètre #24 (préférences `admin`/`teacher`/`user`,
   thème, sidebar collapse, participation visio), le système SHALL la définir dans un module de
   constantes gelé unique sous `src/constants/`.
2. WHEN un code lit ou écrit une de ces clés, le système SHALL utiliser la constante centralisée
   (ou un helper dérivant la clé scopée par institution) plutôt qu'un littéral.
3. WHERE une clé est scopée par institution (thème, sidebar) ou par séance/utilisateur
   (participation visio), le module SHALL fournir un helper paramétré produisant exactement la
   même clé qu'aujourd'hui (`lms-theme-preference-${institution}`, `sidebar-collapsed-${institution}`,
   `visio_participation_${seanceId}_${userId}`), afin de ne pas invalider les données existantes.
4. IF le slug d'institution est absent, THEN le helper de clé scopée SHALL utiliser le suffixe
   `default`, reproduisant le comportement actuel (`auth.getInstitution() || 'default'`).
5. WHEN le module de clés de storage est défini, le système SHALL **exclure** les clés du store
   auth (`token`, `user`, `meta`, `institution`) et SHALL NE PAS modifier ni dupliquer
   `KEYS` de `src/stores/auth.js` (#19).
6. WHERE le module expose ces clés, il SHALL être gelé (`Object.freeze`).

> NB (#24-NOTE-2, bug réel à corriger en R5) : `main.js:10` utilise la clé thème NON scopée
> `lms-theme-preference` tandis que `useTheme.js` utilise la clé scopée par institution. La
> centralisation DOIT aligner ces deux usages sur une clé unique ; le design tranchera la
> stratégie de migration des préférences existantes éventuelles.

### Requirement 3 — Magic numbers centralisés et nommés

**User Story:** En tant que développeur, je veux que les valeurs numériques de configuration
(intervalle de heartbeat, taille max d'upload, délais d'expiration) soient nommées, documentées
et centralisées dans des modules gelés, afin que leur signification soit explicite et qu'elles
soient modifiables en un seul endroit.

#### Acceptance Criteria

1. WHERE l'intervalle de heartbeat visio est requis, le système SHALL le lire depuis une
   constante centralisée nommée valant `30000` (ms), et remplacer les 6 occurrences codées en
   dur (`useVisioParticipation.js`, `stores/visio.js`, `VisioManager.vue`, `JitsiMeet.vue`).
2. WHERE la taille maximale d'upload de fichier est requise, le système SHALL la lire depuis une
   constante centralisée valant `30 * 1024 * 1024` octets (30 MiB), utilisée à la fois pour la
   validation (`ChapterManager.vue:472`) et pour le libellé affiché (« 30 MB », L105/L473).
3. WHEN le libellé de taille max est affiché à l'utilisateur, le système SHALL le dériver de la
   même constante (pas de double source de vérité texte vs validation).
4. WHERE un délai/intervalle pertinent supplémentaire est centralisé (ex. expiration des
   participations visio `7 jours`, `jitsi.js:325`), le système SHALL le nommer et le documenter
   dans le module approprié.
5. WHERE ces valeurs sont exposées comme constantes, chaque module SHALL être gelé
   (`Object.freeze`).
6. WHEN une valeur est centralisée, le système SHALL préserver la valeur numérique exacte
   actuelle (non-régression), toute modification de valeur étant hors périmètre de #24.

> NB : la liste des types de fichiers autorisés et le TTL cache (`cache.js:3`, déjà isolé) sont
> candidats optionnels ; le design tranchera leur inclusion.

### Requirement 4 — Configuration API explicite, sans fallback `localhost` silencieux

**User Story:** En tant que responsable de la sécurité/exploitation, je veux que l'URL de l'API
provienne d'une configuration explicite qui échoue de manière visible si elle est absente, afin
qu'un build de production mal configuré ne puisse jamais pointer silencieusement sur
`http://localhost:8000`.

#### Acceptance Criteria

1. WHERE l'URL de base de l'API est requise, le système SHALL la résoudre via une source unique
   s'appuyant sur `import.meta.env.VITE_API_URL`, remplaçant les 7 fallbacks
   `|| 'http://localhost:8000(/api)'`.
2. IF `VITE_API_URL` est absente en mode production (`import.meta.env.PROD`), THEN le système
   SHALL échouer de manière visible (erreur explicite) plutôt que de retomber silencieusement
   sur un défaut `localhost`.
3. WHERE le fallback `localhost` est requis pour le confort de développement, le système SHALL
   le limiter au mode développement (`import.meta.env.DEV`) et le centraliser en un seul endroit,
   et SHALL NE PAS l'embarquer dans un build de production.
4. WHEN un appel applicatif a besoin de l'URL de l'API, le système SHALL exposer cette URL via
   la configuration centralisée plutôt que via un accès direct dispersé à `import.meta.env`.
5. WHEN la résolution de l'URL d'API échoue (variable manquante en prod), le système SHALL NE
   PAS exposer ni journaliser de secret (les variables `VITE_*` sont publiques par conception).

> NB : la décision exacte (supprimer totalement le fallback vs le confiner au mode dev) est
> laissée au design ; l'invariant non négociable est « aucun fallback `localhost` silencieux en
> production ».

### Requirement 5 — Migration des sites codés en dur sans régression

**User Story:** En tant que mainteneur, je veux que tous les sites identifiés soient migrés vers
les constantes/configuration centralisées tout en préservant le comportement observable, afin
d'obtenir le bénéfice de la centralisation sans introduire de régression.

#### Acceptance Criteria

1. WHEN la migration est terminée, le système SHALL NE plus contenir de littéral `meet.jit.si`
   dans le code applicatif `src/` (hors modules de constantes et documentation), vérifiable par
   grep.
2. WHEN la migration est terminée, le système SHALL NE plus contenir de fallback
   `|| 'http://localhost:8000'` dans le code applicatif `src/`, vérifiable par grep.
3. WHEN la migration est terminée, le système SHALL NE plus contenir de littéral `30000` pour le
   heartbeat ni `30 * 1024 * 1024` pour l'upload dans le code applicatif, vérifiable par grep.
4. WHEN les clés de storage sont migrées, le système SHALL produire des clés strictement
   identiques aux clés actuelles pour ne pas perdre les préférences/participations déjà stockées.
5. WHERE une migration ne peut être complétée intégralement dans le périmètre de cette
   fonctionnalité, le système SHALL la laisser explicitement documentée comme dette tracée
   (référence #24-DEBT-x), et SHALL NE PAS masquer le hardcoding résiduel.
6. WHEN la migration touche du code existant, le système SHALL NE PAS modifier le store auth
   (#19) ni le backend.
7. WHILE la migration est en cours, le système SHALL préserver le comportement fonctionnel des
   visioconférences, du thème, de la sidebar et des préférences (non-régression).

### Requirement 6 — Couverture de tests Vitest

**User Story:** En tant que mainteneur, je veux des tests automatisés sur les nouvelles
constantes et helpers, afin de garantir leur immuabilité et le comportement attendu de la
résolution du domaine Jitsi et de l'URL API.

#### Acceptance Criteria

1. WHEN les tests s'exécutent, le système SHALL vérifier que chaque module de constantes
   introduit est gelé (`Object.isFrozen(...) === true`).
2. WHEN `VITE_JITSI_DOMAIN` est définie, le système SHALL vérifier que le helper/constante Jitsi
   retourne ce domaine.
3. WHEN `VITE_JITSI_DOMAIN` est absente, le système SHALL vérifier que le helper/constante Jitsi
   retourne le défaut `meet.jit.si`.
4. WHEN un helper de clé de storage scopée est testé, le système SHALL vérifier qu'il produit la
   clé attendue avec un slug d'institution donné ET avec le fallback `default`.
5. WHERE la résolution de l'URL d'API est testée, le système SHALL vérifier qu'en mode
   production sans `VITE_API_URL` l'erreur visible est levée (pas de fallback `localhost`).
6. WHEN les tests sont écrits, le système SHALL suivre le pattern Vitest existant
   (`src/stores/__tests__/`) et SHALL être conformes à PRODUCTION_STANDARDS §1.3.

### Requirement 7 — Documentation des variables d'environnement

**User Story:** En tant que personne déployant le frontend, je veux que les variables
d'environnement (nouvelles et existantes critiques) soient documentées dans les fichiers
`.env*.example`, afin de configurer correctement un déploiement sans lire le code.

#### Acceptance Criteria

1. WHEN `.env.example` est mis à jour, le système SHALL documenter `VITE_JITSI_DOMAIN` (avec le
   défaut `meet.jit.si` et un exemple de domaine auto-hébergé en commentaire).
2. WHEN `.env.production.example` est mis à jour, le système SHALL documenter `VITE_JITSI_DOMAIN`
   et SHALL rappeler que `VITE_API_URL` est **obligatoire** en production (aucun fallback
   `localhost`).
3. WHERE une variable est documentée, le fichier `.example` SHALL préciser qu'aucune valeur
   secrète ne doit y figurer (les variables `VITE_*` sont embarquées en clair dans le bundle
   client).
4. WHEN les `.example` sont modifiés, le système SHALL NE PAS modifier les fichiers `.env` /
   `.env.production` réels (non versionnés/sensibles).

---

## Non-functional Requirements & Constraints

1. **Immuabilité.** Tous les modules de constantes introduits SHALL être gelés via
   `Object.freeze`, cohérents avec `src/constants/roles.js` et `errorMessages.js`.
2. **Sécurité.** Aucun secret dans les variables `VITE_*` (publiques par conception Vite) ;
   aucun fallback `localhost` silencieux en production.
3. **Aucune modification backend** ni du store auth `KEYS` (#19).
4. **Conformité.** Respecter PRODUCTION_STANDARDS (§1.1 tailles de fichiers/fonctions, §1.3
   tests, §1.6) et CONTRIBUTING.
5. **Traçabilité.** Toute valeur centralisée doit être traçable à son ou ses sites d'origine ;
   toute migration non finalisée doit être déclarée comme dette tracée explicite.
6. **Décisions déléguées au design.** Emplacement/nommage des modules (`src/constants/visio.js`,
   `storageKeys.js`, `upload.js`, `http.js`…), forme du domaine Jitsi (fonction helper vs
   constante), stratégie exacte du fallback `localhost` (suppression vs confinement dev),
   périmètre migration immédiate vs dette, et traitement de l'incohérence de clé thème
   (#24-NOTE-2).
