/** Test de rendu ProfileInfoCard (#H3 ≤300) : avatar, infos utilisateur, fallbacks. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import ProfileInfoCard from '@/components/admin/ProfileInfoCard.vue'

const mountCard = (props = {}) =>
  mount(ProfileInfoCard, {
    props: {
      user: {
        nom: 'Dupont',
        prenom: 'Marie',
        email: 'marie@e.com',
        telephone: '0102030405',
        klassci_id: 'KL-42',
      },
      userInitials: 'MD',
      roleLabel: 'Administrateur',
      memberSince: '15 janvier 2024',
      ...props,
    },
  })

describe('ProfileInfoCard (#H3)', () => {
  it('affiche initiales, nom, rôle et date d\'inscription', () => {
    const w = mountCard()
    expect(w.find('.avatar-initials').text()).toBe('MD')
    expect(w.find('.user-name').text()).toContain('Dupont')
    expect(w.find('.user-role').text()).toBe('Administrateur')
    expect(w.html()).toContain('15 janvier 2024')
  })

  it('affiche email, téléphone et ID Klassci fournis', () => {
    const w = mountCard()
    const html = w.html()
    expect(html).toContain('marie@e.com')
    expect(html).toContain('0102030405')
    expect(html).toContain('KL-42')
  })

  it('utilise les libellés de repli pour les champs manquants', () => {
    const w = mountCard({ user: { nom: 'X', prenom: 'Y' } })
    expect(w.html()).toContain('Non renseigné')
  })
})
