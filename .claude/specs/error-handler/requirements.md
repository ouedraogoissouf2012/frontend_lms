# Requirements Document — Gestion centralisée des erreurs côté client (error-handler)

## Introduction

Cette fonctionnalité centralise et fiabilise la gestion des erreurs côté client du frontend Vue 3 (dépôt `lms-frontend`). Elle répond à l'issue GitHub **#20** (TIER 0 CRITICAL de l'épique d'audit #16) et constitue l'équivalent frontend de la règle backend `PRODUCTION_STANDARDS §1.2` qui interdit d'exposer `$e->getMessage()` à l'utilisateur final.

### Problème vérifié (grep, 2026-06-15, dossier `src/` hors fichiers `.bak`)

- **80 expositions** de `error.message` / `err.message` / `error.response?.data?.message` affichées directement à l'utilisateur (dans des `alert()`, `this.error =`, `error.value =`), réparties sur 37 emplacements.
- **114 appels `alert(...)`** au total (29 fichiers), dont **21** contenant une variable d'erreur (`error` / `err` / `e`) — UX native incohérente **et** fuite potentielle du détail technique.
- Message « Erreur lors du chargement » dupliqué **34 fois** (absence de catalogue centralisé / i18n).
- Risque concret : si l'API renvoie `{ success:false, message:"SQLSTATE[23000]... FK constraint..." }` (erreur 5xx) ou un message d'infrastructure, l'utilisateur voit ce détail. Exemples vérifiés : `components/visio/VisioManager.vue:285` (`alert('Erreur...: ' + (error.response?.data?.message || error.message))`), `components/enseignants/EnseignantsListExample.vue:151` (`this.error = err.message || ...`), `views/lessons/LessonEditor.vue`, `components/modals/GenerateReportModal.vue`, `views/admin/AdminEnseignants.vue:455`, `views/admin/AdminEvaluationDetails.vue:257`.

> Note d'écart par rapport au brief : les chiffres ci-dessus remplacent les estimations du brief (~51 expositions, 42 `alert` avec erreur, ~72 duplications). Recompté par grep le 2026-06-15 ; les fichiers `*.vue.bak` sont exclus du périmètre de migration.

### Briques existantes à réutiliser

- `src/services/toast.js` : service toast singleton (`toast.success/error/warning/info(message, title)`). Cible d'affichage standard, remplace les `alert()`.
- `src/services/api.js` : intercepteur de réponse (refait en #19) — il fait `console.error('❌ API Error:', ...)` puis `return Promise.reject(error)` (logout sur 401 via le store). Point unique de normalisation en amont.
- `src/constants/roles.js` (#18) : `logRoleDecision(event, context)` journalise SANS donnée sensible et se désactive en prod (`import.meta.env?.PROD`). Modèle de journalisation à reproduire.
- `src/constants/` : emplacement candidat pour le catalogue de messages.
- Vitest installé (#21) : la normalisation doit être testable en isolation (fonction pure).

### Périmètre

- **Inclus** : module de normalisation pur, catalogue de messages centralisé, branchement dans l'intercepteur, migration des `alert()` d'erreur et des affectations de message brut, journalisation sûre, tests Vitest.
- **Exclu explicitement** : intégration APM/Sentry (déféré, roadmap TIER 2 backend) ; i18n complet (le catalogue prépare i18n mais ne l'implémente pas) ; migration des comparaisons de rôle (#18-FE-2) ; refonte des god components (#28) ; **toute modification backend** (interdite).

---

## Requirements

### Requirement 1 — Module de normalisation pur

**User Story:** En tant qu'ingénieur frontend, je veux une fonction pure unique qui transforme n'importe quelle erreur en un message utilisateur sûr, afin qu'aucun détail technique brut ne puisse atteindre l'utilisateur et que la logique soit testable en isolation.

#### Acceptance Criteria

1. WHEN une erreur est passée au module de normalisation THEN le système SHALL retourner un objet résultat contenant au minimum un message utilisateur sûr (chaîne non vide) et une catégorie d'erreur identifiée.
2. WHEN l'erreur fournie est une erreur axios avec réponse HTTP THEN le système SHALL déterminer la catégorie à partir du code de statut HTTP (`error.response.status`).
3. WHEN l'erreur fournie est une erreur axios SANS réponse (timeout, coupure réseau, CORS) THEN le système SHALL classer l'erreur en catégorie « réseau » et retourner le message réseau du catalogue.
4. WHEN l'erreur fournie est une réponse applicative `{ success:false, message }` THEN le système SHALL traiter `message` selon les règles d'exposition (cf. Requirement 4) et non le restituer aveuglément.
5. WHEN l'erreur fournie est une `Error` JavaScript native, `null`, `undefined`, une chaîne, ou un type non reconnu THEN le système SHALL retourner le message de repli générique (catégorie « inconnue ») sans lever d'exception.
6. WHERE le module de normalisation est défini, le système SHALL exposer la normalisation comme une fonction PURE (sans effet de bord : pas d'appel `toast`, pas de navigation, pas de mutation d'état global à l'intérieur de la normalisation elle-même).
7. IF la même erreur est normalisée deux fois THEN le système SHALL retourner un résultat identique (déterminisme).
8. WHERE le module est implémenté, le système SHALL respecter `PRODUCTION_STANDARDS §5` (taille des unités) et §1.6 (SOLID — responsabilité unique : normaliser, ne pas afficher).

### Requirement 2 — Catalogue de messages centralisé

**User Story:** En tant que mainteneur, je veux un catalogue unique de messages utilisateur par catégorie d'erreur, afin de supprimer la duplication des 34 « Erreur lors du chargement » et de préparer une future internationalisation.

#### Acceptance Criteria

1. WHERE le catalogue est défini, le système SHALL fournir un message utilisateur sûr pour chacune des catégories suivantes : `401` (non authentifié), `403` (accès refusé), `404` (introuvable), `422` (validation), `429` (trop de requêtes), `5xx` (erreur serveur), `network` (réseau / pas de réponse), et `unknown` (repli générique).
2. WHEN une catégorie d'erreur ne dispose pas d'un message dédié dans le catalogue THEN le système SHALL utiliser le message de repli générique de la catégorie `unknown`.
3. WHERE les messages sont définis, le système SHALL les centraliser dans une source unique (le design tranche entre `src/constants/` et le module), structurée de façon à permettre l'introduction ultérieure de clés d'i18n sans changer les sites appelants.
4. WHEN le catalogue est consulté THEN le système SHALL retourner des messages rédigés en français, orientés utilisateur (actionnables, sans jargon technique).
5. WHERE le catalogue remplace des chaînes dupliquées, le système SHALL permettre une personnalisation contextuelle optionnelle du message (ex. « impossible de charger les enseignants ») sans réintroduire la duplication littérale ni exposer de détail technique.
6. WHERE le catalogue est défini, le système SHALL le geler (immuable à l'exécution) de façon cohérente avec le pattern `Object.freeze` utilisé dans `src/constants/roles.js`.

### Requirement 3 — Gestion structurée des erreurs de validation (422)

**User Story:** En tant qu'utilisateur, je veux voir les messages de validation par champ lorsque ma saisie est invalide, afin de corriger précisément mon erreur sans voir d'information technique.

#### Acceptance Criteria

1. WHEN l'erreur est de catégorie `422` ET contient des messages de validation par champ THEN le système SHALL exposer ces messages de champ de façon structurée (accessibles par champ) dans le résultat de normalisation.
2. WHEN l'erreur `422` ne contient aucun détail de champ exploitable THEN le système SHALL retourner le message générique de validation du catalogue.
3. WHILE des messages de validation de champ sont exposés, le système SHALL ne transmettre que des libellés non sensibles destinés à l'utilisateur, et SHALL ne jamais inclure de détail technique d'infrastructure (cf. Requirement 4).
4. WHEN le résultat de normalisation est consommé par un appelant qui n'attend qu'un message simple THEN le système SHALL fournir également un message utilisateur agrégé (chaîne unique) pour le cas `422`, de sorte que les appelants non structurés restent fonctionnels.

### Requirement 4 — Non-divulgation des détails techniques (sécurité §1.2)

**User Story:** En tant que responsable sécurité, je veux qu'aucun détail technique d'infrastructure ne soit jamais affiché à l'utilisateur, afin d'atteindre l'équivalence avec la règle backend `getMessage()` = 0 (`PRODUCTION_STANDARDS §1.2`).

#### Acceptance Criteria

1. WHEN l'erreur est de catégorie `5xx` THEN le système SHALL retourner le message serveur générique du catalogue et SHALL ne jamais retourner comme message utilisateur le contenu brut de `error.response.data.message`.
2. IF une réponse d'erreur contient une stack trace, un message SQL/SQLSTATE, un chemin de fichier, un nom de classe d'exception ou tout autre détail d'infrastructure THEN le système SHALL ne jamais l'inclure dans le message utilisateur retourné.
3. WHERE un message provenant du serveur pourrait être affiché, le système SHALL ne le considérer comme affichable que pour les catégories où il est sûr et utile (ex. `422` validation, `403`/`404` contrôlés), et SHALL appliquer le message du catalogue pour les catégories à risque (`5xx`, `unknown`).
4. WHEN une erreur réseau survient (pas de réponse) THEN le système SHALL ne jamais exposer le détail technique sous-jacent (ex. `ECONNREFUSED`, message d'exception axios) dans le message utilisateur.
5. WHERE la normalisation est appliquée, le système SHALL garantir qu'il existe zéro chemin par lequel `error.message` brut d'une erreur 5xx ou réseau parvient à l'utilisateur final (vérifiable par test, cf. Requirement 8).

### Requirement 5 — Branchement dans l'intercepteur de réponse (point unique)

**User Story:** En tant qu'ingénieur frontend, je veux que l'intercepteur de réponse attache un message utilisateur sûr à chaque erreur rejetée, afin que tout appelant dispose d'un message prêt à afficher sans dupliquer la logique de normalisation.

#### Acceptance Criteria

1. WHEN l'intercepteur de réponse de `src/services/api.js` rejette une erreur THEN le système SHALL attacher à l'objet erreur un message utilisateur sûr normalisé (ex. `error.userMessage`) avant le `return Promise.reject(error)`.
2. WHERE l'intercepteur attache le message normalisé, le système SHALL préserver le flux de rejet existant (la promesse reste rejetée avec l'objet erreur) et SHALL ne pas avaler ni résoudre l'erreur.
3. WHERE l'intercepteur attache le message normalisé, le système SHALL préserver le comportement existant de déconnexion sur 401 (`useAuthStore().logout()` + redirection conditionnelle vers `/login`).
4. WHEN l'erreur est de catégorie `422` THEN le système SHALL rendre les messages de validation par champ accessibles sur l'objet erreur en plus du message agrégé.
5. IF un appelant n'utilise pas le message attaché par l'intercepteur THEN le système SHALL permettre à cet appelant d'invoquer directement le module de normalisation pour obtenir le même résultat (cohérence entre les deux voies).

### Requirement 6 — Migration des sites d'affichage d'erreur

**User Story:** En tant qu'utilisateur, je veux des notifications d'erreur cohérentes (toast) plutôt que des `alert()` natifs et des messages techniques bruts, afin d'avoir une expérience homogène et sûre.

#### Acceptance Criteria

1. WHEN un site affiche une erreur via `alert(...)` contenant une variable d'erreur THEN le système SHALL remplacer cet appel par `toast.error(messageNormalisé)`.
2. WHEN un site affecte un message d'erreur brut à un état (`this.error = err.message || ...` ou `error.value = error.response?.data?.message || ...`) THEN le système SHALL remplacer la valeur affectée par le message utilisateur normalisé.
3. WHERE la migration est appliquée, le système SHALL ne plus laisser aucun site afficher directement `error.message`, `err.message` ou `error.response?.data?.message` à l'utilisateur dans les fichiers migrés.
4. IF la migration de la totalité des sites n'est pas réalisable dans le périmètre de cette itération THEN le système SHALL appliquer une migration incrémentale priorisée (module + intercepteur + sites `alert()` d'erreur en premier) ET SHALL tracer explicitement le reliquat comme dette identifiée (fichiers et compteur restants), conformément à `PRODUCTION_STANDARDS` (déclaration de dette tracée).
5. WHERE des fichiers `*.vue.bak` existent, le système SHALL les exclure du périmètre de migration.
6. WHEN un site est migré THEN le système SHALL préserver le comportement fonctionnel existant (mêmes branches succès/échec, mêmes effets sur `loading`/état), en ne changeant que la source du message affiché.

### Requirement 7 — Journalisation sûre des erreurs techniques

**User Story:** En tant qu'ingénieur d'exploitation, je veux que les erreurs techniques soient journalisées de façon exploitable mais sans donnée sensible, afin de pouvoir diagnostiquer sans créer de fuite ni polluer la console en production.

#### Acceptance Criteria

1. WHEN une erreur technique est traitée THEN le système SHALL pouvoir la journaliser de façon exploitable (catégorie, code HTTP, URL de la requête) sans inclure de donnée sensible (pas de token, pas d'email, pas de mot de passe).
2. WHERE la journalisation est implémentée, le système SHALL suivre le modèle de `logRoleDecision` (`src/constants/roles.js`) et se désactiver en production (`import.meta.env?.PROD`), cohérent avec la désactivation des `console.log` en prod (#15).
3. WHEN la journalisation est active (hors production) THEN le système SHALL pouvoir consigner le détail technique pour le diagnostic, sans que ce détail soit jamais retourné comme message utilisateur (séparation stricte affichage / journal).
4. IF aucune information non sensible n'est disponible THEN le système SHALL journaliser au minimum la catégorie d'erreur sans échouer.

### Requirement 8 — Couverture de tests Vitest

**User Story:** En tant que mainteneur, je veux des tests unitaires exhaustifs de la normalisation, afin de garantir de façon vérifiable qu'aucun détail technique ne fuit et que chaque catégorie est correctement traitée.

#### Acceptance Criteria

1. WHERE la suite de tests est définie, le système SHALL couvrir chaque catégorie d'erreur : `401`, `403`, `404`, `422`, `429`, `5xx`, `network` (pas de réponse) et `unknown`.
2. WHEN un cas `5xx` portant un message technique brut (ex. SQL/SQLSTATE) est normalisé THEN le test SHALL vérifier que ce message brut N'EST JAMAIS retourné comme message utilisateur.
3. WHEN un cas `422` avec erreurs de champ est normalisé THEN le test SHALL vérifier que les messages de validation par champ sont exposés de façon structurée.
4. WHEN une entrée invalide (`null`, `undefined`, objet inattendu, chaîne) est normalisée THEN le test SHALL vérifier qu'un message de repli générique est retourné sans exception levée.
5. WHEN une erreur réseau (axios sans `response`) est normalisée THEN le test SHALL vérifier que le message réseau du catalogue est retourné et qu'aucun détail technique n'apparaît.
6. WHERE la normalisation est testée, le système SHALL démontrer son déterminisme et son absence d'effet de bord (fonction pure), conformément à `PRODUCTION_STANDARDS §1.3`.

### Requirement 9 — Équivalence sécurité avec la règle backend

**User Story:** En tant que responsable sécurité, je veux une preuve mesurable que le frontend n'expose aucun détail technique d'infrastructure, afin d'atteindre la parité avec la règle backend `getMessage()` = 0.

#### Acceptance Criteria

1. WHEN la fonctionnalité est livrée THEN le système SHALL garantir qu'aucun message d'erreur 5xx brut, stack trace ou détail SQL/infra n'est affiché à l'utilisateur dans les sites migrés (objectif d'équivalence : 0 exposition).
2. WHERE des sites n'ont pas encore été migrés THEN le système SHALL en documenter le compte exact comme dette tracée (cf. Requirement 6.4), de sorte que l'écart par rapport à l'objectif « 0 » soit explicite et mesurable.
3. WHEN un détail technique doit être conservé pour diagnostic THEN le système SHALL le restreindre au canal de journalisation (Requirement 7) et SHALL ne jamais le présenter dans l'UI.

---

## Exigences non fonctionnelles

1. **Sécurité (`PRODUCTION_STANDARDS §1.2`)** : aucune fuite de détail technique d'infrastructure vers le client ; secrets et données sensibles jamais journalisés.
2. **Testabilité (`§1.3`)** : la logique métier (normalisation) est unit-testée en isolation, tests écrits selon l'approche TDD, couvrant les cas limites.
3. **SOLID (`§1.6`)** : séparation stricte normalisation (logique pure) / catalogue (données) / affichage (`toast`) / journalisation ; responsabilité unique par unité.
4. **Tailles (`§5`)** : modules et fonctions de taille maîtrisée, scindés si nécessaire.
5. **Contrainte d'intégration** : aucune modification backend ; réutilisation de `toast.js`, de l'intercepteur `api.js` et du modèle `logRoleDecision` existants.
6. **Préparation i18n** : le catalogue est structuré pour accueillir des clés d'i18n ultérieurement, sans imposer l'implémentation i18n dans cette itération.

---

## Questions ouvertes laissées au document de conception (le design tranche)

Ces points relèvent du **COMMENT** et seront décidés en phase de design ; ils ne modifient pas le **QUOI** ci-dessus :

- (a) Forme du module : service (`src/services/errorHandler.js`) vs composable (`useErrorHandler`).
- (b) Emplacement du catalogue : `src/constants/` vs intégré au module de normalisation.
- (c) Stratégie de migration des ~135 sites concernés (114 `alert`, dont 21 d'erreur + 80 expositions, recoupements inclus) : big-bang vs incrémentale priorisée (probablement incrémentale : module + intercepteur + `alert()` d'erreur d'abord, reliquat tracé en dette).
- (d) Branchement : attacher `error.userMessage` dans l'intercepteur vs faire invoquer le handler par les appelants (les deux voies devant rester cohérentes, cf. Requirement 5.5).
