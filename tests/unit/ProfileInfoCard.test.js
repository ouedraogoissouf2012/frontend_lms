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
      ...props,
    },
  })

describe('ProfileInfoCard (#H3)', () => {
  it('affiche initiales, nom et rôle', () => {
    const w = mountCard()
    expect(w.find('.avatar-initials').text()).toBe('MD')
    expect(w.find('.user-name').text()).toContain('Dupont')
    expect(w.find('.user-role').text()).toBe('Administrateur')
  })

  // La carte ne doit plus proposer de ligne « Membre depuis » : aucune charge
  // ne porte de date de création, elle affichait « Non disponible » à vie.
  it('ne propose plus de ligne « Membre depuis »', () => {
    expect(mountCard().text()).not.toContain('Membre depuis')
  })

  it('affiche email et téléphone fournis', () => {
    const w = mountCard()
    const html = w.html()
    expect(html).toContain('marie@e.com')
    expect(html).toContain('0102030405')
  })

  it('utilise les libellés de repli pour les champs manquants', () => {
    const w = mountCard({ user: { nom: 'X', prenom: 'Y' } })
    expect(w.html()).toContain('Non renseigné')
  })
})
