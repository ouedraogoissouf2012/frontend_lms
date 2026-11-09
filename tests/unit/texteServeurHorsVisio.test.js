/**
 * Hors visio, un refus dit son SENS, jamais le texte du serveur (D0), comme dans #500.
 *
 * Sites relevés par le cliquet de #500 et sa revue : useLessonForm concaténait
 * `response.message` à son toast ; useParticipantsModal affichait `response.message` et
 * `err.response.data.message`. useAdminMatieres et useAdminSeances (simulent KLASSCI) sont
 * couverts par le cliquet élargi de visioMessagesSansTexteBrut.test.js.
 */
import { ref, nextTick } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn(), show: vi.fn() }))
const lesson = vi.hoisted(() => ({ createLesson: vi.fn(), updateLesson: vi.fn() }))
const lms = vi.hoisted(() => ({ getVisioParticipants: vi.fn() }))
vi.mock('@/composables/useToast', () => ({ toast }))
vi.mock('@/services/cache', () => ({ writeCache: vi.fn() }))
vi.mock('@/services/lesson', () => ({ default: lesson }))
vi.mock('@/services/lms', () => ({ default: lms }))
vi.mock('@/services/attendanceExport', () => ({ default: {} }))

import { useLessonForm } from '@/composables/useLessonForm'
import { useParticipantsModal } from '@/composables/useParticipantsModal'
import { normalizeError } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const SERVEUR = 'Texte serveur détaillé'

beforeEach(() => {
  Object.values(toast).forEach((fn) => fn.mockReset())
  lesson.createLesson.mockReset()
  lesson.updateLesson.mockReset()
  lms.getVisioParticipants.mockReset()
})

describe('formulaire de leçon : un refus de sauvegarde', () => {
  const sauver = async (edition) => {
    const f = useLessonForm(ref([{ id: 5 }]))
    if (edition) f.editingLesson.value = { id: 5 }
    f.lessonForm.matiere_id = 3
    f.lessonForm.title = 'Titre'
    await f.saveLesson()
    return toast.error.mock.calls.at(-1)?.[0]
  }

  it('création refusée : le repli du front, jamais le texte du serveur', async () => {
    lesson.createLesson.mockResolvedValue({ success: false, message: SERVEUR })
    const affiche = await sauver(false)
    expect(affiche).toBeTruthy()
    expect(affiche).not.toContain(SERVEUR)
  })

  it('refus avec un `reason` connu : le catalogue, exactement', async () => {
    lesson.createLesson.mockResolvedValue({ success: false, message: SERVEUR, reason: 'no_institution' })
    expect(await sauver(false)).toBe(ERROR_MESSAGES.noInstitution)
  })

  it('refus HTTP (422) : le message de l’intercepteur est gardé, la sauvegarde est nommée', async () => {
    lesson.createLesson.mockRejectedValue(Object.assign(new Error('HTTP 422'), { userMessage: 'Le champ titre est obligatoire.' }))
    const affiche = await sauver(false)
    expect(affiche).toContain('Le champ titre est obligatoire.')
    expect(affiche).toMatch(/sauvegarde/i)
  })

  it('modification refusée : idem', async () => {
    lesson.updateLesson.mockResolvedValue({ success: false, message: SERVEUR })
    const affiche = await sauver(true)
    expect(affiche).toBeTruthy()
    expect(affiche).not.toContain(SERVEUR)
  })
})

describe('liste de présence : un refus de chargement', () => {
  // Le composable arme un rafraîchissement toutes les 15 s : faux minuteurs, et démontage.
  let monte = null
  beforeEach(() => { vi.useFakeTimers() })
  afterEach(() => { monte?.unmount(); monte = null; vi.useRealTimers() })

  const charger = async () => {
    let c
    monte = mount(defineComponent({ setup() { c = useParticipantsModal(ref(9)); return () => null } }))
    await flushPromises()
    await nextTick()
    return c
  }

  it('refus avec un `reason` connu : le catalogue, exactement', async () => {
    lms.getVisioParticipants.mockResolvedValue({ success: false, message: SERVEUR, reason: 'no_institution' })
    const c = await charger()
    expect(c.error.value).toBe(ERROR_MESSAGES.noInstitution)
  })

  it('success:false : le repli du front, jamais le texte du serveur', async () => {
    lms.getVisioParticipants.mockResolvedValue({ success: false, message: SERVEUR })
    const c = await charger()
    expect(c.error.value).toBeTruthy()
    expect(c.error.value).not.toContain(SERVEUR)
  })

  it('erreur HTTP : la catégorie du statut, jamais response.data.message', async () => {
    const erreur = Object.assign(new Error('Request failed with status code 500'), {
      response: { status: 500, data: { success: false, message: SERVEUR } },
    })
    lms.getVisioParticipants.mockRejectedValue(erreur)
    const c = await charger()
    expect(c.error.value).toBe(normalizeError(erreur).userMessage)
    expect(c.error.value).not.toContain(SERVEUR)
  })
})
