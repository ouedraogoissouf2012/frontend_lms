/**
 * Outil E2E (D607) : un écran gardé par une CAPACITÉ que l'école n'accorde pas PAR CONCEPTION est un refus TENU,
 * compté VERT, et non un NON TESTÉ. Dans une école KLASSCI, l'inscription locale est refusée par le produit :
 * `KlassciRosterAuthority::allowsLocalEnrolment()` rend false (KlassciRosterAuthority.php:18-20), et la capacité
 * `peutInscrireLocalement` part ainsi à la connexion (LoginOrchestrator.php:135). Le refus devient une vraie mesure :
 * un écran qui s'OUVRE malgré la capacité absente est ROUGE.
 */
import { describe, it, expect } from 'vitest'
import { verdictCapacite } from '../../e2e/acces.mjs'
import { jeuDuParcours } from '../../e2e/klassci-ecole/jeu.mjs'

const ROUTE = { chemin: '/admin/enrolment-codes', capacite: 'peutInscrireLocalement' }
const ABSENTE = { peutInscrireLocalement: false }
const ACCORDEE = { peutInscrireLocalement: true }

describe('acces.mjs — le refus de capacité attendu (D607)', () => {
  it('capacité absente par conception, écran refusé : VERT, « refus tenu »', () => {
    expect(verdictCapacite(ROUTE, ABSENTE, false, '/admin/dashboard'))
      .toEqual({ verdict: 'VERT', attendu: 'refusé', defaut: expect.stringMatching(/^refus tenu : .*peutInscrireLocalement.*\/admin\/dashboard/) })
  })

  it('capacité absente par conception, mais l’écran S’OUVRE : ROUGE, « refus NON tenu »', () => {
    expect(verdictCapacite(ROUTE, ABSENTE, true, ROUTE.chemin))
      .toEqual({ verdict: 'ROUGE', attendu: 'refusé', defaut: expect.stringMatching(/^refus NON tenu/) })
  })

  it('capacité attendue, mais l’écran est refusé : ROUGE', () => {
    expect(verdictCapacite(ROUTE, ACCORDEE, false, '/admin/dashboard')).toMatchObject({ verdict: 'ROUGE' })
  })

  it('capacité attendue et écran ouvert, ou capacité non déclarée, ou écran sans capacité : la règle du parcours (null)', () => {
    expect(verdictCapacite(ROUTE, ACCORDEE, true, ROUTE.chemin)).toBeNull()
    expect(verdictCapacite(ROUTE, undefined, false, '/admin/dashboard')).toBeNull()
    expect(verdictCapacite({ chemin: '/admin/users' }, ABSENTE, false, '/admin/dashboard')).toBeNull()
  })

  it('l’école KLASSCI déclare la capacité absente, comme le produit', () => {
    expect(jeuDuParcours().capacites).toEqual({ peutInscrireLocalement: false })
  })
})
