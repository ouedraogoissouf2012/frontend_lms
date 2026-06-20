/**
 * Test de RENDU du sous-composant CalendarFilters (#28bis).
 * Vérifie que le composant monte sans erreur, affiche les filtres conditionnels
 * selon les flags, le compteur, et émet reset / apply-preset + met à jour les v-model.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import CalendarFilters from '@/components/calendar/CalendarFilters.vue'

function mountFilters(props = {}) {
  return mount(CalendarFilters, {
    props: {
      eventTypeFilter: 'all',
      dateRangePreset: '30days',
      selectedMatiere: '',
      selectedClasse: '',
      selectedEnseignant: '',
      eventCount: 7,
      ...props
    }
  })
}

describe('CalendarFilters (#28bis) — rendu', () => {
  it('monte sans erreur et affiche le compteur', () => {
    const w = mountFilters()
    expect(w.find('.filters-card').exists()).toBe(true)
    expect(w.find('.filter-count').text()).toContain('7 événement(s)')
  })

  it('type + période toujours présents (2 selects mini)', () => {
    const w = mountFilters()
    expect(w.findAll('select').length).toBeGreaterThanOrEqual(2)
  })

  it('filtres conditionnels masqués par défaut, affichés selon les flags', () => {
    const base = mountFilters()
    const baseCount = base.findAll('select').length
    const w = mountFilters({ showMatiereFilter: true, showClasseFilter: true, showEnseignantFilter: true, matieres: [{ id: 1, nom: 'Maths' }] })
    expect(w.findAll('select').length).toBe(baseCount + 3)
    expect(w.html()).toContain('Maths')
  })

  it('émet reset au clic sur Réinitialiser', async () => {
    const w = mountFilters()
    await w.find('.reset-button').trigger('click')
    expect(w.emitted('reset')).toBeTruthy()
  })

  it('met à jour le v-model du type et émet apply-preset sur changement de période', async () => {
    const w = mountFilters()
    const [typeSelect, periodSelect] = w.findAll('select')
    await typeSelect.setValue('seances')
    expect(w.emitted('update:eventTypeFilter')[0]).toEqual(['seances'])
    await periodSelect.setValue('week')
    expect(w.emitted('apply-preset')).toBeTruthy()
  })
})
