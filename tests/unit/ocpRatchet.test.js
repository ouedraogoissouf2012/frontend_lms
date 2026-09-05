import { describe, expect, it } from 'vitest'
import {
  ALLOW_LIST,
  EMPTY_SCAN_EXIT_CODE,
  FORBIDDEN_PATTERNS,
  assertValidOcpBaseline,
  buildBaseline,
  diffAgainstBaseline,
  failIfEmptyScan,
  isAllowListed,
  isScannedFile,
  scanContent,
  serializeOcpBaseline,
  totalCount,
} from '../../scripts/lib/ocpRatchet.mjs'

const v = (file, line, column, pattern) => ({ file, line, column, pattern })

describe('isScannedFile', () => {
  it('scans Vue/JS under components and views only', () => {
    expect(isScannedFile('src/components/ui/Btn.vue')).toBe(true)
    expect(isScannedFile('src/views/Login.vue')).toBe(true)
    expect(isScannedFile('src/composables/useThing.js')).toBe(false)
    expect(isScannedFile('src/services/api.js')).toBe(false)
    expect(isScannedFile('src/components/ui/Btn.css')).toBe(false)
  })
})

describe('allow-list — InstitutionFormModal is périmètre, not a waiver', () => {
  it('lists only the integration form named by #330', () => {
    expect(ALLOW_LIST).toEqual(['src/components/admin/InstitutionFormModal.vue'])
    expect(isAllowListed(ALLOW_LIST[0])).toBe(true)
    expect(isAllowListed('src/components/admin/EvalResultsFilters.vue')).toBe(false)
  })

  it('never reports hits inside the allow-listed form', () => {
    expect(
      scanContent(
        ALLOW_LIST[0],
        'v-model="form.klassci_api_url"\nplaceholder="https://x.klassci.com"',
      ),
    ).toEqual([])
  })
})

describe('the test that proves the guard turns red (#330)', () => {
  it('fails a new klassci coupling in a component absent from the baseline', () => {
    const hits = scanContent(
      'src/components/ui/NewThing.vue',
      '<option :value="enseignant.klassci_id">',
    )
    expect(hits).toHaveLength(1)
    expect(hits[0].pattern).toBe('klassci')
    const { newViolations } = diffAgainstBaseline(hits, {})
    expect(newViolations).toHaveLength(1)
    expect(newViolations[0].file).toBe('src/components/ui/NewThing.vue')
  })

  it('fails when it inspected nothing — distinct from a clean scan', () => {
    const failure = failIfEmptyScan(0)
    expect(failure).not.toBeNull()
    expect(failure.exitCode).toBe(EMPTY_SCAN_EXIT_CODE)
    expect(failure.exitCode).not.toBe(1)
    expect(failure.message).toMatch(/0 files/)
    expect(failIfEmptyScan(1)).toBeNull()
  })
})

describe('scanContent — Article 2 and Article 3 signatures', () => {
  it('flags klassci in every casing, including identifiers', () => {
    expect(scanContent('src/views/A.vue', 'KLASSCI').map((x) => x.pattern)).toEqual(['klassci'])
    expect(scanContent('src/views/A.vue', 'loadKlassciData()').map((x) => x.pattern)).toEqual([
      'klassci',
    ])
    expect(scanContent('src/views/A.vue', ':user-id="currentUser?.klassci_id"').map((x) => x.pattern)).toEqual([
      'klassci',
    ])
  })

  it('flags establishment-mode reads, not a generic mode prop', () => {
    expect(scanContent('src/views/A.vue', 'if (isStandalone)')).toHaveLength(1)
    expect(scanContent('src/views/A.vue', 'institution.mode').map((x) => x.pattern)).toEqual([
      'institution.mode',
    ])
    expect(scanContent('src/views/A.vue', 'institution?.mode')).toHaveLength(1)
    expect(scanContent('src/views/A.vue', 'const mode = "dark"')).toEqual([])
  })

  it('flags form-coupling that never writes the word klassci', () => {
    expect(scanContent('src/components/x.vue', 'seance.programmation?.date').map((x) => x.pattern)).toEqual([
      'programmation',
    ])
    expect(scanContent('src/components/x.vue', 'row.matiere_nom').map((x) => x.pattern)).toEqual([
      'matiere_nom',
    ])
    expect(scanContent('src/components/x.vue', "role === 'superAdmin'").map((x) => x.pattern)).toEqual([
      "'superAdmin'",
    ])
  })

  it('counts klassci and programmation on the same line as two hits', () => {
    const hits = scanContent(
      'src/views/A.vue',
      'evaluationKlassci.programmation?.bareme',
    )
    expect(hits.map((h) => h.pattern)).toEqual(['klassci', 'programmation'])
  })

  it('ignores hits that live inside a // line-comment', () => {
    expect(scanContent('src/views/A.vue', '// compte KLASSCI valide')).toEqual([])
    expect(scanContent('src/views/A.vue', "const ok = 1 // was 'superAdmin'")).toEqual([])
  })

  it('handles CRLF the same as LF', () => {
    expect(scanContent('src/views/A.vue', 'line1\r\nKLASSCI\r\n')).toHaveLength(1)
  })

  it('does not scan composables even when they are coupled', () => {
    expect(scanContent('src/composables/useCreateQuestions.js', 'evaluationKlassci')).toEqual([])
  })
})

describe('buildBaseline / diffAgainstBaseline', () => {
  it('counts occurrences per file', () => {
    expect(
      buildBaseline([
        v('src/views/A.vue', 1, 5, 'klassci'),
        v('src/views/A.vue', 2, 5, 'programmation'),
        v('src/views/B.vue', 1, 5, 'klassci'),
      ]),
    ).toEqual({ 'src/views/A.vue': 2, 'src/views/B.vue': 1 })
  })

  it('reports nothing when current matches the baseline', () => {
    const current = [v('src/views/A.vue', 1, 5, 'klassci')]
    expect(diffAgainstBaseline(current, buildBaseline(current)).newViolations).toEqual([])
  })

  it('flags a surplus occurrence in a baselined file', () => {
    const baseline = buildBaseline([v('src/views/A.vue', 1, 5, 'klassci')])
    const { newViolations } = diffAgainstBaseline(
      [v('src/views/A.vue', 1, 5, 'klassci'), v('src/views/A.vue', 9, 3, 'programmation')],
      baseline,
    )
    expect(newViolations).toEqual([v('src/views/A.vue', 9, 3, 'programmation')])
  })

  it('is line-number independent: moving a frozen hit does not flag it', () => {
    const baseline = buildBaseline([v('src/views/A.vue', 10, 5, 'klassci')])
    expect(
      diffAgainstBaseline([v('src/views/A.vue', 999, 1, 'klassci')], baseline).newViolations,
    ).toEqual([])
  })

  it('never errors when hits are removed', () => {
    const baseline = buildBaseline([
      v('src/views/A.vue', 1, 5, 'klassci'),
      v('src/views/A.vue', 2, 5, 'programmation'),
    ])
    expect(
      diffAgainstBaseline([v('src/views/A.vue', 1, 5, 'klassci')], baseline).newViolations,
    ).toEqual([])
  })
})

describe('assertValidOcpBaseline (fail-closed)', () => {
  it('accepts a well-formed baseline', () => {
    expect(() => assertValidOcpBaseline({ 'src/views/Login.vue': 1 })).not.toThrow()
  })

  it('rejects a non-object, a non-scanned key, an allow-listed key, a non-positive count', () => {
    expect(() => assertValidOcpBaseline([])).toThrow(/tableau/)
    expect(() => assertValidOcpBaseline({ 'src/composables/x.js': 1 })).toThrow(/scanné/)
    expect(() => assertValidOcpBaseline({ [ALLOW_LIST[0]]: 1 })).toThrow(/allow-list/)
    expect(() => assertValidOcpBaseline({ 'src/views/Login.vue': 0 })).toThrow()
  })
})

describe('serializeOcpBaseline / totalCount / FORBIDDEN_PATTERNS', () => {
  it('sorts keys and ends with a newline', () => {
    expect(serializeOcpBaseline({ 'src/views/B.vue': 1, 'src/views/A.vue': 2 })).toBe(
      '{\n  "src/views/A.vue": 2,\n  "src/views/B.vue": 1\n}\n',
    )
  })

  it('sums allowances', () => {
    expect(totalCount({ 'src/views/A.vue': 2, 'src/views/B.vue': 3 })).toBe(5)
  })

  it('exposes the documented signatures', () => {
    expect(FORBIDDEN_PATTERNS.map((p) => p.label)).toEqual([
      'klassci',
      'isStandalone',
      'is_standalone',
      'institution.mode',
      'programmation',
      'matiere_nom',
      'classe_nom',
      'enseignant_nom',
      "'superAdmin'",
      "'secretaire'",
    ])
  })
})
