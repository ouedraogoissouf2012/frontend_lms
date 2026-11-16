/**
 * #310 : la liste admin des visioconférences ouvrait la salle par `window.open(buildJitsiUrl(roomId))`, SANS jeton.
 * Le serveur visio exige une authentification (ENABLE_AUTH=1, ENABLE_GUESTS=0) : l'admin tombait sur un refus, sans
 * message exploitable. Il entre désormais comme l'enseignant et l'élève depuis #673 : par la salle EMBARQUÉE
 * (`visioStore.joinVisio`), qui obtient le jeton du serveur. Si le serveur refuse l'admin, son motif est DIT
 * (catalogue, `actor_not_authorized`). La garde back admet l'admin d'école après lms_backend#1102 (déclaré).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ getSeances: vi.fn(), join: vi.fn(), erreur: vi.fn() }))
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: () => {} }))
vi.mock('@/services/klassci', () => ({ klassciService: { getSeances: (...a) => h.getSeances(...a) } }))
vi.mock('@/stores/visio', () => ({ useVisioStore: () => ({ joinVisio: h.join }) }))
vi.mock('@/services/visioFeedback', () => ({ notifyVisioError: h.erreur, notifyVisioSuccess: vi.fn(), notifyVisioWarning: vi.fn(), confirmVisioAction: vi.fn() }))

import { useAdminVisio } from '@/composables/useAdminVisio'
import { messageForReason } from '@/services/errorHandler'
import { userError } from '@/utils/userError'

const SEANCE = { id: 10, visio_enabled: true, matiere: { nom: 'SVT' }, classe: { name: '3e A' }, enseignant: { nom: 'Diallo' },
  date_debut: new Date(Date.now() - 3600e3).toISOString(), date_fin: new Date(Date.now() + 3600e3).toISOString(), visio: { room_id: 'salle-10' } }

async function preparer() {
  h.getSeances.mockResolvedValue({ success: true, data: [SEANCE] })
  let api
  mount(defineComponent({ setup() { api = useAdminVisio(); return () => null } }))
  await flushPromises()
  return api
}

beforeEach(() => { Object.values(h).forEach((f) => f.mockReset()) })

describe('#310 — l’admin entre dans la salle avec un jeton', () => {
  it('admis : la salle embarquée (visioStore.joinVisio, qui obtient le jeton), jamais un onglet sans jeton', async () => {
    const open = vi.fn()
    vi.stubGlobal('open', open)
    h.join.mockResolvedValue({ success: true })
    const v = await preparer()
    await v.joinVisio(v.visioconferences.value[0])
    expect(h.join).toHaveBeenCalledWith(10)
    expect(open).not.toHaveBeenCalled()
    expect(h.erreur).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
  })

  it('refusé par le serveur : le motif est dit (actor_not_authorized, catalogue), rien n’est levé', async () => {
    const refus = userError(messageForReason('actor_not_authorized'))
    h.join.mockRejectedValue(refus)
    const v = await preparer()
    await expect(v.joinVisio(v.visioconferences.value[0])).resolves.toBeUndefined()
    expect(h.erreur).toHaveBeenCalledWith(refus, expect.any(String))
    expect(refus.userMessage).toBe('Votre rôle ne permet pas de rejoindre cette visioconférence.')
  })
})
