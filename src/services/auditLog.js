import api from './api'
import { endpoints } from './endpoints'

/** Taille de page : le défaut du serveur (`AuditLogController::index`, `per_page` 1-100). */
export const AUDIT_LOG_PAGE_SIZE = 50

/**
 * Journal d'audit de la plateforme (`GET /api/admin/audit-log`, supradmin strict, lecture seule).
 * Un filtre absent n'est PAS envoyé : `action=` vide serait refusé par la règle `in:` (422).
 */
export const auditLogService = {
  /**
   * @param {{page: number, action?: string, userId?: number|null}} filtres
   * @returns {Promise<{success: boolean, data: object}>} corps : `{ success, data: <page Laravel> }`
   */
  list({ page, action, userId }) {
    const params = { page, per_page: AUDIT_LOG_PAGE_SIZE }
    if (action) params.action = action
    if (userId != null) params.user_id = userId
    return api.get(endpoints.admin.auditLog, { params })
  },
}
