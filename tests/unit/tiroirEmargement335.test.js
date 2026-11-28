/**
 * #335 (relevé par l'inventaire des écrans, 28/11) : « Signer ma présence » est au menu de bureau de l'élève, sous la
 * capacité `peutInscrireLocalement`, mais manquait au TIROIR mobile. Sur téléphone, l'élève ne l'atteignait que par la
 * barre du bas. Le tiroir suit la même règle que le menu : le même rôle, la même capacité (le même volet).
 */
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/' }), useRouter: () => ({ push: vi.fn() }) }))

import { useAuthStore } from '@/stores/auth'
import { useMobileSidebar } from '@/composables/useMobileSidebar'
import { NAV_SECTIONS } from '@/constants/navigation'

const ENTREE = '/student/emargement'
const chemins = (items) => items.map((i) => i.path)

function tiroir(role, capacite) {
  useAuthStore().setSession({ user: { id: 1, role }, token: 't' }, capacite === undefined ? {} : { peut_inscrire_localement: capacite })
  let rendu
  mount({ template: '<div />', setup() { rendu = useMobileSidebar({ isOpen: true }, () => {}); return {} } })
  return rendu
}

beforeEach(() => {
  setActivePinia(createPinia())
  sessionStorage.clear()
})

describe('#335 — « Signer ma présence » au tiroir mobile', () => {
  it('le menu de bureau la garde par la capacité : le tiroir suit la même règle', () => {
    expect(NAV_SECTIONS.find((i) => i.to === ENTREE)).toMatchObject({ capacite: 'peutInscrireLocalement' })
  })

  it('élève d’une école qui tient sa liste : l’entrée est au tiroir', () => {
    expect(chemins(tiroir('etudiant', true).secondaryNavItems.value)).toContain(ENTREE)
  })

  it.each([[false], [undefined]])('élève, capacité %s (école KLASSCI) : pas d’entrée', (capacite) => {
    expect(chemins(tiroir('etudiant', capacite).secondaryNavItems.value)).not.toContain(ENTREE)
  })

  it.each([['enseignant'], ['coordinateur']])('%s : pas d’entrée, même avec la capacité', (role) => {
    const t = tiroir(role, true)
    expect([...chemins(t.secondaryNavItems.value), ...chemins(t.adminNavItems.value)]).not.toContain(ENTREE)
  })
})
