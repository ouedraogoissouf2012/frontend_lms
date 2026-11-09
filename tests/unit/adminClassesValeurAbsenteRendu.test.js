/**
 * Rendu des écrans de classes de l'admin d'école : « — » pour une valeur absente, le nombre
 * pour une valeur mesurée, un vrai zéro reste « 0 ». Les props sont la forme INTERNE du front
 * (résumé produit par useAdminClasses), pas une charge KLASSCI. Voir adminClassesValeurAbsente.test.js.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ClassCard from '@/components/admin/ClassCard.vue'
import ClassesStatsCards from '@/components/admin/ClassesStatsCards.vue'

const MUETTE = { id: 2, name: '5e B', is_active: true }

describe('rendu : « — » pour une valeur absente, le nombre pour une valeur mesurée', () => {
  const stats = (w) => w.findAll('.stat-value').map((v) => v.text())

  it('ClassCard : « —/— » et « — » pour une classe muette', () => {
    const w = mount(ClassCard, { props: { classe: { ...MUETTE, places_occupees: null, places_totales: null, nb_matieres: null } } })
    expect(stats(w)).toEqual(['—/—', '—'])
  })

  it('ClassCard : un vrai zéro reste « 0 », une capacité inconnue reste « — »', () => {
    const w = mount(ClassCard, { props: { classe: { ...MUETTE, places_occupees: 0, places_totales: null, nb_matieres: 0 } } })
    expect(stats(w)).toEqual(['0/—', '0'])
  })

  it('ClassesStatsCards : total des étudiants non mesuré → « — »', () => {
    const w = mount(ClassesStatsCards, { props: { stats: { total: 2, totalEtudiants: null, totalMatieres: 0, actives: 1 } } })
    expect(stats(w)).toEqual(['2', '—', '0', '1'])
  })

})
