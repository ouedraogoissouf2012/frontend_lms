/**
 * La porte unique d'une évaluation, côté élève (revue de #515).
 *
 * - `startEvaluation` : `POST /evaluations/{id}/start`, puis ouvre la copie créée. Un verrou empêche
 *   deux démarrages simultanés (double clic : deux POST, la seconde création échoue). Sans
 *   utilisateur, l'élève est renvoyé vers la connexion au lieu d'un refus muet.
 * - `ouvrirEvaluation` : la décision des entrées qui ne savent pas l'état de la copie (calendrier,
 *   page d'une matière). Copie en cours → reprise ; copie rendue → résultats ; sinon → démarrage.
 */
import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({ push: vi.fn(), demarrer: vi.fn(), getUser: vi.fn(), toastError: vi.fn() }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: h.push }) }))
vi.mock('@/services/evaluation', () => ({ default: { startEvaluation: (...a) => h.demarrer(...a) } }))
vi.mock('@/services/api', () => ({ default: {}, auth: { getUser: () => h.getUser() } }))
vi.mock('@/composables/useToast', () => ({ toast: { error: (...a) => h.toastError(...a) } }))

import { useStartEvaluation } from '@/composables/useStartEvaluation'

function monter() {
  let api
  mount(defineComponent({ setup() { api = useStartEvaluation(); return () => null } }))
  return api
}

describe('useStartEvaluation', () => {
  beforeEach(() => {
    for (const f of Object.values(h)) f.mockReset()
    h.getUser.mockReturnValue({ klassci_id: 7 })
  })

  it('deux démarrages simultanés (double clic) : un seul appel au serveur', async () => {
    let fin
    h.demarrer.mockImplementation(() => new Promise((r) => { fin = r }))
    const api = monter()
    const a = api.startEvaluation({ id: 3 })
    const b = api.startEvaluation({ id: 3 })
    fin({ success: true, data: { id: 99 } })
    await Promise.all([a, b])
    expect(h.demarrer).toHaveBeenCalledTimes(1)
    expect(h.push).toHaveBeenCalledTimes(1)
    // Le verrou se lève : un nouveau démarrage est de nouveau possible.
    h.demarrer.mockResolvedValue({ success: true, data: { id: 100 } })
    await api.startEvaluation({ id: 4 })
    expect(h.demarrer).toHaveBeenCalledTimes(2)
  })

  it('sans utilisateur : renvoi vers la connexion, aucun appel', async () => {
    h.getUser.mockReturnValue(null)
    await monter().startEvaluation({ id: 3 })
    expect(h.demarrer).not.toHaveBeenCalled()
    expect(h.push).toHaveBeenCalledWith('/login')
  })

  describe('ouvrirEvaluation', () => {
    it('copie en cours : reprise de CETTE copie, sans nouveau démarrage', async () => {
      await monter().ouvrirEvaluation({ id: 3, student_submission: { id: 5, status: 'en_cours' } })
      expect(h.demarrer).not.toHaveBeenCalled()
      expect(h.push).toHaveBeenCalledWith({ name: 'TakeEvaluation', params: { id: 3 }, query: { submission_id: 5 } })
    })

    it('copie rendue (soumise ou corrigée) : les résultats', async () => {
      for (const status of ['soumis', 'corrige']) {
        h.push.mockReset()
        await monter().ouvrirEvaluation({ id: 3, student_submission: { id: 5, status } })
        expect(h.push).toHaveBeenCalledWith({ name: 'EvaluationResults', params: { id: 3 } })
      }
      expect(h.demarrer).not.toHaveBeenCalled()
    })

    it('aucune copie : le démarrage par le serveur', async () => {
      h.demarrer.mockResolvedValue({ success: true, data: { id: 99 } })
      await monter().ouvrirEvaluation({ id: 3, student_submission: null })
      expect(h.demarrer).toHaveBeenCalledWith(3, 7)
      expect(h.push).toHaveBeenCalledWith({ name: 'TakeEvaluation', params: { id: 3 }, query: { submission_id: 99 } })
    })
  })
})
