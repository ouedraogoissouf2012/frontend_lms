#!/usr/bin/env node
/**
 * Runner natif (sans framework) des tests de contrat — #17 api-contract-sync.
 *
 * Exécute la logique partagée de `api-contract.spec.mjs` et sort en code 1 si au
 * moins une assertion échoue. Permet de valider le contrat AVANT que Vitest
 * (#21 / T0-5) ne soit installé — la fonctionnalité #17 n'est donc pas bloquée.
 *
 * Le hook `node-resolver.mjs` est enregistré AVANT l'import des services (import
 * dynamique) pour résoudre les imports relatifs sans extension, à la manière de Vite.
 *
 * Usage : node tests/contract/run-contract.mjs   (ou : npm run test:contract)
 */
import { register } from 'node:module'

register('./node-resolver.mjs', import.meta.url)

const { runContractAssertions } = await import('./api-contract.spec.mjs')

const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const DIM = '\x1b[2m'
const RESET = '\x1b[0m'

const { results, failed } = await runContractAssertions()

console.log('\nTests de contrat API (frontend <-> backend) — #17\n')
for (const r of results) {
  const tag = r.ok ? `${GREEN}OK  ${RESET}` : `${RED}FAIL${RESET}`
  console.log(`${tag}  ${r.name}`)
  console.log(`        ${DIM}[${r._req}${r._ek && r._ek !== '—' ? ` · ${r._ek}` : ''}] ${r.detail}${RESET}`)
}

const total = results.length
const passed = total - failed
console.log(`\n${failed === 0 ? GREEN : RED}${passed}/${total} assertions OK${RESET}\n`)

process.exit(failed === 0 ? 0 : 1)
