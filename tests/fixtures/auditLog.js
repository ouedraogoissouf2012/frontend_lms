/**
 * Journal d'audit : `GET /api/admin/audit-log`.
 *
 * ## Capture réelle (`AUDIT_LOG_CAPTURE`)
 *
 * Copie INTÉGRALE de la réponse du vrai contrôleur, prise dans le banc de test de lms_backend #1014
 * (branche `fix/audit-nom-ecole`, D127), capturée le 2026-11-10 à 02:00 UTC par le Réparateur.
 * Données de fabrique FICTIVES : IP de documentation (RFC 5737), e-mails en `.test`, rien de la
 * production. Ne retirer AUCUNE clé.
 *
 * ## Entrées de test (ci-dessous)
 *
 * Elles ont les mêmes CLÉS que la capture : seules les valeurs changent, pour couvrir un cas
 * (copie d'évaluation, nom d'école absent, valeurs hors table). Faits lus dans le code serveur
 * (#1014) : `institution` vaut null pour toute connexion et toute action du supradmin ; `user`
 * vaut null pour un job système, un échec de connexion ou un auteur supprimé depuis.
 */
export const AUDIT_LOG_CAPTURE = Object.freeze({
  "success": true,
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 2,
        "user_id": null,
        "institution_id": null,
        "action": "login_failed",
        "auditable_type": null,
        "auditable_id": null,
        "before": null,
        "after": {
          "username": "compte.inconnu"
        },
        "ip_address": "192.0.2.11",
        "user_agent": "Mozilla/5.0 (exemple)",
        "created_at": "2026-11-10T02:00:50.000000Z",
        "user": null,
        "institution": null
      },
      {
        "id": 1,
        "user_id": 1,
        "institution_id": 1,
        "action": "visio_recording_start",
        "auditable_type": "App\\Models\\SeanceRecording",
        "auditable_id": 12,
        "before": null,
        "after": {
          "statut": "en_cours"
        },
        "ip_address": "192.0.2.10",
        "user_agent": "Mozilla/5.0 (exemple)",
        "created_at": "2026-11-10T02:00:50.000000Z",
        "user": {
          "id": 1,
          "name": "Awa Koné",
          "email": "awa.kone@exemple.test",
          "role": "enseignant"
        },
        "institution": {
          "id": 1,
          "name": "Collège Les Palmiers"
        }
      }
    ],
    "first_page_url": "http://localhost/api/admin/audit-log?page=1",
    "from": 1,
    "last_page": 1,
    "last_page_url": "http://localhost/api/admin/audit-log?page=1",
    "links": [
      {
        "url": null,
        "label": "&laquo; Previous",
        "page": null,
        "active": false
      },
      {
        "url": "http://localhost/api/admin/audit-log?page=1",
        "label": "1",
        "page": 1,
        "active": true
      },
      {
        "url": null,
        "label": "Next &raquo;",
        "page": null,
        "active": false
      }
    ],
    "next_page_url": null,
    "path": "http://localhost/api/admin/audit-log",
    "per_page": 50,
    "prev_page_url": null,
    "to": 2,
    "total": 2
  }
})

export const CONNEXION = Object.freeze({
  id: 11, user_id: 4, institution_id: 7, institution: { id: 7, name: 'Collège Fictif Horizon' },
  action: 'login', auditable_type: null, auditable_id: null, before: null, after: null,
  ip_address: '203.0.113.5', user_agent: 'Mozilla/5.0 (Essai)', created_at: '2026-11-09T08:15:00.000000Z',
  user: { id: 4, name: 'Awa Essai', email: 'awa@exemple.test', role: 'enseignant' },
})

export const COPIE_MODIFIEE = Object.freeze({
  // Nom d'école absent (purge physique) : l'entrée garde son numéro (D127).
  id: 12, user_id: 5, institution_id: 9, institution: null,
  action: 'update', auditable_type: 'App\\Models\\EvaluationSubmission', auditable_id: 31, before: null, after: null,
  ip_address: '198.51.100.2', user_agent: 'Mozilla/5.0 (Essai)', created_at: '2026-11-09T08:20:00.000000Z',
  user: { id: 5, name: 'Koffi Essai', email: 'koffi@exemple.test', role: 'etudiant' },
})

export const ECHEC_CONNEXION = Object.freeze({
  id: 13, user_id: null, institution_id: null, institution: null,
  action: 'login_failed', auditable_type: null, auditable_id: null, before: null, after: null,
  ip_address: '192.0.2.44', user_agent: 'curl/8.0', created_at: '2026-11-09T08:25:00.000000Z',
  user: null,
})

/** Action et type hors des tables : l'écran ne doit ni les recopier ni les deviner. */
export const INCONNUE = Object.freeze({
  id: 14, user_id: 4, institution_id: 7, institution: { id: 7, name: 'Collège Fictif Horizon' },
  action: 'teleport', auditable_type: 'App\\Models\\Secret', auditable_id: 2, before: null, after: null,
  ip_address: '203.0.113.5', user_agent: 'Mozilla/5.0 (Essai)', created_at: '2026-11-09T08:30:00.000000Z',
  user: { id: 4, name: 'Awa Essai', email: 'awa@exemple.test', role: 'enseignant' },
})

/** Corps rendu par l'intercepteur : `{ success, data: <page Laravel> }`. */
export const pageDuJournal = (data, { current_page = 1, last_page = 1, total = data.length } = {}) => ({
  success: true,
  data: { data, current_page, last_page, per_page: 50, total },
})
