/**
 * Pure, IO-free ratchet logic for the OCP guard (issues #325 / #330).
 *
 * Scope: `src/components/**` and `src/views/**` only. A component receives
 * already-normalised data and must not know the establishment mode. 85 % of
 * real coupling lives under composables/services/utils; this guard freezes
 * the 1.6 % that still leaks into the presentation layer.
 *
 * Ratchet, not a mass-refactor:
 *   - legacy hits are frozen in `.ocp-baseline.json` and do NOT fail the build;
 *   - ANY new hit fails (exit 1). The baseline only tightens.
 *
 * Distinct from a green "nothing to report": inspecting 0 files is exit 2.
 */

export const EMPTY_SCAN_EXIT_CODE = 2

export const ALLOW_LIST = Object.freeze([
  'src/components/admin/InstitutionFormModal.vue',
])

const SCANNED_EXTENSIONS = new Set(['.vue', '.js', '.ts'])

const SCANNED_PREFIXES = Object.freeze(['src/components/', 'src/views/'])

export const FORBIDDEN_PATTERNS = [
  { label: 'klassci', re: /klassci/gi },
  { label: 'isStandalone', re: /\bisStandalone\b/g },
  { label: 'is_standalone', re: /\bis_standalone\b/g },
  { label: 'institution.mode', re: /\binstitution\s*\??\s*\.\s*mode\b/g },
  { label: 'programmation', re: /\bprogrammation\b/g },
  { label: 'matiere_nom', re: /\bmatiere_nom\b/g },
  { label: 'classe_nom', re: /\bclasse_nom\b/g },
  { label: 'enseignant_nom', re: /\benseignant_nom\b/g },
  { label: "'superAdmin'", re: /['"]superAdmin['"]/g },
  { label: "'secretaire'", re: /['"]secretaire['"]/g },
]

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function extname(file) {
  const i = file.lastIndexOf('.')
  return i === -1 ? '' : file.slice(i)
}

export function isAllowListed(relPosixPath) {
  return ALLOW_LIST.includes(relPosixPath)
}

export function isScannedFile(relPosixPath) {
  if (!SCANNED_EXTENSIONS.has(extname(relPosixPath))) return false
  return SCANNED_PREFIXES.some((prefix) => relPosixPath.startsWith(prefix))
}

export function failIfEmptyScan(inspectedCount) {
  if (inspectedCount > 0) return null
  return {
    exitCode: EMPTY_SCAN_EXIT_CODE,
    message:
      'x OCP guard inspected 0 files. "Nothing to report" and "I looked at nothing" must not share a green.',
  }
}

export function scanContent(relPosixPath, content) {
  if (!isScannedFile(relPosixPath) || isAllowListed(relPosixPath)) return []

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
        if (commentIdx !== -1 && match.index > commentIdx) continue
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

export function buildBaseline(violations) {
  const baseline = Object.create(null)
  for (const { file } of violations) {
    baseline[file] = (baseline[file] || 0) + 1
  }
  return baseline
}

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

export function assertValidOcpBaseline(value) {
  if (!isPlainObject(value)) {
    throw new Error(
      `baseline invalide: attendu un objet {fichier: nombre}, reçu ${
        Array.isArray(value) ? 'un tableau' : typeof value
      }`,
    )
  }
  for (const [file, count] of Object.entries(value)) {
    if (!isScannedFile(file)) {
      throw new Error(`baseline invalide: "${file}" n'est pas un composant/vue scanné`)
    }
    if (isAllowListed(file)) {
      throw new Error(`baseline invalide: "${file}" est sur l'allow-list, pas une baseline`)
    }
    if (!Number.isSafeInteger(count) || count <= 0) {
      throw new Error(
        `baseline invalide: "${file}" a un compte non valide (${JSON.stringify(count)}) ` +
          '- entier > 0 requis',
      )
    }
  }
}

export function serializeOcpBaseline(baseline) {
  const sorted = Object.create(null)
  for (const file of Object.keys(baseline).sort()) {
    sorted[file] = baseline[file]
  }
  return JSON.stringify(sorted, null, 2) + '\n'
}

export function totalCount(baseline) {
  return Object.values(baseline).reduce((sum, n) => sum + n, 0)
}
