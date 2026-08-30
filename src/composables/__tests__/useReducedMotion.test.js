/**
 * Tests du composable useReducedMotion — src/composables/useReducedMotion.js
 *
 * Source unique de vérité pour la préférence système « mouvement réduit ».
 * On simule matchMedia (absent de jsdom) pour piloter matches + changements OS.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { useReducedMotion } from '@/composables/useReducedMotion'

const original = window.matchMedia

/** Fabrique un MediaQueryList simulé, avec __emit pour déclencher un changement. */
function mockMatchMedia(matches) {
  const listeners = new Set()
  const mql = {
    matches,
    media: '(prefers-reduced-motion: reduce)',
    addEventListener: (_type, cb) => listeners.add(cb),
    removeEventListener: (_type, cb) => listeners.delete(cb),
    __emit(next) {
      this.matches = next
      listeners.forEach((cb) => cb({ matches: next }))
    },
  }
  window.matchMedia = vi.fn(() => mql)
  return mql
}

afterEach(() => {
  window.matchMedia = original
})

describe('useReducedMotion', () => {
  it('reflète matches=true au montage', () => {
    mockMatchMedia(true)
    const { prefersReducedMotion } = useReducedMotion()
    expect(prefersReducedMotion.value).toBe(true)
  })

  it('reflète matches=false au montage', () => {
    mockMatchMedia(false)
    const { prefersReducedMotion } = useReducedMotion()
    expect(prefersReducedMotion.value).toBe(false)
  })

  it('réagit au changement de préférence OS en direct', () => {
    const mql = mockMatchMedia(false)
    const { prefersReducedMotion } = useReducedMotion()
    expect(prefersReducedMotion.value).toBe(false)
    mql.__emit(true)
    expect(prefersReducedMotion.value).toBe(true)
  })

  it('repli sûr si matchMedia est indisponible → pas de réduction', () => {
    window.matchMedia = undefined
    const { prefersReducedMotion } = useReducedMotion()
    expect(prefersReducedMotion.value).toBe(false)
  })

  it('stop() détache le listener (plus aucune réaction)', () => {
    const mql = mockMatchMedia(false)
    const { prefersReducedMotion, stop } = useReducedMotion()
    stop()
    mql.__emit(true)
    expect(prefersReducedMotion.value).toBe(false)
  })
})
