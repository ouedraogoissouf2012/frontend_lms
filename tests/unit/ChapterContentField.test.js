/**
 * Test de montage du sous-composant ChapterContentField (H5).
 * Vérifie le rendu adapté au content_type et la liaison two-way par référence.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ChapterContentField from '@/components/lessons/ChapterContentField.vue'

function mountField(chapter = {}) {
  return mount(ChapterContentField, {
    props: { chapter: { content_type: 'text', content: '', ...chapter } },
    global: { stubs: { TipTapEditor: true } }
  })
}

describe('ChapterContentField (H5) — montage', () => {
  it('rend l\'éditeur de texte (TipTap) pour le type « text »', () => {
    const w = mountField({ content_type: 'text' })
    expect(w.findComponent({ name: 'TipTapEditor' }).exists()).toBe(true)
    expect(w.find('.url-input').exists()).toBe(false)
  })

  it('rend le champ URL + autoplay pour le type « video »', () => {
    const w = mountField({ content_type: 'video', video_url: '' })
    expect(w.find('.url-input').exists()).toBe(true)
    expect(w.find('.checkbox-label input[type="checkbox"]').exists()).toBe(true)
  })

  it('rend le champ lien pour le type « link »', () => {
    const w = mountField({ content_type: 'link', external_link: '' })
    expect(w.find('.url-input').exists()).toBe(true)
  })

  it('rend la zone d\'upload pour les types fichier (pdf/word/powerpoint)', () => {
    const w = mountField({ content_type: 'pdf' })
    expect(w.find('.file-upload-container').exists()).toBe(true)
    expect(w.find('.file-help-text').text()).toContain('Taille max')
  })

  it('met à jour l\'URL vidéo du chapitre par référence', async () => {
    const chapter = { content_type: 'video', video_url: '' }
    const w = mount(ChapterContentField, {
      props: { chapter },
      global: { stubs: { TipTapEditor: true } }
    })
    await w.find('.url-input').setValue('https://youtu.be/x')
    expect(chapter.video_url).toBe('https://youtu.be/x')
  })
})
