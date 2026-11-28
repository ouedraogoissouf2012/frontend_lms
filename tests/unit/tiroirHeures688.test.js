/**
 * #688 (relevé par l'inventaire des écrans, 28/11) : « Mes heures » (enseignant) et « Heures des enseignants »
 * (coordinateur, admin) sont au menu de bureau sous la capacité `peutInscrireLocalement`, mais manquaient au TIROIR
 * mobile. Le tiroir suit la même règle que le menu : le même rôle, la même capacité (le même volet).
 */
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/' }), useRouter: () => ({ push: vi.fn() }) }))

import { useAuthStore } from '@/stores/auth'
import { useMobileSidebar } from '@/composables/useMobileSidebar'
import { NAV_SECTIONS } from '@/constants/navigation'

const MES_HEURES = '/teacher/heures'
const HEURES_DES_ENSEIGNANTS = '/admin/heures-enseignants'
const chemins = (items) => items.map((i) => i.path)

function tiroir(role, capacite) {
  useAuthStore().setSession({ user: { id: 1, role }, token: 't' }, capacite === undefined ? {} : { peut_inscrire_localement: capacite })
  let rendu
  mount({ template: '<div />', setup() { rendu = useMobileSidebar({ isOpen: true }, () => {}); return {} } })
  return [...chemins(rendu.secondaryNavItems.value), ...chemins(rendu.adminNavItems.value)]
}

beforeEach(() => {
  setActivePinia(createPinia())
  sessionStorage.clear()
})

describe('#688 — les heures au tiroir mobile', () => {
  it('le menu de bureau les garde par la capacité : le tiroir suit la même règle', () => {
    expect(NAV_SECTIONS.find((i) => i.to === MES_HEURES)).toMatchObject({ capacite: 'peutInscrireLocalement' })
    expect(NAV_SECTIONS.find((i) => i.to === HEURES_DES_ENSEIGNANTS)).toMatchObject({ capacite: 'peutInscrireLocalement' })
  })

  it('enseignant d’une école qui tient sa liste : « Mes heures », une seule fois', () => {
    expect(tiroir('enseignant', true).filter((c) => c === MES_HEURES)).toHaveLength(1)
  })

  it.each([['coordinateur'], ['admin']])('%s d’une école qui tient sa liste : « Heures des enseignants », une seule fois', (role) => {
    expect(tiroir(role, true).filter((c) => c === HEURES_DES_ENSEIGNANTS)).toHaveLength(1)
  })

  it.each([['enseignant'], ['coordinateur'], ['admin']])('%s d’une école KLASSCI (capacité absente) : aucune des deux', (role) => {
    expect(tiroir(role, false)).not.toEqual(expect.arrayContaining([MES_HEURES]))
    expect(tiroir(role, undefined)).not.toContain(HEURES_DES_ENSEIGNANTS)
    expect(tiroir(role, false)).not.toContain(HEURES_DES_ENSEIGNANTS)
  })

  it('un élève n’a aucune des deux', () => {
    const t = tiroir('etudiant', true)
    expect(t).not.toContain(MES_HEURES)
    expect(t).not.toContain(HEURES_DES_ENSEIGNANTS)
  })
})
