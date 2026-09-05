#!/usr/bin/env node
/**
 * OCP guard (issues #325 / #330) — ratchet runner.
 *
 * Scans Vue/JS under src/components and src/views for presentation-layer
 * coupling (klassci, establishment mode, form-coupling signatures), then
 * compares to `.ocp-baseline.json`:
 *   - legacy hits are frozen and do NOT fail the build;
 *   - ANY new hit fails (exit 1).
 *
 * Inspecting 0 files is exit 2 — a distinct failure from "violations found".
 *
 * Usage:
 *   node scripts/lint-ocp.mjs           # check; exit 1 on any new violation
 *   node scripts/lint-ocp.mjs --update  # regenerate the baseline snapshot
 */
import { existsSync, readFileSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import {
  assertValidOcpBaseline,
  buildBaseline,
  diffAgainstBaseline,
  failIfEmptyScan,
  isScannedFile,
  scanContent,
  serializeOcpBaseline,
  totalCount,
} from './lib/ocpRatchet.mjs'

const REPO_ROOT = process.cwd()
const SCAN_ROOTS = ['src/components', 'src/views']
const BASELINE_FILE = path.join(REPO_ROOT, '.ocp-baseline.json')

function toRelPosix(absPath) {
  return path.relative(REPO_ROOT, absPath).split(path.sep).join('/')
}

async function collectSourceFiles(dir) {
  if (!existsSync(dir)) return []
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectSourceFiles(fullPath)))
    } else if (entry.isFile() && isScannedFile(toRelPosix(fullPath))) {
      files.push(fullPath)
    }
  }
  return files
}

async function collectScan() {
  const files = []
  for (const relRoot of SCAN_ROOTS) {
    files.push(...(await collectSourceFiles(path.join(REPO_ROOT, relRoot))))
  }
  const violations = []
  for (const file of files) {
    violations.push(...scanContent(toRelPosix(file), await readFile(file, 'utf8')))
  }
  violations.sort(
    (a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column,
  )
  return { inspected: files.length, violations }
}

function loadBaseline() {
  if (!existsSync(BASELINE_FILE)) return null
  const parsed = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))
  assertValidOcpBaseline(parsed)
  return parsed
}

async function main() {
  const update = process.argv.includes('--update')
  const { inspected, violations } = await collectScan()

  const empty = failIfEmptyScan(inspected)
  if (empty) {
    console.error(empty.message)
    process.exitCode = empty.exitCode
    return
  }

  if (update) {
    const baseline = buildBaseline(violations)
    await writeFile(BASELINE_FILE, serializeOcpBaseline(baseline))
    console.log(
      `OK Baseline regenerated: ${totalCount(baseline)} grandfathered OCP hit(s) ` +
        `across ${Object.keys(baseline).length} file(s) ` +
        `(${inspected} files inspected) -> ${path.basename(BASELINE_FILE)}`,
    )
    return
  }

  const baseline = loadBaseline()
  if (baseline === null) {
    console.error(
      `x Missing ${path.basename(BASELINE_FILE)}. Run "npm run lint:ocp:baseline" once to create it.`,
    )
    process.exitCode = 1
    return
  }

  const { newViolations } = diffAgainstBaseline(violations, baseline)

  if (newViolations.length === 0) {
    console.log(
      `OK No new presentation-layer OCP coupling. ` +
        `(${inspected} files inspected, ${totalCount(baseline)} pre-existing hit(s) frozen.)`,
    )
    return
  }

  console.error(
    `x ${newViolations.length} new OCP coupling(s) in components/views ` +
      `(${inspected} files inspected):\n`,
  )
  let lastFile = null
  for (const v of newViolations) {
    if (v.file !== lastFile) {
      console.error(`  ${v.file}`)
      lastFile = v.file
    }
    console.error(`    ${v.line}:${v.column}  ${v.pattern}   ${v.snippet}`)
  }
  console.error(
    `\nA component receives already-normalised data and does not know the source.` +
      `\nNormalise at the composable/service boundary (epique #325).` +
      `\nInstitutionFormModal is allow-listed because it IS the integration form.` +
      `\nGenuinely unavoidable (rare)? Three distinct written requests (art. 7), then ` +
      `"npm run lint:ocp:baseline" — the ratchet only tightens.`,
  )
  process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
