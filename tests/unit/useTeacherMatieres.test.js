/**
 * Test du composable useTeacherMatieres (#H9). lmsService et vue-router mockes.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'

const push = vi.fn()
const getMyMatieres = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
vi.mock('@/services/lms', () => ({ default: { getMyMatieres: (...a) => getMyMatieres(...a) } }))
const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() }))
vi.mock('@/composables/useToast', () => ({ toast }))

import { useTeacherMatieres } from '@/composables/useTeacherMatieres'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useTeacherMatieres(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useTeacherMatieres (#H9)', () => {
  it('charge les matieres au montage (getMyMatieres renvoie un tableau normalise, #296)', async () => {
    getMyMatieres.mockResolvedValue([{ id: 1 }, { id: 2 }])
    const api = await setup()
    expect(api.matieres.value).toHaveLength(2)
    expect(api.loading.value).toBe(false)
    expect(api.error.value).toBe(null)
  })

  // Test inversé : il exigeait le texte figé « Impossible de charger les matières »
  // pour tout échec. Une erreur sans réponse HTTP dit désormais le message du
  // catalogue (le motif serveur : cf. messagesFiges.test.js, au vrai client).
  it('sur erreur sans reponse HTTP, renseigne le message du catalogue', async () => {
    getMyMatieres.mockRejectedValue(new Error('reseau'))
    const api = await setup()
    expect(api.error.value).toBe(ERROR_MESSAGES.unknown)
  })

  it('navigateToMatiere resout l id et pousse la route', async () => {
    getMyMatieres.mockResolvedValue([])
    const api = await setup()
    push.mockClear()
    api.navigateToMatiere({ matiere_id: 42 })
    expect(push).toHaveBeenCalledWith({ name: 'matiere-details', params: { id: 42 } })
    api.navigateToMatiere({ id: 7 })
    expect(push).toHaveBeenCalledWith({ name: 'matiere-details', params: { id: 7 } })
  })

  it('navigateToMatiere sans id renseigne error', async () => {
    getMyMatieres.mockResolvedValue([])
    const api = await setup()
    push.mockClear()
    api.navigateToMatiere({})
    expect(push).not.toHaveBeenCalled()
    expect(api.error.value).toBe('Impossible de naviguer vers cette matière')
  })
})

// Lot « Réessayer », PR B1 : un refus ne propose pas « Réessayer », une panne le propose ; l'erreur
// de navigation locale (aucune requête) non plus.
describe('useTeacherMatieres — Réessayer seulement sur une panne passagère', () => {
  it('refus 401, puis panne 503 au rechargement', async () => {
    getMyMatieres.mockRejectedValue(Object.assign(new Error('HTTP 401'), { response: { status: 401, data: { reason: 'klassci_token_missing' } } }))
    const u = await setup()
    expect(u.canRetry.value).toBe(false)
    getMyMatieres.mockRejectedValue(Object.assign(new Error('HTTP 503'), { response: { status: 503 } }))
    await u.loadMatieres()
    expect(u.canRetry.value).toBe(true)
  })

  // Revue de #519 : une carte sans id remplaçait toute la grille par une erreur sans bouton (impasse).
  // C'est une erreur de NAVIGATION, pas de chargement : un toast, et la grille reste.
  it('matière sans id : un toast, la liste reste affichée, aucune erreur de chargement', async () => {
    getMyMatieres.mockResolvedValue([{ id: 3, nom: 'Maths' }])
    const u = await setup()
    toast.error.mockClear()
    u.navigateToMatiere({ nom: 'Sans id' })
    expect(toast.error).toHaveBeenCalledWith('Impossible de naviguer vers cette matière')
    expect(u.error.value).toBeNull()
    expect(u.matieres.value).toHaveLength(1)
    expect(push).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'matiere-details' }))
  })
})
