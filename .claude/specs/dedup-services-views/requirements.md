# Requirements — Dédup services & vues (#26)

> TIER 1 — MEDIUM · `tier-1-paradigme` · DRY/SRP
> Réfs standards : `PRODUCTION_STANDARDS.md` §5 (service ≤ 300 lignes, SRP), Q5
> (« peut-on supprimer du code »). Backend = source de vérité (split
> `LMSDataController` → 7 controllers : le front doit suivre la même logique).

## Investigation factuelle (code réel — fichier:ligne)

Vérifié le 2026-06-16 sur la branche `refactor/26-dedup-services` :

| Élément | Constat vérifié |
|---|---|
| `src/services/lms.js` | **466 lignes**, ~32 méthodes couvrant **6 domaines** : classes (`getClasseDetails:16`, `getClasseEtudiants:31`, `getClasses:59`), matières (`getMatiereDetails:45`, `getMyMatieres:370`), séances (`getUpcomingSeances:88`, `getSeanceDetails:102`, `getSeanceParticipants:116`, `validateParticipant:131`, `syncVideoAttendances:168`, `getMyTeachingSeances:214`, `getMyClassesSeances:229`, `hideSeance:384`, `unhideSeance:398`, `getAttendanceHistory:413`, `getSeancesHistory:427`, `getSeanceAttendances:441`, `deleteSeance:455`), visio (`toggleVisio:149`, `activateVisio:244`, `deactivateVisio:258`, `startVisio:272`, `endVisio:286`, `joinVisio:300`, `leaveVisio:314`, `heartbeatVisio:328`, `getVisioParticipants:342`), enseignants (`getEnseignants:73`, `getTeacherDashboard:357`), notifications (`getNotificationPreferences:186`, `sendSessionReminder:200`). **SRP violé.** |
| `src/services/klassci.js` | 336 lignes. Recouvrement de signatures avec `lms.js` : `getClasses`, `getMatiereDetails`. Frontière d'usage **non documentée**. |
| `src/services/api.js` | 267 lignes. Les reexports cassés `notifications.markAsRead`/`markAllAsRead` et `quizzes.getMyAttempts` **ont déjà été supprimés en #17** (commentaires `api.js:156-159`, `:136`). L'export `notifications` délègue désormais au service canonique `notifications.js`. → **Partie #26 largement close ; reste à confirmer/documenter, pas de doublon cassé résiduel.** |
| `src/services/notifications.js` | 135 lignes — client canonique notifications (chemins corrects). |
| `src/views/matieres/MatiereDetailsModern.vue` | **1000 lignes, ZÉRO import, non routé** (route active = `MatiereDetails.vue:32` → `/matieres/:id`). → **code mort confirmé.** |
| `src/views/lessons/StudentLessonView.vue` | 1352 lignes. Routée `/lessons/:id` (name `LessonView`, import statique `router:14`/`:429`). Atteinte par `Dashboard.vue:70`, `LessonChapters.vue:153`, `MatiereDetails.vue:655`. |
| `src/views/student/StudentLessonView.vue` | 1514 lignes. Routée `/student/lessons/:id` (name `lesson-details`, lazy `router:352`). Atteinte par `StudentCourses.vue:216`. → **les DEUX vues sont vivantes**, atteintes par des chemins différents : la fusion est nécessaire **et risquée**. |
| `src/stores/visio.js` | 406 lignes. Logique heartbeat de participation visio. |
| `src/composables/useVisioParticipation.js` | 314 lignes. Logique heartbeat **dupliquée** côté composant. |

## Stratégie de livraison (3 PRs, blast radius isolé)

Le périmètre est hétérogène en risque ; on le découpe en 3 PRs indépendantes
référençant #26, du plus sûr au plus risqué :

- **PR1 — code mort & frontière services** (risque faible)
- **PR2 — split `lms.js` par domaine** (risque moyen, mécanique, gardé par les tests de contrat)
- **PR3 — fusion `StudentLessonView` + dédup heartbeat** (risque élevé, isolé)

---

## Exigences

### Besoin 1 — Suppression du code mort (PR1)
**User story :** En tant que mainteneur, je veux supprimer les vues non routées,
afin de réduire la surface de code morte et la confusion.

- WHEN on supprime `src/views/matieres/MatiereDetailsModern.vue`, THE SYSTEM SHALL continuer à builder sans erreur (zéro import entrant — vérifié).
- WHEN on inspecte le routing, THE SYSTEM SHALL n'exposer que `MatiereDetails.vue` sur `/matieres/:id`.
- THE SYSTEM SHALL ne supprimer aucun fichier référencé par un import ou une route.

### Besoin 2 — Frontière `klassci` vs `lms` documentée (PR1)
**User story :** En tant que dev, je veux savoir quel service appeler, afin
d'éviter les doublons d'appels.

- THE SYSTEM SHALL documenter en tête de `klassci.js` et `lms.js` la frontière : `klassci` = **proxy KLASSCI brut** (passe-plat vers l'API KLASSCI), `lms` = **données enrichies LMS**.
- WHEN deux méthodes de même signature existent sans valeur ajoutée distincte, THE SYSTEM SHALL en supprimer une et rediriger les appelants, SANS casser les tests de contrat.
- THE SYSTEM SHALL confirmer (commentaire/PR) que les reexports cassés de `api.js` sont déjà résolus (#17), sans régression.

### Besoin 3 — Split `lms.js` par domaine (PR2)
**User story :** En tant que mainteneur, je veux des services à responsabilité
unique, afin de respecter §5 (≤ 300 l., SRP) et le miroir du split backend.

- THE SYSTEM SHALL découper `lms.js` en modules domaine : `lmsClasses.js`, `lmsMatieres.js`, `lmsSeances.js`, `lmsVisio.js`, `lmsNotifications.js`, `lmsTeachers.js` (ou regroupement justifié).
- WHEN un appelant importe l'ancien `lms.js`, THE SYSTEM SHALL préserver la compatibilité via un baril de réexport (`lms.js` réexporte les modules) OU mettre à jour tous les appelants dans la même PR.
- WHEN les tests de contrat s'exécutent, THE SYSTEM SHALL rester 100 % vert (chemins API inchangés).
- THE SYSTEM SHALL faire en sorte qu'aucun module domaine ne dépasse ~300 lignes.

### Besoin 4 — Fusion des deux `StudentLessonView` (PR3)
**User story :** En tant que mainteneur, je veux une seule vue leçon étudiant,
afin d'éliminer ~1350 lignes dupliquées.

- THE SYSTEM SHALL choisir la vue canonique sur preuve (couverture fonctionnelle, fraîcheur, nombre d'appelants) et documenter la décision.
- WHEN la vue redondante est supprimée, THE SYSTEM SHALL repointer sa/ses route(s) et navigation(s) (`StudentCourses.vue:216` / route `lesson-details`) vers la vue conservée, sans perte de fonctionnalité.
- THE SYSTEM SHALL garantir une **régression nulle** : `/lessons/:id` et `/student/lessons/:id` (ou la route consolidée) restent fonctionnelles et chargent la vue conservée.
- THE SYSTEM SHALL n'exposer aucune erreur brute (§1.2).

### Besoin 5 — Dédup logique heartbeat visio (PR3)
**User story :** En tant que dev, je veux une seule source de la logique
heartbeat, afin d'éviter les divergences.

- THE SYSTEM SHALL centraliser la logique heartbeat dans `stores/visio.js` (état global).
- WHEN un composant a besoin de la participation visio, THE SYSTEM SHALL faire en sorte que `useVisioParticipation.js` consomme le store (liaison composant) sans réimplémenter le timer/heartbeat.
- THE SYSTEM SHALL préserver le comportement existant (intervalle, nettoyage au démontage, sendBeacon de sortie) — vérifié par tests.

## Analyse de risque

- **PR1** : suppression pure de code mort + commentaires → risque ~nul (build + grep d'imports).
- **PR2** : déplacement de méthodes ; risque maîtrisé par baril de compat + tests de contrat (28 assertions) qui figent les chemins API.
- **PR3** : **risque élevé** — deux vues live de ~1400 lignes. Mitigation : diff fonctionnel rigoureux avant choix, repointage explicite des routes/nav, vérification manuelle des parcours étudiant, PR isolée et réversible. Le heartbeat est traité dans la même PR car il touche aussi la participation visio des leçons.

## Hors périmètre
- Décomposition des god components (vues ≥ 300 l.) → #28.
- Standardisation `<script setup>` + lazy loading → #27.
