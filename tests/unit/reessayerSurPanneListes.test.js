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
  // Utilisateur connecté (store) : `null` = identité inconnue, sans requête de leçons.
  utilisateur: { courant: { id: 42, role: 'enseignant' } },
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
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ get currentUser() { return m.utilisateur.courant } }) }))

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
  m.utilisateur.courant = { id: 42, role: 'enseignant' }
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

// Revue de #518 : un « vrai » de canRetry ne prouve rien seul (il démarre vrai) ; `juger` exige
// d'abord que l'échec soit bien constaté (`error` posé), puis rend canRetry.
async function juger(useX) {
  const u = await monter(useX)
  expect(u.error.value).toBeTruthy()
  return u.canRetry.value
}

describe('AdminEnseignants : canRetry relayé', () => {
  // Le cas mixte (portail enrichi en panne, repli refusé) relève du lot 3b : non tranché ici.
  it('les deux sources refusent : pas de Réessayer ; les deux en panne : Réessayer', async () => {
    m.klassci.getLmsEnseignants.mockRejectedValue(refus())
    m.klassci.getEnseignants.mockRejectedValue(refus())
    expect(await juger(useAdminEnseignants)).toBe(false)
    m.klassci.getLmsEnseignants.mockRejectedValue(panne503())
    m.klassci.getEnseignants.mockRejectedValue(panne503())
    expect(await juger(useAdminEnseignants)).toBe(true)
  })
})

// Règle validée (ARRÊT 1 de la PR B), appliquée ici aussi par la revue de #518 : un 2xx
// « success: false » n'est un refus définitif qu'avec un `reason` CONNU du catalogue ; sans lui,
// c'est une anomalie qu'un nouvel essai peut lever.
describe('AdminMatieres : canRetry relayé ; « success: false » refus seulement avec un reason connu', () => {
  it('2xx « success: false » avec reason connu : pas de Réessayer ; sans reason : Réessayer', async () => {
    m.klassci.getAdminMatieres.mockResolvedValue({ success: false, reason: 'klassci_token_missing' })
    expect(await juger(useAdminMatieres)).toBe(false)
    m.klassci.getAdminMatieres.mockResolvedValue({ success: false })
    expect(await juger(useAdminMatieres)).toBe(true)
  })

  it('401 : pas de Réessayer ; 500 et 503 (pannes) : Réessayer', async () => {
    m.klassci.getAdminMatieres.mockRejectedValue(refus())
    expect(await juger(useAdminMatieres)).toBe(false)
    m.klassci.getAdminMatieres.mockRejectedValue(panne500())
    expect(await juger(useAdminMatieres)).toBe(true)
    m.klassci.getAdminMatieres.mockRejectedValue(panne503())
    expect(await juger(useAdminMatieres)).toBe(true)
  })
})

describe('AdminSeances : canRetry relayé ; « success: false » refus seulement avec un reason connu', () => {
  it('2xx « success: false » avec reason connu : pas de Réessayer ; sans reason : Réessayer', async () => {
    m.klassci.getSeances.mockResolvedValue({ success: false, reason: 'klassci_token_missing' })
    expect(await juger(useAdminSeances)).toBe(false)
    m.klassci.getSeances.mockResolvedValue({ success: false })
    expect(await juger(useAdminSeances)).toBe(true)
  })

  it('401 : pas de Réessayer ; 503 : Réessayer', async () => {
    m.klassci.getSeances.mockRejectedValue(refus())
    expect(await juger(useAdminSeances)).toBe(false)
    m.klassci.getSeances.mockRejectedValue(panne503())
    expect(await juger(useAdminSeances)).toBe(true)
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

  it('que des refus : pas de Réessayer, et le message dit le motif, jamais « Réessayez »', async () => {
    toutesEnEchec(refus)
    const u = await monter(useAdminStats)
    expect(u.canRetry.value).toBe(false)
    expect(u.error.value).toBe(refus().userMessage)
    expect(u.error.value).not.toMatch(/R[ée]essayez/)
  })

  it('une seule source en panne parmi des refus : Réessayer (un essai peut la lever)', async () => {
    toutesEnEchec(refus)
    m.analytics.getSystemMetrics.mockRejectedValue(panne503())
    expect(await juger(useAdminStats)).toBe(true)
  })
})

describe('TeacherClasses : canRetry relayé', () => {
  it('401 : pas de Réessayer ; 503 : Réessayer', async () => {
    m.lmsClasses.getTeacherClasses.mockRejectedValue(refus())
    expect(await juger(useTeacherClasses)).toBe(false)
    m.lmsClasses.getTeacherClasses.mockRejectedValue(panne503())
    expect(await juger(useTeacherClasses)).toBe(true)
  })
})

describe('TeacherHub : canRetry relayé ; une seule panne parmi les quatre sources suffit', () => {
  const toutEnEchec = (fabrique) => {
    m.klassci.getTeacherDashboard.mockRejectedValue(fabrique())
    m.lms.getMyTeachingSeances.mockRejectedValue(fabrique())
    m.lessons.getLessons.mockRejectedValue(fabrique())
    m.klassci.getClasses.mockRejectedValue(fabrique())
  }

  it('que des refus : pas de Réessayer ; que des pannes : Réessayer', async () => {
    toutEnEchec(refus)
    expect(await juger(useTeacherHub)).toBe(false)
    toutEnEchec(panne503)
    expect(await juger(useTeacherHub)).toBe(true)
  })

  it('tableau de bord refusé mais leçons en panne (source locale du LMS) : Réessayer', async () => {
    toutEnEchec(refus)
    m.lessons.getLessons.mockRejectedValue(panne500())
    expect(await juger(useTeacherHub)).toBe(true)
  })

  it('identité inconnue (aucune requête de leçons) et refus partout ailleurs : pas de Réessayer', async () => {
    toutEnEchec(refus)
    m.utilisateur.courant = null
    expect(await juger(useTeacherHub)).toBe(false)
    expect(m.lessons.getLessons).not.toHaveBeenCalled()
  })
})
