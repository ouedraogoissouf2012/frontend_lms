/**
 * Test de montage du god-component ChapterManager (G5).
 *
 * Vérifie que le composant monte sans erreur, déclenche le chargement des
 * chapitres au montage (parité de la route `/lessons/:id/chapters`) et crée
 * automatiquement un premier chapitre vide quand la liste revient vide
 * (chemin qui exerce la logique pure extraite vers utils/chapterManager).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const apiGet = vi.fn()
vi.mock('@/services/api', () => ({
  default: {
    get: (...a) => apiGet(...a),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}))
vi.mock('@/services/toast', () => ({ toast: { error: vi.fn(), success: vi.fn() } }))
vi.mock('@/services/errorHandler', () => ({ normalizeError: (e) => ({ userMessage: String(e) }) }))
vi.mock('@/services/knowledgeCheck', () => ({
  default: { getByChapter: vi.fn().mockResolvedValue({ success: true, data: [] }), delete: vi.fn() }
}))

import ChapterManager from '@/components/lessons/ChapterManager.vue'

const stubs = {
  ContentLoader: true,
  KnowledgeCheckEditor: true,
  KnowledgeCheckPlayer: true,
  ChapterViewMode: true,
  ChapterEditForm: true
}

function mountManager(props = {}) {
  return mount(ChapterManager, {
    props: { lessonId: 42, ...props },
    global: { stubs }
  })
}

describe('ChapterManager (G5) — montage', () => {
  beforeEach(() => {
    apiGet.mockReset()
  })

  it('monte sans erreur et charge les chapitres de la leçon au montage', async () => {
    apiGet.mockResolvedValue({ success: true, data: [{ id: 1, title: 'Ch1' }] })
    const w = mountManager()
    await flushPromises()
    expect(apiGet).toHaveBeenCalledWith('/lessons/42/chapters')
    expect(w.vm.chapters).toHaveLength(1)
    expect(w.vm.chapters[0].isEditing).toBe(false)
  })

  it('crée automatiquement un chapitre vide si la leçon n’en a aucun', async () => {
    apiGet.mockResolvedValue({ success: true, data: [] })
    const w = mountManager()
    await flushPromises()
    expect(w.vm.chapters).toHaveLength(1)
    const created = w.vm.chapters[0]
    expect(created.isNew).toBe(true)
    expect(created.isEditing).toBe(true)
    expect(created.content_type).toBe('text')
    expect(created.order).toBe(0)
  })
})
