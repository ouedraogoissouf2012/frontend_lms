/**
 * Entrée Vitest des tests de contrat — #17 api-contract-sync.
 *
 * Délègue à la logique partagée de `api-contract.spec.mjs` (même source de vérité
 * que le runner natif `run-contract.mjs`). C'est la cible CI sous Vitest (#21).
 * En l'absence de Vitest, utiliser `npm run test:contract` (runner natif).
 */
import { describe, it, expect, beforeAll } from 'vitest'
import { runContractAssertions } from './api-contract.spec.mjs'

describe('Contrat API frontend <-> backend (#17)', () => {
  let results

  beforeAll(async () => {
    ;({ results } = await runContractAssertions())
  })

  it('exécute au moins une assertion de contrat', () => {
    expect(results.length).toBeGreaterThan(0)
  })

  it('toutes les assertions de contrat passent', () => {
    const failures = results
      .filter((r) => !r.ok)
      .map((r) => `${r.name} — ${r.detail}`)
    expect(failures).toEqual([])
  })
})
