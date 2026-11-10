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

  // Cliquet : les sites hors visio connus le 09/11/2026, à corriger dans une PR à part. Un site
  // nouveau fait rougir ; un site corrigé mais encore listé aussi (la liste doit rétrécir).
  const CONNUS = [
    'composables/useAdminMatieres.js',
    'composables/useAdminSeances.js',
    'composables/useParticipantsModal.js',
    'composables/useStudentEvaluationsList.js',
  ]

  // Les quatre façons de porter le texte du serveur à l'écran : une erreur fabriquée (y compris
  // par userError, qui le blanchirait en message « du front »), un toast, un `userMessage` affecté.
  const SOURCE = String.raw`(?:result|response|res|data)\??\.(?:data\??\.)?message`
  const TEXTE_SERVEUR = new RegExp(
    String.raw`(?:new Error|userError)\(\s*${SOURCE}|toast\.[a-z]+\(\s*${SOURCE}|userMessage\s*=\s*${SOURCE}`,
  )

  it('aucun NOUVEAU site ne porte le texte du serveur à l’écran dans src/ (cliquet)', () => {
    const fautifs = fichiers(racine)
      .filter((f) => TEXTE_SERVEUR.test(readFileSync(f, 'utf8')))
      .map((f) => relative(racine, f).split(sep).join('/'))
      .sort()
    expect(fautifs).toEqual(CONNUS)
  })
})
