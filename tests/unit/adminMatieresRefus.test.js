/**
 * /admin/matieres : un refus du serveur dit son sens par le `reason`, ou le repli du front,
 * jamais le texte du serveur (D0). Revue indépendante de #506 : aucun test de comportement.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const k = vi.hoisted(() => ({ getAdminMatieres: vi.fn(), getStructure: vi.fn() }))
vi.mock('@/services/klassci', () => ({ klassciService: k }))
vi.mock('@/services/cache', () => ({
  readCache: () => null, readCacheStale: () => ({ data: null, fresh: false }), writeCache: vi.fn(),
  clearCache: vi.fn(), invalidateEntity: vi.fn(),
}))

import { useAdminMatieres } from '@/composables/useAdminMatieres'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

async function charger() {
  let api
  mount(defineComponent({ setup() { api = useAdminMatieres(); return () => null } }))
  await flushPromises()
  return api
}

beforeEach(() => {
  k.getStructure.mockReset().mockResolvedValue({ filieres: [], niveaux_etudes: [] })
  k.getAdminMatieres.mockReset()
})

describe('/admin/matieres — refus du chargement', () => {
  it('avec un `reason` connu : le catalogue', async () => {
    k.getAdminMatieres.mockResolvedValue({ success: false, message: 'Texte serveur détaillé', reason: 'no_institution' })
    const c = await charger()
    expect(c.error.value).toBe(ERROR_MESSAGES.noInstitution)
  })

  it('sans `reason` : le repli du front, jamais le texte du serveur', async () => {
    k.getAdminMatieres.mockResolvedValue({ success: false, message: 'Texte serveur détaillé' })
    const c = await charger()
    expect(c.error.value).toBe('Erreur lors du chargement des matières')
  })
})
