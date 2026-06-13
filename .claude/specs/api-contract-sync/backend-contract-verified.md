# Contrat backend vérifié — api-contract-sync (#17)

> Document de **référence** (pas un des 3 docs de spec). Chaque ligne a été confirmée par lecture
> directe de `lms-backend/routes/api.php` ET du controller/FormRequest correspondant, le
> 2026-06-13. Le backend est la source de vérité ; le frontend s'aligne sur ce tableau.

## Endpoints cibles (méthode + chemin + corps réellement attendu)

| Réf | Méthode service frontend cible | HTTP + chemin (api.php) | Corps attendu (FormRequest / controller) | Vérifié |
|-----|-------------------------------|--------------------------|-------------------------------------------|---------|
| Ék-1 | `quizzes.startAttempt(quizId)` | `POST /quizzes/{quiz}/start` (`:408`) | aucun corps (`StartQuizAttemptRequest`) | ✅ |
| Ék-2 | `quizzes.submitAttempt(attemptId, answers)` | `POST /quiz-attempts/{id}/submit` (`:410`) | **`{ answers: [...] }`** — `submitAttempt` lit `$request->input('answers')` ; `SubmitQuizAttemptRequest` : `answers => required\|array`. **Garder l'enveloppe `{ answers }`** (le tableau plat seul échouerait la validation). | ✅ |
| Ék-3 | (consultation) `GET /quiz-attempts/{id}` (`:418`) | — | `getMyAttempts` **SUPPRIMÉE** (aucun consommateur ; sémantique quizId≠attemptId) | ✅ |
| Ék-4 | `notificationsService.markAsRead(id)` | `POST /notifications/{id}/mark-as-read` (préfixe `notifications` + `:765`) | aucun corps | ✅ |
| Ék-5 | `notificationsService.markAllAsRead()` | `POST /notifications/mark-all-as-read` (`:768`) | aucun corps | ✅ |
| Ék-6 | `evaluation.getStudentEvaluations()` | `GET /evaluations/student` (`:661`) | aucun param ni query d'identité — identité dérivée du token (anti-IDOR, route paramétrée supprimée `:657-661`) | ✅ |
| Ék-7 | `evaluation.syncToKlassci(id)` | `POST /evaluations/{id}/sync-klassci` (`:700`) | **aucun corps** — `syncToKlassci(int $id)` ne lit pas le request body. Distinct de `POST /evaluations/{id}/sync-notes` (`:697`). | ✅ |
| Ék-8 | `chapter.createChapter(lessonId, data)` | `POST /lessons/{lessonId}/chapters` (`:244`) | `StoreChapterRequest` — champs **FRANÇAIS** : `titre` (required, 3-255), `description` (max 1000), `ordre` (required), `fichier` (optionnel, mimes pdf/doc/docx/ppt/pptx, max 30 MB → **multipart/form-data si fichier**), `type_contenu`. ⚠️ NE PAS confondre avec `UpdateChapterRequest` qui, lui, est en anglais (`title`/`content`/`order`). | ✅ |
| Ék-9 | `chapter.reorderChapters(lessonId, chapters)` | `POST /lessons/{lessonId}/chapters/reorder` (`:256`) | `ReorderChaptersRequest` : `{ chapters: [{ id: integer exists, order: integer >=0 }] }` (required, min 1) | ✅ |
| Ék-10 | `searchService.globalSearch(query)` | `GET /search` (`:801`) | query string `q`/filtres (client canonique `search.js`) ; `klassci.search` (`/proxy/search`) **SUPPRIMÉE** | ✅ |
| Ék-11 | `lms.getVisioParticipants(seanceId)` | `GET /lms/seances/{seanceId}/visio-participants` (`:613`, route renommée) | aucun corps ; ≠ `/participants` (`:543`, participants AUTORISÉS, méthode `getSeanceParticipants` **inchangée**) | ✅ |
| Ék-12 | `chapterProgress.resetLessonProgress` | route inexistante | **SUPPRIMÉE** (aucun consommateur) | ✅ |

## Points d'attention confirmés

1. **`submitAttempt` garde `{ answers }`** : seuls méthode (`PUT`→`POST`) et chemin changent ; le corps actuel `{ answers }` (api.js:193) est déjà correct. Le design avait laissé ce point « à confirmer » → **tranché : enveloppe conservée**.
2. **`syncToKlassci` sans corps** : `api.post(url)` sans 2ᵉ argument est correct.
3. **`createChapter` champs français** : un futur appelant (aucun aujourd'hui) devra envoyer `titre`/`ordre`/`type_contenu`, et passer en `multipart/form-data` si un `fichier` est joint.
4. **Notifications** : routes sous le groupe `Route::prefix('notifications')` → chemins complets `/notifications/{id}/mark-as-read` et `/notifications/mark-all-as-read`.

## Sources backend

`routes/api.php` (lignes citées) · `app/Http/Controllers/API/Quiz/QuizAttemptStudentController.php` · `app/Http/Requests/{SubmitQuizAttemptRequest,StoreChapterRequest,ReorderChaptersRequest}.php` · `app/Http/Controllers/API/Evaluation/EvaluationKlassciSyncController.php` · `app/Http/Controllers/API/ChapterController.php`.
