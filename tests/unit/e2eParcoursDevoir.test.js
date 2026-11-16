/**
 * Parcours fonctionnel du DEVOIR (PR 3) : ce que chaque relecture exige pour dire VERT, et l'ordre des étapes.
 * La note de l'élève est jugée selon `show_results` seul (`notes_published` n'est jamais lu, lms_backend#902). La
 * synchronisation est relue au journal du faux, VALEUR de la note comprise. Le verrou (#569) est VERT si le refus
 * est DIT. Le titre (#568) et l'éditeur après « Créer version en ligne » (#570) sont des ROUGE nommés.
 */
import { describe, it, expect } from 'vitest'
import {
  ETAPES_DEVOIR, donneesDevoir, AUCUN_CHEMIN_TITRE, PAS_D_EDITEUR, PROGRAMMATION_MASQUEE, jugerVisibilite,
  jugerEvaluation, jugerCopieRemise, jugerCorrection, jugerNoteEleve, jugerSynchronisation, jugerVerrou, jugerSuppressionEvaluation,
} from '../../e2e/parcours-devoir.mjs'

const lecture = (statut, data) => ({ statut, corps: data === undefined ? null : { success: statut < 400, data } })
const A = donneesDevoir({ ecole: 'lms' }).a

describe('parcours-devoir — les étapes et ce qu’elles requièrent', () => {
  it('l’évaluation A (créer → corriger → note → synchro → verrou), puis B (créer, modifier, titre, supprimer)', () => {
    expect(ETAPES_DEVOIR.map((e) => [e.cle, e.compte, e.requiert])).toEqual([
      ['creer', 'enseignant', []],
      ['visible', 'enseignant', ['creer']],
      ['editeur', 'enseignant', ['creer']],
      ['question', 'enseignant', ['creer']],
      ['publier', 'enseignant', ['question']],
      ['passer', 'etudiant', ['publier']],
      ['corriger', 'enseignant', ['passer']],
      ['note', 'etudiant', ['corriger']],
      ['synchroniser', 'enseignant', ['corriger']],
      ['verrou', 'enseignant', ['passer']],
      ['creer_b', 'enseignant', []],
      ['question_b', 'enseignant', ['creer_b']],
      ['modifier_b', 'enseignant', ['question_b']],
      ['titre_b', 'enseignant', ['question_b']],
      ['supprimer_b', 'enseignant', ['creer_b']],
    ])
  })

  it('aucune étape ne requiert « visible », « editeur », « titre_b » ni « verrou » : leurs ROUGE n’arrêtent rien', () => {
    expect(ETAPES_DEVOIR.some((e) => e.requiert.some((r) => ['visible', 'editeur', 'titre_b', 'verrou'].includes(r)))).toBe(false)
  })

  it('dans l’école KLASSCI, les titres sont ceux des programmations servies par le faux', () => {
    const d = donneesDevoir({ ecole: 'klassci', devoirs: { principal: { id: 9602, titre: 'P' }, b: { id: 9603, titre: 'B' } } })
    expect([d.a.titre, d.b.titre]).toEqual(['P', 'B'])
  })

  it('les données ne portent aucun mot d’énumération (lu comme un texte brut)', () => {
    const d = donneesDevoir({ ecole: 'lms' })
    expect(JSON.stringify(d)).not.toMatch(/\b(published|draft|archived|completed|soumis|corrige)\b/i)
  })
})

describe('parcours-devoir — l’évaluation relue', () => {
  it('VERT : titre, publication, question de dissertation, show_results conformes', () => {
    const data = { titre: A.titre, is_published: true, show_results: true, questions: [{ question: A.question, type: 'dissertation' }] }
    expect(jugerEvaluation(lecture(200, data), 5, { titre: A.titre, publiee: true, question: A.question, show_results: true }).confirme).toBe(true)
  })

  it('ROUGE : un type autre que dissertation, une publication absente', () => {
    const data = { titre: A.titre, is_published: false, questions: [{ question: A.question, type: 'qcm' }] }
    const j = jugerEvaluation(lecture(200, data), 5, { publiee: true, question: A.question })
    expect(j.confirme).toBe(false)
    expect(j.ecart).toContain('type relu « qcm »')
    expect(j.ecart).toContain('publication relue false')
  })
})

describe('parcours-devoir — la copie, la correction, la note', () => {
  it('copie remise : statut « soumis »', () => {
    expect(jugerCopieRemise(lecture(200, { status: 'soumis' }), 5).confirme).toBe(true)
    expect(jugerCopieRemise(lecture(200, { status: 'en_cours' }), 5).confirme).toBe(false)
  })

  it('correction : une copie « corrige », 20/20, le commentaire saisi', () => {
    const ok = { evaluation: { submissions: [{ status: 'corrige', note_sur_20: '20.00', feedback: A.commentaire }] } }
    expect(jugerCorrection(lecture(200, ok), 5, A).confirme).toBe(true)
    const pas = { evaluation: { submissions: [{ status: 'soumis' }] } }
    expect(jugerCorrection(lecture(200, pas), 5, A)).toEqual({ confirme: false, ecart: 'aucune copie « corrige » relue (soumis)' })
  })

  it('note de l’élève : l’API ET l’écran (la note telle que rendue, et le commentaire)', () => {
    const lu = lecture(200, { note_sur_20: '20.00' })
    expect(jugerNoteEleve(lu, `Note finale\n20.00/20\n${A.commentaire}`, 5, A).confirme).toBe(true)
    expect(jugerNoteEleve(lu, 'Note finale\n/20', 5, A).confirme).toBe(false)
    expect(jugerNoteEleve(lecture(200, null), 'x', 5, A).confirme).toBe(false)
  })
})

describe('parcours-devoir — la synchronisation relue au journal du faux', () => {
  const envoi = (champs) => ({ methode: 'POST', chemin: '/evaluations/9602/notes', statut: 200, nb_notes: 1, valeurs_notes: [20], ...champs })

  it('VERT : un envoi, HTTP 200, une note de la valeur corrigée', () => {
    expect(jugerSynchronisation([envoi()], 9602, A).confirme).toBe(true)
  })

  it('ROUGE : aucun envoi, une autre valeur, un refus', () => {
    expect(jugerSynchronisation([], 9602, A).confirme).toBe(false)
    expect(jugerSynchronisation([envoi({ valeurs_notes: [0] })], 9602, A)).toEqual({ confirme: false, ecart: 'note envoyée 0, 20 corrigée' })
    expect(jugerSynchronisation([envoi({ statut: 422 })], 9602, A).confirme).toBe(false)
  })
})

describe('parcours-devoir — le verrou (#569), la suppression, les ROUGE nommés', () => {
  it('verrou : VERT si la carte le dit, ou si le refus est dit après l’essai ; ROUGE sinon', () => {
    expect(jugerVerrou({ messageCarte: 'Questions verrouillées : …' }).confirme).toBe(true)
    expect(jugerVerrou({ statut: 403, dit: '« Impossible de modifier »' }).confirme).toBe(true)
    expect(jugerVerrou({ statut: 403, dit: 'aucun message affiché' }).ecart).toContain('Refs #569')
    expect(jugerVerrou({ statut: 200 }).confirme).toBe(false)
  })

  it('suppression : 404 ET absente de la liste', () => {
    expect(jugerSuppressionEvaluation(lecture(404), lecture(200, [{ id: 6 }]), 5).confirme).toBe(true)
    expect(jugerSuppressionEvaluation(lecture(200, {}), lecture(200, []), 5).confirme).toBe(false)
    expect(jugerSuppressionEvaluation(lecture(404), lecture(200, [{ id: 5 }]), 5).confirme).toBe(false)
  })

  it('une programmation ouverte masquée par défaut : ROUGE nommé ; visible : rien à redire', () => {
    expect(jugerVisibilite(true).rouge).toContain(PROGRAMMATION_MASQUEE)
    expect(jugerVisibilite(false)).toEqual({})
  })

  it('les constats nommés', () => {
    expect(AUCUN_CHEMIN_TITRE).toBe('aucun chemin d’interface ne modifie le titre d’une évaluation')
    expect(PAS_D_EDITEUR).toBe('la version en ligne créée ne mène pas à l’éditeur de ses questions')
  })
})
