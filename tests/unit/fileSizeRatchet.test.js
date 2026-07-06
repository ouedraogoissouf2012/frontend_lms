import { describe, expect, it } from 'vitest'
import {
  assertValidSizeBaseline,
  buildBaseline,
  countLines,
  diffAgainstSizeBaseline,
  isTrackedSourceFile,
  serializeSizeBaseline,
} from '../../scripts/lib/fileSizeRatchet.mjs'

const f = (file, lines) => ({ file, lines })

describe('file size ratchet (#195)', () => {
  it('tracks only source extensions covered by the guard', () => {
    expect(isTrackedSourceFile('src/App.vue')).toBe(true)
    expect(isTrackedSourceFile('src/main.js')).toBe(true)
    expect(isTrackedSourceFile('src/types.ts')).toBe(true)
    expect(isTrackedSourceFile('src/styles/app.scss')).toBe(true)
    expect(isTrackedSourceFile('src/styles/app.css')).toBe(true)
    expect(isTrackedSourceFile('README.md')).toBe(false)
  })

  it('counts logical source lines without inflating trailing newlines', () => {
    expect(countLines('')).toBe(0)
    expect(countLines('a\nb\n')).toBe(2)
    expect(countLines('a\r\nb\r\n')).toBe(2)
  })

  it('builds a baseline only for files above the limit', () => {
    expect(buildBaseline([
      f('src/a.vue', 300),
      f('src/b.vue', 301),
      f('src/c.js', 450),
    ])).toEqual({
      'src/b.vue': 301,
      'src/c.js': 450,
    })
  })

  it('passes when current sizes match or shrink versus the baseline', () => {
    const result = diffAgainstSizeBaseline(
      [f('src/legacy.vue', 330), f('src/shrunk.vue', 301), f('src/ok.vue', 300)],
      { 'src/legacy.vue': 330, 'src/shrunk.vue': 350 },
    )

    expect(result).toEqual({ newOversized: [], grownBaseline: [] })
  })

  it('flags a new oversized file and a baseline file that grows', () => {
    const result = diffAgainstSizeBaseline(
      [f('src/new.vue', 301), f('src/legacy.vue', 331)],
      { 'src/legacy.vue': 330 },
    )

    expect(result.newOversized).toEqual([f('src/new.vue', 301)])
    expect(result.grownBaseline).toEqual([
      { file: 'src/legacy.vue', lines: 331, allowed: 330, growth: 1 },
    ])
  })

  it('validates baseline shape fail-closed', () => {
    expect(() => assertValidSizeBaseline({ 'src/a.vue': 301 })).not.toThrow()
    expect(() => assertValidSizeBaseline({ 'src/a.vue': 300 })).toThrow(/baseline invalide/)
    expect(() => assertValidSizeBaseline({ 'src/a.md': 301 })).toThrow(/baseline invalide/)
    expect(() => assertValidSizeBaseline({ 'src/a.vue': '301' })).toThrow(/baseline invalide/)
  })

  it('serializes deterministically', () => {
    expect(serializeSizeBaseline({ 'src/z.vue': 400, 'src/a.vue': 301 })).toBe(
      '{\n  "src/a.vue": 301,\n  "src/z.vue": 400\n}\n',
    )
  })
})
