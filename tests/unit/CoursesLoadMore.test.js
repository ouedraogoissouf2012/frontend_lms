/**
 * CoursesLoadMore (#434) : compteur « N cours affichés sur M » toujours visible, et
 * bouton « Charger plus » tant qu'une page reste à charger.
 *
 * La région `role="status"` existe AVANT tout chargement : un lecteur d'écran rate
 * l'annonce d'une région créée dynamiquement. Elle porte le message COMPLET, pas
 * seulement le chiffre.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CoursesLoadMore from '@/components/student/CoursesLoadMore.vue'

const monter = (props = {}) =>
  mount(CoursesLoadMore, { props: { shown: 15, total: 18, hasMore: true, loading: false, error: null, ...props } })

describe('CoursesLoadMore (#434)', () => {
  it('rend une région status polie, même sans total connu', () => {
    const w = monter({ shown: 0, total: null, hasMore: false })
    const status = w.find('[role="status"]')
    expect(status.exists()).toBe(true)
    expect(status.attributes('aria-live')).toBe('polite')
    expect(status.text()).toBe('')
  })

  it('annonce « 15 cours affichés sur 18 »', () => {
    expect(monter().find('[role="status"]').text()).toBe('15 cours affichés sur 18')
  })

  it('annonce « 18 cours » quand tout est affiché', () => {
    expect(monter({ shown: 18, hasMore: false }).find('[role="status"]').text()).toBe('18 cours')
  })

  it('émet more au clic sur Charger plus', async () => {
    const w = monter()
    await w.find('button.load-more-btn').trigger('click')
    expect(w.emitted('more')).toHaveLength(1)
  })

  it('masque le bouton quand il ne reste rien à charger', () => {
    expect(monter({ shown: 18, hasMore: false }).find('button.load-more-btn').exists()).toBe(false)
  })

  it('désactive le bouton pendant le chargement', () => {
    const btn = monter({ loading: true }).find('button.load-more-btn')
    expect(btn.attributes('disabled')).toBeDefined()
    expect(btn.text()).toContain('Chargement')
  })

  it("affiche l'erreur du chargement suivant sans masquer le bouton (qui sert à réessayer)", async () => {
    const w = monter({ error: 'Connexion impossible.' })
    expect(w.find('.load-more-error').text()).toContain('Connexion impossible.')
    await w.find('button.load-more-btn').trigger('click')
    expect(w.emitted('more')).toHaveLength(1)
  })
})
