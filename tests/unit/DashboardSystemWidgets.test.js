/**
 * Test de rendu DashboardSystemWidgets : widgets « Activité Système » et
 * « Vue d'Ensemble » du tableau de bord admin.
 *
 * Enjeu : distinguer « mesuré à zéro » de « jamais mesuré ». L'ancien rendu
 * `{{ stats?.x || 0 }}` affichait `0` dans les deux cas — une métrique sans
 * aucune source s'y lisait comme un comptage crédible.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import DashboardSystemWidgets from '@/components/dashboard/DashboardSystemWidgets.vue'

const values = (w) => w.findAll('.stat-value').map(n => n.text())

describe('DashboardSystemWidgets', () => {
  it('affiche les compteurs mesurés tels quels', () => {
    const w = mount(DashboardSystemWidgets, {
      props: { stats: { nb_seances_actives: 3, nb_evaluations: 42, nb_filieres: 11, nb_niveaux: 8 } },
    })
    expect(values(w)).toEqual(['3', '42', '11', '8'])
  })

  it('rend « 0 » pour un compteur RÉELLEMENT mesuré à zéro', () => {
    const w = mount(DashboardSystemWidgets, {
      props: { stats: { nb_seances_actives: 0, nb_evaluations: 0, nb_filieres: 0, nb_niveaux: 0 } },
    })
    expect(values(w)).toEqual(['0', '0', '0', '0'])
    expect(w.findAll('.stat-value')[0].attributes('title')).toBe('')
  })

  it('rend « — » pour une valeur NON mesurée (null/undefined), jamais un 0 fabriqué', () => {
    const w = mount(DashboardSystemWidgets, {
      props: { stats: { nb_seances_actives: null, nb_evaluations: undefined, nb_filieres: 11, nb_niveaux: 8 } },
    })
    expect(values(w)).toEqual(['—', '—', '11', '8'])
  })

  it('explique le tiret par une infobulle', () => {
    const w = mount(DashboardSystemWidgets, { props: { stats: { nb_seances_actives: null } } })
    expect(w.findAll('.stat-value')[0].attributes('title')).toBe('Donnée non disponible pour le moment')
  })

  it('ne casse pas sans stats du tout', () => {
    const w = mount(DashboardSystemWidgets)
    expect(values(w)).toEqual(['—', '—', '—', '—'])
  })
})
