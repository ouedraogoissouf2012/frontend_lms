/**
 * Test de rendu CourseCard (#G1 ≤300, #437) : titre + libellé de type, troncature, et
 * navigation par un VRAI lien.
 *
 * #437 : la carte était un `role="button"` contenant un `<button>` (défaut axe
 * `nested-interactive`, WCAG 4.1.2). Au clavier, Entrée sur le bouton interne
 * déclenchait la navigation DEUX fois (son `keydown` remonté à la carte, puis le
 * `click` natif du bouton) — mesuré dans un vrai navigateur. Naviguer est le rôle
 * d'un lien : la carte en devient un, et « Voir le cours » devient décoratif.
 *
 * Données : un cours de la capture RÉELLE `tests/fixtures/api/myCourses.js`.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, it, expect, vi } from 'vitest'
import CourseCard from '@/components/student/CourseCard.vue'
import { MY_COURSES_CAPTURES } from '../fixtures/api/myCourses'

const COURS = MY_COURSES_CAPTURES.klassci_page_1_defaut.body.data[0]
const ROUTE = { name: 'lesson-details', params: { id: COURS.id } }

function routeur() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/student/lessons/:id', name: 'lesson-details', component: { template: '<div />' } },
    ],
  })
}

const mountCard = (course = {}, to = ROUTE, router = routeur()) =>
  mount(CourseCard, { props: { course: { ...COURS, ...course }, to }, global: { plugins: [router] } })

describe('CourseCard (#G1)', () => {
  it('rend le titre et le libellé de type', () => {
    const w = mountCard({ type: 'tp' })
    expect(w.find('.course-title').text()).toBe(COURS.title)
    expect(w.find('.course-type-badge').text()).toBe('TP')
  })

  it('retombe sur "Cours" pour un type inconnu', () => {
    const w = mountCard({ type: 'inconnu' })
    expect(w.find('.course-type-badge').text()).toBe('Cours')
  })

  it('tronque une description trop longue', () => {
    const w = mountCard({ description: 'a'.repeat(120) })
    const rendered = w.find('.course-description').text()
    expect(rendered.endsWith('…')).toBe(true)
    expect(rendered).toHaveLength(81) // 80 + caractère ellipse
  })
})

describe('CourseCard — un seul élément interactif, un vrai lien (#437)', () => {
  it('la carte est un lien vers la leçon', () => {
    const w = mountCard()
    const lien = w.find('a.course-card')
    expect(lien.exists()).toBe(true)
    expect(lien.attributes('href')).toBe(`/student/lessons/${COURS.id}`)
    // WCAG 2.5.3 (Label in Name) : le nom accessible CONTIENT le texte visible « Voir le cours ».
    expect(lien.attributes('aria-label')).toBe(`Voir le cours ${COURS.title}`)
    expect(lien.attributes('aria-label')).toContain(w.find('.course-button span').text())
  })

  it("ne contient aucun bouton ni élément focalisable imbriqué", () => {
    const w = mountCard()
    expect(w.findAll('button')).toHaveLength(0)
    expect(w.findAll('[tabindex]')).toHaveLength(0)
    expect(w.find('.course-button').attributes('aria-hidden')).toBe('true')
  })

  it('activation clavier comme le navigateur (keydown Entrée puis click) : UNE seule navigation', async () => {
    const router = routeur()
    await router.push('/')
    const push = vi.spyOn(router, 'push')
    const w = mountCard({}, ROUTE, router)
    // Le navigateur envoie keydown Entrée à l'élément focalisé, puis son click.
    const cible = w.find('.course-button').element.closest('a, button') ?? w.find('.course-card').element
    cible.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    cible.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await flushPromises()
    // Toutes les voies d'activation comptent : navigation du lien OU émission
    // `select` (l'ancienne carte émettait deux `select` pour une seule touche).
    const activations = push.mock.calls.length + (w.emitted('select')?.length ?? 0)
    expect(activations).toBe(1)
    expect(router.currentRoute.value.fullPath).toBe(`/student/lessons/${COURS.id}`)
  })

  it('sans route (cours sans id), la carte n’est pas un lien', () => {
    const w = mountCard({ id: undefined }, null)
    expect(w.find('a').exists()).toBe(false)
    expect(w.find('.course-card').exists()).toBe(true)
  })

  it('sans route, rien ne promet un clic : pas de « Voir le cours », pas de classe interactive', () => {
    const w = mountCard({ id: undefined }, null)
    expect(w.find('.course-button').exists()).toBe(false)
    expect(w.find('.course-card').classes()).toContain('is-inerte')
  })

  it('sans route, la carte focalisable par programme se nomme (role group + titre)', () => {
    const carte = mountCard({ id: undefined }, null).find('.course-card')
    expect(carte.attributes('tabindex')).toBe('-1')
    expect(carte.attributes('role')).toBe('group')
    expect(carte.attributes('aria-label')).toBe(COURS.title)
  })

  it('avec route, la carte n’est pas marquée inerte', () => {
    expect(mountCard().find('.course-card').classes()).not.toContain('is-inerte')
  })
})
