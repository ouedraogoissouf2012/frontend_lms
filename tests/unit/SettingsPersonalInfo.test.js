/** Test de rendu SettingsPersonalInfo (#H3 ≤300) : affichage des infos user + libellé de rôle. */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SettingsPersonalInfo from '@/components/admin/SettingsPersonalInfo.vue'

const getRoleLabel = (r) => (r === 'admin' ? 'Administrateur' : r)

describe('SettingsPersonalInfo (#H3)', () => {
  it('affiche le nom, l\'email et le rôle traduit', () => {
    const w = mount(SettingsPersonalInfo, {
      props: {
        user: { nom: 'Dupont', prenom: 'Marie', email: 'marie@e.com', role: 'admin' },
        getRoleLabel,
      },
    })
    expect(w.html()).toContain('Dupont')
    expect(w.html()).toContain('marie@e.com')
    expect(w.html()).toContain('Administrateur')
  })

  it('affiche « Non renseigné » pour les champs manquants', () => {
    const w = mount(SettingsPersonalInfo, {
      props: { user: { nom: 'X', prenom: 'Y', role: 'admin' }, getRoleLabel },
    })
    expect(w.html()).toContain('Non renseigné')
  })
})
