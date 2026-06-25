/**
 * Tests de RENDU des sous-composants de l'historique des séances (H7) :
 * SeancePeriodFilters / SeancesTable / SeancesPagination. Vérifie onglets de
 * période, plage custom conditionnelle, recherche, lignes du tableau, classe de
 * taux et events émis.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SeancePeriodFilters from '@/components/attendance/SeancePeriodFilters.vue'
import SeancesTable from '@/components/attendance/SeancesTable.vue'
import SeancesPagination from '@/components/attendance/SeancesPagination.vue'

const periodTabs = [
  { value: 'today', label: 'Aujourd\'hui', icon: 'fa-circle' },
  { value: 'week', label: 'Cette semaine', icon: 'fa-calendar' },
  { value: 'month', label: 'Ce mois', icon: 'fa-calendar-check-o' },
  { value: 'custom', label: 'Personnalisé', icon: 'fa-clock-o' }
]

const fmtDate = (d) => d ? `D(${d})` : '-'
const fmtTime = (d) => d ? `T(${d})` : '-'
const fmtDuration = (m) => m ? `${m}min` : '-'

const seances = [
  { id: 1, klassci_seance_id: 'S1', titre: 'Cours 1', matiere: { nom: 'Maths' }, classe: { nom: '6e A' }, date: '2026-06-01', visio_started_at: '2026-06-01T08:00:00', duree_seance_minutes: 60, participants_count: 12, duree_moyenne_minutes: 45, taux_presence: 90 }
]
const pagination = { current_page: 2, per_page: 50, total: 60, last_page: 3 }

describe('SeancePeriodFilters (H7)', () => {
  it('marque l\'onglet actif et émet select-period', async () => {
    const w = mount(SeancePeriodFilters, { props: { periodTabs, selectedPeriod: 'week' } })
    expect(w.findAll('.period-tab')).toHaveLength(4)
    expect(w.find('.period-tab.active').text()).toContain('Cette semaine')
    await w.findAll('.period-tab')[2].trigger('click')
    expect(w.emitted('select-period')[0]).toEqual(['month'])
  })

  it('affiche la plage custom seulement en mode custom et émet apply-custom', async () => {
    const week = mount(SeancePeriodFilters, { props: { periodTabs, selectedPeriod: 'week' } })
    expect(week.find('.custom-date-section').exists()).toBe(false)

    const custom = mount(SeancePeriodFilters, { props: { periodTabs, selectedPeriod: 'custom' } })
    expect(custom.find('.custom-date-section').exists()).toBe(true)
    await custom.find('.btn-primary-action').trigger('click')
    expect(custom.emitted('apply-custom')).toBeTruthy()
  })

  it('émet search à la saisie et clear via la croix', async () => {
    const w = mount(SeancePeriodFilters, { props: { periodTabs, selectedPeriod: 'week', searchQuery: 'x' } })
    await w.find('.search-input').trigger('input')
    expect(w.emitted('search')).toBeTruthy()
    await w.find('.clear-search-btn').trigger('click')
    expect(w.emitted('clear')).toBeTruthy()
  })
})

describe('SeancesTable (H7)', () => {
  it('rend une ligne par séance avec la classe de taux et émet les actions', async () => {
    const w = mount(SeancesTable, {
      props: { seances, selectedSeance: null, pagination, formatDate: fmtDate, formatTime: fmtTime, formatDuration: fmtDuration }
    })
    expect(w.findAll('tbody tr')).toHaveLength(1)
    expect(w.text()).toContain('Maths')
    expect(w.find('.rate-text.rate-high').exists()).toBe(true) // 90 ≥ 80
    await w.find('.btn-view').trigger('click')
    expect(w.emitted('view-attendances')[0]).toEqual([seances[0]])
    await w.find('.btn-delete').trigger('click')
    expect(w.emitted('delete-seance')[0]).toEqual([seances[0]])
  })

  it('surligne la séance sélectionnée', () => {
    const w = mount(SeancesTable, {
      props: { seances, selectedSeance: { id: 1 }, pagination, formatDate: fmtDate, formatTime: fmtTime, formatDuration: fmtDuration }
    })
    expect(w.find('tbody tr.row-selected').exists()).toBe(true)
  })
})

describe('SeancesPagination (H7)', () => {
  it('émet change-page vers les pages voisines', async () => {
    const w = mount(SeancesPagination, { props: { pagination } })
    const [prev, next] = w.findAll('.pagination-btn')
    await prev.trigger('click')
    expect(w.emitted('change-page')[0]).toEqual([1])
    await next.trigger('click')
    expect(w.emitted('change-page')[1]).toEqual([3])
  })

  it('ne rend rien sur une seule page', () => {
    const w = mount(SeancesPagination, { props: { pagination: { current_page: 1, last_page: 1 } } })
    expect(w.find('.pagination-wrapper').exists()).toBe(false)
  })
})
