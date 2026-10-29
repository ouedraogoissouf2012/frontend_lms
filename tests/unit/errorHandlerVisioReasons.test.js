/**
 * #429 : les refus d'entrée en visio (POST /lms/seances/{id}/join) portent un `reason` que
 * le front ne montrait presque jamais. Chaque motif devient une catégorie du catalogue
 * unique (errorHandler), et chaque message est écrit d'après la CONDITION serveur
 * (ParticipantValidationService), avec un recours qui change vraiment quelque chose.
 */
import { describe, it, expect } from 'vitest'
import { normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const refus = (status, reason) => ({ response: { status, data: { success: false, message: 'texte serveur', reason } } })

describe('#429 — motifs de refus de la visio', () => {
  it.each([
    [403, 'not_enrolled', 'visioNotEnrolled'],
    [403, 'no_classe_id', 'visioNoClasse'],
    [403, 'visio_not_enabled', 'visioNotEnabled'],
    [403, 'teacher_not_owner', 'visioTeacherNotOwner'],
    [403, 'actor_not_authorized', 'visioRoleRefused'],
    [403, 'invalid_role', 'visioRoleRefused'],
    [403, 'tenant_not_resolved', 'visioNoInstitution'],
  ])('%i %s → catégorie %s, message du catalogue, jamais le texte serveur', (status, reason, categorie) => {
    const r = normalizeError(refus(status, reason))
    expect(r.category).toBe(categorie)
    expect(r.userMessage).toBe(ERROR_MESSAGES[categorie])
    expect(r.userMessage).not.toContain('texte serveur')
  })

  // Le SENS, pas seulement la clé (leçons B1 de #447 et de #806).
  it('not_enrolled : l’élève n’est pas parmi les élèves ACTIFS ; recours : l’établissement', () => {
    const m = ERROR_MESSAGES.visioNotEnrolled
    expect(m).toMatch(/établissement/)
    expect(m).not.toMatch(/formateur|reconnect/i)
  })

  it('no_classe_id : la séance n’a pas de classe ; recours : l’établissement, pas le formateur', () => {
    const m = ERROR_MESSAGES.visioNoClasse
    expect(m).toMatch(/classe/)
    expect(m).toMatch(/établissement/)
    expect(m).not.toMatch(/formateur/)
  })

  it('tenant_not_resolved : le COMPTE n’est rattaché à aucun établissement ; se reconnecter n’y change rien', () => {
    const m = ERROR_MESSAGES.visioNoInstitution
    expect(m).toMatch(/aucun établissement/)
    expect(m).toMatch(/administration/)
    expect(m).not.toMatch(/reconnect/i)
  })

  it('chaque message de motif est distinct et non vide', () => {
    const cles = ['visioNotEnrolled', 'visioNoClasse', 'visioNotEnabled', 'visioTeacherNotOwner', 'visioRoleRefused', 'visioNoInstitution']
    const textes = cles.map((c) => ERROR_MESSAGES[c])
    textes.forEach((t) => expect(typeof t === 'string' && t.length > 10).toBe(true))
    expect(new Set(textes).size).toBe(cles.length)
  })

  it('un 400 de join (visio non active) n’a pas de motif : aucune catégorie visio n’est inventée', () => {
    // Le 400 n'est pas traduit par statut (repli « unknown ») ; StudentSchedule le traite à part.
    const r = normalizeError({ response: { status: 400, data: { success: false, message: "La visio n'est pas active" } } })
    expect(r.category).not.toMatch(/^visio/)
    expect(r.userMessage).not.toContain("La visio n'est pas active")
  })
})
