import { describe, it, expect } from 'vitest'
import {
  CANONICAL_HELPER,
  FORBIDDEN_PATTERNS,
  isScannedFile,
  isErrorContext,
  scanContent,
  buildBaseline,
  diffAgainstBaseline,
  assertValidDewrapBaseline,
  serializeDewrapBaseline,
  totalCount,
} from '../../scripts/lib/dewrapRatchet.mjs'

const v = (file, line, column, pattern) => ({ file, line, column, pattern })

describe('isScannedFile', () => {
  it('scans JS and Vue source under src/', () => {
    expect(isScannedFile('src/services/foo.js')).toBe(true)
    expect(isScannedFile('src/components/Bar.vue')).toBe(true)
  })

  it('never scans the canonical helper (it legitimately unwraps envelopes)', () => {
    expect(isScannedFile(CANONICAL_HELPER)).toBe(false)
    expect(isScannedFile('src/utils/apiList.js')).toBe(false)
  })

  it('ignores non-source files (JSON, images, styles)', () => {
    expect(isScannedFile('.dewrap-baseline.json')).toBe(false)
    expect(isScannedFile('src/assets/logo.svg')).toBe(false)
    expect(isScannedFile('src/styles/main.scss')).toBe(false)
  })
})

describe('isErrorContext', () => {
  it('recognises axios error-body access', () => {
    expect(isErrorContext('err.response?')).toBe(true)
    expect(isErrorContext('const x = error.response')).toBe(true)
  })

  it('does not trip on lookalike identifiers', () => {
    expect(isErrorContext('orderData')).toBe(false)
    expect(isErrorContext('const serverError = fetchData()')).toBe(false) // "Error" capitalised
    expect(isErrorContext('response?')).toBe(false)
  })
})

describe('scanContent — detection', () => {
  it('flags each of the four forbidden list-unwrap forms', () => {
    expect(scanContent('src/services/a.js', 'return response.data || []').map((x) => x.pattern))
      .toEqual(['.data || []'])
    expect(scanContent('src/services/a.js', 'return response.data ?? []').map((x) => x.pattern))
      .toEqual(['.data ?? []'])
    expect(scanContent('src/services/a.js', 'const rows = res.data.data').map((x) => x.pattern))
      .toEqual(['.data.data'])
    expect(scanContent('src/services/a.js', 'const rows = res.data?.data').map((x) => x.pattern))
      .toEqual(['.data?.data'])
  })

  it('tolerates whitespace variants (formatter/minifier)', () => {
    expect(scanContent('src/services/a.js', 'x.data ||  [ ]')).toHaveLength(1)
    expect(scanContent('src/services/a.js', 'x.data ?.  data')).toHaveLength(1)
  })

  it('reports repo-relative file, 1-based line and column', () => {
    const src = 'const a = 1\nconst rows = payload.data || []\n'
    const [hit] = scanContent('src/composables/useThing.js', src)
    expect(hit.file).toBe('src/composables/useThing.js')
    expect(hit.line).toBe(2)
    expect(hit.column).toBe(src.split('\n')[1].indexOf('.data') + 1)
    expect(hit.snippet).toBe('const rows = payload.data || []')
  })

  it('counts a location once even though patterns overlap', () => {
    // "response.data?.data" must not be double-counted as ?. and plain-dot.
    expect(scanContent('src/services/a.js', 'return response.data?.data')).toHaveLength(1)
  })

  it('handles CRLF the same as LF', () => {
    expect(scanContent('src/services/a.js', 'line1\r\nx.data || []\r\n')).toHaveLength(1)
  })
})

describe('scanContent — the measured false positives are NOT flagged', () => {
  it('ignores object fallback `.data || {}` / `.data ?? {}` (not a list unwrap)', () => {
    // FullCalendar extendedProps + MessageEvent payloads, present in the tree.
    expect(scanContent('src/composables/useEventDetail.js', 'props.event.extendedProps?.data || {}')).toEqual([])
    expect(scanContent('src/composables/useVisioHeartbeat.js', 'const { type } = e.data || {}')).toEqual([])
    expect(scanContent('src/services/errorHandler.js', 'const data = error.response?.data ?? {}')).toEqual([])
  })

  it('ignores axios ERROR body access (err/error prefix)', () => {
    expect(scanContent('src/composables/x.js', 'data: err.response?.data?.data || null')).toEqual([])
    expect(scanContent('src/services/x.js', 'const rows = error.response.data.data')).toEqual([])
  })

  it('still flags a SUCCESS-response nested unwrap on the same shape', () => {
    // useAdminEvaluationDetails.js:23 — response (not error) → genuine unwrap.
    const hits = scanContent('src/composables/useAdminEvaluationDetails.js', 'return response?.data?.data || response?.data || response || null')
    expect(hits.map((h) => h.pattern)).toEqual(['.data?.data'])
  })

  it('ignores forbidden forms that live inside a // line-comment', () => {
    expect(scanContent('src/services/a.js', '// avoid response.data || [] here')).toEqual([])
    expect(scanContent('src/services/a.js', 'const ok = 1 // was res.data.data')).toEqual([])
  })

  it('never scans the canonical helper itself', () => {
    expect(scanContent(CANONICAL_HELPER, 'return payload.data || []')).toEqual([])
  })
})

describe('buildBaseline', () => {
  it('counts occurrences per file', () => {
    expect(
      buildBaseline([
        v('a.js', 1, 5, '.data || []'),
        v('a.js', 2, 5, '.data.data'),
        v('b.js', 1, 5, '.data ?? []'),
      ]),
    ).toEqual({ 'a.js': 2, 'b.js': 1 })
  })

  it('returns an empty object for no violations', () => {
    expect(buildBaseline([])).toEqual({})
  })
})

describe('diffAgainstBaseline', () => {
  it('reports nothing when current matches the baseline', () => {
    const current = [v('a.js', 1, 5, '.data || []')]
    expect(diffAgainstBaseline(current, buildBaseline(current)).newViolations).toEqual([])
  })

  it('flags a brand-new violation in a baselined file (surplus beyond allowance)', () => {
    const baseline = buildBaseline([v('a.js', 1, 5, '.data || []')]) // allows 1
    const { newViolations } = diffAgainstBaseline(
      [v('a.js', 1, 5, '.data || []'), v('a.js', 9, 3, '.data.data')],
      baseline,
    )
    expect(newViolations).toEqual([v('a.js', 9, 3, '.data.data')])
  })

  it('flags every violation in a file absent from the baseline', () => {
    const baseline = buildBaseline([v('a.js', 1, 5, '.data || []')])
    const { newViolations } = diffAgainstBaseline(
      [v('a.js', 1, 5, '.data || []'), v('b.js', 1, 5, '.data.data')],
      baseline,
    )
    expect(newViolations).toEqual([v('b.js', 1, 5, '.data.data')])
  })

  it('is line-number independent: moving an existing unwrap does not flag it', () => {
    const baseline = buildBaseline([v('a.js', 10, 5, '.data || []')])
    expect(diffAgainstBaseline([v('a.js', 999, 1, '.data || []')], baseline).newViolations).toEqual([])
  })

  it('never errors when unwraps are removed (ratchet only tightens on regen)', () => {
    const baseline = buildBaseline([v('a.js', 1, 5, '.data || []'), v('a.js', 2, 5, '.data.data')])
    expect(diffAgainstBaseline([v('a.js', 1, 5, '.data || []')], baseline).newViolations).toEqual([])
  })

  it('treats a missing baseline as zero allowance', () => {
    expect(diffAgainstBaseline([v('a.js', 1, 5, '.data || []')], undefined).newViolations)
      .toEqual([v('a.js', 1, 5, '.data || []')])
  })
})

describe('assertValidDewrapBaseline (fail-closed)', () => {
  it('accepts a well-formed baseline', () => {
    expect(() => assertValidDewrapBaseline({ 'src/services/api.js': 1 })).not.toThrow()
  })

  it('rejects a non-object', () => {
    expect(() => assertValidDewrapBaseline([])).toThrow(/tableau/)
    expect(() => assertValidDewrapBaseline(null)).toThrow(/object/)
  })

  it('rejects a non-source file key', () => {
    expect(() => assertValidDewrapBaseline({ 'notes.txt': 1 })).toThrow(/scanné/)
  })

  it('rejects non-positive or non-integer counts', () => {
    expect(() => assertValidDewrapBaseline({ 'src/services/api.js': 0 })).toThrow()
    expect(() => assertValidDewrapBaseline({ 'src/services/api.js': 1.5 })).toThrow()
    expect(() => assertValidDewrapBaseline({ 'src/services/api.js': -2 })).toThrow()
  })
})

describe('serializeDewrapBaseline', () => {
  it('sorts keys and ends with a newline', () => {
    expect(serializeDewrapBaseline({ 'b.js': 1, 'a.js': 2 })).toBe(
      '{\n  "a.js": 2,\n  "b.js": 1\n}\n',
    )
  })
})

describe('totalCount', () => {
  it('sums allowances across files', () => {
    expect(totalCount({ 'a.js': 2, 'b.js': 3 })).toBe(5)
  })
})

describe('FORBIDDEN_PATTERNS', () => {
  it('exposes the four documented forms', () => {
    expect(FORBIDDEN_PATTERNS.map((p) => p.label)).toEqual([
      '.data || []',
      '.data ?? []',
      '.data?.data',
      '.data.data',
    ])
  })
})
