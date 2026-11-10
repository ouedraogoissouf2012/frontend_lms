/**
 * Service du journal d'audit : il n'envoie que des paramètres que `ViewAuditLogRequest` valide
 * (`page`, `per_page` 1-100, `action` ∈ 9 valeurs, `user_id` existant). Un filtre absent n'est
 * PAS envoyé : `action=` vide serait refusé par la règle `in:` (422).
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/services/api', () => ({ default: { get: (...a) => h.get(...a) } }))

import { auditLogService } from '@/services/auditLog'

describe('auditLogService.list', () => {
  beforeEach(() => { h.get.mockReset().mockResolvedValue({ success: true, data: { data: [] } }) })

  it('sans filtre : page et 50 par page seulement', async () => {
    await auditLogService.list({ page: 1, action: '', userId: null })
    expect(h.get).toHaveBeenCalledWith('/admin/audit-log', { params: { page: 1, per_page: 50 } })
  })

  it('avec filtres : action et user_id', async () => {
    await auditLogService.list({ page: 3, action: 'login_failed', userId: 4 })
    expect(h.get).toHaveBeenCalledWith('/admin/audit-log', { params: { page: 3, per_page: 50, action: 'login_failed', user_id: 4 } })
  })
})
