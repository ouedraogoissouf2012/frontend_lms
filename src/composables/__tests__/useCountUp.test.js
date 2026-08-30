/**
 * Tests du composable useCountUp — src/composables/useCountUp.js
 *
 * Compteur animé accessible et déterministe : l'horloge (now) et le
 * planificateur (raf) sont injectés (DIP) pour tester le tween sans vrai temps.
 * On vérifie le respect de « mouvement réduit », le tween, les gardes de valeur
 * et la réactivité à la source.
 */
import { describe, it, expect } from 'vitest'
import { ref, nextTick } from 'vue'
import { useCountUp } from '@/composables/useCountUp'

/** Horloge + rAF simulés : advance(dt) fait avancer le temps et vide la file. */
function fakeClock() {
  let t = 0
  let queue = []
  return {
    now: () => t,
    raf: (cb) => { queue.push(cb); return queue.length },
    caf: () => { queue = [] },
    advance(dt) {
      t += dt
      const pending = queue
      queue = []
      pending.forEach((cb) => cb(t))
    },
  }
}

describe('useCountUp — accessibilité (mouvement réduit)', () => {
  it('mouvement réduit → pose la valeur finale immédiatement', () => {
    const { value, run } = useCountUp(50, { reducedMotion: ref(true) })
    run()
    expect(value.value).toBe(50)
  })

  it('duration<=0 → valeur finale immédiate (même sans réduction)', () => {
    const { value, run } = useCountUp(30, { duration: 0, reducedMotion: ref(false) })
    run()
    expect(value.value).toBe(30)
  })
})

describe('useCountUp — tween déterministe', () => {
  it('anime de `from` vers la cible et atteint exactement la cible', () => {
    const clock = fakeClock()
    const { value, run } = useCountUp(100, {
      duration: 100,
      easing: (x) => x, // linéaire pour une assertion exacte
      reducedMotion: ref(false),
      now: clock.now, raf: clock.raf, caf: clock.caf,
    })
    run()
    expect(value.value).toBe(0) // départ = from
    clock.advance(50)
    expect(value.value).toBeCloseTo(50, 5) // mi-parcours
    clock.advance(50)
    expect(value.value).toBe(100) // arrivée exacte
  })

  it('part de `from` personnalisé', () => {
    const clock = fakeClock()
    const { value, run } = useCountUp(10, {
      from: 4, duration: 100, easing: (x) => x, reducedMotion: ref(false),
      now: clock.now, raf: clock.raf, caf: clock.caf,
    })
    run()
    expect(value.value).toBe(4)
    clock.advance(100)
    expect(value.value).toBe(10)
  })
})

describe('useCountUp — gardes et réactivité', () => {
  it('cible non finie (NaN) → 0, jamais NaN', () => {
    const { value, run } = useCountUp(ref(Number.NaN), { reducedMotion: ref(true) })
    run()
    expect(value.value).toBe(0)
  })

  it('réagit au changement de source (watch)', async () => {
    const src = ref(10)
    const { value } = useCountUp(src, { reducedMotion: ref(true) })
    src.value = 20
    await nextTick()
    expect(value.value).toBe(20)
  })

  it('accepte un getter comme source', () => {
    const { value, run } = useCountUp(() => 7, { reducedMotion: ref(true) })
    run()
    expect(value.value).toBe(7)
  })
})
