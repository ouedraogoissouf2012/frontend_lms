import { describe, expect, it } from 'vitest'
import { decodeCsvBytes } from '../decodeText'

const bytes = (...values) => new Uint8Array(values).buffer

/**
 * #334 — ce décodage sert UNIQUEMENT à afficher les colonnes. Le fichier part
 * au serveur octet pour octet (ADR-718-01), donc une erreur ici ne peut plus
 * abîmer la donnée importée ; elle rendrait seulement l'écran illisible.
 */
describe('decodeCsvBytes', () => {
  it('lit de l UTF-8', () => {
    // « Ouédraogo » en UTF-8 : é = C3 A9
    expect(decodeCsvBytes(bytes(0x4f, 0x75, 0xc3, 0xa9, 0x64, 0x72, 0x61, 0x6f, 0x67, 0x6f)))
      .toBe('Ouédraogo')
  })

  it('bascule sur Windows-1252 quand l UTF-8 est invalide', () => {
    // Le cas mesuré à l'audit : Excel francophone écrit é = 0xE9, que le
    // décodeur UTF-8 remplaçait par U+FFFD de façon irréversible.
    expect(decodeCsvBytes(bytes(0x4f, 0x75, 0xe9, 0x64, 0x72, 0x61, 0x6f, 0x67, 0x6f)))
      .toBe('Ouédraogo')
  })

  it('ne fabrique aucun caractere de remplacement sur un export cp1252', () => {
    const texte = decodeCsvBytes(bytes(0x41, 0xef, 0x63, 0x68, 0x61)) // Aïcha

    expect(texte).toBe('Aïcha')
    expect(texte).not.toContain('�')
  })

  it('ne bascule PAS en cp1252 quand seul le dernier caractere est tronque', () => {
    // Cas d'un échantillon coupé à taille fixe : « Oué » dont le « é » (C3 A9)
    // est amputé de son second octet. Sans précaution, l'échec du décodage
    // strict ferait relire TOUT l'échantillon en Windows-1252 — y compris une
    // ligne d'en-tête parfaitement valide située bien avant la coupure.
    const tronque = bytes(0x4f, 0x75, 0xc3)

    expect(decodeCsvBytes(tronque, { partial: true })).toBe('Ou')
  })

  it('signale quand meme un vrai octet invalide au milieu d un echantillon partiel', () => {
    // 0xE9 isolé EN MILIEU de flux n'est pas une troncature : c'est du cp1252.
    expect(decodeCsvBytes(bytes(0x4f, 0x75, 0xe9, 0x64), { partial: true })).toBe('Oué d'.replace(' ', ''))
  })

  it('rend une chaine vide sur une entree vide', () => {
    expect(decodeCsvBytes(new ArrayBuffer(0))).toBe('')
  })

  it('accepte directement un Uint8Array', () => {
    expect(decodeCsvBytes(new Uint8Array([0x61, 0x62]))).toBe('ab')
  })
})
