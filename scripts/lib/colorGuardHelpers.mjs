/**
 * Pure, IO-free helpers for the hardcoded-color guard CLI (issue #161).
 * Extracted from scripts/lint-css.mjs so they are unit-testable in isolation.
 */

/** Pull the offending hex out of a color-no-hex message: `Disallowed hex color "#abc"`. */
export function extractColor(text) {
  if (typeof text !== 'string') return null
  const m = text.match(/"(#[0-9a-fA-F]{3,8})"/)
  return m ? m[1] : null
}

// `i`: CSS functional notation is case-insensitive (VAR(--a, #fff) is valid CSS).
const FALLBACK_RE = /var\(\s*--[A-Za-z0-9_-]+\s*,\s*(#[0-9a-fA-F]{3,8})/gdi

/** True when the hex at `column` (1-based) is the fallback value of a var(--token, #hex). */
export function isFallbackHex(sourceLine, column) {
  if (!sourceLine) return false
  const hexStart = column - 1
  for (const match of sourceLine.matchAll(FALLBACK_RE)) {
    if (match.indices?.[1]?.[0] === hexStart) return true
  }
  return false
}

/** Deterministic, sorted JSON so the committed baseline diffs cleanly. */
export function serializeBaseline(baseline) {
  // Null-prototype: a file key like "__proto__" must become an own property,
  // not mutate the prototype (which JSON.stringify would then silently drop).
  const sorted = Object.create(null)
  for (const file of Object.keys(baseline).sort()) {
    sorted[file] = Object.create(null)
    for (const color of Object.keys(baseline[file]).sort()) {
      sorted[file][color] = baseline[file][color]
    }
  }
  return JSON.stringify(sorted, null, 2) + '\n'
}

export function totalCount(baseline) {
  return Object.values(baseline).reduce(
    (sum, perFile) => sum + Object.values(perFile).reduce((s, n) => s + n, 0),
    0,
  )
}

/**
 * Validate a parsed baseline. The guard must FAIL CLOSED: a corrupted baseline
 * (wrong shape, non-integer counts…) must abort the run — never silently widen
 * the allowance. Throws with a precise reason.
 */
export function assertValidBaseline(value) {
  const isPlainObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v)
  if (!isPlainObject(value)) {
    throw new Error(`baseline invalide: attendu un objet {fichier: {couleur: entier}}, reçu ${Array.isArray(value) ? 'un tableau' : typeof value}`)
  }
  for (const [file, perFile] of Object.entries(value)) {
    if (!isPlainObject(perFile)) {
      throw new Error(`baseline invalide: l'entrée "${file}" doit être un objet {couleur: entier}`)
    }
    for (const [color, count] of Object.entries(perFile)) {
      if (!Number.isSafeInteger(count) || count <= 0) {
        throw new Error(`baseline invalide: "${file}" → "${color}" a un compte non valide (${JSON.stringify(count)}) — entier > 0 requis`)
      }
    }
  }
}
