// Test de capacité de la visio (lms_backend#1232) : le RAPPORT, palier par palier, depuis les sorties des runners.
//
// Usage : node rapport.mjs <plan.json> <dossier des runner-*.json> <rapport.md>
// Il ne décide rien à la place du lecteur : il donne, par palier, les chiffres client (entrées, perte, débit, gels,
// CPU du runner). Les chiffres serveur (docker stats) sont relevés par la superviseure et joints au rapport final.
// Un runner saturé (CPU p95 ≥ 85 %) est SIGNALÉ : ses mesures disent la limite du générateur, pas du serveur.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { validerPlan } from './plan.mjs'
import { resumerPalier } from './mesures.mjs'

export const CPU_RUNNER_SATURE = 85

/** Les lignes du rapport, pures. */
export function lignesDuRapport(plan, runners) {
  const echantillons = runners.flatMap((r) => r.participants.flatMap((p) => p.echantillons))
  const echecs = runners.flatMap((r) => r.participants.filter((p) => p.echecEntree).map((p) => `participant ${p.numero} : ${p.echecEntree}`))
  const entrees = runners.flatMap((r) => r.participants.map((p) => p.entreeMs)).filter(Number.isFinite)
  const l = [
    `# Charge de la visio — salle ${plan.salle}`,
    '',
    `T0 : ${runners[0]?.t0 ?? '—'} ; paliers ${plan.paliers.join(', ')} ; ${plan.dureePalierS} s par palier ; ${plan.navigateursParRunner} navigateurs par runner.`,
    '',
    '| Palier | Attendus | Entrés | Échec d’entrée | Perte reçue (médiane / p95) | Débit reçu (médiane / p5) | Gels apparus | CPU runner p95 |',
    '|---|---|---|---|---|---|---|---|',
  ]
  const val = (x, u = '') => (x == null ? '—' : `${x}${u}`)
  plan.paliers.forEach((_, i) => {
    const r = resumerPalier(echantillons, plan, i)
    const sature = r.cpuRunnerPct.p95 != null && r.cpuRunnerPct.p95 >= CPU_RUNNER_SATURE ? ' ⚠ générateur saturé' : ''
    l.push(`| ${i + 1} | ${r.attendus} | ${r.entres} | ${r.tauxEchecEntreePct} % | ${val(r.perteRecuePct.mediane, ' %')} / ${val(r.perteRecuePct.p95, ' %')} | ${val(r.debitRecuKbps.mediane, ' kb/s')} / ${val(r.debitRecuKbps.p5, ' kb/s')} | ${r.gelsApparus} | ${val(r.cpuRunnerPct.p95, ' %')}${sature} |`)
  })
  l.push('', `Temps d’entrée (ms) : ${entrees.length ? `médiane ${entrees.sort((a, b) => a - b)[Math.floor(entrees.length / 2)]}, max ${Math.max(...entrees)}` : '—'}`)
  l.push('', echecs.length ? `Échecs d’entrée :\n${echecs.map((e) => `- ${e}`).join('\n')}` : 'Aucun échec d’entrée.')
  l.push('', '## Connexion au pont vidéo (dernier relevé de chaque participant)', '', ...cheminsMedia(runners))
  return l
}

/**
 * Le chemin du média, par participant : l'état ICE, la paire retenue et les octets envoyés et reçus. Sans ce relevé,
 * « débit reçu 0 » ne dit pas si rien ne part, ou si rien ne revient (essai 1 de #1232).
 */
export function cheminsMedia(runners) {
  const lignes = []
  for (const p of runners.flatMap((r) => r.participants).sort((a, b) => a.numero - b.numero)) {
    const dernier = [...p.echantillons].reverse().find((e) => e.ice) ?? null
    const ice = dernier?.ice
    lignes.push(`- participant ${p.numero} (${p.role}) : ICE ${ice?.etat ?? '—'}, connexion ${ice?.connexion ?? '—'}, `
      + `paire ${ice?.candidatLocal ?? '—'} → ${ice?.candidatDistant ?? '—'}, octets envoyés ${dernier?.octetsEnvoyes ?? '—'}`)
  }
  return lignes.length ? lignes : ['- aucun relevé']
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cheminPlan, dossier, sortie] = process.argv.slice(2)
  const plan = validerPlan(JSON.parse(readFileSync(cheminPlan, 'utf8')))
  const runners = readdirSync(dossier, { recursive: true })
    .filter((f) => /runner-\d+\.json$/.test(String(f)))
    .map((f) => JSON.parse(readFileSync(join(dossier, String(f)), 'utf8')))
    .sort((a, b) => a.runner - b.runner)
  writeFileSync(sortie, lignesDuRapport(plan, runners).join('\n') + '\n')
}
