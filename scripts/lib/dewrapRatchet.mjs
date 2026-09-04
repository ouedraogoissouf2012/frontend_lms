/**
 * Pure, IO-free ratchet logic for the ad-hoc envelope de-wrap guard (issue #296).
 *
 * Context: the KLASSCI backend wraps list payloads in an envelope
 * (`{ success, data: [...] }`, sometimes paginated `{ data: { data: [...] } }`).
 * The canonical way to unwrap a LIST is the shared helper `extractList`
 * (src/utils/apiList.js). Hand-rolled unwrapping such as `response.data || []`
 * or `response.data.data` re-implements that helper inconsistently and was the
 * source of the "empty dashboards" class of bugs.
 *
 * This guard is a RATCHET, not a mass-refactor:
 *   - the handful of legacy hand-rolled unwraps are frozen in a committed
 *     baseline (.dewrap-baseline.json) and do NOT fail the build;
 *   - ANY new hand-rolled unwrap in src/ fails the build (exit 1), with a
 *     message pointing to extractList.
 *
 * Why these four forms and nothing else — measured on the real tree (see #296):
 *   - `.data || []` / `.data ?? []` : the `[]` fallback PROVES list intent, so
 *     it is unambiguously replaceable by extractList. Zero false positives.
 *   - `.data.data` / `.data?.data`  : the paginated-list unwrap extractList also
 *     covers. These can appear on non-API nesting, so error-context and the
 *     baseline absorb the legitimate residue.
 * Deliberately NOT matched, because they are legitimate non-API `.data` access
 * that would create false positives (all present in the tree today):
 *   - `.data || {}` / `.data ?? {}`  : object fallback (FullCalendar
 *     `extendedProps.data`, `MessageEvent.data`), not a list unwrap.
 *   - `error.response?.data...`       : reading an axios ERROR body — exempted
 *     via {@link isErrorContext}.
 */

/** Repo-relative POSIX path of the canonical helper, always exempt. */
export const CANONICAL_HELPER = 'src/utils/apiList.js'

const SCANNED_EXTENSIONS = new Set(['.vue', '.js', '.ts', '.mjs'])

/**
 * The forbidden hand-rolled unwrap forms. Order matters: the `?.` variant is
 * listed before the plain-dot one, but the regexes are mutually exclusive on a
 * given substring (`.data?.data` has a `?` the plain-dot form rejects), and
 * matches are de-duplicated by (line, column) anyway.
 *
 * `\s*` tolerates minifier/formatter whitespace (`.data ||  []`, `.data ?. data`).
 */
export const FORBIDDEN_PATTERNS = [
  { label: '.data || []', re: /\.data\s*\|\|\s*\[\s*\]/g },
  { label: '.data ?? []', re: /\.data\s*\?\?\s*\[\s*\]/g },
  { label: '.data?.data', re: /\.data\s*\?\.\s*data\b/g },
  { label: '.data.data', re: /\.data\s*\.\s*data\b/g },
]

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function extname(file) {
  const i = file.lastIndexOf('.')
  return i === -1 ? '' : file.slice(i)
}

/** A source file we scan: JS/Vue under src/, but never the canonical helper. */
export function isScannedFile(relPosixPath) {
  if (relPosixPath === CANONICAL_HELPER) return false
  return SCANNED_EXTENSIONS.has(extname(relPosixPath))
}

/**
 * True when the `.data` chain being matched is an axios ERROR body access
 * (`err.response.data.data`, `error.response?.data?.data`). Reading the error
 * envelope is legitimate and must never be flagged. Heuristic on the text
 * BEFORE the match: a standalone `err`/`error` identifier governs the access.
 * Word-boundaried + case-sensitive so `orderData`/`serverError` don't trip it.
 */
export function isErrorContext(prefixBeforeMatch) {
  return /\berr(or)?\b/.test(prefixBeforeMatch)
}

/**
 * Scan one file's text. Returns `{ file, line, column, pattern, snippet }` for
 * every forbidden unwrap, skipping line-comments and error-body access.
 * `file` must be a repo-relative POSIX path.
 */
export function scanContent(relPosixPath, content) {
  if (!isScannedFile(relPosixPath)) return []

  const lines = String(content).replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const violations = []

  lines.forEach((line, index) => {
    const commentIdx = line.indexOf('//')
    const seenColumns = new Set()

    for (const { label, re } of FORBIDDEN_PATTERNS) {
      re.lastIndex = 0
      let match
      while ((match = re.exec(line)) !== null) {
        const column = match.index + 1

        // Inside a `//` line-comment (e.g. an example in a doc-comment): ignore.
        if (commentIdx !== -1 && match.index > commentIdx) continue
        // Reading an axios error body: legitimate, never a list unwrap.
        if (isErrorContext(line.slice(0, match.index))) continue
        // Two patterns can anchor at the same spot; count a location once.
        if (seenColumns.has(column)) continue
        seenColumns.add(column)

        violations.push({
          file: relPosixPath,
          line: index + 1,
          column,
          pattern: label,
          snippet: line.trim().slice(0, 120),
        })
      }
    }
  })

  return violations
}

/** Baseline shape: `{ [file]: allowedOccurrenceCount }`. */
export function buildBaseline(violations) {
  const baseline = Object.create(null)
  for (const { file } of violations) {
    baseline[file] = (baseline[file] || 0) + 1
  }
  return baseline
}

/**
 * Diff current violations against the baseline. A file may hold up to its
 * baselined count of grandfathered unwraps; anything beyond that (ordered by
 * line, then column) is a NEW violation. Line-number independent: moving an
 * existing unwrap around does not flag it. Removing unwraps never errors.
 */
export function diffAgainstBaseline(violations, baseline) {
  const safeBaseline = isPlainObject(baseline) ? baseline : {}

  const byFile = new Map()
  for (const v of violations) {
    if (!byFile.has(v.file)) byFile.set(v.file, [])
    byFile.get(v.file).push(v)
  }

  const newViolations = []
  for (const [file, list] of byFile) {
    list.sort((a, b) => a.line - b.line || a.column - b.column)
    const allowed = Object.hasOwn(safeBaseline, file) ? safeBaseline[file] : 0
    if (list.length > allowed) newViolations.push(...list.slice(allowed))
  }

  newViolations.sort(
    (a, b) => a.file.localeCompare(b.file) || a.line - b.line || a.column - b.column,
  )
  return { newViolations }
}

/**
 * Fail-closed validation of a loaded baseline: a corrupted file aborts the run
 * (exit 1) instead of silently widening the allowance.
 */
export function assertValidDewrapBaseline(value) {
  if (!isPlainObject(value)) {
    throw new Error(
      `baseline invalide: attendu un objet {fichier: nombre}, reçu ${
        Array.isArray(value) ? 'un tableau' : typeof value
      }`,
    )
  }
  for (const [file, count] of Object.entries(value)) {
    if (!isScannedFile(file)) {
      throw new Error(`baseline invalide: "${file}" n'est pas un fichier source scanné`)
    }
    if (!Number.isSafeInteger(count) || count <= 0) {
      throw new Error(
        `baseline invalide: "${file}" a un compte non valide (${JSON.stringify(count)}) ` +
          '- entier > 0 requis',
      )
    }
  }
}

export function serializeDewrapBaseline(baseline) {
  const sorted = Object.create(null)
  for (const file of Object.keys(baseline).sort()) {
    sorted[file] = baseline[file]
  }
  return JSON.stringify(sorted, null, 2) + '\n'
}

export function totalCount(baseline) {
  return Object.values(baseline).reduce((sum, n) => sum + n, 0)
}
