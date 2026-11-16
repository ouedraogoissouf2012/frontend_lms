/**
 * #582, points 3, 4 et 5 : l'« Activer Visio » de l'admin était un TODO (console.log) ; `participant-joined` était
 * émis sans écouteur ; la fin de visio annonçait « undefined participant(s) », car elle lisait
 * `participants_disconnected` alors que `end-visio` rend `participants_count`.
 * L'admin programme la visio comme le coordinateur (même confirmation, `toggle-visio`) ; la garde back l'admet pour
 * l'admin d'école après lms_backend#1102 (dépendance d'ordre déclarée).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, reactive } from 'vue'
import { readFileSync } from 'node:fs'
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  toggleVisio: vi.fn(), endVisio: vi.fn(), confirm: vi.fn(), succes: vi.fn(), erreur: vi.fn(),
}))
vi.mock('@/services/lms', () => ({ default: { toggleVisio: h.toggleVisio, endVisio: h.endVisio } }))
vi.mock('@/services/visioFeedback', () => ({
  confirmVisioAction: h.confirm, notifyVisioSuccess: h.succes, notifyVisioError: h.erreur, notifyVisioWarning: vi.fn(),
}))
vi.mock('@/services/klassci', () => ({
  klassciService: new Proxy({}, { get: () => vi.fn().mockResolvedValue({ success: true, data: [] }) }),
}))

import { useAdminSeances } from '@/composables/useAdminSeances'
import { useVisioActions } from '@/composables/useVisioActions'

beforeEach(() => {
  setActivePinia(createPinia())
  Object.values(h).forEach((f) => f.mockReset())
  h.confirm.mockResolvedValue(true)
})

describe('#582.3 — l’admin programme la visio d’une séance', () => {
  it('la confirmation du coordinateur, puis toggle-visio (activée, jitsi)', async () => {
    h.toggleVisio.mockResolvedValue({ success: true })
    let api
    mount(defineComponent({ setup() { api = useAdminSeances(); return () => null } }))
    await flushPromises()
    await api.enableVisio({ id: 12 })
    expect(h.confirm).toHaveBeenCalledWith('Voulez-vous programmer une visioconférence Jitsi pour cette séance ?')
    expect(h.toggleVisio).toHaveBeenCalledWith(12, true, 'jitsi')
  })

  it('refusée à la confirmation : rien ne part', async () => {
    h.confirm.mockResolvedValue(false)
    let api
    mount(defineComponent({ setup() { api = useAdminSeances(); return () => null } }))
    await flushPromises()
    await api.enableVisio({ id: 12 })
    expect(h.toggleVisio).not.toHaveBeenCalled()
  })
})

describe('#582.4 et 5 — la fin de visio et les événements', () => {
  const actions = () => {
    let api
    mount(defineComponent({ setup() { api = useVisioActions(reactive({ seance: { id: 5, visio_active: true } }), vi.fn()); return () => null } }))
    return api
  }

  it('la fin annonce le nombre que le serveur rend (participants_count)', async () => {
    h.endVisio.mockResolvedValue({ success: true, data: { participants_count: 3 } })
    await actions().terminerPourTous()
    expect(h.succes).toHaveBeenCalledWith('Séance terminée : 3 participant(s) déconnecté(s).')
  })

  it('sans nombre rendu : jamais « undefined »', async () => {
    h.endVisio.mockResolvedValue({ success: true, data: {} })
    await actions().terminerPourTous()
    expect(h.succes).toHaveBeenCalledWith('Séance terminée.')
  })

  it('« participant-joined » n’est plus émis (aucun écouteur)', () => {
    expect(readFileSync('src/composables/useVisioActions.js', 'utf8')).not.toContain('participant-joined')
  })
})
