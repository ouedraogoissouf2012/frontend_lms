// @vitest-environment node
// (environnement node : jsdom remplace `URL`, et fileURLToPath échoue sous lui.)
/**
 * Une icône s'affiche comme une icône, jamais comme le nom de sa classe.
 *
 * Constat E2E (10/11/2026) : le tableau de bord générique (/dashboard) affichait « fa-book »,
 * « fa-check-circle » et « fa-bar-chart » en toutes lettres dans ses cartes. La barre d'outils de
 * l'éditeur de leçon écrivait « fa-bars » et « fa-play » dans ses boutons. FontAwesome 4.7 est
 * chargé (`src/main.js`) : ces noms étaient du TEXTE au lieu d'une balise.
 *
 * Revue indépendante : la première garde ne voyait que le nom SEUL. Il restait « fa-check Bonne
 * réponse » sur les résultats d'évaluation de l'élève, « fa-user » sur les séances d'une matière,
 * et des toasts « fa-check Leçon publiée… ». La garde lit désormais tout le texte d'un gabarit et
 * les chaînes du script qui COMMENCENT par un nom d'icône.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect } from 'vitest'

const racine = fileURLToPath(new URL('../../src', import.meta.url))
const sources = (dossier) => readdirSync(dossier).flatMap((n) => {
  const p = join(dossier, n)
  return statSync(p).isDirectory() ? sources(p) : /\.(js|vue)$/.test(n) ? [p] : []
})

/** Le TEXTE d'un gabarit : sans commentaires ni balises (un nom de classe dans `class` est légitime). */
const texteDuGabarit = (source) => (source.match(/<template>([\s\S]*)<\/template>/)?.[1] ?? '')
  .replace(/<!--[\s\S]*?-->/g, '')
  .replace(/<[^>]+>/g, ' ')
/** Le code d'un fichier : le script d'un composant, ou le module entier. */
const code = (source, fichier) => (fichier.endsWith('.vue') ? (source.match(/<script[^>]*>([\s\S]*?)<\/script>/)?.[1] ?? '') : source)

const NOM_DANS_LE_TEXTE = /\bfa-[a-z0-9]+(?:-[a-z0-9]+)*\b/
// Une chaîne qui commence par un nom d'icône, suivi d'un blanc ou du sélecteur d'emoji (U+FE0F).
const CHAINE_QUI_COMMENCE_PAR_UNE_ICONE = /['"`]fa-[a-z0-9]+(?:-[a-z0-9]+)*(?:[^\S\n]|️)/

/** Les lignes fautives d'un fichier (les journaux `console.*` ne s'affichent pas : ignorés). */
function fautes(source, fichier) {
  const gabarit = fichier.endsWith('.vue') ? texteDuGabarit(source).split('\n').filter((l) => NOM_DANS_LE_TEXTE.test(l)) : []
  const script = code(source, fichier).split('\n').filter((l) => CHAINE_QUI_COMMENCE_PAR_UNE_ICONE.test(l) && !/console\./.test(l))
  return [...gabarit, ...script]
}

describe('aucune icône n’est écrite par le nom de sa classe', () => {
  it('aucun fichier de src/ n’affiche « fa-… » en texte', () => {
    const fautifs = sources(racine)
      .filter((f) => fautes(readFileSync(f, 'utf8'), f).length > 0)
      .map((f) => relative(racine, f).split(sep).join('/'))
      .sort()
    expect(fautifs).toEqual([])
  })

  it('la garde voit bien le défaut, et seulement lui (témoins)', () => {
    const vue = (gabarit, script = '') => `<template>${gabarit}</template><script setup>${script}</script>`
    expect(fautes(vue('<div>\n  fa-book\n</div>'), 'a.vue')).toHaveLength(1)
    expect(fautes(vue('<span>fa-check Bonne réponse</span>'), 'a.vue')).toHaveLength(1)
    expect(fautes(vue("<p>{{ ok ? 'fa-check Correct' : 'Faux' }}</p>"), 'a.vue')).toHaveLength(1)
    expect(fautes("notifier('fa-check Leçon publiée')", 'a.js')).toHaveLength(1)
    expect(fautes(`notifier('fa-exclamation-triangle${String.fromCharCode(0xfe0f)} Le titre')`, 'a.js')).toHaveLength(1)
    // Légitimes : la classe d'une balise, un nom d'icône passé en donnée, un journal.
    expect(fautes(vue('<i class="fa fa-book" aria-hidden="true"></i>'), 'a.vue')).toHaveLength(0)
    expect(fautes("const icone = 'fa-book'", 'a.js')).toHaveLength(0)
    expect(fautes("console.log('fa-check visio démarrée')", 'a.js')).toHaveLength(0)
  })
})
