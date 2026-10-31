/**
 * Chapitres et quiz d'une leçon : une liste INCONNUE n'est pas une liste VIDE.
 *
 * Le chargement avalait ses erreurs : sur une coupure, l'enseignant voyait une
 * leçon sans chapitre (avec « Ajouter un chapitre ») ou un chapitre « sans quiz »
 * (avec « Créer un quiz ») — et pouvait recréer en double ce qui existait déjà.
 *
 * Les réponses traversent le VRAI client HTTP (api.js et son intercepteur, qui pose
 * `userMessage`) : seul l'adaptateur réseau d'axios est doublé. Corps serveur :
 * `GET /lessons/{id}/chapters` → ChapterCrudService::listByLesson (data = liste) ;
 * `GET /knowledge-checks?chapter_id=` → KnowledgeCheckCrudController::index.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'

import api from '@/services/api'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { useChapterManager } from '@/composables/useChapterManager'
import ChapterManager from '@/components/lessons/ChapterManager.vue'
import ChapterViewMode from '@/components/lessons/ChapterViewMode.vue'
import ChapterQuizField from '@/components/lessons/ChapterQuizField.vue'

const CHAPITRE_QUIZ = { id: 11, lesson_id: 3, title: 'Révisions', content_type: 'quiz', order_index: 1 }
const CHAPITRES = { success: true, data: [CHAPITRE_QUIZ] }
const QUIZ = { id: 90, chapter_id: 11, title: 'Quiz 1', questions: [{ id: 1 }], user_best_score: null }
const QUIZ_DU_CHAPITRE = { success: true, data: [QUIZ] }
const PANNE = { status: 500, data: { success: false, message: 'Erreur interne' } }

let adaptateurOrigine
let requetes
/**
 * Chaque route sert soit un corps (200), soit `{ status, data }` d'erreur, soit
 * `'coupure'` (aucune réponse). Une route absente échoue bruyamment.
 */
function servir(routes) {
  api.defaults.adapter = async (config) => {
    requetes.push(config)
    const chemin = Object.keys(routes).find((c) => config.url.endsWith(c))
    if (!chemin) throw new Error(`requête non prévue par le test : ${config.method} ${config.url}`)
    const r = routes[chemin]
    if (r === 'coupure') throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, {})
    if (r.status) {
      const response = { status: r.status, statusText: '', data: r.data, headers: {}, config }
      throw new AxiosError(`HTTP ${r.status}`, AxiosError.ERR_BAD_RESPONSE, config, {}, response)
    }
    return { status: 200, statusText: 'OK', data: r, headers: {}, config }
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  requetes = []
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
  vi.restoreAllMocks()
})

async function composable() {
  let exposed
  mount(defineComponent({ setup() { exposed = useChapterManager(ref(3)); return () => null } }))
  await flushPromises()
  return exposed
}

const STUBS = {
  ContentLoader: true,
  Modal: { template: '<div><slot /></div>' },
  KnowledgeCheckEditor: true,
  KnowledgeCheckPlayer: true,
}
async function ecranEnseignant() {
  const w = mount(ChapterManager, { props: { lessonId: 3 }, global: { stubs: STUBS } })
  await flushPromises()
  return w
}

describe('useChapterManager — chapitres inconnus', () => {
  it('une panne serveur pose le message du catalogue et ne fabrique AUCUN chapitre', async () => {
    servir({ '/lessons/3/chapters': PANNE })
    const m = await composable()
    expect(m.loadError.value).toBe(ERROR_MESSAGES.server)
    expect(m.chapters.value).toEqual([])
  })

  it('une coupure réseau pose le message réseau', async () => {
    servir({ '/lessons/3/chapters': 'coupure' })
    const m = await composable()
    expect(m.loadError.value).toBe(ERROR_MESSAGES.network)
  })

  it('« Réessayer » recharge et efface l’erreur', async () => {
    servir({ '/lessons/3/chapters': PANNE })
    const m = await composable()
    servir({ '/lessons/3/chapters': CHAPITRES, '/knowledge-checks': QUIZ_DU_CHAPITRE })
    await m.loadChapters()
    await flushPromises()
    expect(m.loadError.value).toBeNull()
    expect(m.chapters.value.map((c) => c.id)).toEqual([11])
  })
})

describe('useChapterManager — quiz inconnu', () => {
  it('un quiz en échec est INCONNU, pas absent ; « Réessayer » le rend connu', async () => {
    servir({ '/lessons/3/chapters': CHAPITRES, '/knowledge-checks': PANNE })
    const m = await composable()
    expect(m.isQuizUnknown(11)).toBe(true)
    expect(m.getChapterQuiz(11)).toBeNull()

    servir({ '/knowledge-checks': QUIZ_DU_CHAPITRE })
    await m.loadKnowledgeChecks(11)
    expect(m.isQuizUnknown(11)).toBe(false)
    expect(m.getChapterQuiz(11)).toEqual(QUIZ)
  })

  it('un chapitre réellement sans quiz est connu (liste vide)', async () => {
    servir({ '/lessons/3/chapters': CHAPITRES, '/knowledge-checks': { success: true, data: [] } })
    const m = await composable()
    expect(m.isQuizUnknown(11)).toBe(false)
  })
})

describe('ChapterManager — écran enseignant', () => {
  it('chapitres en échec : l’alerte parle, ni liste ni « Ajouter un chapitre »', async () => {
    servir({ '/lessons/3/chapters': PANNE })
    const w = await ecranEnseignant()
    expect(w.get('[role="alert"]').text()).toContain(ERROR_MESSAGES.server)
    expect(w.text()).not.toContain('Ajouter un chapitre')
    expect(w.find('.chapters-container').exists()).toBe(false)
  })

  it('l’alerte est présente dès le montage, muette quand tout va bien', async () => {
    servir({ '/lessons/3/chapters': CHAPITRES, '/knowledge-checks': QUIZ_DU_CHAPITRE })
    const w = await ecranEnseignant()
    expect(w.get('[role="alert"]').text()).toBe('')
    expect(w.text()).toContain('Ajouter un chapitre')
  })

  it('« Réessayer » relance le chargement des chapitres', async () => {
    servir({ '/lessons/3/chapters': PANNE })
    const w = await ecranEnseignant()
    servir({ '/lessons/3/chapters': CHAPITRES, '/knowledge-checks': QUIZ_DU_CHAPITRE })
    await w.get('[role="alert"] button').trigger('click')
    await flushPromises()
    expect(w.get('[role="alert"]').text()).toBe('')
    expect(w.text()).toContain('Révisions')
  })

  // Chemin le plus visible : un chapitre s'affiche par défaut en MODE LECTURE.
  it('chapitre en mode lecture, quiz en échec : ni « Aucun quiz » ni « Créer un quiz »', async () => {
    servir({ '/lessons/3/chapters': CHAPITRES, '/knowledge-checks': PANNE })
    const w = await ecranEnseignant()
    const bloc = w.get('.chapter-quiz-view')
    expect(bloc.text()).not.toMatch(/Aucun quiz/i)
    expect(bloc.text()).not.toMatch(/Cr[ée]er un quiz/i)
    expect(bloc.text()).toContain('Quiz indisponible pour le moment')

    servir({ '/knowledge-checks': QUIZ_DU_CHAPITRE })
    await bloc.get('button').trigger('click')
    await flushPromises()
    expect(w.get('.chapter-quiz-view').text()).toContain('Quiz 1')
  })
})

describe('ChapterManager — chapitre en édition, quiz en échec', () => {
  it('le relais jusqu’à ChapterQuizField : pas d’invite de création, « Réessayer » recharge', async () => {
    servir({ '/lessons/3/chapters': CHAPITRES, '/knowledge-checks': PANNE })
    const w = await ecranEnseignant()
    await w.get('.btn-edit').trigger('click')
    const champ = w.get('.quiz-editor-inline')
    expect(champ.text()).toContain('Quiz indisponible pour le moment')
    expect(champ.text()).not.toMatch(/Aucun quiz|Cr[ée]er un quiz/i)

    servir({ '/knowledge-checks': QUIZ_DU_CHAPITRE })
    await champ.get('button').trigger('click')
    await flushPromises()
    expect(w.get('.quiz-editor-inline').text()).toContain('Quiz 1')
  })
})

describe('useChapterManager — une réponse périmée ne réécrit pas l’état', () => {
  it('un échec arrivé APRÈS un rechargement réussi ne rend pas le quiz inconnu', async () => {
    servir({ '/lessons/3/chapters': CHAPITRES, '/knowledge-checks': QUIZ_DU_CHAPITRE })
    const m = await composable()
    let echouer
    api.defaults.adapter = (config) => new Promise((resolve, reject) => {
      echouer = () => reject(new AxiosError('Network Error', AxiosError.ERR_NETWORK, config, {}))
    })
    const ancien = m.loadKnowledgeChecks(11)
    // axios appelle l'adaptateur APRÈS ses intercepteurs (asynchrone) : on attend l'appel.
    await vi.waitFor(() => expect(echouer).toBeTypeOf('function'))
    const premierEchec = echouer
    servir({ '/knowledge-checks': QUIZ_DU_CHAPITRE })
    await m.loadKnowledgeChecks(11)
    premierEchec()
    await ancien
    expect(m.isQuizUnknown(11)).toBe(false)
    expect(m.getChapterQuiz(11)).toEqual(QUIZ)
  })

  it('un succès périmé (liste d’avant) n’écrase pas la réponse plus récente', async () => {
    servir({ '/lessons/3/chapters': CHAPITRES, '/knowledge-checks': { success: true, data: [] } })
    const m = await composable()
    let repondreAncien
    api.defaults.adapter = (config) => new Promise((resolve) => {
      repondreAncien = () => resolve({ status: 200, statusText: 'OK', data: { success: true, data: [] }, headers: {}, config })
    })
    const ancien = m.loadKnowledgeChecks(11)
    await vi.waitFor(() => expect(repondreAncien).toBeTypeOf('function'))
    const premier = repondreAncien
    servir({ '/knowledge-checks': QUIZ_DU_CHAPITRE })
    await m.loadKnowledgeChecks(11)
    premier()
    await ancien
    expect(m.getChapterQuiz(11)).toEqual(QUIZ)
  })
})

describe('Présentation du quiz inconnu', () => {
  it('ChapterViewMode, élève (readonly) : le même texte, aucun bouton de création', () => {
    const w = mount(ChapterViewMode, { props: { chapter: CHAPITRE_QUIZ, quiz: null, readonly: true, quizUnknown: true } })
    expect(w.text()).toContain('Quiz indisponible pour le moment')
    expect(w.text()).not.toMatch(/Aucun quiz|Cr[ée]er un quiz/i)
  })

  it('ChapterQuizField (édition) : ni « Aucun quiz » ni « Créer un quiz », et « Réessayer » émet retry-quiz', async () => {
    const w = mount(ChapterQuizField, { props: { chapter: CHAPITRE_QUIZ, quiz: null, quizUnknown: true } })
    expect(w.text()).toContain('Quiz indisponible pour le moment')
    expect(w.text()).not.toMatch(/Aucun quiz|Cr[ée]er un quiz/i)
    await w.get('button').trigger('click')
    expect(w.emitted('retry-quiz')).toEqual([[11]])
  })

  it('ChapterQuizField, quiz connu absent : l’invite de création reste', () => {
    const w = mount(ChapterQuizField, { props: { chapter: CHAPITRE_QUIZ, quiz: null, quizUnknown: false } })
    expect(w.text()).toMatch(/Cr[ée]er un quiz/i)
  })
})
