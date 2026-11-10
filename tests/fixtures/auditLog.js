/**
 * Entrées FICTIVES du journal d'audit, à la forme de `GET /api/admin/audit-log`
 * (AuditLogController::index : `successResponse($query->paginate())`, `user:id,name,email,role`).
 * IP de documentation (RFC 5737), e-mails en `.test` : aucune donnée réelle.
 * `institution` n'est servi qu'après la PR backend demandée (D127) : une entrée sans lui
 * garde son `institution_id`.
 */
export const CONNEXION = Object.freeze({
  id: 11, user_id: 4, institution_id: 7, institution: { id: 7, name: 'Collège Fictif Horizon' },
  action: 'login', auditable_type: null, auditable_id: null, before: null, after: null,
  ip_address: '203.0.113.5', user_agent: 'Mozilla/5.0 (Essai)', created_at: '2026-11-09T08:15:00.000000Z',
  user: { id: 4, name: 'Awa Essai', email: 'awa@exemple.test', role: 'enseignant' },
})

export const COPIE_MODIFIEE = Object.freeze({
  id: 12, user_id: 5, institution_id: 9,
  action: 'update', auditable_type: 'App\\Models\\EvaluationSubmission', auditable_id: 31, before: null, after: null,
  ip_address: '198.51.100.2', user_agent: 'Mozilla/5.0 (Essai)', created_at: '2026-11-09T08:20:00.000000Z',
  user: { id: 5, name: 'Koffi Essai', email: 'koffi@exemple.test', role: 'etudiant' },
})

export const ECHEC_CONNEXION = Object.freeze({
  id: 13, user_id: null, institution_id: null,
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
