/**
 * #566 : aucun chemin d'interface ne supprimait un quiz. `deleteKnowledgeCheck` (useChapterManager : confirmation
 * puis `DELETE /knowledge-checks/{id}`) existait sans appelant ; l'E2E (#567) le mesurait ROUGE. Le bouton
 * « Supprimer le quiz » vit à côté de « Modifier le quiz », dans le chapitre en édition, et son événement monte
 * jusqu'à la fonction existante (aucune seconde logique de suppression).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

const kc = vi.hoisted(() => ({ getByChapter: vi.fn().mockResolvedValue({ success: true, data: [] }), delete: vi.fn() }))
vi.mock('@/services/knowledgeCheck', () => ({ default: kc }))
vi.mock('@/services/api', () => ({ default: { get: vi.fn().mockResolvedValue({ success: true, data: [] }), post: vi.fn(), put: vi.fn(), delete: vi.fn() } }))
vi.mock('@/composables/useToast', () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }))
const confirmer = vi.hoisted(() => vi.fn())
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: confirmer }) }))

import ChapterQuizField from '@/components/lessons/ChapterQuizField.vue'
import ChapterEditForm from '@/components/lessons/ChapterEditForm.vue'
import ChapterList from '@/components/lessons/ChapterList.vue'
import ChapterManager from '@/components/lessons/ChapterManager.vue'

const QUIZ = { id: 31, chapter_id: 7, title: 'Mon quiz', questions: [{}, {}] }
const CHAPITRE = { id: 7, title: 'Chapitre', content_type: 'quiz', isEditing: true }
const boutonSupprimer = (w) => w.findAll('button').find((b) => b.text().includes('Supprimer le quiz'))

describe('#566 — « Supprimer le quiz » dans le chapitre en édition', () => {
  it('le champ du quiz offre le bouton, et émet « delete-quiz » avec le quiz', async () => {
    const w = mount(ChapterQuizField, { props: { chapter: { id: 7 }, quiz: QUIZ } })
    await boutonSupprimer(w).trigger('click')
    expect(w.emitted('delete-quiz')[0]).toEqual([QUIZ])
  })

  it('sans quiz, pas de bouton de suppression', () => {
    expect(boutonSupprimer(mount(ChapterQuizField, { props: { chapter: { id: 7 }, quiz: null } }))).toBeUndefined()
  })

  it('le formulaire du chapitre relaie l’événement', async () => {
    const w = mount(ChapterEditForm, { props: { chapter: { ...CHAPITRE }, quiz: QUIZ } })
    await boutonSupprimer(w).trigger('click')
    expect(w.emitted('delete-quiz')[0]).toEqual([QUIZ])
  })

  it('la liste des chapitres relaie l’événement', async () => {
    const w = mount(ChapterList, {
      props: { chapters: [{ ...CHAPITRE }], getChapterQuiz: () => QUIZ, isQuizUnknown: () => false, quizEchec: () => null },
    })
    await boutonSupprimer(w).trigger('click')
    expect(w.emitted('delete-quiz')[0]).toEqual([QUIZ])
  })

  it('le gestionnaire des chapitres supprime par la fonction existante : confirmation, puis DELETE', async () => {
    confirmer.mockResolvedValue(true)
    kc.delete.mockResolvedValue({ success: true })
    const w = mount(ChapterManager, {
      props: { lessonId: 42 },
      global: { stubs: { ContentLoader: true, KnowledgeCheckEditor: true, KnowledgeCheckPlayer: true, ChapterList: true } },
    })
    await flushPromises()
    w.findComponent(ChapterList).vm.$emit('delete-quiz', QUIZ)
    await flushPromises()
    expect(confirmer).toHaveBeenCalledWith(expect.objectContaining({ message: 'Supprimer le quiz "Mon quiz" ?' }))
    expect(kc.delete).toHaveBeenCalledWith(31)
  })
})
