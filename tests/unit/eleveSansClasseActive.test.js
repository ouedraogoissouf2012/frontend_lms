/**
 * Élève sans classe active (E2E de la nuit, écran /student/schedule de l'élève inactif) : `GET
 * /lms/seances/my-classes` rend 404 quand l'élève n'a aucune classe (LMSSeancesListController::
 * myClassesSeances:130). Ce 404 porte le motif FIXÉ `student_without_active_class` (décision de la
 * superviseure) : c'est un ÉTAT VIDE honnête, pas une erreur. La même route peut relayer un 404
 * KLASSCI : seul CE motif est traité en état vide, jamais d'après le texte du serveur (D0).
 */
import { ref } from 'vue'
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const lmsMock = vi.hoisted(() => ({ getMyClassesSeances: vi.fn(), getMyTeachingSeances: vi.fn(), getUpcomingSeances: vi.fn() }))
vi.mock('@/services/lms', () => ({ lmsService: lmsMock }))
vi.mock('@/services/evaluation', () => ({ default: { getStudentEvaluations: vi.fn(), getEvaluations: vi.fn() } }))

import { useCalendarEvents } from '@/composables/useCalendarEvents'
import { REASONS, entreeDuMotif } from '@/services/refusalReasons'

const PIEGE = 'Aucune classe trouvée pour cet étudiant'
const refus = (data) => ({ response: { status: 404, data: { success: false, message: PIEGE, ...data } } })
const agenda = () => useCalendarEvents({
  getUserRole: () => 'student', getUserId: () => 1, eventTypeFilter: ref('seances'), dateRangePreset: ref('month'),
})

beforeEach(() => { vi.clearAllMocks() })

describe('useCalendarEvents — l’élève sans classe active', () => {
  it('1. 404 student_without_active_class → état vide honnête : aucune erreur, le message du catalogue', async () => {
    lmsMock.getMyClassesSeances.mockRejectedValue(refus({ reason: 'student_without_active_class' }))
    const c = agenda()
    await c.loadEvents()
    expect(c.error.value).toBeNull()
    expect(c.information.value).toBe(ERROR_MESSAGES.eleveSansClasseActive)
    expect(c.events.value).toEqual([])
  })

  it('2. 404 sans motif → reste une erreur', async () => {
    lmsMock.getMyClassesSeances.mockRejectedValue(refus({}))
    const c = agenda()
    await c.loadEvents()
    expect(c.error.value).toEqual(expect.any(String))
    expect(c.information.value).toBeNull()
  })

  it('3. 404 relayé avec un autre motif → reste une erreur, jamais le texte du serveur', async () => {
    lmsMock.getMyClassesSeances.mockRejectedValue(refus({ reason: 'klassci_unavailable' }))
    const c = agenda()
    await c.loadEvents()
    expect(c.error.value).toEqual(expect.any(String))
    expect(c.error.value).not.toBe(PIEGE)
    expect(c.information.value).toBeNull()
  })

  it('4. 200 « aucune matière » (liste vide) → ni erreur ni information', async () => {
    lmsMock.getMyClassesSeances.mockResolvedValue({ success: true, data: [], message: 'Aucune matière trouvée pour cet étudiant' })
    const c = agenda()
    await c.loadEvents()
    expect(c.error.value).toBeNull()
    expect(c.information.value).toBeNull()
  })

  it('5. un rechargement réussi efface l’information', async () => {
    lmsMock.getMyClassesSeances.mockRejectedValueOnce(refus({ reason: 'student_without_active_class' }))
    const c = agenda()
    await c.loadEvents()
    lmsMock.getMyClassesSeances.mockResolvedValue({ success: true, data: [] })
    await c.loadEvents()
    expect(c.information.value).toBeNull()
  })
})

describe('catalogue — le motif est une sortie en état vide, pas une erreur', () => {
  it('6. student_without_active_class est connu, marqué état vide, définitif', () => {
    expect(entreeDuMotif('student_without_active_class')).toBe(REASONS.student_without_active_class)
    expect(REASONS.student_without_active_class).toMatchObject({ categorie: 'eleveSansClasseActive', etatVide: true, transitoire: false })
    expect(ERROR_MESSAGES.eleveSansClasseActive).toBe('Vous n’êtes inscrit dans aucune classe active.')
  })
})

describe('calendrier — l’état vide se lit comme une information, pas une alerte', () => {
  it('7. information affichée en role="status", aucune alerte', async () => {
    vi.resetModules()
    vi.doMock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
    vi.doMock('@/composables/useCalendarEvents', () => ({
      useCalendarEvents: () => ({
        events: ref([]), matieres: ref([]), classes: ref([]), enseignants: ref([]), loading: ref(false), refreshing: ref(false),
        error: ref(null), information: ref(ERROR_MESSAGES.eleveSansClasseActive), loadEvents: vi.fn(), refreshData: vi.fn(),
      }),
    }))
    const { default: UniversalCalendar } = await import('@/components/calendar/UniversalCalendar.vue')
    const w = mount(UniversalCalendar, {
      props: { userRole: 'student', userId: 1 },
      global: { stubs: { CalendarNavigation: true, CalendarFilters: true, CalendarView: true, CalendarCompactAgenda: true, CalendarLegend: true, EventDetailModal: true } },
    })
    expect(w.find('[role="status"]').text()).toBe(ERROR_MESSAGES.eleveSansClasseActive)
    expect(w.find('[role="alert"]').exists()).toBe(false)
  })
})
