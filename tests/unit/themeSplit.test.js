// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const themesUrl = new URL('../../src/assets/styles/themes.css', import.meta.url)
const themeDir = fileURLToPath(new URL('../../src/assets/styles/theme', import.meta.url))

const expectedImports = [
  './theme/_tokens-base.css',
  './theme/_tokens-palette.css',
  './theme/_tokens-semantic.css',
  './theme/_theme-light.css',
  './theme/_theme-dark.css',
  './theme/_globals.css',
]

function lineCount(content) {
  return content.trimEnd().split(/\r?\n/).length
}

describe('theme stylesheet split (#194)', () => {
  it('conserve l’ordre de cascade du barrel', () => {
    const imports = [...readFileSync(themesUrl, 'utf8').matchAll(/^@import ['"](.+)['"];$/gm)]
      .map((match) => match[1])

    expect(imports).toEqual(expectedImports)
  })

  it('garde le barrel et les partials sous la limite de 300 lignes', () => {
    const files = [
      fileURLToPath(themesUrl),
      ...readdirSync(themeDir).map((file) => join(themeDir, file)),
    ]

    const overLimit = files
      .map((file) => ({ file: basename(file), lines: lineCount(readFileSync(file, 'utf8')) }))
      .filter(({ lines }) => lines > 300)

    expect(overLimit).toEqual([])
  })
})
