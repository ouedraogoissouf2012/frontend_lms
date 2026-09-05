/**
 * Test du composable useAdminEvaluationDetails (#H3 ≤300) : chargement des résultats
 * par classe, gestion d'erreur, et helpers de présentation (statut/note/CSV).
 * Service api + vue-router mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getMock = vi.fn()
vi.mock('@/services/api', () => ({ default: { get: (...args) => getMock(...args) } }))

const pushMock = vi.fn()
const backMock = vi.fn()
vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '42' } }),
  useRouter: () => ({ push: pushMock, back: backMock }),
}))

import { useAdminEvaluationDetails } from '@/composables/useAdminEvaluationDetails'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminEvaluationDetails(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useAdminEvaluationDetails (#H3)', () => {
  beforeEach(() => {
    getMock.mockReset()
    pushMock.mockReset()
    backMock.mockReset()
  })

  it('charge les résultats par classe et peuple state au montage', async () => {
    getMock
      .mockResolvedValueOnce({ success: true, data: { id: 42, titre: 'Test 1', submissions_count: 1 } })
      .mockResolvedValueOnce({
        success: true,
        data: {
          evaluation: { titre: 'Test 1' },
          resultats: [{ etudiant_id: 1, etudiant_nom_complet: 'Aline' }],
          statistiques: { total_etudiants: 30 },
        },
      })
    const c = await setup()
    expect(getMock).toHaveBeenCalledWith('/evaluations/42')
    expect(getMock).toHaveBeenCalledWith('/evaluations/42/results-by-class')
    expect(c.loading.value).toBe(false)
    expect(c.evaluation.value.titre).toBe('Test 1')
    expect(c.resultats.value).toHaveLength(1)
    expect(c.statistiques.value.total_etudiants).toBe(30)
    expect(c.error.value).toBe(null)
  })

  it('positionne error si la réponse est en échec', async () => {
    getMock
      .mockResolvedValueOnce({ success: true, data: { id: 42, submissions_count: 1 } })
      .mockResolvedValueOnce({ success: false, message: 'Boom' })
    const c = await setup()
    expect(c.error.value).toBe('Boom')
    expect(c.loading.value).toBe(false)
  })

  it('capture les exceptions réseau dans error', async () => {
    getMock.mockRejectedValue({ response: { data: { message: 'HTTP 500' } } })
    const c = await setup()
    expect(c.error.value).toBe('HTTP 500')
    expect(c.loading.value).toBe(false)
  })

  it('retombe sur le détail évaluation si results-by-class renvoie 500', async () => {
    getMock
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: 42,
          titre: 'Évaluation sans soumission',
          submissions_count: 1,
          questions_count: 1,
        },
      })
      .mockRejectedValueOnce({ response: { data: { message: 'Erreur résultats' } } })
      .mockResolvedValueOnce({
        success: true,
        data: {
          id: 42,
          titre: 'Évaluation sans soumission',
          submissions_count: 0,
          questions_count: 1,
        },
      })

    const c = await setup()

    expect(getMock).toHaveBeenCalledWith('/evaluations/42')
    expect(getMock).toHaveBeenCalledWith('/evaluations/42/results-by-class')
    expect(getMock).toHaveBeenCalledWith('/evaluations/42')
    expect(c.error.value).toBe(null)
    expect(c.evaluation.value.titre).toBe('Évaluation sans soumission')
    expect(c.resultats.value).toEqual([])
    expect(c.statistiques.value).toMatchObject({
      total_etudiants: 0,
      etudiants_soumis: 0,
      taux_participation: 0,
    })
  })

  it('#321 : places_occupees null ne zéroïse plus le total quand nb_etudiants existe', async () => {
    // Éval sans soumission → buildEmptyStatistiques. `places_occupees` null (référentiel
    // non chargé, convention « null = non mesuré ») NE DOIT PAS masquer nb_etudiants.
    getMock.mockResolvedValueOnce({
      success: true,
      data: {
        id: 42,
        titre: 'Éval planifiée',
        submissions_count: 0,
        classe: { places_occupees: null, nb_etudiants: 30 },
      },
    })

    const c = await setup()

    expect(c.statistiques.value.total_etudiants).toBe(30) // avant #321 : 0 (Number(null)===0)
    expect(c.statistiques.value.etudiants_non_passes).toBe(30) // 30 - 0 soumis
    expect(c.statistiques.value.taux_participation).toBe(0) // 0/30
  })

  it('n’appelle pas results-by-class quand aucune soumission n’existe', async () => {
    getMock.mockResolvedValueOnce({
      success: true,
      data: {
        id: 42,
        titre: 'Évaluation planifiée',
        submissions_count: 0,
        questions_count: 1,
      },
    })

    const c = await setup()

    expect(getMock).toHaveBeenCalledTimes(1)
    expect(getMock).toHaveBeenCalledWith('/evaluations/42')
    expect(c.error.value).toBe(null)
    expect(c.evaluation.value.titre).toBe('Évaluation planifiée')
    expect(c.resultats.value).toEqual([])
  })

  it('goBack délègue à router.back', async () => {
    getMock.mockResolvedValue({ success: true, data: { submissions_count: 0 } })
    const c = await setup()
    c.goBack()
    expect(backMock).toHaveBeenCalled()
  })

  it('mappe statut et note vers les bonnes classes/libellés', async () => {
    getMock.mockResolvedValue({ success: true, data: { submissions_count: 0 } })
    const c = await setup()
    expect(c.getStatusClass('soumis')).toBe('status-success')
    expect(c.getStatusClass('en_cours')).toBe('status-warning')
    expect(c.getStatusClass('inconnu')).toBe('status-default')
    expect(c.getStatusLabel('non_passee')).toBe('Non passée')
    expect(c.getNoteClass(18)).toBe('note-excellent')
    expect(c.getNoteClass(15)).toBe('note-good')
    expect(c.getNoteClass(11)).toBe('note-average')
    expect(c.getNoteClass(5)).toBe('note-poor')
    expect(c.getNoteClass(null)).toBe('')
  })

  it('formatDate / formatDateTime renvoient "-" sans valeur', async () => {
    getMock.mockResolvedValue({ success: true, data: { submissions_count: 0 } })
    const c = await setup()
    expect(c.formatDate(null)).toBe('-')
    expect(c.formatDateTime(undefined)).toBe('-')
  })
})
