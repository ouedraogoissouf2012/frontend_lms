/**
 * Tests du composant Modal enrichi (#25) — src/components/ui/Modal.vue
 * Premiers tests de montage (@vue/test-utils) : slots header/body/footer,
 * fermeture ✕/overlay/Échap, scroll-lock, prop size (+ alias medium), $attrs.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, afterEach } from 'vitest'
import Modal from '@/components/ui/Modal.vue'

afterEach(() => { document.body.style.overflow = '' })

function mountModal(props = {}, slots = {}) {
  return mount(Modal, { props: { modelValue: true, ...props }, slots })
}

describe('ui/Modal (#25)', () => {
  it('rend title + body', () => {
    const w = mountModal({ title: 'Titre' }, { default: '<p>corps</p>' })
    expect(w.find('.modal-title').text()).toBe('Titre')
    expect(w.find('.modal-body').html()).toContain('corps')
  })

  it('title optionnelle → pas de .modal-title, ✕ toujours présent', () => {
    const w = mountModal()
    expect(w.find('.modal-title').exists()).toBe(false)
    expect(w.find('.modal-close-btn').exists()).toBe(true)
  })

  it('slot header remplace l\'en-tête mais garde le ✕', () => {
    const w = mountModal({ title: 'X' }, { header: '<div class="custom-h">H</div>' })
    expect(w.find('.custom-h').exists()).toBe(true)
    expect(w.find('.modal-close-btn').exists()).toBe(true)
  })

  it('footer rendu uniquement si slot fourni', () => {
    expect(mountModal().find('.modal-footer').exists()).toBe(false)
    expect(mountModal({}, { footer: '<button>OK</button>' }).find('.modal-footer').exists()).toBe(true)
  })

  it('✕ émet update:modelValue=false', async () => {
    const w = mountModal()
    await w.find('.modal-close-btn').trigger('click')
    expect(w.emitted('update:modelValue')[0]).toEqual([false])
  })

  it('clic sur l\'overlay émet false', async () => {
    const w = mountModal()
    await w.find('.modal-overlay').trigger('click')
    expect(w.emitted('update:modelValue')[0]).toEqual([false])
  })

  it('Échap émet false', async () => {
    const w = mountModal()
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await w.vm.$nextTick()
    expect(w.emitted('update:modelValue')[0]).toEqual([false])
    w.unmount()
  })

  it('scroll-lock du body quand visible', () => {
    mountModal()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('size : md par défaut, alias medium → md, lg respecté', () => {
    expect(mountModal().find('.modal-container').classes()).toContain('modal-md')
    expect(mountModal({ size: 'medium' }).find('.modal-container').classes()).toContain('modal-md')
    expect(mountModal({ size: 'lg' }).find('.modal-container').classes()).toContain('modal-lg')
  })

  it('$attrs : une classe custom traverse vers .modal-container', () => {
    const w = mountModal({ class: 'ma-classe-custom' })
    expect(w.find('.modal-container').classes()).toContain('ma-classe-custom')
  })
})
