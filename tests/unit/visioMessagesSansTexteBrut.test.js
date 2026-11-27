// @vitest-environment node
// (environnement node : jsdom remplace `URL`, et fileURLToPath échoue sous lui.)
/**
 * Un refus de visio dit son SENS, jamais le TEXTE du serveur ni la clé du fournisseur (D0).
 *
 * Critère validé : le sens passe par le `reason`, à travers le catalogue du front ; sans
 * `reason` connu, le repli rédigé par l'appelant. Jamais `response.data.message`, jamais
 * `result.message`, jamais le message brut d'une erreur venue d'ailleurs (`service_unavailable`).
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn(), info: vi.fn(), warning: vi.fn() }))
vi.mock('@/composables/useToast', () => ({ toast }))
vi.mock('@/services/confirmDialog', () => ({ confirmDialog: vi.fn() }))

import { notifyVisioError } from '@/services/visioFeedback'
import { normalizeError, messageForReason } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { userError } from '@/utils/userError'

const REPLI = 'Erreur lors du démarrage de la visio'
const affiche = () => toast.error.mock.calls.at(-1)[0]

beforeEach(() => { toast.error.mockReset() })

describe('visioFeedback — le toast ne montre jamais un texte venu d’ailleurs', () => {
  it('le texte du serveur n’est jamais affiché : la catégorie du statut le remplace', () => {
    const erreur = Object.assign(new Error('Request failed with status code 500'), {
      response: { status: 500, data: { success: false, message: 'Texte serveur détaillé' } },
    })
    notifyVisioError(erreur, REPLI)
    expect(affiche()).not.toContain('Texte serveur')
    expect(affiche()).toBe(normalizeError(erreur).userMessage)
  })

  it('une clé du fournisseur de visio n’est jamais affichée : le repli de l’appelant', () => {
    notifyVisioError(new Error('service_unavailable'), REPLI)
    expect(affiche()).toBe(REPLI)
  })

  it('le message déjà calculé par l’intercepteur est gardé', () => {
    notifyVisioError(Object.assign(new Error('x'), { userMessage: ERROR_MESSAGES.visioNotEnrolled }), REPLI)
    expect(affiche()).toBe(ERROR_MESSAGES.visioNotEnrolled)
  })

  it('un message RÉDIGÉ PAR LE FRONT pour l’utilisateur reste affiché (userError)', () => {
    notifyVisioError(userError('Identifiant de salle visio introuvable.'), REPLI)
    expect(affiche()).toBe('Identifiant de salle visio introuvable.')
  })

  it('sans erreur, le repli', () => {
    notifyVisioError(null, REPLI)
    expect(affiche()).toBe(REPLI)
  })
})

describe('les deux motifs du serveur qui disent d’attendre ou de renoncer (VisioStatusRefusal)', () => {
  const refus = (reason) => normalizeError(Object.assign(new Error('HTTP 403'), { response: { status: 403, data: { success: false, message: 'x', reason } } }))

  it('visio_not_started : attendre', () => {
    expect(ERROR_MESSAGES.visioNotStarted).toBe("La visioconférence n'a pas encore commencé. Attendez que l'enseignant la démarre.")
    expect(refus('visio_not_started').userMessage).toBe(ERROR_MESSAGES.visioNotStarted)
  })

  it('visio_ended : renoncer', () => {
    expect(ERROR_MESSAGES.visioEnded).toBe('La visioconférence est terminée.')
    expect(refus('visio_ended').userMessage).toBe(ERROR_MESSAGES.visioEnded)
  })
})

describe('messageForReason — un `reason` connu donne le catalogue, sinon rien', () => {
  it('traduit un motif connu', () => {
    expect(messageForReason('visio_ended')).toBe(ERROR_MESSAGES.visioEnded)
    expect(messageForReason('not_enrolled')).toBe(ERROR_MESSAGES.visioNotEnrolled)
  })

  it('rien pour un motif inconnu, absent, ou une clé du prototype', () => {
    for (const motif of ['motif-inconnu', undefined, null, '', 'toString', '__proto__', 'constructor']) {
      expect(messageForReason(motif)).toBeNull()
    }
  })
})

describe('garde : aucun appelant ne fabrique une erreur avec le texte du serveur', () => {
  const racine = fileURLToPath(new URL('../../src', import.meta.url))
  const fichiers = (dossier) => readdirSync(dossier).flatMap((n) => {
    const p = join(dossier, n)
    return statSync(p).isDirectory() ? fichiers(p) : /\.(js|vue)$/.test(n) ? [p] : []
  })

  // Garde STRICTE (D477, 14/11/2026) : aucun fichier de `src` ne porte le texte du serveur à l'écran.
  // Le cliquet ouvert le 09/11 (17 puis 8 puis 3 fichiers gelés) est fermé : les erreurs passent par
  // `displayMessage` ou le `reason` du catalogue, les succès disent les textes du front, et la connexion
  // a sa règle propre (`messageConnexion`).

  // Le texte d'une réponse (`response.message`, `response.data.message`) ou le message d'une erreur
  // (`err.message`), et toutes les façons de le porter à l'écran.
  const SRC = String.raw`(?:result|response|res|data)\??\.(?:data\??\.)?message`
  const ERR = String.raw`\b(?:err|error|e|erreur)\??\.message\b`
  const TXT = `(?:${SRC}|${ERR})`
  const MOTIFS = [
    String.raw`(?:new Error|userError)\(\s*${SRC}`,
    String.raw`toast\.[a-z]+\([^)\n]*${TXT}`,
    String.raw`userMessage\s*(?:=(?!=)|:)\s*[^;\n]*${TXT}`,
    String.raw`\b\w+\??\.response\??\.data\??\.message`,
    String.raw`\+\s*\(?\s*${TXT}`,
    String.raw`\$\{\s*${TXT}`,
    String.raw`\.value\s*=(?!=)\s*[^;\n]*${TXT}`,
  ].map((m) => new RegExp(m))
  // Un commentaire DÉCRIT un site, il n'en est pas un. Retrait LIGNE PAR LIGNE (lignes qui
  // commencent par //, *, /*, <!--) : un « /* » au milieu d'une chaîne (`'image/*'`) ne doit
  // jamais ouvrir un bloc qui effacerait du vrai code.
  function sansCommentaires(texte) {
    let bloc = false
    return texte.split('\n').filter((ligne) => {
      const t = ligne.trim()
      if (bloc) { if (t.includes('*/') || t.includes('-->')) bloc = false; return false }
      if (t.startsWith('/*')) { if (!t.includes('*/')) bloc = true; return false }
      if (t.startsWith('<!--')) { if (!t.includes('-->')) bloc = true; return false }
      return !(t.startsWith('//') || t.startsWith('*'))
    }).join('\n')
  }

  // #1739 (déclaré) : UNE exception NOMMÉE et COMPTÉE. Le refus de compte de l'école
  // (`klassci_account_refused`) dit le message de KLASSCI, que le serveur a nettoyé (texte seul,
  // 300 caractères au plus) ; l'écran le rend en texte. Un site de plus dans ce fichier rougit.
  const EXCEPTIONS = Object.freeze({ 'utils/messageConnexion.js': 1 })
  const sites = (texte) => texte.split('\n').filter((ligne) => MOTIFS.some((re) => re.test(ligne))).length
  const relatif = (f) => relative(racine, f).split(sep).join('/')

  it('aucun site ne porte le texte du serveur à l’écran dans src/ (garde stricte)', () => {
    const fautifs = fichiers(racine)
      .filter((f) => {
        const t = sansCommentaires(readFileSync(f, 'utf8'))
        const permis = EXCEPTIONS[relatif(f)] ?? 0
        // Hors exception, la garde reste celle du texte ENTIER (un site peut tenir sur deux lignes).
        return permis === 0 ? MOTIFS.some((re) => re.test(t)) : sites(t) > permis
      })
      .map(relatif)
      .sort()
    expect(fautifs).toEqual([])
  })

  it('chaque exception nommée sert exactement (#1739) : ni morte, ni élargie', () => {
    for (const [fichier, permis] of Object.entries(EXCEPTIONS)) {
      expect(sites(sansCommentaires(readFileSync(join(racine, fichier), 'utf8'))), fichier).toBe(permis)
    }
  })
})
