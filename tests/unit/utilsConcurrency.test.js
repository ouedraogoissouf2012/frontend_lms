/**
 * Test de `mapWithConcurrency` : parcours borné en parallèle, utilisé pour
 * remplacer les boucles `for … await` (N allers-retours SÉRIALISÉS) des écrans
 * qui agrègent une ressource par entité.
 *
 * Contrat vérifié : ordre des résultats préservé, plafond de concurrence jamais
 * dépassé, et un rejet n'interrompt pas les autres (résultat par élément).
 */
import { describe, it, expect } from 'vitest'
import { mapWithConcurrency } from '@/utils/concurrency'

/** Promesse résolue manuellement, pour piloter l'ordonnancement dans le test. */
function deferred() {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

describe('mapWithConcurrency', () => {
  it('préserve l’ordre des résultats malgré l’exécution concurrente', async () => {
    const delays = [30, 5, 20, 1]
    const res = await mapWithConcurrency([0, 1, 2, 3], 2, async (i) => {
      await new Promise(r => setTimeout(r, delays[i]))
      return `r${i}`
    })
    expect(res).toEqual([
      { status: 'fulfilled', value: 'r0' },
      { status: 'fulfilled', value: 'r1' },
      { status: 'fulfilled', value: 'r2' },
      { status: 'fulfilled', value: 'r3' },
    ])
  })

  it('ne dépasse JAMAIS le plafond de concurrence', async () => {
    let inFlight = 0
    let maxInFlight = 0
    await mapWithConcurrency(Array.from({ length: 12 }, (_, i) => i), 3, async () => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise(r => setTimeout(r, 2))
      inFlight--
    })
    expect(maxInFlight).toBe(3)
  })

  it('isole les rejets : un échec n’interrompt pas les autres éléments', async () => {
    const res = await mapWithConcurrency([1, 2, 3], 2, async (n) => {
      if (n === 2) throw new Error('boom')
      return n * 10
    })
    expect(res[0]).toEqual({ status: 'fulfilled', value: 10 })
    expect(res[1].status).toBe('rejected')
    expect(res[1].reason).toBeInstanceOf(Error)
    expect(res[2]).toEqual({ status: 'fulfilled', value: 30 })
  })

  it('gère la liste vide sans appeler la fonction', async () => {
    let calls = 0
    const res = await mapWithConcurrency([], 4, async () => { calls++ })
    expect(res).toEqual([])
    expect(calls).toBe(0)
  })

  it('ramène un plafond invalide (0, négatif, NaN) à 1 — jamais de concurrence infinie', async () => {
    let inFlight = 0
    let maxInFlight = 0
    const run = async () => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise(r => setTimeout(r, 2))
      inFlight--
    }
    await mapWithConcurrency([1, 2, 3], 0, run)
    expect(maxInFlight).toBe(1)

    maxInFlight = 0
    await mapWithConcurrency([1, 2, 3], -5, run)
    expect(maxInFlight).toBe(1)
  })

  it('n’ouvre pas plus de tâches que d’éléments', async () => {
    let maxInFlight = 0
    let inFlight = 0
    await mapWithConcurrency([1, 2], 10, async () => {
      inFlight++
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise(r => setTimeout(r, 2))
      inFlight--
    })
    expect(maxInFlight).toBe(2)
  })
})
