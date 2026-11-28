#!/usr/bin/env node
/**
 * Garde CI (#754) : aucune clé en double dans les catalogues de messages et de motifs, dans leur composition FINALE
 * (étalements suivis jusqu'à leur module). La logique vit dans `scripts/lib/catalogues.mjs`.
 *
 * Sort en 1 sur un doublon ou sur une composition illisible ; en 0 sinon.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { CATALOGUES, controlerLesCatalogues } from './lib/catalogues.mjs'

const RACINE = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const refus = controlerLesCatalogues((chemin) => readFileSync(resolve(RACINE, chemin), 'utf8'))

if (refus.length) {
  console.error('x Catalogues : une clé en double, ou une composition illisible.')
  for (const r of refus) {
    console.error(r.erreur ? `  ${r.catalogue} : ${r.erreur}` : `  ${r.catalogue} : « ${r.cle} » apparaît ${r.origines.length} fois (${r.origines.join(', ')})`)
  }
  console.error('En JavaScript, la dernière clé gagne en silence : un texte disparaîtrait sans erreur. Gardez UNE clé.')
  process.exit(1)
}

console.log(`OK Aucune clé en double dans ${CATALOGUES.length} catalogue(s), composition finale comprise.`)
