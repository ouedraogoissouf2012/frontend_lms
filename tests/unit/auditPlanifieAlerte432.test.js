// @vitest-environment node
/**
 * #432 — un audit planifié ROUGE prévient : le workflow `audit.yml` ouvre UNE issue « Audit planifié rouge », ou
 * commente celle qui est déjà ouverte (jamais de doublon). La preuve de comportement est faite par deux lancements
 * réels (workflow_dispatch, audit forcé rouge) ; ce test garde la FORME qui la rend sûre : le droit d'écrire des issues
 * n'appartient qu'au job d'alerte, qui ne tourne que sur un échec de l'audit, et cherche avant de créer.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const yml = readFileSync(resolve(process.cwd(), '.github/workflows/audit.yml'), 'utf8')
const jobAlerte = yml.slice(yml.indexOf('\n  alerte:'))
const jobAudit = yml.slice(yml.indexOf('\n  npm-audit:'), yml.indexOf('\n  alerte:'))

describe('#432 — l’alerte de l’audit planifié', () => {
  it('le workflow, par défaut, ne fait que LIRE le dépôt ; l’audit n’a aucun droit sur les issues', () => {
    expect(yml).toMatch(/\npermissions:\n {2}contents: read\n/)
    expect(jobAudit).not.toMatch(/issues: write/)
  })

  it('un job « alerte » existe, qui suit l’audit et ne tourne que sur son ÉCHEC', () => {
    expect(yml.indexOf('\n  alerte:')).toBeGreaterThan(0)
    expect(jobAlerte).toMatch(/needs: npm-audit/)
    expect(jobAlerte).toMatch(/if: \$\{\{ failure\(\) && needs\.npm-audit\.result == 'failure' \}\}/)
  })

  it('lui seul peut écrire des issues', () => {
    expect(jobAlerte).toMatch(/permissions:\n {6}issues: write/)
    expect(yml.match(/issues: write/g)).toHaveLength(1)
  })

  it('il CHERCHE l’issue ouverte (par label, puis par titre exact) AVANT d’en créer une', () => {
    const parLabel = jobAlerte.indexOf('gh issue list --state open --label "$LABEL"')
    const parTitre = jobAlerte.indexOf('--search "in:title')
    const creation = jobAlerte.indexOf('gh issue create')
    expect(parLabel).toBeGreaterThan(0)
    expect(parTitre).toBeGreaterThan(parLabel)
    expect(creation).toBeGreaterThan(parTitre)
    expect(jobAlerte).toMatch(/gh issue comment "\$NUM"/)
    expect(jobAlerte).toMatch(/TITRE: Audit planifié rouge/)
  })

  it('deux alertes rapprochées passent une à une (aucune course vers deux créations)', () => {
    expect(jobAlerte).toMatch(/concurrency:\n {6}group: audit-planifie-alerte\n {6}cancel-in-progress: false/)
  })
})
