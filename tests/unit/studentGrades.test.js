/**
 * Tests de la logique métier pure des notes élève (G4 — décomposition de
 * StudentGrades.vue pour ramener son <script> sous 300 lignes).
 *
 * Les assertions encodent le comportement EXACT d'origine (parité stricte).
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  formatType,
  formatDate,
  formatTemps,
  getMoyenneClass,
  getNoteClass,
  getMaxNote,
  getMinNote,
  getTrendIcon,
  getTrendText,
  isNew,
  flattenEvaluations,
  filterAndSortEvaluations,
  computeStatsReussite,
  computeMeilleureNote,
  findMeilleureMatiere
} from '@/utils/studentGrades'

describe('studentGrades — formatType', () => {
  it('mappe les types connus vers leur libellé', () => {
    expect(formatType('devoir')).toBe('Devoir')
    expect(formatType('composition')).toBe('Composition')
    expect(formatType('interrogation')).toBe('Interrogation')
    expect(formatType('examen')).toBe('Examen')
    expect(formatType('tp')).toBe('TP')
    expect(formatType('td')).toBe('TD')
    expect(formatType('qcm')).toBe('QCM')
  })
  it('retourne la valeur brute pour un type inconnu', () => {
    expect(formatType('autre')).toBe('autre')
  })
})

describe('studentGrades — formatDate', () => {
  it('formate JJ/MM/AAAA (fr-FR)', () => {
    expect(formatDate(new Date(2026, 5, 15))).toBe('15/06/2026')
    expect(formatDate(new Date(2026, 0, 5))).toBe('05/01/2026')
  })
  it('repli « - » pour une valeur absente', () => {
    expect(formatDate('')).toBe('-')
    expect(formatDate(null)).toBe('-')
    expect(formatDate(undefined)).toBe('-')
  })
})

describe('studentGrades — formatTemps', () => {
  it('repli « - » pour 0 / null', () => {
    expect(formatTemps(0)).toBe('-')
    expect(formatTemps(null)).toBe('-')
  })
  it('minutes seules sous 60', () => {
    expect(formatTemps(45)).toBe('45 min')
  })
  it('heures pleines', () => {
    expect(formatTemps(60)).toBe('1h')
    expect(formatTemps(120)).toBe('2h')
  })
  it('heures + minutes (format « XhYY » sans espace ni « min »)', () => {
    expect(formatTemps(90)).toBe('1h30')
    expect(formatTemps(125)).toBe('2h5')
  })
})

describe('studentGrades — classes CSS de note', () => {
  it('getMoyenneClass par paliers', () => {
    expect(getMoyenneClass(16)).toBe('note-excellent')
    expect(getMoyenneClass(14)).toBe('note-good')
    expect(getMoyenneClass(12)).toBe('note-average')
    expect(getMoyenneClass(10)).toBe('note-below-average')
    expect(getMoyenneClass(9.99)).toBe('note-fail')
  })
  it('getNoteClass partage les mêmes paliers', () => {
    expect(getNoteClass(16)).toBe('note-excellent')
    expect(getNoteClass(13.5)).toBe('note-average')
    expect(getNoteClass(5)).toBe('note-fail')
  })
})

describe('studentGrades — min/max d\'une matière', () => {
  const matiere = { evaluations: [{ note: '12' }, { note: '8' }, { note: '17' }] }
  it('getMaxNote', () => {
    expect(getMaxNote(matiere)).toBe(17)
  })
  it('getMinNote', () => {
    expect(getMinNote(matiere)).toBe(8)
  })
  it('0 si aucune évaluation', () => {
    expect(getMaxNote({ evaluations: [] })).toBe(0)
    expect(getMinNote({})).toBe(0)
  })
})

describe('studentGrades — tendance', () => {
  const hausse = { evaluations: [
    { note: '8', date_evaluation: '2026-01-01' },
    { note: '14', date_evaluation: '2026-02-01' }
  ] }
  const baisse = { evaluations: [
    { note: '15', date_evaluation: '2026-01-01' },
    { note: '9', date_evaluation: '2026-02-01' }
  ] }
  const stable = { evaluations: [
    { note: '12', date_evaluation: '2026-01-01' },
    { note: '12', date_evaluation: '2026-02-01' }
  ] }
  it('icône selon la pente', () => {
    expect(getTrendIcon(hausse)).toBe('mdi-trending-up')
    expect(getTrendIcon(baisse)).toBe('mdi-trending-down')
    expect(getTrendIcon(stable)).toBe('mdi-arrow-right')
    expect(getTrendIcon({ evaluations: [{ note: '10' }] })).toBe('mdi-arrow-right')
  })
  it('texte selon la pente', () => {
    expect(getTrendText(hausse)).toBe('En hausse')
    expect(getTrendText(baisse)).toBe('En baisse')
    expect(getTrendText(stable)).toBe('Stable')
    expect(getTrendText({ evaluations: [] })).toBe('Stable')
  })
})

describe('studentGrades — isNew (< 48 h depuis la soumission)', () => {
  afterEach(() => vi.useRealTimers())
  it('false sans date de soumission', () => {
    expect(isNew({})).toBe(false)
  })
  it('true si soumis il y a moins de 48 h', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-21T12:00:00'))
    expect(isNew({ date_soumission: '2026-06-20T12:00:00' })).toBe(true)
  })
  it('false si soumis il y a plus de 48 h', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-06-21T12:00:00'))
    expect(isNew({ date_soumission: '2026-06-18T00:00:00' })).toBe(false)
  })
})

describe('studentGrades — flattenEvaluations', () => {
  it('aplatit les évaluations en injectant matiere_nom / matiere_id', () => {
    const matieres = [
      { matiere_id: 1, matiere_nom: 'Maths', evaluations: [{ id: 10, note: '12', titre: 'Devoir 1' }] },
      { matiere_id: 2, matiere_nom: 'Physique', evaluations: [{ id: 20, note: '15', titre: 'TP' }] }
    ]
    const flat = flattenEvaluations(matieres)
    expect(flat).toHaveLength(2)
    expect(flat[0]).toMatchObject({ id: 10, note: '12', matiere_nom: 'Maths', matiere_id: 1 })
    expect(flat[1]).toMatchObject({ id: 20, matiere_nom: 'Physique', matiere_id: 2 })
  })
})

describe('studentGrades — filterAndSortEvaluations', () => {
  const data = [
    { titre: 'Algèbre', matiere_nom: 'Maths', matiere_id: 1, type: 'devoir', note: '8', date_evaluation: '2026-03-01' },
    { titre: 'Optique', matiere_nom: 'Physique', matiere_id: 2, type: 'examen', note: '16', date_evaluation: '2026-01-01' },
    { titre: 'Géométrie', matiere_nom: 'Maths', matiere_id: 1, type: 'examen', note: '12', date_evaluation: '2026-02-01' }
  ]
  const base = { searchQuery: '', filterType: '', filterMatiere: '', sortBy: 'date-desc' }

  it('tri date décroissante par défaut', () => {
    const r = filterAndSortEvaluations(data, base)
    expect(r.map(e => e.date_evaluation)).toEqual(['2026-03-01', '2026-02-01', '2026-01-01'])
  })
  it('tri note croissante', () => {
    const r = filterAndSortEvaluations(data, { ...base, sortBy: 'note-asc' })
    expect(r.map(e => e.note)).toEqual(['8', '12', '16'])
  })
  it('tri par matière (localeCompare)', () => {
    const r = filterAndSortEvaluations(data, { ...base, sortBy: 'matiere' })
    expect(r.map(e => e.matiere_nom)).toEqual(['Maths', 'Maths', 'Physique'])
  })
  it('filtre recherche (titre ou matière, insensible à la casse)', () => {
    expect(filterAndSortEvaluations(data, { ...base, searchQuery: 'optique' })).toHaveLength(1)
    expect(filterAndSortEvaluations(data, { ...base, searchQuery: 'maths' })).toHaveLength(2)
  })
  it('filtre type et filtre matière', () => {
    expect(filterAndSortEvaluations(data, { ...base, filterType: 'examen' })).toHaveLength(2)
    expect(filterAndSortEvaluations(data, { ...base, filterMatiere: 1 })).toHaveLength(2)
  })
  it('ne mute pas le tableau source', () => {
    const copy = [...data]
    filterAndSortEvaluations(data, { ...base, sortBy: 'note-asc' })
    expect(data).toEqual(copy)
  })
})

describe('studentGrades — stats', () => {
  const evals = [{ note: '8' }, { note: '12' }, { note: '16' }, { note: '10' }]
  it('computeStatsReussite (>= 10 réussi)', () => {
    expect(computeStatsReussite(evals)).toEqual({ total: 4, reussies: 3, taux: 75 })
  })
  it('computeStatsReussite tableau vide', () => {
    expect(computeStatsReussite([])).toEqual({ total: 0, reussies: 0, taux: 0 })
  })
  it('computeMeilleureNote', () => {
    expect(computeMeilleureNote(evals)).toBe(16)
    expect(computeMeilleureNote([])).toBe(0)
  })
  it('findMeilleureMatiere', () => {
    const flat = [
      { note: '16', matiere_nom: 'Physique' },
      { note: '12', matiere_nom: 'Maths' }
    ]
    expect(findMeilleureMatiere(flat, 16)).toBe('Physique')
    expect(findMeilleureMatiere(flat, 20)).toBe('')
  })
})
