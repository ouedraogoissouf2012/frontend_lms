/**
 * Pure, IO-free ratchet logic for the source file-size guard (issue #195).
 *
 * A file entry is a plain object: { file, lines } where `file` is a
 * repo-relative POSIX path. The baseline is keyed by file path:
 *   { [file]: allowedLineCount }
 *
 * The guard allows legacy files already above the limit, but freezes their
 * current size. A new oversized file fails, and a baseline file that grows
 * fails. Shrinking or deleting a baseline file is always accepted.
 */

export const DEFAULT_MAX_LINES = 300

const SOURCE_EXTENSIONS = new Set(['.vue', '.js', '.ts', '.scss', '.css'])

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

export function isTrackedSourceFile(file) {
  return SOURCE_EXTENSIONS.has(file.slice(file.lastIndexOf('.')))
}

export function countLines(source) {
  const normalized = String(source).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trimEnd()
  if (normalized === '') return 0
  return normalized.split('\n').length
}

export function buildBaseline(entries, maxLines = DEFAULT_MAX_LINES) {
  const baseline = Object.create(null)
  for (const { file, lines } of entries) {
    if (lines > maxLines) baseline[file] = lines
  }
  return baseline
}

export function diffAgainstSizeBaseline(entries, baseline, maxLines = DEFAULT_MAX_LINES) {
  const safeBaseline = isPlainObject(baseline) ? baseline : {}
  const newOversized = []
  const grownBaseline = []

  for (const entry of entries) {
    if (entry.lines <= maxLines) continue

    const allowed = Object.hasOwn(safeBaseline, entry.file) ? safeBaseline[entry.file] : undefined
    if (allowed === undefined) {
      newOversized.push(entry)
    } else if (entry.lines > allowed) {
      grownBaseline.push({ ...entry, allowed, growth: entry.lines - allowed })
    }
  }

  const byFile = (a, b) => a.file.localeCompare(b.file)
  return {
    newOversized: newOversized.sort(byFile),
    grownBaseline: grownBaseline.sort(byFile),
  }
}

export function assertValidSizeBaseline(value, maxLines = DEFAULT_MAX_LINES) {
  if (!isPlainObject(value)) {
    throw new Error(
      `baseline invalide: attendu un objet {fichier: lignes}, reçu ${
        Array.isArray(value) ? 'un tableau' : typeof value
      }`,
    )
  }

  for (const [file, lines] of Object.entries(value)) {
    if (!isTrackedSourceFile(file)) {
      throw new Error(`baseline invalide: "${file}" n'est pas une extension source suivie`)
    }
    if (!Number.isSafeInteger(lines) || lines <= maxLines) {
      throw new Error(
        `baseline invalide: "${file}" a une taille non valide (${JSON.stringify(lines)}) ` +
          `- entier > ${maxLines} requis`,
      )
    }
  }
}

export function serializeSizeBaseline(baseline) {
  const sorted = Object.create(null)
  for (const file of Object.keys(baseline).sort()) {
    sorted[file] = baseline[file]
  }
  return JSON.stringify(sorted, null, 2) + '\n'
}
