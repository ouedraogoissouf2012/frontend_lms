import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import ChapterMediaRenderer from '@/components/lessons/ChapterMediaRenderer.vue'

vi.mock('@/constants/http', () => ({ apiOrigin: () => 'http://api.test' }))

function mountRenderer(chapter) {
  return mount(ChapterMediaRenderer, { props: { chapter } })
}

describe('ChapterMediaRenderer', () => {
  it('intègre une vidéo YouTube reconnue', () => {
    const w = mountRenderer({
      content_type: 'video',
      video_url: 'https://www.youtube.com/watch?v=abc123DEF45'
    })

    expect(w.find('iframe').attributes('src')).toBe('https://www.youtube.com/embed/abc123DEF45?rel=0')
    expect(w.find('[data-test="open-video"]').exists()).toBe(false)
  })

  it('ouvre une vidéo locale non intégrable via une URL storage sécurisée', () => {
    const w = mountRenderer({
      content_type: 'video',
      video_url: 'recordings/seance-42.mp4'
    })

    const link = w.find('[data-test="open-video"]')
    expect(w.find('iframe').exists()).toBe(false)
    expect(link.exists()).toBe(true)
    expect(link.attributes('href')).toBe('http://api.test/storage/recordings/seance-42.mp4')
    expect(link.attributes('rel')).toBe('noopener noreferrer')
  })

  it('ne rend pas de lien vidéo si le backend renvoie un schéma dangereux', () => {
    const w = mountRenderer({
      content_type: 'video',
      video_url: 'javascript:alert(1)'
    })

    expect(w.find('[data-test="open-video"]').exists()).toBe(false)
    expect(w.find('[data-test="video-unavailable"]').exists()).toBe(true)
    expect(w.html()).not.toContain('href="javascript:alert(1)"')
  })

  it('sécurise aussi les liens externes dangereux', () => {
    const w = mountRenderer({
      content_type: 'link',
      external_link: 'javascript:alert(1)'
    })

    expect(w.find('a').exists()).toBe(false)
    expect(w.find('[data-test="link-unavailable"]').exists()).toBe(true)
  })
})
