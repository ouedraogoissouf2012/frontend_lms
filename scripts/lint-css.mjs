#!/usr/bin/env node
/**
 * Hardcoded-color guard (issue #161) — ratchet runner.
 *
 * Runs Stylelint's `color-no-hex` over src/**, then compares the result to a
 * committed baseline (.stylelint-color-baseline.json) so that:
 *   - the ~471 intentional residual hex colors (token gaps tracked in #136)
 *     are frozen and do NOT fail the build;
 *   - ANY new hardcoded hex color fails the build (exit 1).
 *
 * The rule is never disabled and no source file is blanket-ignored, so the
 * guard stays effective everywhere. The only legitimate exception baked in is
 * the token fallback `var(--token, #hex)`, which is filtered out here so new
 * fallbacks are allowed too (matching the documented convention).
 *
 * Usage:
 *   node scripts/lint-css.mjs            # check; exit 1 on any new violation
 *   node scripts/lint-css.mjs --update   # regenerate the baseline snapshot
 */
import { readFile, writeFile } from 'node:fs/promises'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import stylelint from 'stylelint'

import { buildBaseline, diffAgainstBaseline } from './lib/colorRatchet.mjs'

const REPO_ROOT = process.cwd()
const BASELINE_FILE = path.join(REPO_ROOT, '.stylelint-color-baseline.json')
const GLOB = 'src/**/*.{vue,css,scss}'
const RULE = 'color-no-hex'

/** Repo-relative POSIX path so the committed baseline is OS-portable (CI is Linux). */
function toRelPosix(absPath) {
  return path.relative(REPO_ROOT, absPath).split(path.sep).join('/')
}

/** Pull the offending hex out of a color-no-hex message: `Disallowed hex color "#abc"`. */
function extractColor(text) {
  const m = text.match(/"(#[0-9a-fA-F]{3,8})"/)
  return m ? m[1] : null
}

const FALLBACK_RE = /var\(\s*--[A-Za-z0-9_-]+\s*,\s*(#[0-9a-fA-F]{3,8})/gd

/** True when the hex at `column` (1-based) is the fallback value of a var(--token, #hex). */
function isFallbackHex(sourceLine, column) {
  if (!sourceLine) return false
  const hexStart = column - 1
  for (const match of sourceLine.matchAll(FALLBACK_RE)) {
    if (match.indices?.[1]?.[0] === hexStart) return true
  }
  return false
}

async function collectViolations() {
  const { results } = await stylelint.lint({ files: GLOB, formatter: 'json' })

  const fileLineCache = new Map()
  const getLine = (absPath, line) => {
    let lines = fileLineCache.get(absPath)
    if (!lines) {
      lines = readFileSync(absPath, 'utf8').split(/\r?\n/)
      fileLineCache.set(absPath, lines)
    }
    return lines[line - 1] ?? ''
  }

  const violations = []
  for (const result of results) {
    for (const w of result.warnings) {
      if (w.rule !== RULE) continue
      const color = extractColor(w.text)
      if (!color) continue
      // Documented exception: token fallback `var(--token, #hex)` is allowed.
      if (isFallbackHex(getLine(result.source, w.line), w.column)) continue
      violations.push({
        file: toRelPosix(result.source),
        line: w.line,
        column: w.column,
        color: color.toLowerCase(),
      })
    }
  }
  return violations
}

/** Deterministic, sorted JSON so the committed baseline diffs cleanly. */
function serializeBaseline(baseline) {
  const sorted = {}
  for (const file of Object.keys(baseline).sort()) {
    sorted[file] = {}
    for (const color of Object.keys(baseline[file]).sort()) {
      sorted[file][color] = baseline[file][color]
    }
  }
  return JSON.stringify(sorted, null, 2) + '\n'
}

function loadBaseline() {
  if (!existsSync(BASELINE_FILE)) return null
  return JSON.parse(readFileSync(BASELINE_FILE, 'utf8'))
}

function totalCount(baseline) {
  return Object.values(baseline).reduce(
    (sum, perFile) => sum + Object.values(perFile).reduce((s, n) => s + n, 0),
    0,
  )
}

async function main() {
  const update = process.argv.includes('--update')
  const violations = await collectViolations()

  if (update) {
    const baseline = buildBaseline(violations)
    await writeFile(BASELINE_FILE, serializeBaseline(baseline))
    console.log(
      `✔ Baseline regenerated: ${totalCount(baseline)} grandfathered hardcoded color(s) ` +
        `across ${Object.keys(baseline).length} file(s) -> ${path.basename(BASELINE_FILE)}`,
    )
    return
  }

  const baseline = loadBaseline()
  if (baseline === null) {
    console.error(
      `✖ Missing ${path.basename(BASELINE_FILE)}. Run "npm run lint:css:baseline" once to create it.`,
    )
    process.exitCode = 1
    return
  }

  const { newViolations } = diffAgainstBaseline(violations, baseline)

  if (newViolations.length === 0) {
    console.log(
      `✔ No new hardcoded colors. (${totalCount(baseline)} pre-existing color(s) frozen by the baseline.)`,
    )
    return
  }

  console.error(`✖ ${newViolations.length} new hardcoded color(s) introduced:\n`)
  let lastFile = null
  for (const v of newViolations) {
    if (v.file !== lastFile) {
      console.error(`  ${v.file}`)
      lastFile = v.file
    }
    console.error(`    ${v.line}:${v.column}  ${v.color}`)
  }
  console.error(
    '\nUse a design token instead: color: var(--your-token);' +
      '\nNeed a fallback? var(--your-token, #hex) is allowed.' +
      '\nNo token exists yet (rare, see #136)? Justify it in the PR and run ' +
      '"npm run lint:css:baseline" to grandfather it explicitly.',
  )
  process.exitCode = 1
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
