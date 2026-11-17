/**
 * #601 : seul l'enseignant crée une leçon (décision du user, 17/11 ; back lms_backend#1167). Le coordinateur
 * voyait « Nouvelle leçon », parce que le bouton suivait `isTeacher` (enseignant OU coordinateur). La création a
 * désormais sa propre permission, `canCreateLesson`, réservée à l'enseignant. `isTeacher` garde le reste
 * (modifier, supprimer, publier) : le user ne l'a pas tranché, le coordinateur le conserve.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi } from 'vitest'

const porte = vi.hoisted(() => ({ role: { valeur: 'enseignant' }, getMatiereDetails: vi.fn() }))
vi.mock('@/services/lms', () => ({
  default: { getMatiereDetails: (...a) => porte.getMatiereDetails(...a), hideSeance: vi.fn() },
}))
vi.mock('@/services/lesson', () => ({
  default: { createLesson: vi.fn(), getLesson: vi.fn(), deleteLesson: vi.fn(), publishLesson: vi.fn(), unpublishLesson: vi.fn() },
}))
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({ id: 1, role: porte.role.valeur }) } }))
vi.mock('@/composables/useStartEvaluation', () => ({ useStartEvaluation: () => ({ ouvrirEvaluation: vi.fn() }) }))

import MatiereLessonsTab from '@/components/matieres/MatiereLessonsTab.vue'
import MatiereDetails from '@/views/matieres/MatiereDetails.vue'
import { useMatiereDetails } from '@/composables/useMatiereDetails'
import { messageForReason, normalizeError } from '@/services/errorHandler'

const AVEC_LECON = {
  success: true,
  data: {
    matiere: { id: 1, nom: 'Mathématiques' },
    lessons: [{ id: 10, title: 'Leçon 1' }],
    seances_programmees: [], evaluations_programmees: [], classes_concernees: [], statistiques: {},
  },
}
const CREER = /^(Nouvelle leçon|Créer ma première leçon)$/
const boutonsCreer = (w) => w.findAll('button').filter((b) => CREER.test(b.text().trim()))
const MOTIF = 'lesson_creation_teacher_only'
const TEXTE_MOTIF = 'Seul un enseignant peut créer une leçon.'

describe('#601 — l’onglet Leçons : la création suit `canCreate`, le reste suit `isTeacher`', () => {
  const carte = { template: '<div class="lc" :data-enseignant="String(isTeacher)" />', props: ['lesson', 'isTeacher'] }
  const onglet = (props) => mount(MatiereLessonsTab, { props: { loading: false, viewMode: 'grid', ...props }, global: { stubs: { LessonCard: carte } } })

  it('coordinateur (isTeacher, sans canCreate) : aucun bouton de création ; ses cartes gardent leurs actions', () => {
    const w = onglet({ lessons: [{ id: 1 }], isTeacher: true, canCreate: false })
    expect(boutonsCreer(w)).toHaveLength(0)
    expect(w.find('.lc').attributes('data-enseignant')).toBe('true')
  })

  it('coordinateur, matière sans leçon : ni « Créer ma première leçon », ni l’invitation à créer', () => {
    const w = onglet({ lessons: [], isTeacher: true, canCreate: false })
    expect(boutonsCreer(w)).toHaveLength(0)
    expect(w.text()).not.toContain('Créez votre première leçon')
  })

  it('enseignant (canCreate) : « Nouvelle leçon » émet create ; la matière vide invite à créer', async () => {
    const w = onglet({ lessons: [{ id: 1 }], isTeacher: true, canCreate: true })
    await boutonsCreer(w)[0].trigger('click')
    expect(w.emitted('create')).toHaveLength(1)
    const vide = onglet({ lessons: [], isTeacher: true, canCreate: true })
    expect(boutonsCreer(vide).map((b) => b.text().trim())).toEqual(['Nouvelle leçon', 'Créer ma première leçon'])
  })
})

async function composable(role) {
  porte.role.valeur = role
  porte.getMatiereDetails.mockResolvedValue(AVEC_LECON)
  let api
  mount(defineComponent({ setup() { api = useMatiereDetails(); return () => null } }), {
    global: { mocks: { $route: { params: { id: '1' } }, $router: { push: vi.fn(), back: vi.fn() } } },
  })
  await flushPromises()
  return api
}

describe('#601 — useMatiereDetails : `canCreateLesson` est réservé à l’enseignant', () => {
  it.each([
    ['enseignant', true],
    ['coordinateur', false],
    ['admin', false],
    ['etudiant', false],
  ])('%s : canCreateLesson = %s', async (role, attendu) => {
    expect((await composable(role)).canCreateLesson.value).toBe(attendu)
  })

  it('coordinateur : isTeacher reste vrai (modifier, supprimer, publier : non tranché, inchangé)', async () => {
    expect((await composable('coordinateur')).isTeacher.value).toBe(true)
  })

  it('coordinateur : createLesson n’ouvre pas la modale ; l’enseignant, si', async () => {
    const coord = await composable('coordinateur')
    coord.createLesson()
    expect(coord.showCreateLessonModal.value).toBe(false)
    const prof = await composable('enseignant')
    prof.createLesson()
    expect(prof.showCreateLessonModal.value).toBe(true)
  })
})

describe('#601 — la page Matière, montée : le câblage de la permission', () => {
  const page = async (role) => {
    porte.role.valeur = role
    porte.getMatiereDetails.mockResolvedValue(AVEC_LECON)
    const w = mount(MatiereDetails, {
      global: {
        stubs: {
          DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: { template: '<div><slot /></div>' },
          LessonCard: true, MatiereSeancesTab: true, MatiereEvaluationsTab: true, MatiereClassesTab: true,
        },
        mocks: { $route: { params: { id: '1' } }, $router: { push: vi.fn(), back: vi.fn() } },
      },
    })
    await flushPromises()
    return w
  }

  it.each([['coordinateur'], ['admin']])('%s : aucun point d’entrée de création', async (role) => {
    expect(boutonsCreer(await page(role))).toHaveLength(0)
  })

  it('enseignant : « Nouvelle leçon » est là', async () => {
    expect(boutonsCreer(await page('enseignant'))).toHaveLength(1)
  })
})

describe('#601 — le refus du serveur (lms_backend#1167) est dit par le catalogue (D0)', () => {
  it('le motif a son texte', () => {
    expect(messageForReason(MOTIF)).toBe(TEXTE_MOTIF)
  })

  it('un 403 qui le porte : le texte du catalogue, jamais celui du serveur', () => {
    const err = { response: { status: 403, data: { reason: MOTIF, message: 'Texte fictif du serveur' } } }
    const { userMessage } = normalizeError(err)
    expect(userMessage).toBe(TEXTE_MOTIF)
    expect(userMessage).not.toContain('Texte fictif du serveur')
  })
})
