/**
 * « Réessayer » seulement sur une panne passagère : les six écrans de liste servis par
 * useCachedResource (lot « Réessayer », PR A, suite de #517).
 *
 * useCachedResource expose `canRetry` depuis #517 ; ces composables ne le relayaient pas, et
 * leurs vues offraient « Réessayer » sur un refus définitif (401 `klassci_token_missing`,
 * réponse « success: false ») que réessayer ne lève pas. Chaque composable est jugé dans les deux
 * sens : refus → false, panne (5xx, 503 avec Retry-After) → true.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const m = vi.hoisted(() => ({
  klassci: {
    getLmsEnseignants: vi.fn(), getEnseignants: vi.fn(),
    getAdminMatieres: vi.fn(), getStructure: vi.fn(),
    getSeances: vi.fn(), getTeachers: vi.fn(), getClasses: vi.fn(),
    getMatieres: vi.fn(), getTeacherDashboard: vi.fn(), getClasseEtudiants: vi.fn(),
  },
  lmsClasses: { getTeacherClasses: vi.fn() },
  lms: { getMyTeachingSeances: vi.fn() },
  lessons: { getLessons: vi.fn() },
  analytics: { getSystemMetrics: vi.fn() },
  adminStatistics: { getAdminStatistics: vi.fn(), extractAdminStatistics: vi.fn(() => null) },
  auth: { getUser: vi.fn(), getMeta: vi.fn() },
}))

vi.mock('@/services/cache', () => ({
  readCache: () => null,
  readCacheStale: () => ({ data: null, fresh: false }),
  writeCache: () => {},
  clearCache: () => {},
  invalidateEntity: () => {},
}))
vi.mock('@/services/klassci', () => ({ default: m.klassci, klassciService: m.klassci }))
vi.mock('@/services/lmsClasses', () => ({ lmsClassesService: m.lmsClasses }))
vi.mock('@/services/lms', () => ({ lmsService: m.lms }))
vi.mock('@/services/lesson', () => ({ default: m.lessons, lessonService: m.lessons }))
vi.mock('@/services/analytics', () => ({ analyticsService: m.analytics }))
vi.mock('@/services/adminStatistics', () => m.adminStatistics)
vi.mock('@/services/api', () => ({ auth: m.auth, default: {} }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ currentUser: { id: 42, role: 'enseignant' } }) }))

import { useAdminEnseignants } from '@/composables/useAdminEnseignants'
import { useAdminMatieres } from '@/composables/useAdminMatieres'
import { useAdminSeances } from '@/composables/useAdminSeances'
import { useAdminStats } from '@/composables/useAdminStats'
import { useTeacherClasses } from '@/composables/useTeacherClasses'
import { useTeacherHub } from '@/composables/useTeacherHub'

const PIEGE = 'Texte du serveur, jamais affiché'
// Un refus définitif : 401 du lot 3d, tel que l'intercepteur le rend.
const refus = () => Object.assign(new Error('HTTP 401'), {
  response: { status: 401, data: { success: false, message: PIEGE, reason: 'klassci_token_missing' } },
  userMessage: "Aucun accès KLASSCI n'est enregistré pour ce compte : les données qui en proviennent ne peuvent pas être affichées.",
})
// Une panne : 503 avec Retry-After (KLASSCI indisponible), et un 500.
const panne503 = () => Object.assign(new Error('HTTP 503'), {
  response: { status: 503, headers: { 'retry-after': '30' }, data: { success: false, message: PIEGE } },
  userMessage: 'Service KLASSCI temporairement indisponible. Réessayez dans 30 secondes.',
})
const panne500 = () => Object.assign(new Error('HTTP 500'), {
  response: { status: 500, data: { success: false, message: PIEGE, error: 'Une erreur est survenue.' } },
  userMessage: 'Une erreur est survenue côté serveur. Veuillez réessayer plus tard.',
})

async function monter(useX) {
  let api
  mount(defineComponent({ setup() { api = useX(); return () => null } }))
  await flushPromises()
  await flushPromises()
  return api
}

beforeEach(() => {
  vi.clearAllMocks()
  m.auth.getUser.mockReturnValue({ id: 42, role: 'superAdmin' })
  m.auth.getMeta.mockReturnValue({})
  m.klassci.getStructure.mockResolvedValue({ filieres: [], niveaux_etude: [] })
  m.klassci.getTeachers.mockResolvedValue([])
  m.klassci.getClasses.mockResolvedValue([])
  m.klassci.getMatieres.mockResolvedValue([])
  m.klassci.getEnseignants.mockResolvedValue([])
  m.klassci.getClasseEtudiants.mockResolvedValue([])
  m.analytics.getSystemMetrics.mockResolvedValue(null)
  m.adminStatistics.getAdminStatistics.mockResolvedValue(null)
  m.lms.getMyTeachingSeances.mockResolvedValue({ data: [] })
  m.lessons.getLessons.mockResolvedValue({ success: true, data: [] })
})

describe('AdminEnseignants : canRetry relayé', () => {
  it('refus du repli : pas de Réessayer ; panne : Réessayer', async () => {
    m.klassci.getLmsEnseignants.mockRejectedValue(panne503())
    m.klassci.getEnseignants.mockRejectedValue(refus())
    expect((await monter(useAdminEnseignants)).canRetry.value).toBe(false)

    m.klassci.getEnseignants.mockRejectedValue(panne503())
    expect((await monter(useAdminEnseignants)).canRetry.value).toBe(true)
  })
})

describe('AdminMatieres : canRetry relayé, et « success: false » est un refus', () => {
  it('2xx « success: false » : pas de Réessayer (refus, pas panne)', async () => {
    m.klassci.getAdminMatieres.mockResolvedValue({ success: false, reason: 'klassci_token_missing' })
    const u = await monter(useAdminMatieres)
    expect(u.error.value).toBeTruthy()
    expect(u.canRetry.value).toBe(false)
  })

  it('401 : pas de Réessayer ; 500 et 503 (pannes) : Réessayer', async () => {
    m.klassci.getAdminMatieres.mockRejectedValue(refus())
    expect((await monter(useAdminMatieres)).canRetry.value).toBe(false)
    m.klassci.getAdminMatieres.mockRejectedValue(panne500())
    expect((await monter(useAdminMatieres)).canRetry.value).toBe(true)
    m.klassci.getAdminMatieres.mockRejectedValue(panne503())
    expect((await monter(useAdminMatieres)).canRetry.value).toBe(true)
  })
})

describe('AdminSeances : canRetry relayé, et « success: false » est un refus', () => {
  it('2xx « success: false » : pas de Réessayer', async () => {
    m.klassci.getSeances.mockResolvedValue({ success: false })
    const u = await monter(useAdminSeances)
    expect(u.error.value).toBeTruthy()
    expect(u.canRetry.value).toBe(false)
  })

  it('401 : pas de Réessayer ; 503 : Réessayer', async () => {
    m.klassci.getSeances.mockRejectedValue(refus())
    expect((await monter(useAdminSeances)).canRetry.value).toBe(false)
    m.klassci.getSeances.mockRejectedValue(panne503())
    expect((await monter(useAdminSeances)).canRetry.value).toBe(true)
  })
})

describe('AdminStats : toutes les sources en échec', () => {
  const toutesEnEchec = (fabrique) => {
    m.klassci.getClasses.mockRejectedValue(fabrique())
    m.klassci.getMatieres.mockRejectedValue(fabrique())
    m.klassci.getEnseignants.mockRejectedValue(fabrique())
    m.analytics.getSystemMetrics.mockRejectedValue(fabrique())
    m.adminStatistics.getAdminStatistics.mockRejectedValue(fabrique())
  }

  it('que des refus : pas de Réessayer', async () => {
    toutesEnEchec(refus)
    const u = await monter(useAdminStats)
    expect(u.error.value).toBeTruthy()
    expect(u.canRetry.value).toBe(false)
  })

  it('une seule source en panne parmi des refus : Réessayer (un essai peut la lever)', async () => {
    toutesEnEchec(refus)
    m.analytics.getSystemMetrics.mockRejectedValue(panne503())
    expect((await monter(useAdminStats)).canRetry.value).toBe(true)
  })
})

describe('TeacherClasses : canRetry relayé', () => {
  it('401 : pas de Réessayer ; 503 : Réessayer', async () => {
    m.lmsClasses.getTeacherClasses.mockRejectedValue(refus())
    expect((await monter(useTeacherClasses)).canRetry.value).toBe(false)
    m.lmsClasses.getTeacherClasses.mockRejectedValue(panne503())
    expect((await monter(useTeacherClasses)).canRetry.value).toBe(true)
  })
})

describe('TeacherHub : canRetry relayé', () => {
  const toutEnEchec = (fabrique) => {
    m.klassci.getTeacherDashboard.mockRejectedValue(fabrique())
    m.lms.getMyTeachingSeances.mockRejectedValue(fabrique())
    m.lessons.getLessons.mockRejectedValue(fabrique())
    m.klassci.getClasses.mockRejectedValue(fabrique())
  }

  it('401 : pas de Réessayer ; 503 : Réessayer', async () => {
    toutEnEchec(refus)
    expect((await monter(useTeacherHub)).canRetry.value).toBe(false)
    toutEnEchec(panne503)
    expect((await monter(useTeacherHub)).canRetry.value).toBe(true)
  })
})
