/** Tests de rendu des composants des statistiques enseignant (#H11 ≤300). */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import TeacherStatsGlobalCards from '@/components/teacher/TeacherStatsGlobalCards.vue'
import TeacherStatsPerMatiere from '@/components/teacher/TeacherStatsPerMatiere.vue'
import TeacherStatsActivity from '@/components/teacher/TeacherStatsActivity.vue'
import TeacherStatsParClasse from '@/components/teacher/TeacherStatsParClasse.vue'
import TeacherStatsQuickActions from '@/components/teacher/TeacherStatsQuickActions.vue'

const stubs = { RouterLink: { template: '<a><slot /></a>' } }

describe('TeacherStatsGlobalCards (#H11)', () => {
  it('affiche les 4 compteurs globaux', () => {
    const w = mount(TeacherStatsGlobalCards, {
      props: { stats: { nb_matieres: 3, nb_etudiants: 30, nb_evaluations: 5, nb_seances: 8 } },
    })
    expect(w.findAll('.stat-card')).toHaveLength(4)
    expect(w.findAll('.stat-value').map(n => n.text())).toEqual(['3', '30', '5', '8'])
  })
})

describe('TeacherStatsPerMatiere (#H11)', () => {
  it('liste les matières avec leurs mini-stats', () => {
    const w = mount(TeacherStatsPerMatiere, {
      props: { matieres: [{ id: 1, nom: 'Maths', nb_etudiants: 20, nb_evaluations: 3 }] },
    })
    expect(w.findAll('.matiere-stat-item')).toHaveLength(1)
    expect(w.find('.matiere-name').text()).toBe('Maths')
  })

  it('affiche l\'état vide sans matière', () => {
    const w = mount(TeacherStatsPerMatiere, { props: { matieres: [] } })
    expect(w.find('.empty-state-small').exists()).toBe(true)
  })
})

describe('TeacherStatsActivity (#H11)', () => {
  it('affiche les 4 indicateurs d\'activité', () => {
    const w = mount(TeacherStatsActivity, {
      props: { stats: { nb_lecons: 8, nb_corrections: 4, nb_visio: 2, nb_messages_forum: 9 } },
    })
    expect(w.findAll('.activity-item')).toHaveLength(4)
    expect(w.findAll('.activity-value').map(n => n.text())).toEqual(['8', '4', '2', '9'])
  })
})

describe('TeacherStatsParClasse (#H11)', () => {
  it('affiche une carte par classe', () => {
    const w = mount(TeacherStatsParClasse, {
      props: { classes: [{ id: 1, nom: '6e A', niveau: '6e', nb_etudiants: 25, nb_matieres: 6 }] },
    })
    expect(w.findAll('.classe-stat-card')).toHaveLength(1)
    expect(w.find('.classe-name').text()).toBe('6e A')
  })

  it('affiche l\'état vide sans classe', () => {
    const w = mount(TeacherStatsParClasse, { props: { classes: [] } })
    expect(w.find('.empty-state-small').exists()).toBe(true)
  })
})

describe('TeacherStatsQuickActions (#H11)', () => {
  it('affiche les 3 raccourcis', () => {
    const w = mount(TeacherStatsQuickActions, { global: { stubs } })
    expect(w.findAll('.action-card')).toHaveLength(3)
  })
})
