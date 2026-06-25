/**
 * Tests de montage des sous-composants TeacherSeancesFilters et
 * TeacherSeancesStats (#H6). Composants feuilles : v-model + émissions pour les
 * filtres, affichage des compteurs pour les stats.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TeacherSeancesFilters from '@/components/seances/TeacherSeancesFilters.vue'
import TeacherSeancesStats from '@/components/seances/TeacherSeancesStats.vue'

describe('TeacherSeancesFilters (#H6)', () => {
  it('liste les matières et émet "apply" au changement', async () => {
    const w = mount(TeacherSeancesFilters, {
      props: { matieres: [{ id: 1, nom: 'Maths' }, { id: 2, name: 'Physique' }] }
    })
    const options = w.findAll('option')
    expect(w.text()).toContain('Maths')
    expect(w.text()).toContain('Physique')
    await w.findAll('select')[0].setValue('1')
    expect(w.emitted('apply')).toBeTruthy()
    // v-model remonte la valeur sélectionnée (Number, car :value="matiere.id")
    expect(w.emitted('update:matiereId')[0]).toEqual([1])
    expect(options.length).toBeGreaterThan(0)
  })

  it('émet "reset" au clic sur Réinitialiser', async () => {
    const w = mount(TeacherSeancesFilters, { props: { matieres: [] } })
    await w.find('.btn-reset').trigger('click')
    expect(w.emitted('reset')).toBeTruthy()
  })
})

describe('TeacherSeancesStats (#H6)', () => {
  it('affiche les 4 compteurs', () => {
    const w = mount(TeacherSeancesStats, {
      props: { stats: { total: 7, active: 1, scheduled: 4, finished: 2 } }
    })
    const values = w.findAll('.stat-value').map(v => v.text())
    expect(values).toEqual(['7', '1', '4', '2'])
  })
})
