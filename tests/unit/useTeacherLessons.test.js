/**
 * Test du composable useTeacherLessons (#H4 ≤300) : chargement (API), filtres, stats,
 * navigation. vue-router, klassci/lesson services et cache mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const push = vi.fn()
vi.mock('vue-router', () => ({ useRouter: () => ({ push }) }))
// « Mes leçons » est la liste de l'enseignant CONNECTÉ (D72) : il faut une identité.
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ currentUser: { id: 42, role: 'enseignant' } }) }))

let cacheStore = {}
vi.mock('@/services/cache', () => ({
  readCache: (k) => (k in cacheStore ? cacheStore[k] : null),
  writeCache: (k, v) => { cacheStore[k] = v }
}))

const lessonsPayload = [
  { id: 1, title: 'A', status: 'published', type: 'video', matiere_id: 7 },
  { id: 2, title: 'B', status: 'draft', type: 'document', matiere_id: 7 },
  { id: 3, title: 'C', status: 'archived', type: 'tp', matiere_id: 8 }
]

const h = vi.hoisted(() => ({
  getLessons: vi.fn(),
  getMatieres: vi.fn(),
}))

vi.mock('@/services/lesson', () => ({
  default: {
    getAllLessons: (...a) => h.getLessons(...a)
  }
}))
vi.mock('@/services/klassci', () => ({
  klassciService: { getMatieres: (...a) => h.getMatieres(...a) }
}))

import { useTeacherLessons } from '@/composables/useTeacherLessons'
import { TEACHER_MATIERES_CACHE } from '@/constants/cacheKeys'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useTeacherLessons(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useTeacherLessons (#H4)', () => {
  beforeEach(() => {
    cacheStore = {}
    push.mockClear()
    h.getLessons.mockReset().mockResolvedValue({ success: true, data: { data: lessonsPayload } })
    h.getMatieres.mockReset().mockResolvedValue([{ id: 7, name: 'Maths' }])
  })

  it('charge les leçons depuis la structure paginée et calcule les stats', async () => {
    const c = await setup()
    expect(c.lessons.value).toHaveLength(3)
    expect(c.stats.value).toEqual({ total: 3, published: 1, draft: 1, archived: 1 })
  })

  it('charge les leçons depuis une enveloppe plate { data: [...] }', async () => {
    h.getLessons.mockResolvedValue({ success: true, data: lessonsPayload })
    const c = await setup()
    expect(c.lessons.value).toHaveLength(3)
  })

  it('charge une liste vide si l\'enveloppe n\'a pas de tableau', async () => {
    h.getLessons.mockResolvedValue({ success: true })
    const c = await setup()
    expect(c.lessons.value).toEqual([])
  })

  it('charge les matières depuis l\'enveloppe nommée { matieres: [...] }', async () => {
    h.getMatieres.mockResolvedValue({ matieres: [{ id: 7, name: 'Maths' }, { id: 8, name: 'Physique' }] })
    const c = await setup()
    expect(c.matieres.value).toHaveLength(2)
    expect(cacheStore[TEACHER_MATIERES_CACHE]).toHaveLength(2)
  })

  it('filtre par statut et par matière', async () => {
    const c = await setup()
    c.filters.status = 'draft'
    expect(c.filteredLessons.value).toHaveLength(1)
    expect(c.filteredLessons.value[0].id).toBe(2)
    c.filters.status = ''
    c.filters.matiere_id = 8
    expect(c.filteredLessons.value).toHaveLength(1)
    expect(c.filteredLessons.value[0].id).toBe(3)
  })

  it('resetFilters remet tous les filtres à vide', async () => {
    const c = await setup()
    c.filters.status = 'draft'; c.filters.type = 'tp'; c.filters.matiere_id = 8
    c.resetFilters()
    expect(c.filters).toEqual({ matiere_id: '', status: '', type: '' })
  })

  it('viewChapters navigue vers les chapitres de la leçon', async () => {
    const c = await setup()
    c.viewChapters({ id: 42 })
    expect(push).toHaveBeenCalledWith('/teacher/lessons/42/chapters')
  })
})

// Lot « Réessayer », PR B1 : un refus (401, réponse 2xx « success: false ») ne propose pas
// « Réessayer » ; une panne le propose. Transitions sur la MÊME instance.
describe('useTeacherLessons — Réessayer seulement sur une panne passagère', () => {
  // Cache vidé : sinon l'écran se monte depuis le cache d'un test précédent et l'échec ne touche
  // que le rafraîchissement d'arrière-plan, qui ne pose pas `error`.
  beforeEach(() => {
    cacheStore = {}
    h.getMatieres.mockReset().mockResolvedValue([{ id: 7, name: 'Maths' }])
  })

  it('refus 401, puis panne 503, puis 2xx « success: false » avec et sans reason connu', async () => {
    h.getLessons.mockReset().mockRejectedValue(Object.assign(new Error('HTTP 401'), { response: { status: 401, data: { reason: 'klassci_token_missing' } } }))
    const u = await setup()
    expect(u.error.value).toBeTruthy()
    expect(u.canRetry.value).toBe(false)
    h.getLessons.mockRejectedValue(Object.assign(new Error('HTTP 503'), { response: { status: 503 } }))
    await u.loadLessons()
    expect(u.canRetry.value).toBe(true)
    h.getLessons.mockResolvedValue({ success: false, reason: 'klassci_token_missing' })
    await u.loadLessons()
    expect(u.error.value).toBeTruthy()
    expect(u.canRetry.value).toBe(false)
    // Sans reason : une anomalie qu'un nouvel essai peut lever (règle de l'ARRÊT 1 de la PR B).
    h.getLessons.mockResolvedValue({ success: false })
    await u.loadLessons()
    expect(u.error.value).toBeTruthy()
    expect(u.canRetry.value).toBe(true)
  })
})

// Revue de #519 : le texte disait « Veuillez réessayer » alors que le bouton était caché, et le motif
// connu n'était jamais dit. Le texte suit maintenant l'erreur : son motif, ou un repli neutre.
describe('useTeacherLessons — le message suit le motif du refus', () => {
  beforeEach(() => {
    cacheStore = {}
    h.getMatieres.mockReset().mockResolvedValue([{ id: 7, name: 'Maths' }])
  })
  const MOTIF = "Aucun accès KLASSCI n'est enregistré pour ce compte : les données qui en proviennent ne peuvent pas être affichées."

  it('refus 401 : le message du catalogue, sans « réessayer » ; 2xx motivé : son motif', async () => {
    h.getLessons.mockReset().mockRejectedValue(Object.assign(new Error('HTTP 401'), {
      response: { status: 401, data: { reason: 'klassci_token_missing' } }, userMessage: MOTIF,
    }))
    const u = await setup()
    expect(u.canRetry.value).toBe(false)
    expect(u.error.value).toBe(MOTIF)
    h.getLessons.mockResolvedValue({ success: false, reason: 'klassci_token_missing' })
    await u.loadLessons()
    expect(u.canRetry.value).toBe(false)
    expect(u.error.value).toBe(MOTIF)
    expect(u.error.value).not.toMatch(/r[ée]essayer/i)
  })
})

