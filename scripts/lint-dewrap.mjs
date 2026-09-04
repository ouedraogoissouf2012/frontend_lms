#!/usr/bin/env node
/**
 * Ad-hoc envelope de-wrap guard (issue #296) — ratchet runner.
 *
 * Scans JS/Vue sources under src/ for hand-rolled envelope unwrapping
 * (`response.data || []`, `res.data.data`, …) that should go through the
 * canonical helper `extractList` (src/utils/apiList.js), then compares the
 * result to a committed baseline (.dewrap-baseline.json):
 *   - the few legacy hand-rolled unwraps are frozen and do NOT fail the build;
 *   - ANY new hand-rolled unwrap fails the build (exit 1).
 *
 * See scripts/lib/dewrapRatchet.mjs for the (unit-tested) matching rules and the
 * rationale for the exact forms matched / exempted.
 *
 * Usage:
 *   node scripts/lint-dewrap.mjs           # check; exit 1 on any new violation
 *   node scripts/lint-dewrap.mjs --update  # regenerate the baseline snapshot
 */
import { existsSync, readFileSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'

import {
  CANONICAL_HELPER,
  assertValidDewrapBaseline,
  buildBaseline,
  diffAgainstBaseline,
  isScannedFile,
  scanContent,
  serializeDewrapBaseline,
  totalCount,
} from './lib/dewrapRatchet.mjs'

const REPO_ROOT = process.cwd()
const SRC_DIR = path.join(REPO_ROOT, 'src')
const BASELINE_FILE = path.join(REPO_ROOT, '.dewrap-baseline.json')

/** Repo-relative POSIX path so the committed baseline is OS-portable (CI is Linux). */
function toRelPosix(absPath) {
  return path.relative(REPO_ROOT, absPath).split(path.sep).join('/')
}

async function collectSourceFiles(dir) {
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

async function collectViolations() {
  const files = await collectSourceFiles(SRC_DIR)
  const violations = []
  for (const file of files) {
    violations.push(...scanContent(toRelPosix(file), await readFile(file, 'utf8')))
  }
  return violations.sort(
    (a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column,
  )
}

function loadBaseline() {
  if (!existsSync(BASELINE_FILE)) return null
  // FAIL CLOSED: a corrupted baseline aborts the run (exit 1) instead of
  // silently widening the allowance. assertValidDewrapBaseline throws precisely.
  const parsed = JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))
  assertValidDewrapBaseline(parsed)
  return parsed
}

async function main() {
  const update = process.argv.includes('--update')
  const violations = await collectViolations()

  if (update) {
    const baseline = buildBaseline(violations)
    await writeFile(BASELINE_FILE, serializeDewrapBaseline(baseline))
    console.log(
      `OK Baseline regenerated: ${totalCount(baseline)} grandfathered ad-hoc unwrap(s) ` +
        `across ${Object.keys(baseline).length} file(s) -> ${path.basename(BASELINE_FILE)}`,
    )
    return
  }

  const baseline = loadBaseline()
  if (baseline === null) {
    console.error(
      `x Missing ${path.basename(BASELINE_FILE)}. Run "npm run lint:dewrap:baseline" once to create it.`,
    )
    process.exitCode = 1
    return
  }

  const { newViolations } = diffAgainstBaseline(violations, baseline)

  if (newViolations.length === 0) {
    console.log(
      `OK No new ad-hoc envelope unwraps. ` +
        `(${totalCount(baseline)} pre-existing unwrap(s) frozen by the baseline.)`,
    )
    return
  }

  console.error(`x ${newViolations.length} new ad-hoc envelope unwrap(s) introduced:\n`)
  let lastFile = null
  for (const v of newViolations) {
    if (v.file !== lastFile) {
      console.error(`  ${v.file}`)
      lastFile = v.file
    }
    console.error(`    ${v.line}:${v.column}  ${v.pattern}   ${v.snippet}`)
  }
  console.error(
    `\nUnwrap list payloads with the canonical helper instead:` +
      `\n  import { extractList } from '@/utils/apiList'` +
      `\n  const rows = extractList(response, ['classes'])   // handles [], {data:[]}, {data:{data:[]}}` +
      `\nReading an axios ERROR body (error.response.data) is exempt.` +
      `\nGenuinely unavoidable (rare)? Justify it in the PR and run "npm run lint:dewrap:baseline".` +
      `\n(${CANONICAL_HELPER} is the one file allowed to unwrap envelopes by hand.)`,
  )
  process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
