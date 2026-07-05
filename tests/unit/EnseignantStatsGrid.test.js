/**
 * Test de RENDU de EnseignantStatsGrid (#G1 décompo — extrait d'EnseignantDetailModal).
 * Vérifie l'affichage des 6 cartes de stats avec les formats d'origine (h, %, .toFixed).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EnseignantStatsGrid from '@/components/admin/EnseignantStatsGrid.vue'

const stats = {
  total_classes: 4,
  total_matieres: 3,
  total_heures_effectuees: 12,
  total_heures_prevues: 20,
  taux_realisation_global: 60.456,
  nb_seances_effectuees: 5,
  nb_seances_total: 8,
}

describe('EnseignantStatsGrid (#G1) — rendu', () => {
  it('rend les 6 cartes de statistiques', () => {
    const w = mount(EnseignantStatsGrid, { props: { stats } })
    expect(w.findAll('.stat-detail-card')).toHaveLength(6)
  })

  it('affiche les valeurs avec les formats d\'origine (h, %, .toFixed(1))', () => {
    const w = mount(EnseignantStatsGrid, { props: { stats } })
    const html = w.html()
    expect(html).toContain('>4<')
    expect(html).toContain('>3<')
    expect(html).toContain('12h')
    expect(html).toContain('20h')
    expect(html).toContain('60.5%')
    expect(html).toContain('5/8')
  })

  it('rend des zéros si les statistiques numériques sont absentes (#13)', () => {
    const w = mount(EnseignantStatsGrid, { props: { stats: {} } })
    const html = w.html()

    expect(w.findAll('.stat-detail-card')).toHaveLength(6)
    expect(html).toContain('0.0%')
    expect(html).toContain('0/0')
  })
})
