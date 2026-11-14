/**
 * D540 : la synchronisation des notes compte les copies REMISES, celles qu'elle enverrait.
 *
 * Mesuré par l'E2E de l'école KLASSCI (K3, M2, run 43622040773) : avec une copie seulement DÉMARRÉE,
 * le bouton s'affichait (`submissions_count` la compte), la confirmation annonçait « 1 note(s) », et le
 * serveur envoyait `notes: []` à KLASSCI en se disant réussi. Le serveur livre désormais
 * `submissions_to_sync_count`, du même filtre que la synchronisation (scope `aSynchroniser()`).
 * Sans ce compteur dans la réponse, le front ne devine pas : le bouton reste, la confirmation ne donne
 * aucun nombre, et c'est le 422 motivé `no_submission_to_sync` qui parle. Jamais `submissions_count`.
 */
import { mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const h = vi.hoisted(() => ({
  syncToKlassci: vi.fn(),
  confirm: vi.fn(() => Promise.resolve(true)),
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/evaluation', () => ({ default: { syncToKlassci: h.syncToKlassci } }))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: h.confirm }) }))
vi.mock('@/composables/useToast', () => ({ toast: h.toast }))

import EvaluationCardActions from '@/components/evaluations/EvaluationCardActions.vue'
import { useTeacherEvaluationActions } from '@/composables/useTeacherEvaluationActions'

const AUCUNE_COPIE = "Aucune copie remise n'est à synchroniser. Les notes partiront une fois des copies remises par les élèves."
const BOUTON = 'Synchroniser les notes'

const carte = (versionEnLigne) => ({ id: 9601, can_sync_grades: true, has_online: true, online_version: { id: 2, ...versionEnLigne } })
const bouton = (versionEnLigne) => mount(EvaluationCardActions, { props: { evaluation: carte(versionEnLigne) } })
  .findAll('button').find((b) => b.text().includes(BOUTON))

function actions() {
  let api
  mount(defineComponent({ setup() { api = useTeacherEvaluationActions({ evaluationsLMS: ref([]), loadEvaluationsLMS: vi.fn() }); return () => null } }))
  return api
}

beforeEach(() => {
  vi.clearAllMocks()
  h.confirm.mockResolvedValue(true)
})

describe('D540 — le bouton « Synchroniser les notes » suit les copies REMISES', () => {
  it('une copie démarrée, aucune remise (K3, M2) : pas de bouton', () => {
    expect(bouton({ submissions_count: 1, submissions_to_sync_count: 0 })).toBeUndefined()
  })

  it('deux copies remises : le bouton est là', () => {
    expect(bouton({ submissions_count: 3, submissions_to_sync_count: 2 })).toBeTruthy()
  })

  it('sans compteur des remises dans la réponse : le bouton reste, même si submissions_count vaut 0', () => {
    expect(bouton({ submissions_count: 0 })).toBeTruthy()
  })
})

describe('D540 — la confirmation et le refus de la synchronisation', () => {
  it('aucune copie remise : rien n’est envoyé, et le texte du catalogue le dit', async () => {
    await actions().syncToKlassci(carte({ submissions_count: 1, submissions_to_sync_count: 0 }))
    expect(h.syncToKlassci).not.toHaveBeenCalled()
    expect(h.toast.warning).toHaveBeenCalledWith(AUCUNE_COPIE)
  })

  it('deux copies remises : la confirmation annonce 2 notes, jamais le nombre de copies démarrées', async () => {
    h.syncToKlassci.mockResolvedValue({ success: true })
    await actions().syncToKlassci(carte({ submissions_count: 5, submissions_to_sync_count: 2 }))
    expect(h.confirm).toHaveBeenCalledWith({ message: 'Synchroniser 2 note(s) vers KLASSCI ?' })
    expect(h.syncToKlassci).toHaveBeenCalledWith(2)
  })

  it('sans compteur des remises : la confirmation ne donne AUCUN nombre, et la synchronisation part', async () => {
    h.syncToKlassci.mockResolvedValue({ success: true })
    await actions().syncToKlassci(carte({ submissions_count: 3 }))
    expect(h.confirm).toHaveBeenCalledWith({ message: 'Synchroniser les notes vers KLASSCI ?' })
    expect(h.syncToKlassci).toHaveBeenCalledWith(2)
  })

  it('le 422 `no_submission_to_sync` : le texte du catalogue, jamais celui du serveur', async () => {
    h.syncToKlassci.mockRejectedValue(Object.assign(new Error('HTTP 422'), {
      response: { status: 422, data: { success: false, message: 'Texte serveur, jamais affiché', reason: 'no_submission_to_sync' } },
    }))
    await actions().syncToKlassci(carte({ submissions_count: 3 }))
    expect(h.toast.error).toHaveBeenCalledWith(AUCUNE_COPIE)
  })
})
