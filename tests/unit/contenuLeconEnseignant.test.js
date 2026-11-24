/**
 * #601 : sur une leçon, le coordinateur et l'admin d'école ne font que CONSULTER (décisions du user, 17/11 ; back
 * lms_backend#1167). Le contenu est l'affaire de l'enseignant : créer, modifier, publier, dépublier, supprimer, et les
 * chapitres et leurs quiz. Le coordinateur voyait ces actions, parce qu'elles suivaient `isTeacher` (enseignant OU
 * coordinateur). L'écriture a sa propre permission, `canWriteLesson`, réservée à l'enseignant ; `isTeacher` ne
 * commande plus que des LECTURES (statistiques, statut), que le coordinateur garde.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const porte = vi.hoisted(() => ({
  role: { valeur: 'enseignant' },
  getMatiereDetails: vi.fn(),
  confirmer: vi.fn(),
  lecon: {
    createLesson: vi.fn(), getLesson: vi.fn(), deleteLesson: vi.fn(), publishLesson: vi.fn(), unpublishLesson: vi.fn(),
  },
}))
vi.mock('@/services/lms', () => ({
  default: { getMatiereDetails: (...a) => porte.getMatiereDetails(...a), hideSeance: vi.fn() },
}))
vi.mock('@/services/lesson', () => ({
  default: {
    createLesson: (...a) => porte.lecon.createLesson(...a),
    getLesson: (...a) => porte.lecon.getLesson(...a),
    deleteLesson: (...a) => porte.lecon.deleteLesson(...a),
    publishLesson: (...a) => porte.lecon.publishLesson(...a),
    unpublishLesson: (...a) => porte.lecon.unpublishLesson(...a),
  },
}))
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({ id: 1, role: porte.role.valeur }) } }))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: (...a) => porte.confirmer(...a) }) }))
vi.mock('@/composables/useStartEvaluation', () => ({ useStartEvaluation: () => ({ ouvrirEvaluation: vi.fn() }) }))

import MatiereLessonsTab from '@/components/matieres/MatiereLessonsTab.vue'
import LessonCard from '@/components/lessons/LessonCard.vue'
import LessonCardActions from '@/components/lessons/LessonCardActions.vue'
import MatiereDetails from '@/views/matieres/MatiereDetails.vue'
import { useMatiereDetails } from '@/composables/useMatiereDetails'
import { lessonRoutes } from '@/router/routes/lessons.routes'
import { isTeacher } from '@/constants/roles'
import { messageForReason, normalizeError } from '@/services/errorHandler'

const BROUILLON = { id: 10, title: 'Leçon fictive', status: 'draft', created_at: '2026-11-01T08:00:00Z' }
const PUBLIEE = { id: 11, title: 'Leçon publiée fictive', status: 'published', created_at: '2026-11-01T08:00:00Z' }
const AVEC_LECON = {
  success: true,
  data: {
    matiere: { id: 1, nom: 'Mathématiques' },
    lessons: [BROUILLON],
    seances_programmees: [], evaluations_programmees: [], classes_concernees: [], statistiques: {},
  },
}
const CREER = /^(Nouvelle leçon|Créer ma première leçon)$/
const ECRIRE = /(Publier|Dépublier|Modifier|Supprimer)$/
const boutons = (w, motif) => w.findAll('button').filter((b) => motif.test(b.text().trim()))
const MOTIF = 'lesson_content_teacher_only'
const TEXTE_MOTIF = 'Le contenu d\'une leçon est réservé à son enseignant : vous pouvez la consulter.'

beforeEach(() => {
  porte.getMatiereDetails.mockReset()
  porte.getMatiereDetails.mockResolvedValue(AVEC_LECON)
  porte.confirmer.mockReset()
  porte.confirmer.mockResolvedValue(true)
  for (const fn of Object.values(porte.lecon)) {
    fn.mockReset()
    fn.mockResolvedValue({ success: true, data: { id: 10, title: 'Leçon fictive', classe_id: 2 } })
  }
})

describe('#601 — les actions d’une carte de leçon suivent `canWrite`', () => {
  const actions = (lesson, props) => mount(LessonCardActions, { props: { lesson, ...props } })

  it('coordinateur (isTeacher, sans canWrite) : ni publier, ni modifier, ni supprimer ; « Détails » reste', () => {
    const w = actions(BROUILLON, { isTeacher: true, canWrite: false })
    expect(boutons(w, ECRIRE)).toHaveLength(0)
    expect(w.text()).toContain('Détails')
    expect(boutons(actions(PUBLIEE, { isTeacher: true, canWrite: false }), ECRIRE)).toHaveLength(0)
  })

  it('enseignant (canWrite) : un brouillon se publie, se modifie, se supprime ; une leçon publiée se dépublie', () => {
    const brouillon = actions(BROUILLON, { isTeacher: true, canWrite: true })
    expect(boutons(brouillon, ECRIRE).map((b) => b.text().trim().split(' ').pop())).toEqual(['Publier', 'Modifier', 'Supprimer'])
    expect(boutons(actions(PUBLIEE, { isTeacher: true, canWrite: true }), ECRIRE).map((b) => b.text().trim().split(' ').pop()))
      .toEqual(['Dépublier', 'Modifier', 'Supprimer'])
  })

  it('la carte transmet `canWrite` à ses actions', () => {
    expect(boutons(mount(LessonCard, { props: { lesson: BROUILLON, isTeacher: true, canWrite: false } }), ECRIRE)).toHaveLength(0)
    expect(boutons(mount(LessonCard, { props: { lesson: BROUILLON, isTeacher: true, canWrite: true } }), ECRIRE)).toHaveLength(3)
  })
})

describe('#601 — l’onglet Leçons : l’écriture suit `canWrite`, les lectures suivent `isTeacher`', () => {
  const carte = {
    template: '<div class="lc" :data-ecrire="String(canWrite)" :data-stats="String(showStats)" />',
    props: ['lesson', 'isTeacher', 'canWrite', 'showStats'],
  }
  const onglet = (props) => mount(MatiereLessonsTab, { props: { loading: false, viewMode: 'grid', ...props }, global: { stubs: { LessonCard: carte } } })

  it('coordinateur : aucun bouton de création, des cartes sans écriture, mais leurs statistiques', () => {
    const w = onglet({ lessons: [BROUILLON], isTeacher: true, canWrite: false })
    expect(boutons(w, CREER)).toHaveLength(0)
    expect(w.find('.lc').attributes('data-ecrire')).toBe('false')
    expect(w.find('.lc').attributes('data-stats')).toBe('true')
  })

  it('coordinateur, matière sans leçon : ni « Créer ma première leçon », ni l’invitation à créer', () => {
    const w = onglet({ lessons: [], isTeacher: true, canWrite: false })
    expect(boutons(w, CREER)).toHaveLength(0)
    expect(w.text()).not.toContain('Créez votre première leçon')
  })

  it('enseignant : « Nouvelle leçon » émet create ; ses cartes écrivent ; la matière vide invite à créer', async () => {
    const w = onglet({ lessons: [BROUILLON], isTeacher: true, canWrite: true })
    expect(w.find('.lc').attributes('data-ecrire')).toBe('true')
    await boutons(w, CREER)[0].trigger('click')
    expect(w.emitted('create')).toHaveLength(1)
    const vide = onglet({ lessons: [], isTeacher: true, canWrite: true })
    expect(boutons(vide, CREER).map((b) => b.text().trim())).toEqual(['Nouvelle leçon', 'Créer ma première leçon'])
  })
})

async function composable(role) {
  porte.role.valeur = role
  let api
  mount(defineComponent({ setup() { api = useMatiereDetails(); return () => null } }), {
    global: { mocks: { $route: { params: { id: '1' } }, $router: { push: vi.fn(), back: vi.fn() } } },
  })
  await flushPromises()
  return api
}

describe('#601 — useMatiereDetails : `canWriteLesson` est réservé à l’enseignant', () => {
  it.each([
    ['enseignant', true],
    ['coordinateur', false],
    ['admin', false],
    ['etudiant', false],
  ])('%s : canWriteLesson = %s', async (role, attendu) => {
    expect((await composable(role)).canWriteLesson.value).toBe(attendu)
  })

  it('coordinateur : isTeacher reste vrai (les lectures : statistiques et statut)', async () => {
    expect((await composable('coordinateur')).isTeacher.value).toBe(true)
  })

  it('coordinateur : créer, modifier, supprimer, publier et dépublier sont inertes (aucun appel, aucune confirmation)', async () => {
    const api = await composable('coordinateur')
    api.createLesson()
    await api.editLesson(10)
    await api.confirmDeleteLesson(10)
    await api.publishLesson(10)
    await api.unpublishLesson(10)
    await flushPromises()
    expect(api.showCreateLessonModal.value).toBe(false)
    expect(porte.confirmer).not.toHaveBeenCalled()
    for (const fn of Object.values(porte.lecon)) expect(fn).not.toHaveBeenCalled()
  })

  it('enseignant : les mêmes gestes atteignent le service', async () => {
    const api = await composable('enseignant')
    api.createLesson()
    expect(api.showCreateLessonModal.value).toBe(true)
    api.closeCreateLessonModal()
    await api.editLesson(10)
    await api.confirmDeleteLesson(10)
    await api.publishLesson(10)
    await api.unpublishLesson(10)
    await flushPromises()
    expect(porte.lecon.getLesson).toHaveBeenCalledWith(10)
    expect(porte.confirmer).toHaveBeenCalledTimes(1)
    expect(porte.lecon.deleteLesson).toHaveBeenCalledWith(10)
    expect(porte.lecon.publishLesson).toHaveBeenCalledWith(10)
    expect(porte.lecon.unpublishLesson).toHaveBeenCalledWith(10)
  })
})

describe('#601 — la page Matière, montée : le câblage de la permission', () => {
  const page = async (role) => {
    porte.role.valeur = role
    const w = mount(MatiereDetails, {
      global: {
        stubs: {
          DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: { template: '<div><slot /></div>' },
          MatiereSeancesTab: true, MatiereEvaluationsTab: true, MatiereClassesTab: true,
        },
        mocks: { $route: { params: { id: '1' } }, $router: { push: vi.fn(), back: vi.fn() } },
      },
    })
    await flushPromises()
    return w
  }

  it.each([['coordinateur'], ['admin']])('%s : aucun point d’entrée d’écriture, la leçon reste consultable', async (role) => {
    const w = await page(role)
    expect(boutons(w, CREER)).toHaveLength(0)
    expect(boutons(w, ECRIRE)).toHaveLength(0)
    expect(w.text()).toContain('Leçon fictive')
  })

  it('enseignant : « Nouvelle leçon », et publier, modifier, supprimer sur sa carte', async () => {
    const w = await page('enseignant')
    expect(boutons(w, CREER)).toHaveLength(1)
    expect(boutons(w, ECRIRE)).toHaveLength(3)
  })
})

describe('#601 — les écrans des chapitres et des quiz restent fermés au coordinateur et à l’admin', () => {
  it.each([['LessonChapters'], ['TeacherLessons'], ['TeacherMatieres']])('%s : réservé à l’enseignant', (nom) => {
    const route = lessonRoutes.find((r) => r.name === nom)
    expect(route.meta.roles.length).toBeGreaterThan(0)
    expect(route.meta.roles.every((r) => isTeacher(r))).toBe(true)
  })
})

describe('#601 — le refus du serveur (lms_backend#1167) est dit par le catalogue (D0)', () => {
  it('le motif a son texte ; l’ancien motif de la seule création n’existe plus', () => {
    expect(messageForReason(MOTIF)).toBe(TEXTE_MOTIF)
    expect(messageForReason('lesson_creation_teacher_only')).toBeNull()
  })

  it('un 403 qui le porte : le texte du catalogue, jamais celui du serveur', () => {
    const err = { response: { status: 403, data: { reason: MOTIF, message: 'Texte fictif du serveur' } } }
    const { userMessage } = normalizeError(err)
    expect(userMessage).toBe(TEXTE_MOTIF)
    expect(userMessage).not.toContain('Texte fictif du serveur')
  })
})
