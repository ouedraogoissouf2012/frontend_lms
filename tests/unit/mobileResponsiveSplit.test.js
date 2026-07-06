// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const mobileResponsiveUrl = new URL('../../src/assets/styles/mobile-responsive.css', import.meta.url)
const mobileDir = fileURLToPath(new URL('../../src/assets/styles/mobile', import.meta.url))

const expectedImports = [
  './mobile/_breakpoints.css',
  './mobile/_grids.css',
  './mobile/_cards-buttons.css',
  './mobile/_tables.css',
  './mobile/_layout.css',
  './mobile/_forms-modals.css',
  './mobile/_navigation.css',
  './mobile/_utilities.css',
]

function lineCount(content) {
  return content.trimEnd().split(/\r?\n/).length
}

describe('mobile responsive stylesheet split (#192)', () => {
  it('conserve l’ordre de cascade du barrel', () => {
    const imports = [...readFileSync(mobileResponsiveUrl, 'utf8').matchAll(/^@import ['"](.+)['"];$/gm)]
      .map((match) => match[1])

    expect(imports).toEqual(expectedImports)
  })

  it('garde le barrel et les partials sous la limite de 300 lignes', () => {
    const files = [
      fileURLToPath(mobileResponsiveUrl),
      ...readdirSync(mobileDir).map((file) => join(mobileDir, file)),
    ]

    const overLimit = files
      .map((file) => ({ file: basename(file), lines: lineCount(readFileSync(file, 'utf8')) }))
      .filter(({ lines }) => lines > 300)

    expect(overLimit).toEqual([])
  })
})
