/**
 * Test du composable useChapterManager (#28 / H5) : chargement des chapitres,
 * création auto d'un chapitre vide, édition/annulation en place, ouverture des
 * éditeur/lecteur de quiz et résolution getChapterQuiz. Services mockés (api,
 * toast, errorHandler, knowledgeCheck) ; util chapterManager réel.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const apiGet = vi.fn()
const apiPost = vi.fn()
const apiDelete = vi.fn()
const toastSuccess = vi.fn()
const confirmMock = vi.fn()
vi.mock('@/services/api', () => ({
  default: {
    get: (...a) => apiGet(...a),
    post: (...a) => apiPost(...a),
    put: vi.fn(),
    delete: (...a) => apiDelete(...a)
  }
}))
vi.mock('@/composables/useToast', () => ({ toast: { error: vi.fn(), success: (...a) => toastSuccess(...a) } }))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: (...a) => confirmMock(...a) }) }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: (e) => ({ userMessage: String(e) }) }))
vi.mock('@/services/knowledgeCheck', () => ({
  default: { getByChapter: vi.fn().mockResolvedValue({ success: true, data: [] }), delete: vi.fn() }
}))

import { useChapterManager } from '@/composables/useChapterManager'

async function setup() {
  let api
  const Comp = defineComponent({
    setup() { api = useChapterManager(ref(42)); return () => null }
  })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useChapterManager (#28 / H5)', () => {
  beforeEach(() => {
    apiGet.mockReset()
    apiPost.mockReset()
    apiDelete.mockReset()
    toastSuccess.mockReset()
    confirmMock.mockReset().mockResolvedValue(true)
  })

  it('charge les chapitres de la leçon au montage', async () => {
    apiGet.mockResolvedValue({ success: true, data: [{ id: 1, title: 'Ch1' }] })
    const m = await setup()
    expect(apiGet).toHaveBeenCalledWith('/lessons/42/chapters')
    expect(m.chapters.value).toHaveLength(1)
    expect(m.chapters.value[0].isEditing).toBe(false)
  })

  it('crée automatiquement un chapitre vide si la leçon n\'en a aucun', async () => {
    apiGet.mockResolvedValue({ success: true, data: [] })
    const m = await setup()
    expect(m.chapters.value).toHaveLength(1)
    expect(m.chapters.value[0].isNew).toBe(true)
    expect(m.chapters.value[0].content_type).toBe('text')
    expect(m.chapters.value[0].order).toBe(0)
  })

  it('editChapter passe le chapitre en édition et mémorise l\'état d\'origine', async () => {
    apiGet.mockResolvedValue({ success: true, data: [{ id: 1, title: 'Ch1' }] })
    const m = await setup()
    const ch = m.chapters.value[0]
    m.editChapter(ch)
    expect(ch.isEditing).toBe(true)
    expect(ch._originalState).toBeTruthy()
  })

  it('cancelEdit retire un chapitre neuf de la liste', async () => {
    apiGet.mockResolvedValue({ success: true, data: [] })
    const m = await setup()
    expect(m.chapters.value).toHaveLength(1)
    m.cancelEdit(m.chapters.value[0])
    expect(m.chapters.value).toHaveLength(0)
  })

  it('openQuizEditor/closeQuizEditor pilotent l\'état de la modale éditeur', async () => {
    apiGet.mockResolvedValue({ success: true, data: [] })
    const m = await setup()
    m.openQuizEditor(5, { id: 1 })
    expect(m.showQuizEditor.value).toBe(true)
    expect(m.selectedChapterId.value).toBe(5)
    expect(m.editingQuiz.value).toEqual({ id: 1 })
    m.closeQuizEditor()
    expect(m.showQuizEditor.value).toBe(false)
    expect(m.selectedChapterId.value).toBe(null)
  })

  it('getChapterQuiz renvoie le premier quiz du chapitre ou null', async () => {
    apiGet.mockResolvedValue({ success: true, data: [] })
    const m = await setup()
    expect(m.getChapterQuiz(7)).toBe(null)
    m.knowledgeChecks.value[7] = [{ id: 1, title: 'Q' }]
    expect(m.getChapterQuiz(7)).toEqual({ id: 1, title: 'Q' })
  })

  // #322 — suppression réversible (corbeille backend)
  it('#322 : supprimer poste DELETE et affiche un toast avec action « Annuler »', async () => {
    apiGet.mockResolvedValue({ success: true, data: [{ id: 5, title: 'Ch5' }] })
    apiDelete.mockResolvedValue({ success: true })
    const m = await setup()
    await m.deleteChapter({ id: 5, title: 'Ch5' })
    await flushPromises()
    expect(apiDelete).toHaveBeenCalledWith('/chapters/5')
    const [msg, opts] = toastSuccess.mock.calls.at(-1)
    expect(msg).toBe('Chapitre supprimé')
    expect(opts.action.label).toBe('Annuler')
    expect(typeof opts.action.onClick).toBe('function')
  })

  it('#322 : l\'action « Annuler » restaure (POST /restore + recharge)', async () => {
    apiGet.mockResolvedValue({ success: true, data: [{ id: 5, title: 'Ch5' }] })
    apiDelete.mockResolvedValue({ success: true })
    apiPost.mockResolvedValue({ success: true })
    const m = await setup()
    await m.deleteChapter({ id: 5, title: 'Ch5' })
    await flushPromises()
    await toastSuccess.mock.calls.at(-1)[1].action.onClick()
    await flushPromises()
    expect(apiPost).toHaveBeenCalledWith('/chapters/5/restore')
  })

  it('#322 : restoreChapter poste vers /restore, recharge et confirme', async () => {
    apiGet.mockResolvedValue({ success: true, data: [] })
    apiPost.mockResolvedValue({ success: true })
    const m = await setup()
    await m.restoreChapter({ id: 7, title: 'Ch7' })
    await flushPromises()
    expect(apiPost).toHaveBeenCalledWith('/chapters/7/restore')
    expect(toastSuccess).toHaveBeenCalledWith('Chapitre « Ch7 » restauré')
  })

  it('#322 : ne supprime PAS si la confirmation est refusée', async () => {
    apiGet.mockResolvedValue({ success: true, data: [{ id: 5, title: 'Ch5' }] })
    confirmMock.mockResolvedValue(false)
    const m = await setup()
    await m.deleteChapter({ id: 5, title: 'Ch5' })
    await flushPromises()
    expect(apiDelete).not.toHaveBeenCalled()
  })
})
