/**
 * « Mes leçons » et le hub enseignant voient TOUTES les leçons, pas la première page.
 *
 * `GET /lessons` est paginé (LessonListService : `paginate($request->integer('per_page', 15))`,
 * `per_page` borné à 100 par FilterLessonsRequest). Le front n'envoyait ni page ni `per_page` :
 * au-delà de 15 leçons, « Mes leçons » était tronqué, ses compteurs (Total, Publiées…) faux, et le
 * compteur du hub plafonnait à 15. Constat de la revue indépendante de #503.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const api = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/services/api', () => ({ default: api }))

import lessonService from '@/services/lesson'

const lecons = (debut, n) => Array.from({ length: n }, (_, i) => ({ id: debut + i, status: 'published' }))
const page = (courante, derniere, liste, total) => ({ success: true, data: { data: liste, current_page: courante, last_page: derniere, total } })

beforeEach(() => { api.get.mockReset() })

describe('lessonService.getAllLessons — suit toutes les pages', () => {
  it('3 pages : 35 leçons, demandées par 100 avec le filtre de l’appelant', async () => {
    api.get
      .mockResolvedValueOnce(page(1, 3, lecons(1, 15), 35))
      .mockResolvedValueOnce(page(2, 3, lecons(16, 15), 35))
      .mockResolvedValueOnce(page(3, 3, lecons(31, 5), 35))
    const r = await lessonService.getAllLessons({ enseignant_id: 42 })
    expect(r.success).toBe(true)
    expect(r.data).toHaveLength(35)
    expect(api.get.mock.calls.map(([, o]) => o.params)).toEqual([
      { enseignant_id: 42, per_page: 100, page: 1 },
      { enseignant_id: 42, per_page: 100, page: 2 },
      { enseignant_id: 42, per_page: 100, page: 3 },
    ])
  })

  it('une seule page : un seul appel', async () => {
    api.get.mockResolvedValueOnce(page(1, 1, lecons(1, 3), 3))
    const r = await lessonService.getAllLessons({ enseignant_id: 42 })
    expect(r.data).toHaveLength(3)
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  it('une réponse non paginée (liste plate) est rendue telle quelle', async () => {
    api.get.mockResolvedValueOnce({ success: true, data: lecons(1, 2) })
    const r = await lessonService.getAllLessons({})
    expect(r.data).toHaveLength(2)
    expect(api.get).toHaveBeenCalledTimes(1)
  })

  it('un refus en cours de route est rendu, sans liste partielle présentée comme complète', async () => {
    api.get
      .mockResolvedValueOnce(page(1, 2, lecons(1, 100), 150))
      .mockResolvedValueOnce({ success: false, reason: 'quelconque' })
    const r = await lessonService.getAllLessons({ enseignant_id: 42 })
    expect(r.success).toBe(false)
  })
})

describe('« Mes leçons » charge toutes les pages', () => {
  async function ecran(reponse) {
    vi.resetModules()
    const tout = vi.fn().mockResolvedValue(reponse)
    const ecrireCache = vi.fn()
    vi.doMock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
    vi.doMock('@/services/cache', () => ({ readCache: () => null, writeCache: ecrireCache }))
    vi.doMock('@/services/lesson', () => ({ default: { getAllLessons: tout, getLessons: vi.fn() } }))
    vi.doMock('@/services/teacherReferentials', () => ({ fetchTeacherMatieres: vi.fn().mockResolvedValue([]) }))
    vi.doMock('@/stores/auth', () => ({ useAuthStore: () => ({ currentUser: { id: 42 } }) }))
    const { useTeacherLessons } = await import('@/composables/useTeacherLessons')
    let c
    mount(defineComponent({ setup() { c = useTeacherLessons(); return () => null } }))
    await flushPromises()
    const leconsEcrites = ecrireCache.mock.calls.filter(([cle]) => cle === 'teacher_lessons_v2')
    return { c, tout, leconsEcrites }
  }

  it('l’écran demande la liste complète de l’enseignant', async () => {
    const { c, tout } = await ecran({ success: true, data: lecons(1, 35) })
    expect(tout).toHaveBeenCalledWith({ enseignant_id: 42 })
    expect(c.stats.value.total).toBe(35)
  })

  it('un refus en cours de route : erreur affichée, aucune liste vide présentée ni mise en cache', async () => {
    const { c, leconsEcrites } = await ecran({ success: false })
    expect(c.error.value).toBeTruthy()
    expect(c.lessons.value).toEqual([])
    expect(leconsEcrites).toEqual([])
  })

  it('une liste tronquée par le garde-fou (incomplete) n’est pas mise en cache comme complète', async () => {
    const { c, leconsEcrites } = await ecran({ success: true, data: lecons(1, 5), incomplete: true })
    expect(c.lessons.value).toHaveLength(5)
    expect(leconsEcrites).toEqual([])
  })
})
