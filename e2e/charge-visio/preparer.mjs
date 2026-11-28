// Test de capacité de la visio (lms_backend#1232) : la PRÉPARATION du run, appelée par le premier job.
//
// Usage : node preparer.mjs <nom du tag>   (écrit sur la sortie standard des lignes `cle=valeur` pour $GITHUB_OUTPUT)
// Le tag choisit le plan : `charge-visio-essai-*` → plan-essai.json ; `charge-visio-test-*` → plan-test.json. Tout
// autre tag est refusé. T0 est fixé 150 s plus tard, pour que tous les runners soient prêts avant la première entrée.
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { validerPlan, runnersNecessaires, finS } from './plan.mjs'

export const MARGE_DEPART_S = 150
export const RUNNERS_MAX = 18 // 20 jobs simultanés au plus sur un dépôt public, moins la veille et le rapport

/** Le fichier de plan d'un tag, ou une erreur. */
export function planDuTag(tag) {
  if (/^charge-visio-essai(-[a-z0-9-]+)?$/.test(tag)) return 'plan-essai.json'
  if (/^charge-visio-test(-[a-z0-9-]+)?$/.test(tag)) return 'plan-test.json'
  throw new Error(`tag inconnu : « ${tag} » (charge-visio-essai-… ou charge-visio-test-…)`)
}

/** Les sorties du job de préparation, pures. */
export function sorties(plan, maintenantS) {
  validerPlan(plan)
  const n = runnersNecessaires(plan)
  if (n > RUNNERS_MAX) throw new Error(`${n} runners demandés, ${RUNNERS_MAX} au plus`)
  const t0 = Math.floor(maintenantS) + MARGE_DEPART_S
  return { runners: JSON.stringify([...Array(n).keys()]), t0: String(t0), fin: String(t0 + finS(plan)) }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const fichier = planDuTag(process.argv[2] ?? '')
  const plan = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), fichier), 'utf8'))
  const s = sorties(plan, Date.now() / 1000)
  console.log(`plan=${fichier}`)
  for (const [cle, valeur] of Object.entries(s)) console.log(`${cle}=${valeur}`)
}
