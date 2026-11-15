/**
 * Outil E2E (D616) : un écran qui AFFICHE un texte d'erreur du catalogue du front est ROUGE, avec ce texte.
 *
 * Le faux vert découvert par K4 (run 43710154628) : `/seances/:id` affichait « La ressource demandée est
 * introuvable. » (ERROR_MESSAGES.notFound) dans un bandeau sans `role="alert"`, après un 404 ; le parcours ne
 * connaissait que les textes de chargement (ECRAN_ERREUR) et les 5xx, et l'a compté VERT. Les textes d'erreur sont
 * ceux du CATALOGUE (une seule source), sauf les états vides légitimes (REASONS `etatVide`) et les informations.
 * Un appel 4xx d'un écran jugé est noté dans sa case.
 */
import { describe, it, expect } from 'vitest'
import { ERROR_MESSAGES } from '../../src/constants/errorMessages.js'
import { REASONS } from '../../src/services/refusalReasons.js'
import { textesDErreur, erreurAffichee, appels4xx } from '../../e2e/ecran.mjs'

const TEXTES = textesDErreur(ERROR_MESSAGES, REASONS)

describe('ecran.mjs — les erreurs du catalogue (D616)', () => {
  it('les textes d’erreur viennent du catalogue : `notFound` en est', () => {
    expect(TEXTES).toContain(ERROR_MESSAGES.notFound)
    expect(TEXTES).toContain(ERROR_MESSAGES.forbidden)
  })

  it('un état vide légitime et une information n’en sont pas', () => {
    expect(TEXTES).not.toContain(ERROR_MESSAGES.eleveSansClasseActive)
    expect(TEXTES).not.toContain(ERROR_MESSAGES.listeActualisee)
  })

  it('un écran qui affiche « La ressource demandée est introuvable. » est reconnu (le faux vert de K4)', () => {
    expect(erreurAffichee('Séances\nLa ressource demandée est introuvable.\n', TEXTES)).toBe(ERROR_MESSAGES.notFound)
  })

  it('un écran sans texte d’erreur ne l’est pas', () => {
    expect(erreurAffichee('Classe K1 E2E\nÉtudiants 3\nMatières 2', TEXTES)).toBeNull()
  })

  it('seuls les appels 4xx sont notés', () => {
    const api = [{ statut: 200, chemin: '/api/a' }, { statut: 404, chemin: '/api/b' }, { statut: 403, chemin: '/api/c' }, { statut: 500, chemin: '/api/d' }]
    expect(appels4xx(api)).toEqual(['404 /api/b', '403 /api/c'])
  })
})
