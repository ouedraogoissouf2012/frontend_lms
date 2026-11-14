/**
 * Prévisualisation d'une évaluation par le coordinateur : il ne prévisualise que les évaluations
 * TERMINÉES (politique métier, TeacherEvaluationViewService::preview:140-147). Le 403 porte désormais le
 * motif `preview_requires_finished_evaluation` (lms_backend #1060). L'écran le dit par le catalogue, au
 * lieu de « Impossible de charger la prévisualisation » ; jamais le texte du serveur (D0). Tout autre
 * échec garde le message actuel.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const h = vi.hoisted(() => ({ preview: vi.fn() }))
vi.mock('vue-router', () => ({ useRoute: () => ({ params: { id: '7' } }), useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/evaluation', () => ({ default: { previewEvaluation: (...a) => h.preview(...a), publishEvaluation: vi.fn() } }))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: () => Promise.resolve(true) }) }))

import { usePreviewEvaluation } from '@/composables/usePreviewEvaluation'
import { entreeDuMotif } from '@/services/refusalReasons'

const PIEGE = 'texte du serveur'

async function monter() {
  let api
  mount(defineComponent({ setup() { api = usePreviewEvaluation(); return () => null } }))
  await flushPromises()
  return api
}

beforeEach(() => { vi.clearAllMocks() })

describe('aperçu d’une évaluation non terminée — le motif se dit', () => {
  it('1. le motif est au catalogue, définitif, avec son message', () => {
    expect(entreeDuMotif('preview_requires_finished_evaluation')).toMatchObject({ categorie: 'previewRequiresFinishedEvaluation', transitoire: false })
    expect(ERROR_MESSAGES.previewRequiresFinishedEvaluation).toBe('Cette évaluation ne peut être prévisualisée qu’une fois terminée.')
  })

  it('2. 403 preview_requires_finished_evaluation → le message du catalogue, jamais le texte du serveur', async () => {
    h.preview.mockRejectedValue({ response: { status: 403, data: { success: false, message: PIEGE, reason: 'preview_requires_finished_evaluation' } } })
    const c = await monter()
    expect(c.error.value).toBe(ERROR_MESSAGES.previewRequiresFinishedEvaluation)
  })

  // Reste D0 (même composable) : un 2xx « success: false » affichait `result.message`, le texte du serveur.
  // Il passe désormais par invalidResponseError et messageDe, comme ailleurs.
  it('4. 2xx success:false sans motif → le message générique du catalogue, jamais le texte du serveur', async () => {
    h.preview.mockResolvedValue({ success: false, message: PIEGE })
    const c = await monter()
    expect(c.error.value).toBe(ERROR_MESSAGES.unknown)
  })

  it('5. 2xx success:false avec le motif → le message du catalogue', async () => {
    h.preview.mockResolvedValue({ success: false, message: PIEGE, reason: 'preview_requires_finished_evaluation' })
    const c = await monter()
    expect(c.error.value).toBe(ERROR_MESSAGES.previewRequiresFinishedEvaluation)
  })

  it('3. un autre échec garde le message actuel', async () => {
    h.preview.mockRejectedValue({ response: { status: 500, data: { message: PIEGE } } })
    const c = await monter()
    expect(c.error.value).toBe('Impossible de charger la prévisualisation')
  })
})
