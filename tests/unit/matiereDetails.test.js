/**
 * Tests de la logique pure des détails de matière (#28 — MatiereDetails.vue).
 */
import { describe, it, expect } from 'vitest'
import {
  calculateSeanceDuration,
  getSeanceStatusClass,
  getSeanceStatusLabel,
  getEvaluationStatusClass,
  getEvaluationStatusLabel,
  createEmptyLesson,
  buildLessonPayload,
  resolveEvaluationRoute
} from '@/utils/matiereDetails'

describe('utils/matiereDetails — calculateSeanceDuration', () => {
  it('calcule la durée en minutes', () => {
    expect(calculateSeanceDuration({
      programmation: { heure_debut: '2026-06-18T10:00:00', heure_fin: '2026-06-18T11:30:00' }
    })).toBe(90)
  })
  it('0 si données manquantes ou invalides', () => {
    expect(calculateSeanceDuration({})).toBe(0)
    expect(calculateSeanceDuration({ programmation: { heure_debut: 'x', heure_fin: 'y' } })).toBe(0)
  })
})

describe('utils/matiereDetails — statut séance', () => {
  const dateOnly = (d) => d.toISOString().split('T')[0]
  it('à venir si dans le futur', () => {
    const tomorrow = dateOnly(new Date(Date.now() + 86400000))
    const s = { date_seance: tomorrow, heure_debut: '10:00', heure_fin: '11:00' }
    expect(getSeanceStatusLabel(s)).toBe('À venir')
    expect(getSeanceStatusClass(s)).toContain('orange')
  })
  it('terminé si passé et réalisé', () => {
    const yesterday = dateOnly(new Date(Date.now() - 86400000))
    const s = { date_seance: yesterday, heure_debut: '10:00', heure_fin: '11:00', statut: 'realise' }
    expect(getSeanceStatusLabel(s)).toBe('Terminé')
  })
  it('passé sinon', () => {
    const yesterday = dateOnly(new Date(Date.now() - 86400000))
    const s = { date_seance: yesterday, heure_debut: '10:00', heure_fin: '11:00' }
    expect(getSeanceStatusLabel(s)).toBe('Passé')
  })
})

describe('utils/matiereDetails — statut évaluation', () => {
  it('pas encore ouverte', () => {
    expect(getEvaluationStatusLabel({ has_started: false })).toBe('Pas encore ouverte')
    expect(getEvaluationStatusClass({ has_started: false })).toContain('orange')
  })
  it('ouverte', () => {
    expect(getEvaluationStatusLabel({ has_started: true, is_open: true })).toBe('Ouverte')
    expect(getEvaluationStatusClass({ has_started: true, is_open: true })).toContain('green')
  })
  it('fermée', () => {
    expect(getEvaluationStatusLabel({ has_started: true, is_open: false })).toBe('Fermée')
    expect(getEvaluationStatusClass({ has_started: true, is_open: false })).toContain('gray')
  })
})

describe('utils/matiereDetails — createEmptyLesson', () => {
  it('renvoie un brouillon vierge avec les valeurs par défaut', () => {
    expect(createEmptyLesson()).toEqual({
      title: '',
      description: '',
      prerequis: '',
      niveau_difficulte: 'debutant',
      objectifs_pedagogiques: '',
      duree_estimee_minutes: null
    })
  })
  it('renvoie une nouvelle instance à chaque appel (pas de référence partagée)', () => {
    const a = createEmptyLesson()
    const b = createEmptyLesson()
    expect(a).not.toBe(b)
    a.title = 'modifié'
    expect(b.title).toBe('')
  })
})

describe('utils/matiereDetails — buildLessonPayload', () => {
  const draft = { title: 'Algèbre', description: 'Intro', niveau_difficulte: 'debutant' }

  it('enrichit le brouillon avec le contexte matière/enseignant', () => {
    const payload = buildLessonPayload(draft, {
      matiere: { classes: [{ id: 7 }, { id: 9 }] },
      user: { id: 42 },
      matiereId: 3
    })
    expect(payload).toMatchObject({
      title: 'Algèbre',
      description: 'Intro',
      matiere_id: 3,
      classe_id: 7,            // première classe
      enseignant_id: 42,
      type: 'cours',
      status: 'draft'
    })
  })
  it('classe_id null si la matière n\'a pas de classe', () => {
    expect(buildLessonPayload(draft, { matiere: {}, user: { id: 1 }, matiereId: 3 }).classe_id).toBeNull()
    expect(buildLessonPayload(draft, { matiere: null, user: null, matiereId: 3 }).classe_id).toBeNull()
  })
})

describe('utils/matiereDetails — resolveEvaluationRoute', () => {
  it('étudiant sans soumission → TakeEvaluation', () => {
    const ev = { online_version: { id: 100 } }
    expect(resolveEvaluationRoute(ev, { role: 'etudiant', matiereId: 3 }))
      .toEqual({ route: { name: 'TakeEvaluation', params: { id: 100 } } })
  })
  it('étudiant avec soumission → EvaluationResults', () => {
    const ev = { has_online: true, lms_id: 55, student_submission: { id: 1 } }
    expect(resolveEvaluationRoute(ev, { role: 'etudiant', matiereId: 3 }))
      .toEqual({ route: { name: 'EvaluationResults', params: { id: 55 } } })
  })
  it('coordinateur → CoordinatorPreviewEvaluation', () => {
    expect(resolveEvaluationRoute({ online_version: { id: 8 } }, { role: 'coordinateur', matiereId: 3 }))
      .toEqual({ route: { name: 'CoordinatorPreviewEvaluation', params: { id: 8 } } })
  })
  it('enseignant avec version en ligne → PreviewEvaluation', () => {
    expect(resolveEvaluationRoute({ online_version: { id: 8 } }, { role: 'enseignant', matiereId: 3 }))
      .toEqual({ route: { name: 'PreviewEvaluation', params: { id: 8 } } })
  })
  it('enseignant sans version en ligne → CreateQuestions (avec contexte)', () => {
    const ev = { id: 12, titre: 'Devoir 1' }
    expect(resolveEvaluationRoute(ev, { role: 'teacher', matiereId: 3 })).toEqual({
      route: {
        name: 'CreateQuestions',
        query: { klassci_evaluation_id: 12, klassci_matiere_id: 3, titre: 'Devoir 1' }
      }
    })
  })
  it('rôle non habilité sans version en ligne → notification info', () => {
    expect(resolveEvaluationRoute({ id: 1 }, { role: 'etudiant', matiereId: 3 }))
      .toEqual({ notify: { message: 'Cette évaluation n\'a pas encore de version en ligne', level: 'info' } })
  })
})
