/**
 * Parcours fonctionnel du MOT DE PASSE OUBLIÉ (#613) : ce que la relecture exige pour dire VERT. Le motif suit l'école
 * (KLASSCI → `mot_de_passe_klassci` ; autonome, canal fermé en CI → `reinitialisation_indisponible`), l'écran porte le
 * texte du front de ce motif, et aucune promesse d'envoi. `lien_envoye` : limite déclarée, jugé par Vitest seul.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DONNEES_MOT_DE_PASSE, ETAPES_MOT_DE_PASSE, PROMESSE_D_ENVOI, TEXTES_ATTENDUS, jugerDemande, motifAttendu,
} from '../../e2e/parcours-mot-de-passe.mjs'
import { jeuDuParcours } from '../../e2e/klassci-ecole/jeu.mjs'
import { INFORMATIONS, textesDErreur } from '../../e2e/ecran.mjs'
import { ERROR_MESSAGES } from '../../src/constants/errorMessages.js'
import { REASONS } from '../../src/services/refusalReasons.js'
import { messageForReason } from '../../src/services/errorHandler.js'

const ANCIEN = 'Si un compte existe, un courriel a été envoyé.'
const lecture = (reason, ecran, statut = 200) => ({ statut, corps: { success: true, reason, message: 'texte du serveur' }, ecran })

describe('parcours-mot-de-passe — les étapes', () => {
  it('un anonyme demande pour l’adresse d’un compte, puis pour une adresse inconnue (fictive)', () => {
    expect(ETAPES_MOT_DE_PASSE.map((e) => [e.cle, e.compte, e.requiert])).toEqual([
      ['demander', 'anonyme', []],
      ['inconnue', 'anonyme', ['demander']],
    ])
    expect(DONNEES_MOT_DE_PASSE.adresseInconnue).toMatch(/@e2e\.test$/)
  })

  it('le motif attendu suit l’école', () => {
    expect(motifAttendu('klassci')).toBe('mot_de_passe_klassci')
    expect(motifAttendu('lms')).toBe('reinitialisation_indisponible')
    expect(motifAttendu(undefined)).toBe('reinitialisation_indisponible')
  })

  it('les textes attendus SONT ceux du catalogue du front', () => {
    for (const [reason, texte] of Object.entries(TEXTES_ATTENDUS)) expect(messageForReason(reason)).toBe(texte)
  })

  it('l’école KLASSCI du jeu porte le slug que monte e2e/ecole-klassci.php', () => {
    const php = readFileSync(resolve(process.cwd(), 'e2e/ecole-klassci.php'), 'utf8')
    expect(php).toContain(`['slug' => '${jeuDuParcours().slug}']`)
  })
})

describe('parcours-mot-de-passe — la relecture', () => {
  const kl = TEXTES_ATTENDUS.mot_de_passe_klassci
  const lms = TEXTES_ATTENDUS.reinitialisation_indisponible

  it('VERT : le motif de l’école et son texte du front, sans promesse', () => {
    expect(jugerDemande(lecture('mot_de_passe_klassci', `Mot de passe oublié\n${kl}`), 'klassci', 'adresse d’un compte'))
      .toMatchObject({ confirme: true })
    expect(jugerDemande(lecture('reinitialisation_indisponible', lms), 'lms', 'adresse inconnue').preuve)
      .toBe('adresse inconnue : motif reinitialisation_indisponible, son texte du front affiché, aucune promesse d’envoi')
  })

  it('ROUGE : l’ancien texte en dur (« courriel a été envoyé »), même avec le bon motif', () => {
    expect(jugerDemande(lecture('reinitialisation_indisponible', `${ANCIEN}\n${lms}`), 'lms', 'x'))
      .toEqual({ confirme: false, ecart: 'l’écran promet un envoi (« a été envoyé »)' })
    expect(PROMESSE_D_ENVOI.test('Envoyer le lien')).toBe(false)
  })

  it('ROUGE : un autre motif, un motif absent, un statut autre que 200, ou le texte absent', () => {
    expect(jugerDemande(lecture('lien_envoye', lms), 'lms', 'x').ecart).toBe('motif rendu « lien_envoye », « reinitialisation_indisponible » attendu')
    expect(jugerDemande(lecture(undefined, kl), 'klassci', 'x').ecart).toBe('motif rendu « absent », « mot_de_passe_klassci » attendu')
    expect(jugerDemande(lecture('mot_de_passe_klassci', kl, 429), 'klassci', 'x').ecart).toBe('POST /auth/forgot-password rend HTTP 429, 200 attendu')
    expect(jugerDemande(lecture('mot_de_passe_klassci', 'Mot de passe oublié'), 'klassci', 'x').ecart)
      .toBe('l’écran n’affiche pas le texte du motif « mot_de_passe_klassci »')
  })
})

describe('ecran.mjs — les réponses de « Mot de passe oublié » ne sont pas des erreurs (#613)', () => {
  it('les trois motifs (informations du catalogue) et le texte neutre sont hors des textes d’erreur', () => {
    const textes = textesDErreur(ERROR_MESSAGES, REASONS)
    for (const cle of ['motDePasseKlassci', 'reinitialisationIndisponible', 'lienDeReinitialisationEnvoye', 'demandeDeReinitialisationRecue']) {
      expect(typeof ERROR_MESSAGES[cle]).toBe('string')
      expect(textes).not.toContain(ERROR_MESSAGES[cle])
    }
    expect(INFORMATIONS).toContain('demandeDeReinitialisationRecue')
    expect(textes).toContain(ERROR_MESSAGES.notFound)
  })
})
