/**
 * « Mes leçons » de l'enseignant (/teacher/lessons).
 *
 * Décision D72 de l'utilisateur : un enseignant ne voit pas les leçons de ses collègues dans
 * « Mes leçons ». Constat E2E (09/11/2026, école créée depuis le LMS) : l'écran listait aussi la
 * leçon publiée d'un collègue (Total 4 pour 3 leçons créées). Le serveur sait filtrer
 * (`GET /lessons?enseignant_id=`, FilterLessonsRequest) : le front ne le lui demandait pas.
 *
 * Même écran : « Matière inconnue » sur chaque carte. `GET /lessons` charge la matière de chaque
 * leçon (LessonListService : `with(['matiere', …])`, champ `libelle`), mais le libellé n'était
 * cherché que dans le catalogue de matières de l'enseignant, vide dans ce type d'école.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))

let cacheStore = {}
vi.mock('@/services/cache', () => ({
  readCache: (k) => (k in cacheStore ? cacheStore[k] : null),
  writeCache: (k, v) => { cacheStore[k] = v },
}))

const h = vi.hoisted(() => ({ getLessons: vi.fn(), matieres: vi.fn(), user: { value: null } }))
vi.mock('@/services/lesson', () => ({ default: { getLessons: (...a) => h.getLessons(...a) } }))
vi.mock('@/services/teacherReferentials', () => ({ fetchTeacherMatieres: (...a) => h.matieres(...a) }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ get currentUser() { return h.user.value } }) }))

import { useTeacherLessons } from '@/composables/useTeacherLessons'
import { getLessonMatiereLabel } from '@/utils/matieres'
import TeacherLessonCard from '@/components/lessons/TeacherLessonCard.vue'

const MIENNE = { id: 1, title: 'Fractions, introduction', status: 'published', matiere_id: 7, enseignant_id: 42, matiere: { id: 7, libelle: 'Mathematiques' } }

async function monter() {
  let api
  mount(defineComponent({ setup() { api = useTeacherLessons(); return () => null } }))
  await flushPromises()
  return api
}

beforeEach(() => {
  cacheStore = {}
  h.user.value = { id: 42, role: 'enseignant' }
  h.getLessons.mockReset().mockResolvedValue({ success: true, data: [MIENNE] })
  h.matieres.mockReset().mockResolvedValue([])
})

describe('« Mes leçons » ne montre que les leçons de l’enseignant connecté (D72)', () => {
  it('la liste est demandée pour CET enseignant', async () => {
    await monter()
    expect(h.getLessons).toHaveBeenCalledWith({ enseignant_id: 42 })
  })

  it('le rafraîchissement d’arrière-plan aussi', async () => {
    await monter() // remplit le cache
    await monter() // lit le cache, puis rafraîchit
    expect(h.getLessons).toHaveBeenCalledTimes(2)
    for (const appel of h.getLessons.mock.calls) expect(appel).toEqual([{ enseignant_id: 42 }])
  })

  it('sans identité connue, aucune liste de l’établissement n’est demandée', async () => {
    h.user.value = null
    const c = await monter()
    expect(h.getLessons).not.toHaveBeenCalled()
    expect(c.lessons.value).toEqual([])
    expect(c.error.value).toBeTruthy()
  })

  it('le cache d’avant (qui portait les leçons des collègues) n’est plus relu', async () => {
    cacheStore.teacher_lessons = [{ id: 9, title: 'Lecture suivie', status: 'published', enseignant_id: 77 }]
    // Le serveur ne répond pas : un rafraîchissement ne peut pas masquer une lecture de l'ancien cache.
    h.getLessons.mockRejectedValue(new Error('hors ligne'))
    const c = await monter()
    expect(c.lessons.value.map((l) => l.id)).not.toContain(9)
  })
})

describe('le libellé de matière vient d’abord de la leçon elle-même', () => {
  it('la matière portée par la leçon, catalogue vide', () => {
    expect(getLessonMatiereLabel(MIENNE, [])).toBe('Mathematiques')
  })

  it('le catalogue de l’enseignant quand la leçon ne porte pas sa matière', () => {
    expect(getLessonMatiereLabel({ matiere_id: 7 }, [{ id: 7, name: 'Maths' }])).toBe('Maths')
  })

  it('« Matière inconnue » seulement si ni la leçon ni le catalogue ne la nomment', () => {
    expect(getLessonMatiereLabel({ matiere_id: 7 }, [])).toBe('Matière inconnue')
    expect(getLessonMatiereLabel(null, [])).toBe('Matière inconnue')
  })

  it('la carte de leçon affiche la matière de la leçon, catalogue vide', () => {
    const w = mount(TeacherLessonCard, { props: { lesson: MIENNE, matieres: [] } })
    expect(w.find('.lesson-matiere').text()).toContain('Mathematiques')
  })
})
