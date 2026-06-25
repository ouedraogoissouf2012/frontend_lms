/** Tests de rendu des cartes du profil enseignant (#H11 ≤300). */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ProfileInfoCard from '@/components/teacher/ProfileInfoCard.vue'
import ProfileStatsCard from '@/components/teacher/ProfileStatsCard.vue'
import ProfileQuickActions from '@/components/teacher/ProfileQuickActions.vue'

const stubs = { RouterLink: { template: '<a><slot /></a>' } }

describe('ProfileInfoCard (#H11)', () => {
  it('affiche initiales, rôle et coordonnées (fallback inclus)', () => {
    const w = mount(ProfileInfoCard, {
      props: {
        user: { nom: 'Dupont', prenom: 'Marie', email: 'm@e.com' },
        userInitials: 'MD', roleLabel: 'Enseignant', memberSince: '15 janvier 2024',
      },
    })
    expect(w.find('.avatar-initials').text()).toBe('MD')
    expect(w.find('.user-role').text()).toBe('Enseignant')
    expect(w.text()).toContain('m@e.com')
    expect(w.text()).toContain('Non renseigné') // téléphone absent
  })
})

describe('ProfileStatsCard (#H11)', () => {
  it('affiche les 4 compteurs', () => {
    const w = mount(ProfileStatsCard, {
      props: { stats: { matieres: 3, classes: 2, evaluations: 5, lessons: 9 } },
    })
    expect(w.findAll('.stat-box')).toHaveLength(4)
    expect(w.findAll('.stat-value').map(n => n.text())).toEqual(['3', '2', '5', '9'])
  })
})

describe('ProfileQuickActions (#H11)', () => {
  it('affiche les 4 raccourcis', () => {
    const w = mount(ProfileQuickActions, { global: { stubs } })
    expect(w.findAll('.action-button')).toHaveLength(4)
  })
})
