/**
 * L'outil de montage de l'école LMS (e2e/ecole-lms.ps1) attendait HTTP 201 à l'inscription par code d'un élève.
 * lms_backend#1112 (#914, anti-énumération) rend la MÊME réponse neutre, HTTP 202, quel que soit le cas : le montage
 * s'arrêtait (E2E 43808469676). L'outil accepte 201 (le back d'avant) ET 202 (après #1112), sans dépendre de l'ordre
 * de fusion. Le compte n'est plus prouvé par la réponse : il l'est par la CONNEXION de l'élève qui suit.
 * (Script PowerShell : le test lit le script ; son exécution est jugée par l'E2E.)
 */
import { readFileSync } from 'node:fs'
import { describe, it, expect } from 'vitest'

const script = readFileSync('e2e/ecole-lms.ps1', 'utf8')
const etape6 = script.slice(script.indexOf('# 6. Les élèves'), script.indexOf('# 7.'))

describe('montage de l’école LMS — l’inscription par code', () => {
  it('accepte 201 (avant #1112) ET 202 (la réponse neutre de #1112)', () => {
    expect(etape6).toMatch(/'POST' '\/inscriptions'[\s\S]*-Attendus @\(201, 202\)/)
  })

  it('chaque compte est PROUVÉ par la connexion de l’élève, juste après son inscription', () => {
    expect(etape6).toMatch(/Connecter "6 connexion eleve\$\(\$e\[0\]\)" "eleve\$\(\$e\[0\]\)@e2e\.test"/)
  })
})
