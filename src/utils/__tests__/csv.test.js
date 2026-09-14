import { describe, expect, it } from 'vitest'
import { detectDelimiter, parseFirstRecord } from '../csv'

/**
 * #334 — le client ne réécrit plus le CSV (ADR-718-01) ; il n'en lit que la
 * ligne d'en-tête, pour proposer la cartographie. Cette lecture doit tout de
 * même respecter les guillemets, sinon les colonnes affichées à l'utilisateur
 * ne sont pas celles que le serveur lira.
 */
describe('parseFirstRecord', () => {
  it('rend les champs simples', () => {
    expect(parseFirstRecord('nom;prenom;email', ';')).toEqual(['nom', 'prenom', 'email'])
  })

  it('garde un champ entre guillemets contenant le delimiteur', () => {
    expect(parseFirstRecord('"Ouedraogo; fils";Ali', ';')).toEqual(['Ouedraogo; fils', 'Ali'])
  })

  it('conserve une colonne vide au milieu', () => {
    // Le defaut mesure a l'audit : supprimer le trou decalait toutes les
    // colonnes suivantes d'un cran.
    expect(parseFirstRecord('nom;;prenom', ';')).toEqual(['nom', '', 'prenom'])
  })

  it('restitue un guillemet echappe par doublement', () => {
    expect(parseFirstRecord('a;"b""c";d', ';')).toEqual(['a', 'b"c', 'd'])
  })

  it('ne s arrete pas sur un saut de ligne encapsule', () => {
    expect(parseFirstRecord('nom;"ligne1\nligne2";fin', ';')).toEqual(['nom', 'ligne1\nligne2', 'fin'])
  })

  it('s arrete a la fin du premier enregistrement', () => {
    expect(parseFirstRecord('nom;prenom\nDoe;Jane\nAutre;Ligne', ';')).toEqual(['nom', 'prenom'])
  })

  it('traite CRLF comme une fin d enregistrement', () => {
    expect(parseFirstRecord('nom;prenom\r\nDoe;Jane', ';')).toEqual(['nom', 'prenom'])
  })

  it('ne coupe PAS sur un CR isole, comme le serveur', () => {
    // « CSV Macintosh » d'Excel. PHP 8 ne voit plus un CR seul comme une fin de
    // ligne : le serveur lit donc cinq colonnes ici. Couper au CR afficherait
    // trois colonnes impeccables et ferait valider un fichier dont le serveur
    // n'analysera aucune ligne.
    expect(parseFirstRecord('nom;prenom;email\rAba;Ali;a@b.c', ';'))
      .toEqual(['nom', 'prenom', 'email\rAba', 'Ali', 'a@b.c'])
  })

  it('retire le BOM UTF-8 en tete', () => {
    expect(parseFirstRecord('﻿nom;prenom', ';')).toEqual(['nom', 'prenom'])
  })

  it('coupe les espaces autour des champs', () => {
    expect(parseFirstRecord('  nom ; prenom  ', ';')).toEqual(['nom', 'prenom'])
  })

  it('rend un tableau vide sur une entree vide', () => {
    expect(parseFirstRecord('', ';')).toEqual([])
  })

  it('respecte le delimiteur virgule', () => {
    expect(parseFirstRecord('nom,prenom', ',')).toEqual(['nom', 'prenom'])
  })
})

describe('detectDelimiter', () => {
  it('reconnait le point-virgule', () => {
    expect(detectDelimiter('nom;prenom;email')).toBe(';')
  })

  it('reconnait la virgule', () => {
    expect(detectDelimiter('nom,prenom,email')).toBe(',')
  })

  it('reconnait la tabulation', () => {
    expect(detectDelimiter('nom\tprenom\temail')).toBe('\t')
  })

  it('ignore les delimiteurs situes a l interieur des guillemets', () => {
    // « Rue A, B » ne fait pas de ce fichier un fichier a virgules.
    expect(detectDelimiter('nom;adresse\nDoe;"Rue A, B, C, D"')).toBe(';')
  })

  it('retombe sur le point-virgule quand rien n est detectable', () => {
    expect(detectDelimiter('colonneunique')).toBe(';')
  })

  it('n examine que le premier enregistrement', () => {
    expect(detectDelimiter('nom;prenom\na,b,c,d,e,f')).toBe(';')
  })
})
