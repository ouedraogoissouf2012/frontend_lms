#!/usr/bin/env node
/**
 * Isolated preview — serve any git ref without taking over the repository.
 *
 * WHY THIS EXISTS
 * Checking a fix on screen means running the code, and running the code means
 * the working tree must sit on that ref. When a second session (a colleague, or
 * another agent) is working in the same clone, `git checkout` is a tug-of-war:
 * the branch can be switched back mid-measurement, and the browser then shows a
 * DIFFERENT commit than the one being verified. That failure is silent and
 * reads exactly like a broken fix — a merged, correct change appeared reverted
 * on screen for precisely this reason.
 *
 * This script serves a ref from a dedicated worktree on its own port. The main
 * checkout is never touched, so both sessions work at once.
 *
 * The worktree PERSISTS between runs (~600 MB of node_modules): the first run
 * costs an install, later ones start in seconds. Dependencies are reinstalled
 * only when the lockfile actually moves.
 *
 * USAGE
 *   npm run preview:isolated                    # origin/dev on port 5180
 *   npm run preview:isolated -- origin/main     # another ref
 *   npm run preview:isolated -- --port 5190     # another port
 *
 * ONE ref at a time: the worktree is reused rather than duplicated, so a second
 * run moves it instead of serving alongside. Two previews at once need a second
 * LMS_PREVIEW_DIR (and its own install).
 *
 * The preview lives in ~/.lms-isolated-preview (override: LMS_PREVIEW_DIR).
 * Environment files are copied from the main checkout, as they are untracked.
 */
import { spawn, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import {
  DEFAULT_PORT,
  DEFAULT_REF,
  fingerprintLock,
  needsInstall,
  parseArgs,
  splitRemoteRef
} from './lib/isolatedPreview.mjs'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ENV_FILES = ['.env', '.env.local', '.env.development', '.env.development.local']
const LOCKFILE = 'package-lock.json'

// npm is a `.cmd` shim on Windows, and since the CVE-2024-27980 mitigation
// Node REFUSES to spawn one without a shell (EINVAL). So npm — and only npm —
// runs through a shell. Safe here: its arguments are literals, and the one
// value that varies (the directory) travels through `cwd`, never the command
// line. Node still prints a DEP0190 warning about it; that is expected.
const NPM_SHELL = { shell: true }

/**
 * Runs a command, capturing its output; throws with the stderr on failure.
 *
 * No shell anywhere: on Windows the shell re-splits arguments on spaces, and
 * the preview path routinely contains one (`C:\Users\First Last\...`), which
 * silently turned one path into several arguments.
 */
function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options })
  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed:\n${(result.stderr || result.stdout || '').trim()}`)
  }
  return (result.stdout || '').trim()
}

/** Same, but streams to the terminal — for the long steps worth watching. */
function runVisible(command, args, options = {}) {
  const result = spawnSync(command, args, { stdio: 'inherit', ...options })
  if (result.error) {
    result.error.spawnFailure = true
    throw result.error
  }
  if (result.status !== 0) throw new Error(`${command} ${args.join(' ')} exited with ${result.status}.`)
}

function log(message) {
  process.stdout.write(`${message}\n`)
}

function previewDir() {
  return process.env.LMS_PREVIEW_DIR || path.join(os.homedir(), '.lms-isolated-preview')
}

/** Brings the ref up to date when it lives on a remote. */
function fetchIfRemote(ref) {
  const remotes = run('git', ['remote'], { cwd: REPO_ROOT }).split('\n').filter(Boolean)
  const remote = splitRemoteRef(ref, remotes)
  if (!remote) return

  log(`→ fetching ${remote.remote}/${remote.branch}`)
  run('git', ['fetch', remote.remote, remote.branch], { cwd: REPO_ROOT })
}

/** Creates the worktree on first use, then just moves it onto the ref. */
function checkoutWorktree(dir, ref) {
  if (existsSync(path.join(dir, '.git'))) {
    log(`→ moving the preview worktree onto ${ref}`)
    run('git', ['-C', dir, 'checkout', '--detach', ref])
    return
  }

  log(`→ creating the preview worktree in ${dir}`)
  // Clears any stale registration left by a manually deleted directory.
  run('git', ['worktree', 'prune'], { cwd: REPO_ROOT })
  mkdirSync(path.dirname(dir), { recursive: true })
  run('git', ['worktree', 'add', '--detach', dir, ref], { cwd: REPO_ROOT })
}

/** Environment files are untracked, so the worktree never receives them from git. */
function copyEnvFiles(dir) {
  const copied = ENV_FILES.filter((name) => existsSync(path.join(REPO_ROOT, name)))
  for (const name of copied) copyFileSync(path.join(REPO_ROOT, name), path.join(dir, name))
  log(copied.length ? `→ environment: ${copied.join(', ')}` : '→ no environment file to copy')
}

/** Installs only when the lockfile moved — the whole point of a persistent worktree. */
function installIfNeeded(dir) {
  const modules = path.join(dir, 'node_modules')
  const stamp = path.join(modules, '.lms-preview-lock')
  const currentFingerprint = fingerprintLock(readFileSync(path.join(dir, LOCKFILE), 'utf8'))
  const storedFingerprint = existsSync(stamp) ? readFileSync(stamp, 'utf8').trim() : null

  if (!needsInstall({ hasNodeModules: existsSync(modules), storedFingerprint, currentFingerprint })) {
    log('→ dependencies already match the lockfile')
    return
  }

  log('→ installing dependencies (first run takes a few minutes)')
  // `npm ci` is deliberately avoided: it wipes node_modules and fails on
  // Windows when a file is still held by a running process.
  try {
    runVisible('npm', ['install', '--offline', '--no-audit', '--no-fund'], { cwd: dir, ...NPM_SHELL })
  } catch (error) {
    // Only npm REFUSING the offline cache is worth a second attempt. If npm
    // never started, retrying prints a reassuring message over a broken setup.
    if (error.spawnFailure) throw error
    log('→ offline install incomplete, retrying online')
    runVisible('npm', ['install', '--no-audit', '--no-fund'], { cwd: dir, ...NPM_SHELL })
  }
  writeFileSync(stamp, currentFingerprint)
}

function usage() {
  log(`Isolated preview — serve a git ref without touching the main checkout.

  npm run preview:isolated [-- <ref>] [--ref <ref>] [--port <port>]

  <ref>     git ref to serve (default: ${DEFAULT_REF})
  --port    port to listen on (default: ${DEFAULT_PORT})

  Worktree: ${previewDir()} (override with LMS_PREVIEW_DIR)`)
}

function main() {
  const { ref, port, help } = parseArgs(process.argv.slice(2))
  if (help) return usage()

  const dir = previewDir()
  fetchIfRemote(ref)
  checkoutWorktree(dir, ref)
  copyEnvFiles(dir)
  installIfNeeded(dir)

  const served = run('git', ['-C', dir, 'log', '--oneline', '-1'])
  log(`\n  serving ${ref} → ${served}\n  http://localhost:${port}\n`)

  // Launched through node rather than the npm bin shim, which is not always on
  // PATH inside a worktree. --strictPort fails loudly instead of drifting to
  // another port, which would serve the preview where nobody is looking.
  const vite = spawn(process.execPath, [
    path.join(dir, 'node_modules', 'vite', 'bin', 'vite.js'),
    '--port', String(port),
    '--strictPort'
  ], { cwd: dir, stdio: 'inherit' })

  vite.on('exit', (code) => process.exit(code ?? 0))
}

try {
  main()
} catch (error) {
  process.stderr.write(`\nisolated-preview: ${error.message}\n`)
  process.exit(1)
}
