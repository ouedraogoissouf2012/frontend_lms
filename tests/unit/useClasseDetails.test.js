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
    getUpcomingSeances.mockResolvedValue({ success: true, data: [], meta: {} }) // forme serveur : data EST la liste
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

  // D72-b, B-2 : les deux sources du serveur (ClasseDetailsQueryService KLASSCI,
  // LocalClasseDetailsReader LMS) émettent SEULEMENT `evaluations_programmees`. Une clé
  // `evaluations` n'est émise par aucune fiche de classe : elle n'est plus lue (« sans deviner »).
  it('les évaluations viennent de evaluations_programmees, jamais d’une clé evaluations', async () => {
    getClasseDetails.mockResolvedValue({ success: true, data: { classe: { nom: '6e A' }, evaluations: [{ id: 1 }] } })
    const seule = await setup('5')
    expect(seule.api.evaluations.value).toEqual([])
    getClasseDetails.mockResolvedValue({
      success: true,
      data: { classe: { nom: '6e A' }, evaluations: [{ id: 1 }], evaluations_programmees: [{ id: 2 }] },
    })
    const lue = await setup('5')
    expect(lue.api.evaluations.value).toEqual([{ id: 2 }])
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

  // Test renversé (lot « retour honnête », déclaré) : il épinglait le texte du serveur affiché (D0).
  it('sur reponse en echec, renseigne error — le texte du front, jamais le message du serveur', async () => {
    getClasseDetails.mockResolvedValue({ success: false, message: 'vide' })
    const { api } = await setup('5')
    expect(api.error.value).toBe('Impossible de charger les détails de la classe')
  })

  it('viewMatiere / viewEvaluation / goBack pilotent le router', async () => {
    getClasseDetails.mockResolvedValue({ success: false })
    const { api, push, back } = await setup('5')
    api.viewMatiere(42)
    expect(push).toHaveBeenCalledWith({ name: 'matiere-details', params: { id: 42 } })
    // E4c (migration déclarée) : le clic reçoit l'évaluation et suit le rôle ; la gestion ouvre les
    // résultats par l'id LMS (`online_version.id`), jamais par l'id de l'élément.
    session.role = 'admin'
    api.viewEvaluation({ id: 500, has_online: true, online_version: { id: 99 } })
    expect(push).toHaveBeenCalledWith({ name: 'AdminEvaluationDetails', params: { id: 99 } })
    api.goBack()
    expect(back).toHaveBeenCalled()
  })
})

// Lot « retour honnête » (instruction des rouges du 10/11) : erreurs telles que l'intercepteur les rend.
// Le 401 `klassci_token_missing` est un refus DÉFINITIF (lot 3d, école autonome) ; le 500 une panne.
const PIEGE_SERVEUR = 'Texte serveur, jamais affiché'
const refusDefinitif = () => Object.assign(new Error('HTTP 401'), {
  response: { status: 401, data: { success: false, message: PIEGE_SERVEUR, reason: 'klassci_token_missing' } },
  userMessage: "Aucun accès KLASSCI n'est enregistré pour ce compte : les données qui en proviennent ne peuvent pas être affichées.",
})
const pannePassagere = () => Object.assign(new Error('HTTP 500'), {
  response: { status: 500, data: { message: PIEGE_SERVEUR } },
  userMessage: 'Une erreur est survenue côté serveur. Veuillez réessayer plus tard.',
})
const MOTIF_JETON = "Aucun accès KLASSCI n'est enregistré pour ce compte : les données qui en proviennent ne peuvent pas être affichées."

// Le site lisait `err.response.data.message` (D0) : il quitte la liste gelée du cliquet.
describe('useClasseDetails — le motif d’un refus est dit, jamais le texte du serveur', () => {
  it('refus définitif : le motif ; pas de Réessayer', async () => {
    getClasseDetails.mockRejectedValue(refusDefinitif())
    const { api } = await setup('5')
    expect(api.error.value).toBe(MOTIF_JETON)
    expect(api.canRetry.value).toBe(false)
  })

  it('panne passagère : Réessayer reste offert, jamais le texte du serveur', async () => {
    getClasseDetails.mockRejectedValue(pannePassagere())
    const { api } = await setup('5')
    expect(api.canRetry.value).toBe(true)
    expect(api.error.value).not.toContain(PIEGE_SERVEUR)
  })

  it('réponse « success: false » : jamais son message', async () => {
    getClasseDetails.mockResolvedValue({ success: false, message: PIEGE_SERVEUR })
    const { api } = await setup('5')
    expect(api.error.value).toBe('Impossible de charger les détails de la classe')
  })
})

describe('useClasseDetails — canRetry suit le dernier chargement', () => {
  it('refus, puis panne au rechargement : Réessayer revient', async () => {
    getClasseDetails.mockRejectedValue(refusDefinitif())
    const { api } = await setup('5')
    expect(api.canRetry.value).toBe(false)
    getClasseDetails.mockRejectedValue(pannePassagere())
    await api.loadClasseDetails()
    expect(api.canRetry.value).toBe(true)
  })

  it('réponse « success: false » (2xx) : pas une panne, pas de Réessayer', async () => {
    getClasseDetails.mockResolvedValue({ success: false, message: PIEGE_SERVEUR })
    const { api } = await setup('5')
    expect(api.canRetry.value).toBe(false)
  })
})
