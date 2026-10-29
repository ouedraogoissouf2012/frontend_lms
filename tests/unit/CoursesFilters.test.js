/**
 * Test de rendu CoursesFilters (#G1 ≤300, #437) : v-model matière/enseignant, émission
 * `apply` au @change des selects et `reset` au clic du bouton.
 *
 * #437 : les ids envoyés par le serveur sont des ENTIERS (capture réelle), le modèle
 * était déclaré `String` — Vue avertissait à chaque sélection (mesuré, y compris sous
 * vue 3.5.42). Le modèle est désormais `Number | null`, `null` signifiant « tous ».
 * L'ancien test passait des ids chaînes (`'m1'`) inventés : il ne pouvait pas le voir.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, afterEach } from 'vitest'
import CoursesFilters from '@/components/student/CoursesFilters.vue'
import { MY_COURSES_CAPTURES } from '../fixtures/api/myCourses'

const availableFilters = MY_COURSES_CAPTURES.klassci_page_1_defaut.body.filters
const [MATH, ALGO] = availableFilters.matieres
const [, PROF_2] = availableFilters.enseignants

const warnHandler = vi.fn()
const mountFilters = (props = {}) =>
  mount(CoursesFilters, {
    props: { availableFilters, selectedMatiere: null, selectedEnseignant: null, ...props },
    global: { config: { warnHandler } },
  })

afterEach(() => warnHandler.mockReset())

describe('CoursesFilters (#G1)', () => {
  it("rend les options de matière et d'enseignant", () => {
    const w = mountFilters()
    expect(w.html()).toContain(MATH.name)
    expect(w.html()).toContain(PROF_2.name)
  })

  it('v-model émet l’id ENTIER et apply au changement de matière', async () => {
    const w = mountFilters()
    await w.findAll('.filter-select')[0].findAll('option')[2].setSelected()
    expect(w.emitted('update:selectedMatiere')[0]).toEqual([ALGO.id])
    expect(typeof w.emitted('update:selectedMatiere')[0][0]).toBe('number')
    expect(w.emitted('apply')).toBeTruthy()
  })

  it('v-model émet l’id ENTIER et apply au changement d’enseignant', async () => {
    const w = mountFilters()
    await w.findAll('.filter-select')[1].findAll('option')[2].setSelected()
    expect(w.emitted('update:selectedEnseignant')[0]).toEqual([PROF_2.id])
    expect(w.emitted('apply')).toBeTruthy()
  })

  it('l’option « Toutes les matières » rend null, pas une chaîne vide', async () => {
    const w = mountFilters({ selectedMatiere: ALGO.id })
    await w.findAll('.filter-select')[0].findAll('option')[0].setSelected()
    expect(w.emitted('update:selectedMatiere')[0]).toEqual([null])
  })

  it('aucun avertissement Vue avec des ids entiers sélectionnés', () => {
    mountFilters({ selectedMatiere: ALGO.id, selectedEnseignant: PROF_2.id })
    expect(warnHandler).not.toHaveBeenCalled()
  })

  it('affiche le bouton reset et émet reset au clic', async () => {
    const w = mountFilters({ selectedMatiere: ALGO.id })
    const btn = w.find('.reset-filters-btn')
    expect(btn.exists()).toBe(true)
    await btn.trigger('click')
    expect(w.emitted('reset')).toBeTruthy()
  })

  it('masque le bouton reset si aucun filtre actif', () => {
    const w = mountFilters()
    expect(w.find('.reset-filters-btn').exists()).toBe(false)
  })
})
