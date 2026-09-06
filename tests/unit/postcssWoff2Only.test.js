import { describe, it, expect } from 'vitest'
import postcss from 'postcss'
import woff2OnlyFontFace, { isWoff2Source, keepWoff2InSrc } from '../../scripts/postcss-woff2-only.mjs'

const run = (css) => postcss([woff2OnlyFontFace()]).process(css, { from: undefined }).css

describe('isWoff2Source', () => {
  it('reconnaît un segment woff2', () => {
    expect(isWoff2Source("url('f.woff2') format('woff2')")).toBe(true)
    expect(isWoff2Source("url('f.woff2?v=1')")).toBe(true)
  })
  it('rejette woff/eot/ttf/svg (woff seul ne matche pas woff2)', () => {
    expect(isWoff2Source("url('f.woff') format('woff')")).toBe(false)
    expect(isWoff2Source("url('f.eot?#iefix') format('embedded-opentype')")).toBe(false)
    expect(isWoff2Source("url('f.ttf') format('truetype')")).toBe(false)
    expect(isWoff2Source("url('f.svg#x') format('svg')")).toBe(false)
  })
})

describe('keepWoff2InSrc', () => {
  it('ne garde que le(s) segment(s) woff2', () => {
    const v = "url('f.eot?#iefix') format('embedded-opentype'), url('f.woff2') format('woff2'), url('f.woff') format('woff'), url('f.ttf') format('truetype')"
    expect(keepWoff2InSrc(v)).toBe("url('f.woff2') format('woff2')")
  })
  it('retourne null si aucun woff2 (ex. fallback IE9 eot seul)', () => {
    expect(keepWoff2InSrc("url('f.eot')")).toBeNull()
  })
  it('laisse une valeur déjà woff2-only inchangée', () => {
    const v = "url('f.woff2') format('woff2')"
    expect(keepWoff2InSrc(v)).toBe(v)
  })
})

describe('plugin woff2-only-fontface', () => {
  it('ne garde que le woff2 dans un @font-face multi-format', () => {
    const css = "@font-face{font-family:'FA';src:url('f.eot');src:url('f.eot?#iefix') format('embedded-opentype'),url('f.woff2') format('woff2'),url('f.woff') format('woff'),url('f.ttf') format('truetype'),url('f.svg#f') format('svg')}"
    const out = run(css)
    expect(out).toContain('f.woff2')
    expect(out).not.toMatch(/\.eot/)
    expect(out).not.toMatch(/\.ttf/)
    expect(out).not.toMatch(/\.svg/)
    expect(out).not.toMatch(/\.woff['")]/) // .woff simple retiré ; .woff2 conservé
  })

  it('retire une déclaration src entièrement non-woff2 (fallback IE9)', () => {
    const css = "@font-face{font-family:'FA';src:url('f.eot');src:url('f.woff2') format('woff2')}"
    const out = run(css)
    // La 1re déclaration (eot seul) disparaît, la 2e (woff2) reste.
    expect(out.match(/src:/g) || []).toHaveLength(1)
    expect(out).toContain('f.woff2')
  })

  it('laisse intact un @font-face déjà woff2-only', () => {
    const css = "@font-face{font-family:'M';src:url('m.woff2') format('woff2')}"
    expect(run(css)).toBe(css)
  })

  it('ne touche PAS les classes de glyphes ni les autres @font-face props', () => {
    const css = "@font-face{font-family:'FA';font-weight:normal;font-display:swap;src:url('f.woff2') format('woff2'),url('f.ttf') format('truetype')}.fa-user:before{content:'\\f007'}"
    const out = run(css)
    expect(out).toContain("content:'\\f007'")
    expect(out).toContain('font-display:swap')
    expect(out).toContain('font-weight:normal')
    expect(out).not.toMatch(/\.ttf/)
  })

  it('n\'affecte pas un `src` hors @font-face', () => {
    // (rare, mais garantit le scoping @font-face)
    const css = ".x{src:url('a.ttf')}"
    expect(run(css)).toBe(css)
  })
})
