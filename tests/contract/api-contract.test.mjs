/**
 * Entrée Vitest des tests de contrat — #17 api-contract-sync.
 *
 * Délègue à la logique partagée de `api-contract.spec.mjs` (même source de vérité
 * que le runner natif `run-contract.mjs`). Devient la cible CI une fois Vitest
 * installé (#21 / T0-5). Si Vitest n'est pas disponible, utiliser le runner natif.
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { runContractAssertions } from './api-contract.spec.mjs'

describe('Contrat API frontend ↔ backend (#17)', () => {
  let results

  beforeAll(async () => {
    ({ results } = await runContractAssertions())
  })

  it('produit des résultats', () => {
    expect(results.length).toBeGreaterThan(0)
  })

  it.each(
    // On déballe après coup : Vitest évalue les arguments de it.each au chargement,
    // donc on exécute une fois ici de façon synchrone via top-level await indisponible.
    // Solution : un seul test paramétré qui itère sur les résultats résolus.
    [0]
  )('toutes les assertions de contrat passent', async () => {
    const { results: r } = await runContractAssertions()
    const failures = r.filter((x) => !x.ok)
    expect(failures, failures.map((f) => `${f.name} — ${f.detail}`).join('\n')).toHaveLength(0)
  })
})
