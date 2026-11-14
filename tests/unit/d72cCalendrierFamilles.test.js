/**
 * D72-c, L1 et L2 (R7) : le calendrier lit l'identité d'une évaluation par `utils/identiteEvaluation`
 * (champs à plat), et ses options de filtre sont clées par la MÊME règle que les événements.
 * Avant : l'événement lisait `klassci_*` seulement (une évaluation locale disparaissait dès qu'on
 * filtrait) et les options d'évaluation lisaient `matiere.id` imbriqué (nul sur une évaluation locale :
 * toutes les matières locales tombaient sous une seule clé `null`).
 */
import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { toId } from '@/utils/toId'

const lmsMock = vi.hoisted(() => ({
  getMyClassesSeances: vi.fn(),
  getMyTeachingSeances: vi.fn(),
  getUpcomingSeances: vi.fn(),
}))
const evalMock = vi.hoisted(() => ({
  getStudentEvaluations: vi.fn(),
  getEvaluations: vi.fn(),
}))
vi.mock('@/services/lms', () => ({ lmsService: lmsMock }))
vi.mock('@/services/evaluation', () => ({ default: evalMock }))

import { useCalendarEvents } from '@/composables/useCalendarEvents'

function calendrier(type = 'evaluations') {
  return useCalendarEvents({
    getUserRole: () => 'admin',
    getUserId: () => 1,
    eventTypeFilter: ref(type),
    dateRangePreset: ref('month'),
  })
}

const locale = (id, matiereId, nom) => ({
  id, titre: `Éval ${id}`, duree_minutes: 30,
  klassci_matiere_id: null, matiere_id: matiereId, matiere: { id: null, nom }, matiere_nom: nom,
  klassci_classe_id: null, classe_id: 4, classe: { id: null, nom: '6e A' }, classe_nom: '6e A',
  klassci_enseignant_id: null, enseignant_id: 77, enseignant_nom: 'Awa',
})

beforeEach(() => {
  vi.clearAllMocks()
  lmsMock.getUpcomingSeances.mockResolvedValue({ data: [] })
})

describe('useCalendarEvents — les deux familles d’ids (D72-c)', () => {
  it('9. L1 : une évaluation locale porte ses ids locaux (matière, classe, enseignant)', async () => {
    evalMock.getEvaluations.mockResolvedValue({ data: [locale(1, 9, 'Maths')] })
    const c = calendrier()
    await c.loadEvents()
    expect(c.events.value[0].extendedProps).toMatchObject({ matiereId: '9', classeId: '4', enseignantId: '77' })
  })

  it('10. L2 / R7 : deux matières locales donnent deux options, clées 9 et 10', async () => {
    evalMock.getEvaluations.mockResolvedValue({ data: [locale(1, 9, 'Maths'), locale(2, 10, 'Physique')] })
    const c = calendrier()
    await c.loadEvents()
    expect(c.matieres.value.map((m) => toId(m.id))).toEqual(['9', '10'])
    expect(c.matieres.value.map((m) => m.nom)).toEqual(['Maths', 'Physique'])
  })

  it('11. L2 : la clé de l’option est celle de l’événement, séance comme évaluation', async () => {
    lmsMock.getUpcomingSeances.mockResolvedValue({
      data: [{ id: 'S1', matiere: { id: null, nom: 'Histoire' }, classe: { id: 4, nom: '6e A' } }],
    })
    evalMock.getEvaluations.mockResolvedValue({ data: [locale(1, 9, 'Maths')] })
    const c = calendrier('all')
    await c.loadEvents()
    const clesEvenements = c.events.value.map((e) => toId(e.extendedProps.matiereId)).sort()
    const clesOptions = c.matieres.value.map((m) => toId(m.id)).sort()
    expect(clesOptions).toEqual(clesEvenements)
    expect(clesOptions).toEqual(['9', 'nom:histoire'].sort())
  })

  it('12. L2 : une évaluation KLASSCI dont l’objet imbriqué diffère est clée par klassci_matiere_id', async () => {
    evalMock.getEvaluations.mockResolvedValue({
      data: [{ id: 3, titre: 'K', klassci_matiere_id: 5, matiere_id: null, matiere: { id: 6, nom: 'Chimie' } }],
    })
    const c = calendrier()
    await c.loadEvents()
    expect(c.matieres.value.map((m) => toId(m.id))).toEqual(['5'])
    expect(toId(c.events.value[0].extendedProps.matiereId)).toBe('5')
  })
})
