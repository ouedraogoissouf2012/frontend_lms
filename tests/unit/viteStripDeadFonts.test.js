import { describe, it, expect } from 'vitest'
import viteStripDeadFonts, { isTargetCss } from '../../scripts/vite-strip-dead-fonts.mjs'

describe('isTargetCss (ciblage des CSS d\'icônes vendored)', () => {
  it('cible les CSS font-awesome / material-icons de node_modules', () => {
    expect(isTargetCss('/repo/node_modules/font-awesome/css/font-awesome.min.css')).toBe(true)
    expect(isTargetCss('/repo/node_modules/material-icons/iconfont/filled.css')).toBe(true)
    expect(isTargetCss('C:\\repo\\node_modules\\font-awesome\\css\\font-awesome.min.css')).toBe(true)
    expect(isTargetCss('/repo/node_modules/font-awesome/css/font-awesome.min.css?used')).toBe(true)
  })

  it('ignore le CSS applicatif et les autres paquets', () => {
    expect(isTargetCss('/repo/src/assets/styles/icon-fonts.css')).toBe(false)
    expect(isTargetCss('/repo/node_modules/tailwindcss/base.css')).toBe(false)
    expect(isTargetCss('/repo/src/main.js')).toBe(false)
    expect(isTargetCss('/repo/node_modules/font-awesome/fonts/x.woff2')).toBe(false)
  })
})

describe('viteStripDeadFonts (plugin)', () => {
  const plugin = viteStripDeadFonts()

  it('est un plugin Vite pre nommé', () => {
    expect(plugin.name).toBe('strip-dead-icon-fonts')
    expect(plugin.enforce).toBe('pre')
  })

  it('ne transforme PAS un CSS non ciblé (retourne null)', async () => {
    const out = await plugin.transform("@font-face{src:url('a.ttf')}", '/repo/src/x.css')
    expect(out).toBeNull()
  })

  it('retire les url() non-woff2 d\'un @font-face vendored', async () => {
    const css = "@font-face{font-family:'FA';src:url('f.eot');src:url('f.woff2') format('woff2'),url('f.ttf') format('truetype')}.fa{font-family:'FA'}"
    const out = await plugin.transform(css, '/repo/node_modules/font-awesome/css/font-awesome.min.css')
    expect(out.code).toContain('f.woff2')
    expect(out.code).not.toMatch(/\.ttf/)
    expect(out.code).not.toMatch(/\.eot/)
    expect(out.code).toContain(".fa{font-family:'FA'}") // glyphes intacts
  })
})
