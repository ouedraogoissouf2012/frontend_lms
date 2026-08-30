/**
 * Cartes KPI du tableau de bord admin : distinction « mesuré » / « non mesuré ».
 *
 * Constaté en navigation réelle : quand le chargement KLASSCI échoue, le composable
 * laisse `stats` vide et les 4 cartes affichent « Enseignants 0, Étudiants 0,
 * Classes 0, Matières 0 ». L'écran présente donc une PANNE comme un établissement
 * vide — un administrateur y lit un fait, pas une erreur.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import DashboardStatsCards from '@/components/dashboard/DashboardStatsCards.vue'

// Mouvement réduit : le count-up pose la valeur finale au 1er rendu, ce qui rend
// les assertions synchrones et déterministes.
const originalMatchMedia = window.matchMedia
beforeEach(() => {
  window.matchMedia = vi.fn(() => ({
    matches: true, media: '', addEventListener() {}, removeEventListener() {},
  }))
})
afterEach(() => { window.matchMedia = originalMatchMedia })

const values = (w) => w.findAll('.stat-value').map(n => n.text())

describe('DashboardStatsCards — mesuré vs non mesuré', () => {
  it('affiche les compteurs mesurés', () => {
    const w = mount(DashboardStatsCards, {
      props: {
        stats: {
          nb_enseignants: 6, nb_etudiants: 210,
          nb_classes_actives: 17, nb_matieres_actives: 452,
        },
      },
    })
    expect(values(w)).toEqual(['6', '210', '17', '452'])
  })

  it('affiche « 0 » pour un établissement RÉELLEMENT vide', () => {
    const w = mount(DashboardStatsCards, {
      props: {
        stats: {
          nb_enseignants: 0, nb_etudiants: 0,
          nb_classes_actives: 0, nb_matieres_actives: 0,
        },
      },
    })
    expect(values(w)).toEqual(['0', '0', '0', '0'])
  })

  it('affiche « — » quand la donnée n’a PAS été mesurée (échec de chargement)', () => {
    const w = mount(DashboardStatsCards, {
      props: {
        stats: {
          nb_enseignants: null, nb_etudiants: null,
          nb_classes_actives: null, nb_matieres_actives: null,
        },
      },
    })
    expect(values(w)).toEqual(['—', '—', '—', '—'])
  })

  it('affiche « — » sans stats du tout, plutôt que quatre zéros', () => {
    const w = mount(DashboardStatsCards)
    expect(values(w)).toEqual(['—', '—', '—', '—'])
  })

  it('traite chaque carte indépendamment (mesure partielle)', () => {
    const w = mount(DashboardStatsCards, {
      props: { stats: { nb_enseignants: 6, nb_etudiants: null, nb_classes_actives: 0, nb_matieres_actives: undefined } },
    })
    expect(values(w)).toEqual(['6', '—', '0', '—'])
  })
})
