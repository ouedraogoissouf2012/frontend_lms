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

/**
 * Arret anticipe sur echec DETERMINISTE.
 *
 * Motif : l'ecran Utilisateurs lancait 17 requetes de roster ; toutes recevaient
 * un 403 d'autorisation. Un refus de droits est deterministe — il ne changera pas
 * a la 2e classe. Poursuivre, c'est 16 allers-retours garantis perdants, 16 erreurs
 * en console et 16 lignes de log, pour un resultat connu d'avance.
 */
describe('mapWithConcurrency — arret anticipe', () => {
  it('cesse de lancer de nouvelles taches quand stopWhen est satisfait', async () => {
    let started = 0
    const res = await mapWithConcurrency([1, 2, 3, 4, 5, 6, 7, 8], 2, async (n) => {
      started++
      await new Promise(r => setTimeout(r, 2))
      throw Object.assign(new Error('forbidden'), { status: 403, item: n })
    }, { stopWhen: (reason) => reason?.status === 403 })

    // Les taches deja en vol vont a leur terme ; aucune NOUVELLE n'est ouverte.
    expect(started).toBeLessThan(8)
    expect(res).toHaveLength(8)
  })

  it('marque « skipped » les elements jamais tentes, sans les confondre avec un echec', async () => {
    const res = await mapWithConcurrency([1, 2, 3, 4, 5, 6], 1, async (n) => {
      if (n === 1) throw Object.assign(new Error('forbidden'), { status: 403 })
      return n
    }, { stopWhen: (reason) => reason?.status === 403 })

    expect(res[0].status).toBe('rejected')
    expect(res.slice(1).every(r => r.status === 'skipped')).toBe(true)
  })

  it('ne s’arrete PAS sur un echec transitoire non retenu par stopWhen', async () => {
    let started = 0
    const res = await mapWithConcurrency([1, 2, 3, 4], 1, async (n) => {
      started++
      if (n === 1) throw Object.assign(new Error('timeout'), { status: 503 })
      return n
    }, { stopWhen: (reason) => reason?.status === 403 })

    expect(started).toBe(4)
    expect(res.filter(r => r.status === 'fulfilled')).toHaveLength(3)
  })

  it('se comporte comme avant sans stopWhen (retro-compatible)', async () => {
    const res = await mapWithConcurrency([1, 2, 3], 2, async (n) => {
      if (n === 1) throw new Error('boom')
      return n
    })
    expect(res.map(r => r.status)).toEqual(['rejected', 'fulfilled', 'fulfilled'])
  })
})
