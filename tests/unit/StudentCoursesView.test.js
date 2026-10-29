/**
 * Vue StudentCourses (#434) : la région d'annonce existe dès le montage, et le focus
 * ne se perd pas quand le bouton « Charger plus » disparaît en fin de liste.
 * Le composable est remplacé par un double : la logique est testée à part.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { ref, computed } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MY_COURSES_CAPTURES } from '../fixtures/api/myCourses'

const P1 = MY_COURSES_CAPTURES.klassci_page_1_defaut.body
const P2 = MY_COURSES_CAPTURES.klassci_page_2_defaut.body

let etat
vi.mock('@/composables/useStudentCourses', () => ({ useStudentCourses: () => etat }))

import StudentCourses from '@/views/student/StudentCourses.vue'

function doubleComposable({ chargement = false } = {}) {
  const courses = ref(chargement ? [] : [...P1.data])
  const meta = ref(chargement ? null : { ...P1.meta })
  return {
    courses,
    loading: ref(chargement),
    error: ref(null),
    selectedMatiere: ref(''),
    selectedEnseignant: ref(''),
    availableFilters: ref(chargement ? { matieres: [], enseignants: [] } : P1.filters),
    totalCount: computed(() => meta.value?.total ?? null),
    hasMore: computed(() => !!meta.value && meta.value.current_page < meta.value.last_page),
    loadingMore: ref(false),
    loadMoreError: ref(null),
    loadCourses: vi.fn(),
    applyFilters: vi.fn(),
    resetFilters: vi.fn(),
    navigateToCourse: vi.fn(),
    loadMore: vi.fn(async () => {
      courses.value = [...courses.value, ...P2.data]
      meta.value = { ...P2.meta }
    }),
  }
}

const monter = () =>
  mount(StudentCourses, {
    attachTo: document.body,
    global: { stubs: { DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: true, 'router-link': true } },
  })

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('StudentCourses (#434)', () => {
  it('la région status existe AVANT le premier chargement', () => {
    etat = doubleComposable({ chargement: true })
    const w = monter()
    expect(w.find('[role="status"]').exists()).toBe(true)
    w.unmount()
  })

  it('affiche le compteur réel « 15 cours affichés sur 18 »', () => {
    etat = doubleComposable()
    const w = monter()
    expect(w.find('[role="status"]').text()).toBe('15 cours affichés sur 18')
    w.unmount()
  })

  it('quand le bouton disparaît en fin de liste, le focus passe à la première carte ajoutée', async () => {
    etat = doubleComposable()
    const w = monter()
    const btn = w.find('button.load-more-btn')
    btn.element.focus()
    await btn.trigger('click')
    await flushPromises()
    expect(w.find('button.load-more-btn').exists()).toBe(false)
    const cartes = w.findAll('.course-card')
    expect(cartes).toHaveLength(18)
    expect(document.activeElement).toBe(cartes[15].element)
    w.unmount()
  })
})
