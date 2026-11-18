// Test de capacité de la visio (lms_backend#1232) : le RAPPORT, palier par palier, depuis les sorties des runners.
//
// Usage : node rapport.mjs <plan.json> <dossier des runner-*.json> <rapport.md>
// Il ne décide rien à la place du lecteur : il donne, par palier, les chiffres client (entrées, perte, débit, gels,
// CPU du runner). Les chiffres serveur (docker stats) sont relevés par la superviseure et joints au rapport final.
// Un runner saturé (CPU p95 ≥ 85 %) est SIGNALÉ : ses mesures disent la limite du générateur, pas du serveur. Le CPU se
// lit runner par runner (test 1 : le p95 de tous les runners mêlés affichait 50 %, celui de l'émetteur était à 100 %),
// et un palier que l'arrêt a devancé se dit « non atteint », jamais « 100 % d'échec d'entrée ».
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { runnersNecessaires, validerPlan } from './plan.mjs'
import { resumerPalier } from './mesures.mjs'
import { diagnosticsCapture } from './capture.mjs'

export const CPU_RUNNER_SATURE = 85

/** Les lignes du rapport, pures. */
export function lignesDuRapport(plan, runners) {
  // Le runner d'un échantillon est celui qui l'a écrit : la sortie le dit, quel que soit le plan qui l'a réparti.
  const echantillons = runners.flatMap((r) => r.participants.flatMap((p) => p.echantillons.map((e) => ({ ...e, runner: r.runner }))))
  const finReleveS = finDuReleve(runners)
  const echecs = runners.flatMap((r) => r.participants.filter((p) => p.echecEntree).map((p) => `participant ${p.numero} : ${p.echecEntree}`))
  const entrees = runners.flatMap((r) => r.participants.map((p) => p.entreeMs)).filter(Number.isFinite)
  const l = [
    `# Charge de la visio — salle ${plan.salle}`,
    '',
    `Relevé : ${etatDuReleve(plan, runners)}.`,
    '',
    `T0 : ${runners[0]?.t0 ?? '—'} ; paliers ${plan.paliers.join(', ')} ; ${plan.dureePalierS} s par palier ; ${plan.navigateursParRunner} navigateurs par runner.`,
    '',
    '| Palier | Attendus | Entrés | Échec d’entrée | Perte reçue (médiane / p95) | Débit reçu (médiane / p5) | Hauteur vidéo reçue (médiane) | Gels apparus (par min) | CPU runner p95 (le plus chargé) |',
    '|---|---|---|---|---|---|---|---|---|',
  ]
  const val = (x, u = '') => (x == null ? '—' : `${x}${u}`)
  const detailCpu = []
  plan.paliers.forEach((_, i) => {
    const r = resumerPalier(echantillons, plan, i, finReleveS)
    if (r.atteint === 'non') {
      l.push(`| ${i + 1} | ${r.attendus} | non atteint (arrêt à T+${finReleveS} s) | — | — | — | — | — | — |`)
      return
    }
    const entres = `${r.entres}${r.atteint === 'partiel' ? ' (fenêtre partielle)' : ''}`
    l.push(`| ${i + 1} | ${r.attendus} | ${entres} | ${r.tauxEchecEntreePct} % | ${val(r.perteRecuePct.mediane, ' %')} / ${val(r.perteRecuePct.p95, ' %')} `
      + `| ${val(r.debitRecuKbps.mediane, ' kb/s')} / ${val(r.debitRecuKbps.p5, ' kb/s')} | ${val(r.hauteurVideoRecue.mediane, ' p')} `
      + `| ${r.gelsApparus} (${val(r.gelsParMinute)}/min) | ${celluleCpu(r.cpuRunners)} |`)
    if (r.cpuRunners.length) detailCpu.push(`- palier ${i + 1} : ${r.cpuRunners.map((c) => `runner ${c.runner}${c.emetteur ? ' (émetteur)' : ''} ${c.p95} %${c.p95 >= CPU_RUNNER_SATURE ? ' ⚠' : ''}`).join(', ')}`)
  })
  l.push('', `Temps d’entrée (ms) : ${entrees.length ? `médiane ${entrees.sort((a, b) => a - b)[Math.floor(entrees.length / 2)]}, max ${Math.max(...entrees)}` : '—'}`)
  l.push('', echecs.length ? `Échecs d’entrée :\n${echecs.map((e) => `- ${e}`).join('\n')}` : 'Aucun échec d’entrée.')
  l.push('', '## CPU p95 de chaque runner (fenêtre stable)', '', ...(detailCpu.length ? detailCpu : ['- aucun relevé']))
  l.push('', '## Connexion au pont vidéo (dernier relevé de chaque participant)', '', ...cheminsMedia(runners))
  l.push('', '## Capture locale (getUserMedia direct, état de l’application)', '', ...diagnosticsCapture(runners))
  return l
}

/** La cellule CPU d'un palier : le runner le plus chargé, nommé ; « générateur saturé » s'il l'est. */
function celluleCpu(cpuRunners) {
  if (!cpuRunners.length) return '—'
  const max = cpuRunners.reduce((a, b) => (b.p95 > a.p95 ? b : a))
  return `${max.p95} % (runner ${max.runner}${max.emetteur ? ', émetteur' : ''})${max.p95 >= CPU_RUNNER_SATURE ? ' ⚠ générateur saturé' : ''}`
}

/** L'instant (s depuis T0) où le relevé s'arrête : le premier arrêt, ou le dernier relevé d'un run tué ; null s'il est complet. */
export function finDuReleve(runners) {
  if (runners.length && runners.every((r) => r.termine === true)) return null
  const arrets = runners.map((r) => r.arret?.tS).filter(Number.isFinite)
  if (arrets.length) return Math.min(...arrets)
  const instants = runners.flatMap((r) => r.participants.flatMap((p) => p.echantillons.map((e) => e.tS))).filter(Number.isFinite)
  return instants.length ? Math.max(...instants) : 0
}

/**
 * L'état du relevé : complet, partiel (annulé, ou tué sans signal) ou absent. Un relevé partiel se lit, il ne fait pas
 * échouer le rapport (essai 2 de #1232 : annulé, aucun fichier, le rapport plantait).
 */
export function etatDuReleve(plan, runners) {
  if (runners.length === 0) return 'aucun relevé'
  const attendus = runnersNecessaires(plan)
  const manquants = attendus - runners.length
  const suffixe = manquants > 0 ? ` ; ${manquants} runner(s) sur ${attendus} sans relevé` : ''
  if (manquants <= 0 && runners.every((r) => r.termine === true)) return 'complet'
  const arrets = runners.map((r) => r.arret?.tS).filter(Number.isFinite)
  if (arrets.length) return `relevé partiel (annulé à T+${Math.min(...arrets)} s)${suffixe}`
  const instants = runners.flatMap((r) => r.participants.flatMap((p) => p.echantillons.map((e) => e.tS))).filter(Number.isFinite)
  const dernier = instants.length ? `T+${Math.max(...instants)} s` : 'aucun'
  return `relevé partiel (interrompu sans signal ; dernier relevé : ${dernier})${suffixe}`
}

/** Les sorties des runners ; un dossier absent (aucun runner n'a rien écrit) n'en donne aucune. */
export function lireRunners(dossier) {
  if (!existsSync(dossier)) return []
  return readdirSync(dossier, { recursive: true })
    .filter((f) => /runner-\d+\.json$/.test(String(f)))
    .map((f) => JSON.parse(readFileSync(join(dossier, String(f)), 'utf8')))
    .sort((a, b) => a.runner - b.runner)
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
    const pistes = (dernier?.pistesLocales ?? []).map((t) => `${t.type}${t.muette ? ' (muette)' : ''}`).join(', ') || '—'
    const connexions = (dernier?.connexions ?? []).map((c) => `${c.p2p ? 'p2p' : 'jvb'} ${c.ice}`).join(', ') || '—'
    lignes.push(`- participant ${p.numero} (${p.role}) : ICE ${ice?.etat ?? '—'}, connexion ${ice?.connexion ?? '—'}, `
      + `paire ${ice?.candidatLocal ?? '—'} → ${ice?.candidatDistant ?? '—'}, octets envoyés ${dernier?.octetsEnvoyes ?? '—'} ; `
      + `pistes publiées ${pistes} ; pistes reçues ${dernier?.pistesDistantes ?? '—'} ; `
      + `octets reçus audio ${dernier?.octetsRecusAudio ?? '—'}, vidéo ${dernier?.octetsRecusVideo ?? '—'} ; connexions ${connexions}`)
  }
  return lignes.length ? lignes : ['- aucun relevé']
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [cheminPlan, dossier, sortie] = process.argv.slice(2)
  const plan = validerPlan(JSON.parse(readFileSync(cheminPlan, 'utf8')))
  writeFileSync(sortie, lignesDuRapport(plan, lireRunners(dossier)).join('\n') + '\n')
}
