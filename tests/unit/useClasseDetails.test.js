/**
 * Test du composable useClasseDetails (#H9). Services LMS/KLASSCI mockes, route
 * injectee via global.mocks (la vue reste pilotee par $route/$router).
 *
 * Les mocks du service LMS sont declares au NIVEAU MODULE (et non dans la factory
 * `vi.mock`) : une `vi.fn()` creee dans la factory n'est referencable par aucun
 * test, donc inassertable. Le wrapper paresseux `(...a) => fn(...a)` reste
 * indispensable — `vi.mock` est hisse au-dessus de ces `const`.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getClasseDetails = vi.fn()
const getClasseEtudiants = vi.fn()
const getUpcomingSeances = vi.fn()
vi.mock('@/services/lms', () => ({
  default: {
    getClasseDetails: (...a) => getClasseDetails(...a),
    getClasseEtudiants: (...a) => getClasseEtudiants(...a),
    getUpcomingSeances: (...a) => getUpcomingSeances(...a)
  }
}))
vi.mock('@/services/klassci', () => ({
  default: { getMatieres: vi.fn().mockResolvedValue([{ id: 7 }, { id: 8 }]) }
}))
// Le rôle est lu à chaque appel : un test peut le changer avant le montage.
const session = vi.hoisted(() => ({ role: 'enseignant' }))
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({ role: session.role }) } }))

import { useClasseDetails } from '@/composables/useClasseDetails'

async function setup(routeId = '5') {
  const push = vi.fn(); const back = vi.fn()
  let api
  const Comp = defineComponent({ setup() { api = useClasseDetails(); return () => null } })
  mount(Comp, { global: { mocks: { $route: { params: { id: routeId } }, $router: { push, back } } } })
  await flushPromises()
  return { api, push, back }
}

describe('useClasseDetails (#H9)', () => {
  // Compteurs d'appel remis a zero AVANT chaque test : sans cela, l'assertion
  // « l'endpoint etudiants n'est pas appele » verrait les appels des tests
  // precedents et passerait/echouerait selon l'ordre d'execution.
  beforeEach(() => {
    vi.clearAllMocks()
    session.role = 'enseignant'
    getClasseEtudiants.mockResolvedValue({ success: true, data: { etudiants: [{ id: 1 }] } })
    getUpcomingSeances.mockResolvedValue({ success: true, data: { seances: [] } })
  })

  it('charge la classe au montage avec id de route, puis matieres + etudiants', async () => {
    getClasseDetails.mockResolvedValue({
      success: true,
      data: {
        classe: { nom: '6e A' },
        matieres_disponibles: [{ id: 7 }, { id: 8 }],
        evaluations_programmees: [{ id: 1 }]
      }
    })
    const { api } = await setup('5')
    expect(getClasseDetails).toHaveBeenCalledWith(5)
    expect(api.classeId.value).toBe(5)
    expect(api.classe.value).toEqual({ nom: '6e A' })
    expect(api.matieres.value).toHaveLength(2)
    expect(api.etudiants.value).toHaveLength(1)
    expect(api.loading.value).toBe(false)
  })

  // Non-regression #273 (dette declaree en PR) : KLASSCI refuse
  // `classes/{id}/etudiants` par un 403 PAR CLASSE, tous roles confondus, alors
  // que l'enveloppe de `/lms/classes/{id}` porte deja le roster. Ce test verrouille
  // la SOURCE du roster : rappeler l'endpoint interdit reintroduirait le
  // « 0 etudiant » sur des classes peuplees.
  it('lit le roster dans les details deja recus, sans rappeler l endpoint etudiants (#273)', async () => {
    getClasseDetails.mockResolvedValue({
      success: true,
      data: {
        classe: { nom: 'B2 COM' },
        etudiants: [{ id: 11 }, { id: 12 }, { id: 13 }],
        matieres_disponibles: [{ id: 7 }]
      }
    })
    const { api } = await setup('1')
    expect(api.etudiants.value).toHaveLength(3)
    expect(api.etudiants.value.map(e => e.id)).toEqual([11, 12, 13])
    expect(getClasseEtudiants).not.toHaveBeenCalled()
  })

  // Face symetrique : l'appel separe reste le REPLI (payload sans roster), il
  // n'est pas supprime — seulement subordonne a l'absence de donnee en main.
  it('retombe sur l endpoint etudiants quand l enveloppe n en contient pas', async () => {
    getClasseDetails.mockResolvedValue({
      success: true,
      data: { classe: { nom: 'B2 COM' }, etudiants: [] }
    })
    const { api } = await setup('1')
    expect(getClasseEtudiants).toHaveBeenCalledWith(1)
    expect(api.etudiants.value).toHaveLength(1)
  })

  it('expose les 4 onglets avec compteurs', async () => {
    getClasseDetails.mockResolvedValue({
      success: true,
      data: {
        classe: {},
        matieres_disponibles: [{ id: 7 }],
        evaluations_programmees: [{ id: 1 }, { id: 2 }]
      }
    })
    const { api } = await setup('5')
    const ids = api.tabs.value.map(t => t.id)
    expect(ids).toEqual(['matieres', 'etudiants', 'evaluations', 'planning'])
    expect(api.tabs.value[0].count).toBe(1)
    expect(api.tabs.value[2].count).toBe(2)
  })

  // Le backend vide le roster pour un élève (ADR-GHSA-gg7j-01). Côté écran, un
  // onglet « Étudiants (0) » serait une mesure fausse, et le repli vers
  // `/lms/classes/{id}/etudiants` répondrait 403.
  it('un élève ne voit pas l onglet Étudiants et ne rappelle pas l endpoint', async () => {
    session.role = 'etudiant'
    getClasseDetails.mockResolvedValue({
      success: true,
      data: { classe: { nom: 'B2 COM' }, etudiants: [], matieres_disponibles: [{ id: 7 }] }
    })
    const { api } = await setup('1')
    expect(api.rosterVisible.value).toBe(false)
    expect(api.tabs.value.map(t => t.id)).toEqual(['matieres', 'evaluations', 'planning'])
    expect(getClasseEtudiants).not.toHaveBeenCalled()
  })

  // Fail-closed, comme le serveur : un rôle que l'on ne connaît pas est un élève.
  it('un rôle inconnu est traité comme un élève', async () => {
    session.role = 'invite'
    getClasseDetails.mockResolvedValue({ success: true, data: { classe: {}, etudiants: [] } })
    const { api } = await setup('1')
    expect(api.rosterVisible.value).toBe(false)
    expect(api.tabs.value.map(t => t.id)).not.toContain('etudiants')
    expect(getClasseEtudiants).not.toHaveBeenCalled()
  })

  it('sur reponse en echec, renseigne error', async () => {
    getClasseDetails.mockResolvedValue({ success: false, message: 'vide' })
    const { api } = await setup('5')
    expect(api.error.value).toBe('vide')
  })

  it('viewMatiere / viewEvaluation / goBack pilotent le router', async () => {
    getClasseDetails.mockResolvedValue({ success: false })
    const { api, push, back } = await setup('5')
    api.viewMatiere(42)
    expect(push).toHaveBeenCalledWith({ name: 'matiere-details', params: { id: 42 } })
    api.viewEvaluation(99)
    expect(push).toHaveBeenCalledWith({ name: 'AdminEvaluationDetails', params: { id: 99 } })
    api.goBack()
    expect(back).toHaveBeenCalled()
  })
})
