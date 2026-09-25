#!/usr/bin/env node
/**
 * Garde « contrat d'API » : le front n'appelle que ce que le backend déclare (#876).
 *
 * ## Ce qu'elle empêche
 *
 * Que le front et le backend dérivent sans que rien ne le dise. C'est arrivé
 * dans les deux sens : un bouton d'export qui tapait dans une route morte
 * (#337), douze écrans qui recevaient des 404 (#17), et une route livrée côté
 * serveur que personne n'avait recopiée côté front (backend #760). Les chemins
 * de `src/services/endpoints.js` sont écrits à la main : seule une comparaison
 * au contrat du backend peut voir qu'ils ont cessé d'être vrais.
 *
 * ## Les deux usages
 *
 *   CI du front    --spec <openapi.yaml du backend>
 *                  Chaque appel figure dans la spec, ou dans la dette nommée
 *                  `.api-contract-baseline.json`.
 *
 *   CI du backend  --spec docs/openapi.yaml --routes <route:list --json>
 *                  En plus : chaque appel EXISTE parmi les routes servies, sans
 *                  baseline. C'est ce qui arrête une PR backend qui retire une
 *                  route que le front appelle encore.
 *
 * ## Codes de sortie
 *
 *   0  conforme ; le dénominateur est imprimé
 *   1  appel illisible, appel absent de la spec hors dette, ou route inexistante
 *   2  la garde N'A PAS PU TRAVAILLER (spec ou routes illisibles, rien à
 *      inspecter, baseline absente). Ce n'est jamais un succès : backend #701.
 *
 * Usage :
 *   node scripts/lint-api-contract.mjs --spec <fichier> [--routes <fichier>]
 *   node scripts/lint-api-contract.mjs --spec <fichier> --update
 *
 * `--update` retire la dette remboursée et n'ajoute JAMAIS rien : un appel neuf
 * se documente d'abord dans la spec du backend. Seule la toute première
 * exécution, sans baseline, l'initialise.
 */
import { existsSync, readFileSync } from 'node:fs'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { pathToFileURL } from 'node:url'
import yaml from 'js-yaml'

import { catalogueDepuisRoutes, catalogueDepuisSpec, cle, comparer, extraireAppels, resserrerBaseline } from './lib/apiContract.mjs'

const RACINE = process.cwd()
const SOURCES = path.join(RACINE, 'src')
const ENDPOINTS = path.join(SOURCES, 'services', 'endpoints.js')
const BASELINE = path.join(RACINE, '.api-contract-baseline.json')

class GardeImpuissante extends Error {}

function option(nom) {
  const i = process.argv.indexOf(nom)
  return i >= 0 ? process.argv[i + 1] : null
}

function lireJsonOuYaml(fichier, quoi) {
  if (!fichier || !existsSync(fichier)) throw new GardeImpuissante(`${quoi} introuvable : ${fichier ?? '(option absente)'}`)
  try {
    return fichier.endsWith('.json') ? JSON.parse(readFileSync(fichier, 'utf8')) : yaml.load(readFileSync(fichier, 'utf8'))
  } catch (e) {
    throw new GardeImpuissante(`${quoi} illisible (${fichier}) : ${e.message}`)
  }
}

async function collecter(dir, acc = []) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name !== '__tests__') await collecter(p, acc)
    } else if (/\.(vue|js)$/.test(e.name) && !/\.(test|spec)\.js$/.test(e.name)) acc.push(p)
  }
  return acc
}

async function charger() {
  const spec = catalogueDepuisSpec(lireJsonOuYaml(option('--spec'), 'Spec OpenAPI'))
  if (spec.length === 0) throw new GardeImpuissante('la spec ne déclare aucune opération')
  const fichierRoutes = option('--routes')
  const routes = fichierRoutes ? catalogueDepuisRoutes(lireJsonOuYaml(fichierRoutes, 'Table de routes')) : null
  if (routes && routes.length === 0) throw new GardeImpuissante('la table de routes ne contient aucune route api/')
  const { endpoints } = await import(pathToFileURL(ENDPOINTS).href)
  const fichiers = await collecter(SOURCES)
  const appels = []
  const irresolus = []
  for (const f of fichiers) {
    const relatif = path.relative(RACINE, f).split(path.sep).join('/')
    const r = extraireAppels(relatif, await readFile(f, 'utf8'), endpoints)
    appels.push(...r.appels)
    irresolus.push(...r.irresolus)
  }
  if (appels.length === 0) throw new GardeImpuissante(`aucun appel HTTP trouvé dans ${fichiers.length} fichier(s)`)
  return { spec, routes, fichiers, appels, irresolus }
}

function lister(titre, sites, explication) {
  if (sites.length === 0) return
  console.error(`\n${titre}`)
  for (const s of sites) console.error(`  ${s.fichier}:${s.ligne}  ${s.method ? cle(s) : s.raison}`)
  console.error(explication)
}

/** `--update` : retire la dette remboursée, et refuse d'en ajouter. */
async function mettreAJour(c, denominateur) {
  if (c.irresolus.length > 0) {
    lister(`x ${c.irresolus.length} appel(s) illisible(s) : rien n'est figé.`, c.irresolus, '')
    process.exitCode = 1
    return
  }
  const { nonDocumentes } = comparer(c.appels, { spec: c.spec, baseline: [] })
  const actuelle = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : null
  const nouvelle = resserrerBaseline(actuelle, nonDocumentes)
  await writeFile(BASELINE, `${JSON.stringify(nouvelle, null, 2)}\n`)
  console.log(`OK Baseline : ${nouvelle.length} couple(s) en dette (${denominateur}).`)

  const refuses = nonDocumentes.filter((k) => !nouvelle.includes(k))
  if (refuses.length === 0) return
  console.error(`\nx ${refuses.length} appel(s) neuf(s) refusé(s) : la dette ne grandit pas.`)
  for (const k of refuses) console.error(`  ${k}`)
  console.error("Documente d'abord l'opération dans docs/openapi.yaml côté backend.")
  process.exitCode = 1
}

async function main() {
  let c
  try {
    c = await charger()
  } catch (e) {
    if (!(e instanceof GardeImpuissante)) throw e
    console.error(`x Garde contrat d'API : ${e.message}\nLa garde n'a pas pu travailler — ce n'est PAS un succès.`)
    process.exitCode = 2
    return
  }

  const denominateur =
    `${c.fichiers.length} fichiers, ${c.appels.length} appels, ` +
    `${new Set(c.appels.map(cle)).size} couples méthode-chemin, ${c.spec.length} opérations dans la spec` +
    (c.routes ? `, ${c.routes.length} opérations servies` : '')

  if (process.argv.includes('--update')) {
    await mettreAJour(c, denominateur)
    return
  }

  if (!existsSync(BASELINE)) {
    console.error(`x ${path.basename(BASELINE)} absent. La garde n'a pas pu travailler.`)
    process.exitCode = 2
    return
  }
  const r = comparer(c.appels, { spec: c.spec, routes: c.routes, baseline: JSON.parse(readFileSync(BASELINE, 'utf8')) })

  lister(`x ${c.irresolus.length} appel(s) que la garde ne sait pas lire :`, c.irresolus,
    "Écris le chemin via endpoints.js, sans détour qu'une lecture statique ne peut pas suivre.")
  lister(`x ${r.horsSpec.length} appel(s) absent(s) de la spec du backend :`, r.horsSpec,
    "Documente l'opération dans docs/openapi.yaml côté backend, ou corrige le chemin ou la méthode.")
  lister(`x ${r.inexistants.length} appel(s) vers une route que le serveur ne sert pas :`, r.inexistants,
    "Aucune baseline ne couvre ce cas : le front appellerait un 404 ou un 405 en production.")

  if (r.obsoletes.length > 0) {
    console.log(`\n${r.obsoletes.length} entrée(s) de dette remboursée(s), à retirer de ${path.basename(BASELINE)} :`)
    for (const o of r.obsoletes) console.log(`  - ${o}`)
  }

  if (c.irresolus.length + r.horsSpec.length + r.inexistants.length > 0) {
    console.error(`\n(${denominateur})`)
    process.exitCode = 1
    return
  }
  console.log(`OK Contrat d'API respecté. (${denominateur}, ${r.nonDocumentes.length} couple(s) en dette nommée.)`)
}

main().catch((e) => {
  console.error(e)
  process.exitCode = 2
})
