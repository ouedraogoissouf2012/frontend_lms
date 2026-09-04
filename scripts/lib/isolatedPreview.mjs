/**
 * Pure decisions behind the isolated preview (see ../isolated-preview.mjs).
 *
 * Kept apart from the orchestrator so the choices that actually matter — which
 * ref to serve, on which port, and whether the expensive `npm install` can be
 * skipped — are unit-tested without spawning git, npm or Vite.
 */
import { createHash } from 'node:crypto'

/** Served by default: the integration branch, as published on the remote. */
export const DEFAULT_REF = 'origin/dev'

/** Away from Vite's usual 5173/5174 so a running dev server keeps its port. */
export const DEFAULT_PORT = 5180

function parsePort(raw) {
  const port = Number(raw)
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid --port "${raw}": expected an integer between 1 and 65535.`)
  }
  return port
}

/**
 * Reads the command line.
 *
 * The ref may be positional (`npm run preview:isolated -- origin/main`) or
 * explicit (`--ref origin/main`); both forms accept `--flag=value`.
 *
 * @param {string[]} argv
 * @returns {{ref: string, port: number, help: boolean}}
 */
export function parseArgs(argv) {
  let ref = null
  let port = DEFAULT_PORT
  let help = false

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === '--help' || arg === '-h') {
      help = true
    } else if (arg.startsWith('--ref=')) {
      ref = arg.slice('--ref='.length)
    } else if (arg === '--ref') {
      ref = argv[++i]
      if (ref === undefined) throw new Error('Missing value for --ref.')
    } else if (arg.startsWith('--port=')) {
      port = parsePort(arg.slice('--port='.length))
    } else if (arg === '--port') {
      port = parsePort(argv[++i])
    } else if (!arg.startsWith('-') && ref === null) {
      ref = arg
    }
  }

  return { ref: ref ?? DEFAULT_REF, port, help }
}

/**
 * Splits a remote-tracking ref so the branch can be fetched before it is served.
 *
 * Only a prefix that is a KNOWN remote counts: `fix/foo` is a local branch whose
 * first segment merely looks like one, and fetching `origin fix` would fail.
 *
 * @param {string} ref
 * @param {string[]} remotes - Remote names as reported by `git remote`.
 * @returns {{remote: string, branch: string}|null} `null` when nothing to fetch.
 */
export function splitRemoteRef(ref, remotes = ['origin']) {
  const separator = ref.indexOf('/')
  if (separator === -1) return null

  const remote = ref.slice(0, separator)
  if (!remotes.includes(remote)) return null

  return { remote, branch: ref.slice(separator + 1) }
}

/**
 * Fingerprint of the dependency lockfile.
 *
 * @param {string} lockContents
 * @returns {string}
 */
export function fingerprintLock(lockContents) {
  return createHash('sha256').update(lockContents).digest('hex').slice(0, 16)
}

/**
 * Whether dependencies must be installed before serving.
 *
 * Installing is the one slow step (minutes, hundreds of megabytes), so the
 * worktree is kept across runs and only re-installed when the lockfile moved.
 * An unknown stored fingerprint counts as "moved": a half-written install is
 * worse than a redundant one.
 *
 * @param {{hasNodeModules: boolean, storedFingerprint: string|null, currentFingerprint: string}} state
 * @returns {boolean}
 */
export function needsInstall({ hasNodeModules, storedFingerprint, currentFingerprint }) {
  if (!hasNodeModules) return true
  if (!storedFingerprint) return true
  return storedFingerprint !== currentFingerprint
}
