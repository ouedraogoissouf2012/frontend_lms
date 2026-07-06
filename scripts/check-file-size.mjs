#!/usr/bin/env node
/**
 * Source file-size guard (issue #195) - ratchet runner.
 *
 * Checks tracked source files under src/ against the 300-line standard. Legacy
 * files currently above the limit are frozen in .file-size-baseline.json:
 *   - any new file above 300 lines fails;
 *   - any baseline file that grows fails;
 *   - shrinking/removing a baseline file is accepted.
 *
 * Usage:
 *   node scripts/check-file-size.mjs          # check; exit 1 on regression
 *   node scripts/check-file-size.mjs --update # regenerate the baseline
 */
import { existsSync, readFileSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import {
  DEFAULT_MAX_LINES,
  assertValidSizeBaseline,
  buildBaseline,
  countLines,
  diffAgainstSizeBaseline,
  isTrackedSourceFile,
  serializeSizeBaseline,
} from './lib/fileSizeRatchet.mjs'

const REPO_ROOT = process.cwd()
const SRC_DIR = path.join(REPO_ROOT, 'src')
const BASELINE_FILE = path.join(REPO_ROOT, '.file-size-baseline.json')

function toRelPosix(absPath) {
  return path.relative(REPO_ROOT, absPath).split(path.sep).join('/')
}

async function collectSourceFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...await collectSourceFiles(fullPath))
    } else if (entry.isFile() && isTrackedSourceFile(entry.name)) {
      files.push(fullPath)
    }
  }

  return files
}

async function collectFileSizes() {
  const files = await collectSourceFiles(SRC_DIR)
  const sizes = []

  for (const file of files) {
    sizes.push({
      file: toRelPosix(file),
      lines: countLines(await readFile(file, 'utf8')),
    })
  }

  return sizes.sort((a, b) => a.file.localeCompare(b.file))
}

function loadBaseline() {
  if (!existsSync(BASELINE_FILE)) return null
  const parsed = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))
  assertValidSizeBaseline(parsed, DEFAULT_MAX_LINES)
  return parsed
}

function printFailures(newOversized, grownBaseline) {
  console.error(`x Source file-size guard failed (max ${DEFAULT_MAX_LINES} lines).\n`)

  if (newOversized.length > 0) {
    console.error('New oversized source files:')
    for (const entry of newOversized) {
      console.error(`  ${entry.file}  ${entry.lines} lines`)
    }
    console.error('')
  }

  if (grownBaseline.length > 0) {
    console.error('Baseline files grew:')
    for (const entry of grownBaseline) {
      console.error(`  ${entry.file}  ${entry.lines} lines (baseline ${entry.allowed}, +${entry.growth})`)
    }
    console.error('')
  }

  console.error(
    'Split the file before merging. For a justified temporary exception, ' +
      'document it in the PR and run "npm run lint:size:baseline".',
  )
}

async function main() {
  const update = process.argv.includes('--update')
  const sizes = await collectFileSizes()

  if (update) {
    const baseline = buildBaseline(sizes, DEFAULT_MAX_LINES)
    await writeFile(BASELINE_FILE, serializeSizeBaseline(baseline))
    console.log(
      `OK Baseline regenerated: ${Object.keys(baseline).length} oversized file(s) frozen ` +
        `-> ${path.basename(BASELINE_FILE)}`,
    )
    return
  }

  const baseline = loadBaseline()
  if (baseline === null) {
    console.error(
      `x Missing ${path.basename(BASELINE_FILE)}. Run "npm run lint:size:baseline" once to create it.`,
    )
    process.exitCode = 1
    return
  }

  const { newOversized, grownBaseline } = diffAgainstSizeBaseline(sizes, baseline, DEFAULT_MAX_LINES)

  if (newOversized.length === 0 && grownBaseline.length === 0) {
    console.log(
      `OK No source file-size regressions. ` +
        `(${Object.keys(baseline).length} legacy oversized file(s) frozen by the baseline.)`,
    )
    return
  }

  printFailures(newOversized, grownBaseline)
  process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
