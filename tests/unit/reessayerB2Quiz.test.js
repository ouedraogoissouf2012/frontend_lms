/**
 * Lot « Réessayer », PR B2, dette tracée par la revue de #519 (fermée en premier) : les quiz d'un
 * chapitre emploient LoadRetryNotice sans `canRetry`. Un refus (403…) proposait « Réessayer », sous
 * un message qui promettait une panne (« Quiz indisponible pour le moment »).
 *
 * Désormais, par chapitre : un échec de chargement garde s'il est passager (Réessayer) et son message
 * (le motif du refus, ou « pour le moment » sur une panne), jusqu'au composant qui l'affiche.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const service = vi.hoisted(() => ({ getByChapter: vi.fn() }))
vi.mock('@/services/knowledgeCheck', () => ({ default: service }))

import { useChapterQuizzes } from '@/composables/useChapterQuizzes'
import ChapterQuizField from '@/components/lessons/ChapterQuizField.vue'
import ChapterViewMode from '@/components/lessons/ChapterViewMode.vue'
import ChapterList from '@/components/lessons/ChapterList.vue'
import ChapterEditForm from '@/components/lessons/ChapterEditForm.vue'

const PANNE = 'Quiz indisponible pour le moment.'
const refus = () => Object.assign(new Error('HTTP 403'), { response: { status: 403, data: {} }, userMessage: "Vous n'avez pas accès à ce quiz." })
const panne = () => Object.assign(new Error('HTTP 503'), { response: { status: 503 }, userMessage: 'Service indisponible.' })
const reessayer = (w) => w.findAll('button').filter((b) => /R[ée]essayer/.test(b.text()))

beforeEach(() => { service.getByChapter.mockReset() })

describe('useChapterQuizzes — un échec de quiz dit s’il est passager, et son motif', () => {
  it('refus : inconnu, sans Réessayer, avec le motif ; panne : Réessayer ; succès : plus d’échec', async () => {
    const q = useChapterQuizzes()
    service.getByChapter.mockRejectedValue(refus())
    await q.loadKnowledgeChecks(7)
    expect(q.isQuizUnknown(7)).toBe(true)
    expect(q.quizEchec(7)).toEqual({ canRetry: false, message: "Vous n'avez pas accès à ce quiz." })

    service.getByChapter.mockRejectedValue(panne())
    await q.loadKnowledgeChecks(7)
    expect(q.quizEchec(7)).toEqual({ canRetry: true, message: PANNE })

    service.getByChapter.mockResolvedValue({ success: true, data: [] })
    await q.loadKnowledgeChecks(7)
    expect(q.isQuizUnknown(7)).toBe(false)
    expect(q.quizEchec(7)).toBeNull()
  })
})

describe('ChapterQuizField et ChapterViewMode — Réessayer selon l’échec du quiz', () => {
  const chapter = { id: 7, content_type: 'quiz', title: 'Quiz 1' }

  for (const [nom, Composant] of [['ChapterQuizField', ChapterQuizField], ['ChapterViewMode', ChapterViewMode]]) {
    it(`${nom} : refus → le motif, sans Réessayer ; panne → Réessayer ; sans échec fourni → inchangé`, () => {
      const refuse = mount(Composant, { props: { chapter, quizUnknown: true, quizEchec: { canRetry: false, message: "Vous n'avez pas accès à ce quiz." } } })
      expect(refuse.text()).toContain("Vous n'avez pas accès à ce quiz.")
      expect(reessayer(refuse)).toHaveLength(0)

      const enPanne = mount(Composant, { props: { chapter, quizUnknown: true, quizEchec: { canRetry: true, message: PANNE } } })
      expect(enPanne.text()).toContain(PANNE)
      expect(reessayer(enPanne)).toHaveLength(1)

      const ancien = mount(Composant, { props: { chapter, quizUnknown: true } })
      expect(ancien.text()).toContain(PANNE)
      expect(reessayer(ancien)).toHaveLength(1)
    })
  }
})

describe('ChapterList — transmet l’échec du quiz à chaque chapitre', () => {
  it('lecture et édition reçoivent quizEchec(chapitre)', () => {
    const echec = { canRetry: false, message: "Vous n'avez pas accès à ce quiz." }
    const props = {
      readonly: false, saving: false, getChapterQuiz: () => null,
      isQuizUnknown: () => true, quizEchec: (id) => (id === 7 ? echec : null),
    }
    const lecture = mount(ChapterList, {
      props: { ...props, chapters: [{ id: 7, title: 'Q', content_type: 'quiz', isEditing: false }] },
      global: { stubs: { ChapterViewMode: true, ChapterEditForm: true } },
    })
    expect(lecture.findComponent(ChapterViewMode).props('quizEchec')).toEqual(echec)

    const edition = mount(ChapterList, {
      props: { ...props, chapters: [{ id: 7, title: 'Q', content_type: 'quiz', isEditing: true }] },
      global: { stubs: { ChapterViewMode: true, ChapterEditForm: true } },
    })
    expect(edition.findComponent(ChapterEditForm).props('quizEchec')).toEqual(echec)
  })

  it('ChapterEditForm transmet l’échec à ChapterQuizField', () => {
    const echec = { canRetry: false, message: "Vous n'avez pas accès à ce quiz." }
    const w = mount(ChapterEditForm, {
      props: { chapter: { id: 7, content_type: 'quiz', title: 'Q' }, quizUnknown: true, quizEchec: echec },
      global: { stubs: { ChapterQuizField: true } },
    })
    expect(w.findComponent(ChapterQuizField).props('quizEchec')).toEqual(echec)
  })
})
