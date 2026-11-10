/**
 * Données de l'écran « Journal d'audit » du supradmin (ARRÊT 1, D126/D127).
 *
 * `GET /api/admin/audit-log` : filtres `action`, `user_id`, `page`, `per_page` (ViewAuditLogRequest) ;
 * réponse `{ success, data: <page Laravel> }`. Règles testées :
 *  - les paramètres envoyés sont ceux que le serveur valide (50 par page) ;
 *  - changer un filtre repart de la page 1 ;
 *  - trois états honnêtes : un journal VIDE seulement après une réponse réussie (`total = 0`) ;
 *    une erreur dit le motif posé par l'intercepteur et ne se fait jamais passer pour un vide ;
 *    « Réessayer » seulement sur une panne passagère (estPannePassagere, #508) ;
 *  - une réponse périmée (filtre changé entre-temps) n'écrase pas la plus récente.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { CONNEXION, COPIE_MODIFIEE, pageDuJournal } from '../fixtures/auditLog'

const h = vi.hoisted(() => ({ list: vi.fn() }))
vi.mock('@/services/auditLog', () => ({ auditLogService: { list: (...a) => h.list(...a) } }))

import { useAdminAuditLog } from '@/composables/useAdminAuditLog'

async function monter() {
  let api
  mount(defineComponent({ setup() { api = useAdminAuditLog(); return () => null } }))
  await flushPromises()
  return api
}
const refus = (status, userMessage) => Object.assign(new Error('refus'), { response: { status }, userMessage })

describe('useAdminAuditLog', () => {
  beforeEach(() => { h.list.mockReset() })

  it('au montage : page 1, 50 par page, aucun filtre ; lit la page Laravel', async () => {
    h.list.mockResolvedValue(pageDuJournal([CONNEXION, COPIE_MODIFIEE], { current_page: 1, last_page: 3, total: 120 }))
    const api = await monter()
    expect(h.list).toHaveBeenCalledTimes(1)
    expect(h.list).toHaveBeenCalledWith({ page: 1, action: '', userId: null })
    expect(api.entrees.value.map((e) => e.id)).toEqual([11, 12])
    expect([api.page.value, api.dernierePage.value, api.total.value]).toEqual([1, 3, 120])
    expect(api.etatVide.value).toBeNull()
  })

  it('page suivante puis précédente ; jamais au-delà des bornes', async () => {
    h.list.mockResolvedValue(pageDuJournal([CONNEXION], { current_page: 1, last_page: 2, total: 51 }))
    const api = await monter()
    api.pagePrecedente()
    expect(h.list).toHaveBeenCalledTimes(1)
    h.list.mockResolvedValue(pageDuJournal([COPIE_MODIFIEE], { current_page: 2, last_page: 2, total: 51 }))
    api.pageSuivante()
    await flushPromises()
    expect(h.list).toHaveBeenLastCalledWith({ page: 2, action: '', userId: null })
    api.pageSuivante()
    expect(h.list).toHaveBeenCalledTimes(2)
  })

  it('filtre d’action puis d’acteur : repart de la page 1, et se retire', async () => {
    h.list.mockResolvedValue(pageDuJournal([CONNEXION], { current_page: 2, last_page: 4, total: 160 }))
    const api = await monter()
    api.choisirAction('login')
    await flushPromises()
    expect(h.list).toHaveBeenLastCalledWith({ page: 1, action: 'login', userId: null })
    api.filtrerActeur(CONNEXION.user)
    await flushPromises()
    expect(h.list).toHaveBeenLastCalledWith({ page: 1, action: 'login', userId: 4 })
    expect(api.acteur.value).toEqual({ id: 4, name: 'Awa Essai' })
    api.retirerActeur()
    await flushPromises()
    expect(h.list).toHaveBeenLastCalledWith({ page: 1, action: 'login', userId: null })
    expect(api.acteur.value).toBeNull()
  })

  it('vide : « journal » sans filtre, « filtre » avec — seulement après une réponse réussie', async () => {
    h.list.mockResolvedValue(pageDuJournal([], { total: 0 }))
    const api = await monter()
    expect(api.etatVide.value).toBe('journal')
    api.choisirAction('export')
    await flushPromises()
    expect(api.etatVide.value).toBe('filtre')
  })

  it('erreur : le motif de l’intercepteur, la liste vidée, et JAMAIS un faux « vide »', async () => {
    h.list.mockResolvedValue(pageDuJournal([CONNEXION]))
    const api = await monter()
    h.list.mockRejectedValue(refus(500, 'Le service est momentanément indisponible.'))
    api.charger(1)
    await flushPromises()
    expect(api.erreur.value).toBe('Le service est momentanément indisponible.')
    expect(api.entrees.value).toEqual([])
    expect(api.etatVide.value).toBeNull()
    expect(api.peutReessayer.value).toBe(true)
  })

  it('refus définitif (403) : pas de « Réessayer » ; sans motif, un texte du front', async () => {
    h.list.mockRejectedValue(refus(403))
    const api = await monter()
    expect(api.peutReessayer.value).toBe(false)
    expect(api.erreur.value).toBe('Impossible de charger le journal d’audit.')
  })

  it('une réponse périmée n’écrase pas la plus récente', async () => {
    h.list.mockResolvedValue(pageDuJournal([CONNEXION]))
    const api = await monter()
    let lente
    h.list.mockImplementationOnce(() => new Promise((r) => { lente = r }))
    api.choisirAction('update')
    h.list.mockResolvedValueOnce(pageDuJournal([COPIE_MODIFIEE]))
    api.choisirAction('login')
    await flushPromises()
    lente(pageDuJournal([CONNEXION]))
    await flushPromises()
    expect(api.entrees.value.map((e) => e.id)).toEqual([12])
    expect(api.action.value).toBe('login')
  })
})
