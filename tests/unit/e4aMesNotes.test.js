/**
 * E4a « Mes notes » (contrat back #1040, C30 et règle A de l'utilisateur) : `show_results` décide.
 * Une évaluation qui cache ses résultats n'apporte AUCUNE note, et une note masquée se lit « — »,
 * jamais 0. `moyenne_generale` vaut l'entier 0 quand il n'y a rien à moyenner : c'est une absence de
 * mesure, pas une moyenne de 0. Une `note` est nullable : `null` se lit « — », pas « null/20 » ni 0.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/services/api', () => ({ default: { get: (...a) => h.get(...a) } }))

import { useStudentGrades } from '@/composables/useStudentGrades'
import {
  getMaxNote, getMinNote, computeMeilleureNote, computeStatsReussite, filterAndSortEvaluations, afficherNote,
} from '@/utils/studentGrades'
import GradesStatsCards from '@/components/student/GradesStatsCards.vue'
import GradesTable from '@/components/student/GradesTable.vue'
import GradesSummary from '@/components/student/GradesSummary.vue'

async function notes(data) {
  h.get.mockResolvedValue({ success: true, data })
  let api
  mount(defineComponent({ setup() { api = useStudentGrades(); return () => null } }))
  await api.fetchGrades()
  await flushPromises()
  return api
}

beforeEach(() => { vi.clearAllMocks() })

describe('useStudentGrades — une moyenne absente n’est jamais 0 (règle A)', () => {
  it('1. rien à moyenner (total_evaluations 0, moyenne_generale 0) → moyenne null', async () => {
    const g = await notes({ matieres: [], moyenne_generale: 0, total_matieres: 0, total_evaluations: 0 })
    expect(g.mesure.value).toBe(true)
    expect(g.moyenneGenerale.value).toBeNull()
  })

  it('2. des notes → la moyenne du serveur, telle quelle (un vrai 0 reste 0)', async () => {
    const g = await notes({ matieres: [{ matiere_id: 9, evaluations: [{ note: '0.00' }] }], moyenne_generale: 0, total_matieres: 1, total_evaluations: 1 })
    expect(g.moyenneGenerale.value).toBe(0)
    const h2 = await notes({ matieres: [], moyenne_generale: 13.5, total_matieres: 1, total_evaluations: 2 })
    expect(h2.moyenneGenerale.value).toBe(13.5)
  })
})

describe('utils/studentGrades — une note masquée ne compte pas et ne s’invente pas', () => {
  const avecMasquee = [{ note: '12.00' }, { note: null }, { note: '8.00' }]

  it('3. max et min ignorent une note null ; aucune note lisible → null', () => {
    expect(getMaxNote({ evaluations: avecMasquee })).toBe(12)
    expect(getMinNote({ evaluations: avecMasquee })).toBe(8)
    expect(getMaxNote({ evaluations: [{ note: null }] })).toBeNull()
    expect(getMinNote({})).toBeNull()
  })

  it('4. meilleure note : null ignorée ; aucune → null', () => {
    expect(computeMeilleureNote(avecMasquee)).toBe(12)
    expect(computeMeilleureNote([])).toBeNull()
    expect(computeMeilleureNote([{ note: null }])).toBeNull()
  })

  it('5. taux de réussite : une note null n’est pas comptée ; aucune note → taux null', () => {
    expect(computeStatsReussite(avecMasquee)).toEqual({ total: 2, reussies: 1, taux: 50 })
    expect(computeStatsReussite([])).toEqual({ total: 0, reussies: 0, taux: null })
  })

  it('6. tri par note : une note null va à la fin, dans les deux sens', () => {
    const e = [{ note: null, titre: 'M' }, { note: '15.00', titre: 'A' }, { note: '9.00', titre: 'B' }]
    const tri = (sortBy) => filterAndSortEvaluations(e, { sortBy }).map((x) => x.titre)
    expect(tri('note-desc')).toEqual(['A', 'B', 'M'])
    expect(tri('note-asc')).toEqual(['B', 'A', 'M'])
  })

  it('7. afficherNote : « — » pour null, illisible ou absent ; sinon « x/20 »', () => {
    expect(afficherNote(null)).toBe('—')
    expect(afficherNote(undefined)).toBe('—')
    expect(afficherNote('abc')).toBe('—')
    expect(afficherNote('12.50')).toBe('12.50/20')
    expect(afficherNote(0)).toBe('0/20')
  })
})

describe('écrans — « — » et jamais 0 pour une valeur absente', () => {
  it('8. cartes : moyenne, taux et meilleure note absents → « — »', () => {
    const w = mount(GradesStatsCards, {
      props: {
        moyenneGenerale: null, totalMatieres: 0, totalEvaluations: 0,
        statsReussite: { total: 0, reussies: 0, taux: null }, statsMeilleureNote: null, meilleureMatiere: '',
      },
    })
    const valeurs = w.findAll('.stat-value').map((v) => v.text())
    expect(valeurs[0]).toBe('—')
    expect(valeurs[2]).toBe('—')
    expect(valeurs[3]).toBe('—')
    expect(w.text()).not.toContain('0/20')
  })

  it('9. tableau : une note null se lit « — », jamais « null/20 »', () => {
    const w = mount(GradesTable, {
      props: { filteredEvaluations: [{ evaluation_id: 1, titre: 'T', type: 'qcm', note: null, coefficient: 1, matiere_nom: 'Maths' }] },
    })
    expect(w.find('.note-value').text()).toBe('—')
    expect(w.text()).not.toContain('null')
  })

  it('10. synthèse : une matière sans note lisible → max et min « — »', () => {
    const w = mount(GradesSummary, {
      props: { matieres: [{ matiere_id: 9, matiere_nom: 'Maths', moyenne: 0, total_evaluations: 1, evaluations: [{ note: null }] }] },
    })
    const stats = w.findAll('.stat-text').map((s) => s.text())
    expect(stats[0]).toBe('—')
    expect(stats[1]).toBe('—')
  })
})
