// @vitest-environment node
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const themesUrl = new URL('../../src/assets/styles/themes.css', import.meta.url)
const themesCss = readFileSync(themesUrl, 'utf8')
const expandedThemesCss = themesCss.replace(
  /^@import ['"](.+)['"];$/gm,
  (_, specifier) => readFileSync(new URL(specifier, themesUrl), 'utf8').trimEnd(),
)
const srcDir = fileURLToPath(new URL('../../src', import.meta.url))

function themeBlock(name) {
  const match = expandedThemesCss.match(new RegExp(`\\[data-theme="${name}"\\] \\{([\\s\\S]*?)\\n\\}`))
  return match?.[1] || ''
}

function sourceFiles(dir) {
  const entries = readdirSync(dir)
  return entries.flatMap((entry) => {
    const fullPath = join(dir, entry)
    const stats = statSync(fullPath)
    if (stats.isDirectory()) return sourceFiles(fullPath)
    return /\.(css|scss|vue)$/.test(entry) ? [fullPath] : []
  })
}

describe('theme token aliases (#193)', () => {
  it('définit les aliases de marque en light et dark', () => {
    for (const mode of ['light', 'dark']) {
      const block = themeBlock(mode)

      expect(block).toContain('--primary-color: var(--blue-500);')
      expect(block).toMatch(/--primary-color-rgb:\s*\d+,\s*\d+,\s*\d+;/)
      expect(block).toContain('--secondary-color: var(--blue-600);')
      expect(block).toContain('--card-bg-dark: var(--gray-800);')
    }
  })

  it('ne réintroduit pas de fallback local pour les tokens colmatés', () => {
    const offenders = sourceFiles(srcDir)
      .filter((file) => /var\(--(?:primary-color|card-bg-dark)\s*,/.test(readFileSync(file, 'utf8')))

    expect(offenders).toEqual([])
  })
})
