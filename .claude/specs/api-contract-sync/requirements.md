# Requirements Document — Synchronisation du contrat d'API (api-contract-sync)

> Issue GitHub : #17 — TIER 0 CRITICAL de la roadmap d'audit (épique #16)
> Dépôts concernés : `lms-frontend` (Vue 3, à corriger) et `lms-backend` (Laravel, **source de vérité, NE PAS modifier**)

## Introduction

Un audit a comparé chaque appel des services frontend (`src/services/*.js`) au contrat réel
du backend (`routes/api.php`, 173 endpoints). Environ douze appels frontend ne correspondent
à **aucune** route backend : ils renvoient silencieusement des erreurs 404/405, car l'intercepteur
de réponse axios se contente d'un `console.error` (`src/services/api.js:33`) sans remonter
l'erreur à l'utilisateur ni à un système de supervision. Plusieurs fonctionnalités réelles sont
donc cassées sans signal visible (soumission de quiz, synchronisation des notes vers KLASSCI,
création de chapitres, marquage des notifications, recherche globale, etc.).

Le backend a achevé sa roadmap (25/26 DONE) et constitue la source de vérité. Cette spécification
ne décrit donc **que** l'alignement du frontend sur les routes backend existantes. Aucune
modification du backend n'est autorisée.

Au-delà de la simple correction des chemins, cette fonctionnalité doit :
- éliminer les implémentations dupliquées de clients HTTP (le module `api.js` réexporte des
  clients `quizzes` et `notifications` aux chemins erronés qui doublonnent des services corrects
  existants) ;
- introduire un **test de contrat** automatisé qui vérifie, pour chaque méthode de service, la
  méthode HTTP et le chemin exact attendus, afin qu'une future divergence casse la CI et non
  l'utilisateur ;
- garantir la non-régression d'une faille IDOR corrigée côté backend (un étudiant ne doit jamais
  pouvoir cibler l'identifiant d'un autre étudiant) ;
- respecter les standards projet référencés : `PRODUCTION_STANDARDS.md` (§1.2 sécurité, §1.3 tests,
  §5 services ≤ 300 lignes / SRP) et `CONTRIBUTING.md`.

### Portée et hypothèses

- **Dans la portée** : correction des chemins/méthodes HTTP des services frontend listés ;
  déduplication des clients ; ajout des tests de contrat ; vérification de non-régression IDOR.
- **Hors portée** : toute modification du backend ; refonte de l'intercepteur d'erreurs axios
  (l'amélioration de la remontée d'erreur est notée comme dette dans l'annexe mais n'est pas requise
  par cette fonctionnalité) ; ajout de nouvelles fonctionnalités métier.
- **Hypothèse / dépendance** : le projet ne dispose actuellement d'aucun framework de test. Vitest
  doit être installé par l'issue #21 (T0-5). La stratégie de test (Requirement 13) prend cette
  dépendance en compte et propose une alternative si #21 n'est pas encore livrée.

### Glossaire des écarts vérifiés

Chaque écart ci-dessous a été confirmé par lecture directe du code frontend. Le numéro `(Ék-N)`
est référencé par les critères d'acceptation pour assurer la traçabilité.

| Réf | Fichier:ligne (frontend) | Appel frontend actuel | Route backend réelle (source de vérité) |
|-----|--------------------------|------------------------|-----------------------------------------|
| Ék-1 | `src/services/api.js:188` `quizzes.startAttempt` | `POST /quizzes/{id}/attempts` | `POST /quizzes/{id}/start` (api.php:408) |
| Ék-2 | `src/services/api.js:192` `quizzes.submitAttempt` | `PUT /quizzes/attempts/{id}/submit` | `POST /quiz-attempts/{id}/submit` (api.php:410) |
| Ék-3 | `src/services/api.js:196` `quizzes.getMyAttempts` | `GET /quizzes/{id}/my-attempts` | inexistante ; consultation = `GET /quiz-attempts/{id}` (api.php:418) |
| Ék-4 | `src/services/api.js:222` `notifications.markAsRead` | `POST /notifications/{id}/read` | `POST /notifications/{id}/mark-as-read` (api.php:757) |
| Ék-5 | `src/services/api.js:226` `notifications.markAllAsRead` | `POST /notifications/read-all` | `POST /notifications/mark-all-as-read` (api.php:760) |
| Ék-6 | `src/services/evaluation.js:37-39` `getStudentEvaluations` | `GET /evaluations/student/{klassciEtudiantId}` | route **supprimée** (vecteur IDOR, api.php:657-661) ; remplacer par `GET /evaluations/student` sans paramètre (dérivé du token) |
| Ék-7 | `src/services/evaluation.js:133-135` `syncToKlassci` | `POST /evaluations/{id}/sync-to-klassci` | `POST /evaluations/{id}/sync-klassci` (api.php:700) ; distinct de `POST /evaluations/{id}/sync-notes` (api.php:697) |
| Ék-8 | `src/services/chapter.js:50-52` `createChapter` | `POST /chapters` | `POST /lessons/{lessonId}/chapters` (api.php:244) — exige le `lessonId` en paramètre |
| Ék-9 | `src/services/chapter.js:96-98` `reorderChapters` | `POST /chapters/reorder` | `POST /lessons/{lessonId}/chapters/reorder` (api.php:256) |
| Ék-10 | `src/services/klassci.js:165-167` `search` | `GET /proxy/search` | inexistante ; recherche globale = `GET /search` (api.php:801). Méthode dupliquée : `src/services/search.js:10 globalSearch` utilise déjà `/search` et est le client consommé par `GlobalSearchModal.vue:223` |
| Ék-11 | `src/services/lms.js:342-344` `getVisioParticipants` | `GET /lms/seances/{id}/participants` | `GET /lms/seances/{id}/visio-participants` (api.php:613) — route **renommée** côté backend ; `/participants` = participants AUTORISÉS, `/visio-participants` = participants CONNECTÉS (sémantique distincte) |
| Ék-12 | `src/services/chapterProgress.js:79-81` `resetLessonProgress` | `DELETE /lessons/{id}/progress` | route inexistante (à supprimer si non utilisée) |

---

## Requirements

### Requirement 1 — Démarrage d'une tentative de quiz

**User Story:** En tant qu'étudiant, je veux démarrer une tentative de quiz, afin de pouvoir
répondre aux questions et que ma tentative soit bien enregistrée côté backend.

#### Acceptance Criteria

1. WHEN l'application appelle `quizzes.startAttempt(quizId)` THEN le frontend SHALL émettre une requête `POST` vers le chemin `/quizzes/{quizId}/start` (Ék-1).
2. IF le chemin émis pour le démarrage de tentative diffère de `/quizzes/{quizId}/start` ou si la méthode HTTP n'est pas `POST` THEN le test de contrat SHALL échouer.
3. WHEN un étudiant déclenche le démarrage d'un quiz depuis `src/views/Quizzes.vue:102` THEN le frontend SHALL recevoir une réponse `2xx` du backend (et non un 404/405).

### Requirement 2 — Soumission d'une tentative de quiz

**User Story:** En tant qu'étudiant, je veux soumettre mes réponses à un quiz, afin que ma copie
soit corrigée et enregistrée plutôt que perdue silencieusement.

#### Acceptance Criteria

1. WHEN l'application appelle `quizzes.submitAttempt(attemptId, answers)` THEN le frontend SHALL émettre une requête `POST` vers le chemin `/quiz-attempts/{attemptId}/submit` (Ék-2).
2. WHEN la soumission est déclenchée depuis `src/views/QuizTake.vue:201` THEN le frontend SHALL transmettre le corps de requête contenant les réponses formatées (tableau `{ question_id, answer }`) attendu par le backend.
3. IF la méthode HTTP émise n'est pas `POST` ou si le chemin n'est pas `/quiz-attempts/{attemptId}/submit` THEN le test de contrat SHALL échouer.

### Requirement 3 — Consultation d'une tentative de quiz

**User Story:** En tant qu'étudiant, je veux consulter le résultat d'une tentative de quiz, afin de
voir ma note et mes réponses sans déclencher d'erreur silencieuse.

#### Acceptance Criteria

1. WHEN le code appelle la méthode de consultation d'une tentative THEN le frontend SHALL émettre une requête `GET` vers `/quiz-attempts/{attemptId}` (Ék-3).
2. WHERE la méthode `quizzes.getMyAttempts(quizId)` ciblant `/quizzes/{id}/my-attempts` n'existe sur aucune route backend, le frontend SHALL supprimer cette méthode ou la remplacer par la consultation correcte `GET /quiz-attempts/{attemptId}`.
3. IF aucun consommateur de `getMyAttempts` n'est trouvé dans le code (vues/composants/stores) THEN la méthode SHALL être supprimée sans introduire de régression d'import.
4. WHILE la méthode est supprimée ou remplacée, les imports existants de `quizzes` (`src/views/QuizTake.vue`, `src/views/Quizzes.vue`, `src/views/Dashboard.vue`) SHALL continuer de se résoudre sans erreur de build.

### Requirement 4 — Marquage d'une notification comme lue

**User Story:** En tant qu'utilisateur, je veux marquer une notification comme lue, afin que le
compteur de non-lues se mette à jour de façon fiable.

#### Acceptance Criteria

1. WHEN l'application marque une notification comme lue THEN le frontend SHALL émettre une requête `POST` vers `/notifications/{id}/mark-as-read` (Ék-4).
2. IF le chemin émis est `/notifications/{id}/read` THEN le test de contrat SHALL échouer.

### Requirement 5 — Marquage de toutes les notifications comme lues

**User Story:** En tant qu'utilisateur, je veux marquer toutes mes notifications comme lues, afin de
remettre à zéro mon compteur en une action.

#### Acceptance Criteria

1. WHEN l'application marque toutes les notifications comme lues THEN le frontend SHALL émettre une requête `POST` vers `/notifications/mark-all-as-read` (Ék-5).
2. IF le chemin émis est `/notifications/read-all` THEN le test de contrat SHALL échouer.

### Requirement 6 — Déduplication du client notifications

**User Story:** En tant que développeur, je veux un seul client `notifications` correct, afin
d'éviter qu'un client dupliqué aux chemins erronés soit consommé par erreur.

#### Acceptance Criteria

1. WHERE `src/services/notifications.js` (`notificationsService`) implémente déjà les chemins corrects `/notifications/{id}/mark-as-read` et `/notifications/mark-all-as-read`, le frontend SHALL traiter ce service comme l'implémentation canonique.
2. WHEN le client `notifications` exporté par `src/services/api.js` est corrigé ou retiré THEN le consommateur `src/views/Dashboard.vue:114` SHALL continuer de fonctionner sans modification cassante de son import (ré-export de compatibilité ou mise à jour de l'import vers `notificationsService`).
3. IF deux implémentations de marquage de notification subsistent avec des chemins divergents THEN le test de contrat SHALL échouer.

### Requirement 7 — Évaluations d'un étudiant (correction IDOR)

**User Story:** En tant qu'étudiant, je veux récupérer mes évaluations disponibles, afin de
travailler sur mes propres évaluations sans pouvoir accéder à celles d'un autre étudiant.

#### Acceptance Criteria

1. WHEN l'application récupère les évaluations de l'étudiant connecté THEN le frontend SHALL émettre une requête `GET` vers `/evaluations/student` **sans** segment d'identifiant d'étudiant dans l'URL (Ék-6).
2. IF un identifiant d'étudiant (`klassciEtudiantId`) est passé en argument THEN le frontend SHALL NOT l'inclure dans le chemin ni dans la query string de la requête.
3. WHERE `src/services/klassci.js:256` (`getMyEvaluations`) utilise déjà `GET /evaluations/student` sans paramètre, le frontend SHALL aligner `src/services/evaluation.js:getStudentEvaluations` sur cette même signature (sans paramètre d'identité côté client).
4. WHEN un étudiant tente de consulter les évaluations d'un autre étudiant en forgeant un identifiant THEN le frontend SHALL NOT exposer de chemin permettant de cibler un identifiant arbitraire (l'identité de l'étudiant est dérivée du token côté backend).
5. IF le chemin émis correspond au motif `/evaluations/student/{quelqueChose}` THEN le test de contrat SHALL échouer (garde-fou anti-régression IDOR).

### Requirement 8 — Synchronisation des notes vers KLASSCI

**User Story:** En tant qu'enseignant ou coordinateur, je veux synchroniser les notes d'une
évaluation vers KLASSCI, afin que les résultats remontent dans le système scolaire de référence.

#### Acceptance Criteria

1. WHEN l'application appelle `evaluation.syncToKlassci(id)` THEN le frontend SHALL émettre une requête `POST` vers `/evaluations/{id}/sync-klassci` (Ék-7).
2. IF le chemin émis est `/evaluations/{id}/sync-to-klassci` THEN le test de contrat SHALL échouer.
3. WHERE le backend expose un endpoint distinct `POST /evaluations/{id}/sync-notes` (api.php:697), le frontend SHALL NOT confondre les deux : `sync-klassci` et `sync-notes` SHALL rester des méthodes/chemins séparés.

### Requirement 9 — Création d'un chapitre rattaché à une leçon

**User Story:** En tant qu'enseignant, je veux créer un chapitre dans une leçon, afin de structurer
mon contenu pédagogique sans erreur silencieuse.

#### Acceptance Criteria

1. WHEN l'application crée un chapitre THEN le frontend SHALL émettre une requête `POST` vers `/lessons/{lessonId}/chapters` (Ék-8).
2. WHEN la méthode `chapter.createChapter` est invoquée THEN le frontend SHALL exiger un `lessonId` en paramètre et l'inclure dans le chemin.
3. IF aucun `lessonId` n'est fourni à la création d'un chapitre THEN le frontend SHALL signaler une erreur de validation côté client plutôt que d'émettre une requête vers un chemin incomplet.
4. WHEN la création est déclenchée depuis `src/views/lessons/LessonEditor.vue` THEN l'appelant SHALL transmettre le `lessonId` du contexte courant.
5. IF le chemin émis est `/chapters` (sans segment de leçon) THEN le test de contrat SHALL échouer.

### Requirement 10 — Réorganisation des chapitres d'une leçon

**User Story:** En tant qu'enseignant, je veux réordonner les chapitres d'une leçon, afin de
contrôler l'ordre d'apparition du contenu.

#### Acceptance Criteria

1. WHEN l'application réorganise les chapitres THEN le frontend SHALL émettre une requête `POST` vers `/lessons/{lessonId}/chapters/reorder` (Ék-9).
2. WHEN la méthode `chapter.reorderChapters` est invoquée THEN le frontend SHALL exiger un `lessonId` en paramètre et l'inclure dans le chemin.
3. IF le chemin émis est `/chapters/reorder` (sans segment de leçon) THEN le test de contrat SHALL échouer.

### Requirement 11 — Recherche globale et déduplication du client de recherche

**User Story:** En tant qu'utilisateur, je veux utiliser la recherche globale, afin de trouver
classes, matières, étudiants et enseignants sans appel vers une route inexistante.

#### Acceptance Criteria

1. WHEN l'application effectue une recherche globale THEN le frontend SHALL émettre une requête `GET` vers `/search` (Ék-10).
2. WHERE `src/services/search.js:10` (`searchService.globalSearch`) cible déjà `/search` et est le client consommé par `src/components/modals/GlobalSearchModal.vue:223`, le frontend SHALL traiter `searchService` comme l'implémentation canonique de la recherche globale.
3. WHEN la méthode `src/services/klassci.js:165` (`search`) ciblant `/proxy/search` est traitée THEN le frontend SHALL la supprimer si elle n'a aucun consommateur, ou la rediriger vers `GET /search` si un consommateur existe.
4. IF un chemin `/proxy/search` est émis par un quelconque service THEN le test de contrat SHALL échouer.

### Requirement 12 — Participants connectés à une visioconférence

**User Story:** En tant qu'enseignant en visioconférence, je veux voir les participants
actuellement connectés, afin de distinguer la présence réelle des participants seulement autorisés.

#### Acceptance Criteria

1. WHEN l'application appelle `lms.getVisioParticipants(seanceId)` THEN le frontend SHALL émettre une requête `GET` vers `/lms/seances/{seanceId}/visio-participants` (Ék-11).
2. WHERE `src/services/lms.js:116` (`getSeanceParticipants`) cible les participants AUTORISÉS via `/lms/seances/{id}/participants`, le frontend SHALL conserver cette méthode inchangée et ne corriger QUE `getVisioParticipants` (lignes 342-344).
3. WHEN les participants connectés sont affichés depuis `src/components/visio/ParticipantsModal.vue:355` THEN le frontend SHALL recevoir la liste des participants CONNECTÉS et non celle des participants autorisés.
4. IF `getVisioParticipants` émet vers `/lms/seances/{id}/participants` (sans le préfixe `visio-`) THEN le test de contrat SHALL échouer.

### Requirement 13 — Test de contrat automatisé

**User Story:** En tant que développeur, je veux un test de contrat qui vérifie méthode HTTP et
chemin de chaque méthode de service, afin qu'une future divergence avec le backend casse la CI et
non l'expérience utilisateur.

#### Acceptance Criteria

1. WHEN la suite de tests s'exécute THEN le test de contrat SHALL asserter, pour chaque méthode de service couverte par cette spécification (Requirements 1 à 12), la méthode HTTP exacte et le chemin exact émis (le client axios étant intercepté/mocké, sans appel réseau réel).
2. WHEN une méthode de service est modifiée vers un chemin non conforme au contrat backend THEN le test de contrat SHALL échouer de façon déterministe.
3. WHERE des segments dynamiques existent (`{id}`, `{lessonId}`, `{seanceId}`), le test de contrat SHALL vérifier le motif d'URL résultant avec des valeurs représentatives.
4. IF l'outillage de test (Vitest, issue #21 / T0-5) n'est pas encore disponible THEN la stratégie de test SHALL prévoir une alternative légère (assertions de contrat exécutables sans framework lourd) afin que cette fonctionnalité ne soit pas bloquée par #21.
5. WHEN le test de contrat est ajouté THEN il SHALL inclure le garde-fou anti-IDOR du Requirement 7 (échec si un chemin `/evaluations/student/{id}` paramétré est émis).

### Requirement 14 — Non-régression des consommateurs et de la qualité

**User Story:** En tant que mainteneur, je veux que les corrections n'introduisent ni régression de
build, ni dégradation des standards projet, afin de livrer une version production et non un
prototype.

#### Acceptance Criteria

1. WHEN les corrections de chemins et la déduplication sont appliquées THEN le projet SHALL continuer de compiler sans erreur (`build` réussi) et tous les imports existants SHALL se résoudre.
2. WHEN un service est modifié THEN il SHALL respecter `PRODUCTION_STANDARDS.md` §5 (taille ≤ 300 lignes, responsabilité unique / SRP).
3. WHERE une route est supprimée car inexistante (`getMyAttempts` Ék-3, `resetLessonProgress` Ék-12, `klassci.search` Ék-10) sans consommateur, le frontend SHALL retirer le code mort plutôt que de le laisser pointer vers une route invalide.
4. IF la suppression d'une méthode laisse un consommateur orphelin THEN ce consommateur SHALL être mis à jour vers l'implémentation canonique correspondante dans le même changement.
5. WHEN les corrections sont livrées THEN elles SHALL respecter le processus de `CONTRIBUTING.md` (revue, conventions de commit/branche).

### Requirement 15 — Suppression de la route de réinitialisation de progression inexistante

**User Story:** En tant que développeur, je veux retirer l'appel `DELETE /lessons/{id}/progress`
inexistant, afin d'éliminer une source d'erreur silencieuse 404/405.

#### Acceptance Criteria

1. WHEN la méthode `chapterProgress.resetLessonProgress` (`src/services/chapterProgress.js:79-81`) est traitée THEN le frontend SHALL la supprimer si elle n'a aucun consommateur (Ék-12).
2. IF un consommateur de `resetLessonProgress` est identifié THEN cette spécification SHALL être révisée pour déterminer la route backend de remplacement avant toute suppression.
3. WHILE la méthode est supprimée, aucun chemin `DELETE /lessons/{id}/progress` SHALL subsister dans le code, et le test de contrat SHALL échouer si ce chemin réapparaît.

---

## Exigences non fonctionnelles

### NF1 — Sécurité (PRODUCTION_STANDARDS.md §1.2)

1. WHEN le frontend récupère des ressources liées à l'identité de l'utilisateur (évaluations
   étudiant) THEN il SHALL NOT transmettre d'identifiant d'utilisateur côté client comme valeur
   autoritaire ; l'identité SHALL être dérivée du token côté backend (anti-IDOR).
2. WHERE une route a été supprimée côté backend pour des raisons de sécurité, le frontend SHALL NOT
   tenter de reconstruire le comportement supprimé par un autre chemin.

### NF2 — Testabilité (PRODUCTION_STANDARDS.md §1.3)

1. WHEN un service est appelé dans un test THEN la couche HTTP (axios) SHALL être substituable
   (mock/intercepteur) afin d'asserter le contrat sans appel réseau réel.

### NF3 — Maintenabilité et SRP (PRODUCTION_STANDARDS.md §5)

1. WHEN un module de service est modifié THEN il SHALL conserver une responsabilité unique et ne pas
   dupliquer un client déjà fourni par un autre service (un seul client canonique par domaine :
   notifications, recherche).

### NF4 — Aucune modification du backend

1. WHILE cette fonctionnalité est implémentée, aucune modification du dépôt `lms-backend` SHALL être
   effectuée ; le frontend s'aligne sur le contrat existant.

---

## Annexe — Dette tracée (hors portée de cette fonctionnalité)

> Conformément aux standards (surfacer la dette plutôt que la masquer).

- **Intercepteur d'erreurs axios (`src/services/api.js:33`)** : les erreurs non-401 sont seulement
  `console.error`. Elles ne sont ni remontées à l'utilisateur, ni envoyées à une supervision. Cela a
  masqué les 12 écarts pendant la durée de vie en production. **Risque** : de futures divergences de
  contrat resteront silencieuses pour l'utilisateur final (le test de contrat les capte en CI, mais
  pas en runtime). **À traiter** dans une issue dédiée de durcissement de la gestion d'erreurs ;
  hors portée de #17.

## Traçabilité écarts → requirements

| Écart | Requirement(s) |
|-------|----------------|
| Ék-1  | R1 |
| Ék-2  | R2 |
| Ék-3  | R3, R14 |
| Ék-4  | R4, R6 |
| Ék-5  | R5, R6 |
| Ék-6  | R7, NF1 |
| Ék-7  | R8 |
| Ék-8  | R9 |
| Ék-9  | R10 |
| Ék-10 | R11, R14 |
| Ék-11 | R12 |
| Ék-12 | R15, R14 |
| Transverse — test de contrat | R13, NF2 |
| Transverse — déduplication clients | R6, R11, NF3 |
| Transverse — non-régression IDOR | R7, R13, NF1 |
| Transverse — backend non modifié | NF4 |
