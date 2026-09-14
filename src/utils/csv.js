/**
 * Lecture CSV minimale, côté client (#334, ADR-718-01).
 *
 * Le client ne réécrit plus jamais un CSV : il envoie le fichier tel quel et le
 * serveur l'analyse avec League\Csv. Ce module ne sert donc qu'à UNE chose —
 * lire la ligne d'en-tête pour proposer la cartographie. Il respecte malgré
 * tout les guillemets : les colonnes montrées à l'utilisateur doivent être
 * exactement celles que le serveur lira, sinon la cartographie ne veut rien
 * dire.
 *
 * Volontairement limité au premier enregistrement : rien ici n'a besoin de
 * parcourir un fichier de 5 Mo, et aucune valeur n'est jamais ré-émise.
 */

const DELIMITERS = [';', ',', '\t']
const BOM = '﻿'

/**
 * Vocabulaire transmis au serveur pour désigner le séparateur.
 *
 * On envoie un NOM et non le caractère : Laravel élague les blancs de toute
 * valeur d'entrée, si bien qu'une tabulation arrivait vide et faisait refuser
 * la requête — donc tout fichier tabulé. Mesuré : la requête repartait en 302
 * (échec de validation). Un nom traverse n'importe quel transport.
 */
export const DELIMITER_NAMES = { ';': 'semicolon', ',': 'comma', '\t': 'tab' }

/** Le BOM n'est pas une donnée : sans ça, le premier en-tête ne matche rien. */
function stripBom(text) {
  return text.startsWith(BOM) ? text.slice(BOM.length) : text
}

/**
 * Champs du premier enregistrement CSV, guillemets respectés.
 *
 * Les colonnes vides sont CONSERVÉES : les supprimer décalerait la lecture de
 * toutes les colonnes suivantes.
 *
 * @param {string} text - Contenu (au moins le début) du fichier.
 * @param {string} [delimiter=';'] - Séparateur de colonnes.
 * @returns {string[]} Champs, espaces de bord retirés.
 */
export function parseFirstRecord(text, delimiter = ';') {
  const source = stripBom(String(text ?? ''))
  if (source === '') return []

  const fields = []
  let field = ''
  let quoted = false
  let atFieldStart = true

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]

    if (quoted) {
      if (char !== '"') {
        field += char
      } else if (source[index + 1] === '"') {
        field += '"'
        index += 1
      } else {
        quoted = false
      }
      continue
    }

    if (char === '"' && atFieldStart) {
      quoted = true
      atFieldStart = false
      continue
    }
    if (char === delimiter) {
      fields.push(field)
      field = ''
      atFieldStart = true
      continue
    }
    // Fin du premier enregistrement : un saut de ligne hors guillemets.
    // SEUL « \n » termine. Un CR isolé — le « CSV Macintosh » que propose encore
    // Excel — n'est plus une fin de ligne pour PHP 8, donc pas davantage pour le
    // serveur : le traiter comme telle ici afficherait trois colonnes propres là
    // où le serveur en lit sept et n'analyse aucune ligne. Mieux vaut montrer la
    // même chose que lui, fût-elle laide, que de mentir sur le contenu.
    if (char === '\n') break

    field += char
    if (char !== ' ') atFieldStart = false
  }

  fields.push(field)

  return fields.map((value) => value.trim())
}

/**
 * Séparateur le plus probable, d'après le seul premier enregistrement.
 *
 * Ne compte que les occurrences HORS guillemets : une adresse « Rue A, B, C »
 * ne fait pas d'un fichier à points-virgules un fichier à virgules.
 *
 * Le serveur reste l'autorité — il reçoit ce choix et lit le fichier avec
 * (cf. ADR-718-01), ce qui garantit qu'il découpe comme l'utilisateur a vu.
 *
 * @param {string} text - Contenu (au moins le début) du fichier.
 * @returns {string} `;`, `,` ou une tabulation ; `;` si rien n'est détectable.
 */
export function detectDelimiter(text) {
  const source = stripBom(String(text ?? ''))
  const counts = new Map(DELIMITERS.map((delimiter) => [delimiter, 0]))
  let quoted = false
  let atFieldStart = true

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]

    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') index += 1
        else quoted = false
      }
      continue
    }

    if (char === '"' && atFieldStart) {
      quoted = true
      atFieldStart = false
      continue
    }
    // Même règle que `parseFirstRecord` : un CR isolé n'arrête pas
    // l'enregistrement, sous peine de compter les séparateurs d'une portion de
    // fichier différente de celle que le serveur lira.
    if (char === '\n') break

    if (counts.has(char)) {
      counts.set(char, counts.get(char) + 1)
      atFieldStart = true
      continue
    }
    if (char !== ' ') atFieldStart = false
  }

  let best = ';'
  let bestCount = 0
  for (const delimiter of DELIMITERS) {
    if (counts.get(delimiter) > bestCount) {
      best = delimiter
      bestCount = counts.get(delimiter)
    }
  }

  return best
}
