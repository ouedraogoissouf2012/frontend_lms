/**
 * Tests de la directive v-reveal — src/directives/reveal.js
 *
 * On simule IntersectionObserver (absent de jsdom) et matchMedia pour couvrir :
 * le chemin normal (pending → révélé à l'intersection), l'accessibilité
 * (mouvement réduit → visible d'emblée), le repli sans IO, le délai de cascade
 * et le nettoyage au démontage.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { reveal } from '@/directives/reveal'

const originalMatchMedia = window.matchMedia
const originalIO = globalThis.IntersectionObserver

/** IntersectionObserver simulé : trigger(el, isIntersecting) émule l'entrée. */
class IOStub {
  constructor(cb, options) {
    this.cb = cb
    this.options = options
    this.observed = []
    this.disconnected = false
    IOStub.instances.push(this)
  }

  observe(el) { this.observed.push(el) }
  unobserve(el) { this.observed = this.observed.filter((e) => e !== el) }
  disconnect() { this.disconnected = true }
  trigger(el, isIntersecting) { this.cb([{ target: el, isIntersecting }], this) }
}
IOStub.instances = []

function setReducedMotion(matches) {
  window.matchMedia = vi.fn(() => ({ matches, media: '', addEventListener() {}, removeEventListener() {} }))
}

beforeEach(() => {
  IOStub.instances = []
  setReducedMotion(false)
  globalThis.IntersectionObserver = IOStub
})

afterEach(() => {
  window.matchMedia = originalMatchMedia
  globalThis.IntersectionObserver = originalIO
})

describe('v-reveal — chemin normal', () => {
  it('marque en attente puis révèle quand l\'élément entre dans le viewport', () => {
    const el = document.createElement('div')
    reveal.mounted(el, {})
    expect(el.classList.contains('reveal-pending')).toBe(true)
    expect(IOStub.instances).toHaveLength(1)

    IOStub.instances[0].trigger(el, true)
    expect(el.classList.contains('is-revealed')).toBe(true)
    expect(el.classList.contains('reveal-pending')).toBe(false)
    expect(IOStub.instances[0].observed).toHaveLength(0) // unobserve après révélation
  })

  it('ignore les entrées non intersectantes', () => {
    const el = document.createElement('div')
    reveal.mounted(el, {})
    IOStub.instances[0].trigger(el, false)
    expect(el.classList.contains('is-revealed')).toBe(false)
    expect(el.classList.contains('reveal-pending')).toBe(true)
  })

  it('applique le délai de cascade via --reveal-delay', () => {
    const el = document.createElement('div')
    reveal.mounted(el, { value: 120 })
    expect(el.style.getPropertyValue('--reveal-delay')).toBe('120ms')
  })
})

describe('v-reveal — accessibilité et repli', () => {
  it('mouvement réduit → visible d\'emblée, aucun observer', () => {
    setReducedMotion(true)
    const el = document.createElement('div')
    reveal.mounted(el, {})
    expect(el.classList.contains('is-revealed')).toBe(true)
    expect(el.classList.contains('reveal-pending')).toBe(false)
    expect(IOStub.instances).toHaveLength(0)
  })

  it('sans IntersectionObserver → visible d\'emblée (repli sûr)', () => {
    globalThis.IntersectionObserver = undefined
    const el = document.createElement('div')
    reveal.mounted(el, {})
    expect(el.classList.contains('is-revealed')).toBe(true)
  })
})

describe('v-reveal — nettoyage', () => {
  it('unmounted déconnecte l\'observer', () => {
    const el = document.createElement('div')
    reveal.mounted(el, {})
    const observer = IOStub.instances[0]
    reveal.unmounted(el)
    expect(observer.disconnected).toBe(true)
  })
})
