/**
 * Accueil admin, « Aperçu rapide » : un compteur NON MESURÉ (`null`) s'affiche « — »
 * à l'œil et « non disponible » au lecteur d'écran — jamais un 0 fabriqué. Un
 * compteur mesuré, même nul, s'affiche tel quel. Données du hub doublées.
 */
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const etat = vi.hoisted(() => ({ stats: null }))
vi.mock('@/composables/useAdminHub', () => ({
  useAdminHub: () => ({ loading: ref(false), error: ref(null), stats: ref(etat.stats) }),
}))

import AdminHub from '@/views/admin/AdminHub.vue'

function monter(stats) {
  etat.stats = { classes: 2, matieres: 3, enseignants: 1, ...stats }
  return mount(AdminHub, {
    global: { stubs: { DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: true, HubCard: true } },
  })
}

function carte(wrapper, libelle) {
  return wrapper.findAll('.stat-card').find((c) => c.find('.stat-label').text() === libelle)
}

describe('AdminHub — aperçu rapide', () => {
  it('non mesuré : « — » masqué au lecteur d’écran, qui entend « non disponible »', () => {
    const w = monter({ etudiants: 42, seances: null, evaluations: null })
    for (const libelle of ['Séances programmées', 'Évaluations']) {
      const valeur = carte(w, libelle).find('.stat-value')
      expect(valeur.text()).not.toMatch(/\d/)
      expect(valeur.find('[aria-hidden="true"]').text()).toBe('—')
      expect(valeur.find('.sr-only').text()).toBe('non disponible')
    }
  })

  it('mesuré : le nombre, sans texte « non disponible » ni masquage', () => {
    const w = monter({ etudiants: 0, seances: null, evaluations: null })
    const valeur = carte(w, 'Étudiants total').find('.stat-value')
    expect(valeur.text()).toBe('0')
    expect(valeur.find('.sr-only').exists()).toBe(false)
    expect(valeur.find('[aria-hidden]').exists()).toBe(false)
  })
})
