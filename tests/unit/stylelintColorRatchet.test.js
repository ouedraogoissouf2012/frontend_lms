import { describe, it, expect } from 'vitest'
import { buildBaseline, diffAgainstBaseline } from '../../scripts/lib/colorRatchet.mjs'

const v = (file, line, column, color) => ({ file, line, column, color })

describe('buildBaseline', () => {
  it('groups occurrences by file then color and counts them', () => {
    const baseline = buildBaseline([
      v('a.vue', 1, 5, '#ffffff'),
      v('a.vue', 2, 5, '#ffffff'),
      v('a.vue', 3, 5, '#000000'),
      v('b.vue', 1, 5, '#ffffff'),
    ])
    expect(baseline).toEqual({
      'a.vue': { '#000000': 1, '#ffffff': 2 },
      'b.vue': { '#ffffff': 1 },
    })
  })

  it('normalizes hex casing so #FFF and #fff are the same key', () => {
    const baseline = buildBaseline([
      v('a.vue', 1, 5, '#FFFFFF'),
      v('a.vue', 2, 5, '#ffffff'),
    ])
    expect(baseline).toEqual({ 'a.vue': { '#ffffff': 2 } })
  })

  it('returns an empty object for no violations', () => {
    expect(buildBaseline([])).toEqual({})
  })
})

describe('diffAgainstBaseline', () => {
  it('reports nothing when current exactly matches baseline', () => {
    const current = [v('a.vue', 1, 5, '#ffffff'), v('a.vue', 9, 5, '#ffffff')]
    const baseline = buildBaseline(current)
    expect(diffAgainstBaseline(current, baseline).newViolations).toEqual([])
  })

  it('flags a brand-new color absent from the baseline', () => {
    const baseline = buildBaseline([v('a.vue', 1, 5, '#ffffff')])
    const { newViolations } = diffAgainstBaseline(
      [v('a.vue', 1, 5, '#ffffff'), v('a.vue', 42, 7, '#abc123')],
      baseline,
    )
    expect(newViolations).toEqual([v('a.vue', 42, 7, '#abc123')])
  })

  it('flags only the surplus when a grandfathered color is duplicated', () => {
    const baseline = buildBaseline([v('a.vue', 1, 5, '#ffffff')]) // allows 1
    const { newViolations } = diffAgainstBaseline(
      [v('a.vue', 1, 5, '#ffffff'), v('a.vue', 2, 5, '#ffffff'), v('a.vue', 3, 5, '#ffffff')],
      baseline,
    )
    // 1 allowed, 3 found -> the 2 extra (lowest-line-first ordering) are new
    expect(newViolations).toEqual([v('a.vue', 2, 5, '#ffffff'), v('a.vue', 3, 5, '#ffffff')])
  })

  it('is line-number independent: moving an existing color does not flag it', () => {
    const baseline = buildBaseline([v('a.vue', 10, 5, '#ffffff')])
    const { newViolations } = diffAgainstBaseline([v('a.vue', 999, 1, '#ffffff')], baseline)
    expect(newViolations).toEqual([])
  })

  it('never errors when violations are removed (ratchet only tightens on regen)', () => {
    const baseline = buildBaseline([v('a.vue', 1, 5, '#ffffff'), v('a.vue', 2, 5, '#000000')])
    const { newViolations } = diffAgainstBaseline([v('a.vue', 1, 5, '#ffffff')], baseline)
    expect(newViolations).toEqual([])
  })

  it('keeps files independent (same color in a new file is flagged)', () => {
    const baseline = buildBaseline([v('a.vue', 1, 5, '#ffffff')])
    const { newViolations } = diffAgainstBaseline(
      [v('a.vue', 1, 5, '#ffffff'), v('b.vue', 1, 5, '#ffffff')],
      baseline,
    )
    expect(newViolations).toEqual([v('b.vue', 1, 5, '#ffffff')])
  })

  it('treats a missing baseline (undefined) as zero allowance', () => {
    const { newViolations } = diffAgainstBaseline([v('a.vue', 1, 5, '#ffffff')], undefined)
    expect(newViolations).toEqual([v('a.vue', 1, 5, '#ffffff')])
  })
})
