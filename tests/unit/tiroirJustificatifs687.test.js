/**
 * #687 (relevé par l'inventaire des écrans, 28/11) : « Mes absences » (élève) et « Justificatifs » (coordinateur,
 * admin) sont au menu de bureau sous la capacité `peutInscrireLocalement`, mais manquaient au TIROIR mobile. Le tiroir
 * suit la même règle que le menu : le même rôle, la même capacité (le même volet).
 */
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/' }), useRouter: () => ({ push: vi.fn() }) }))

import { useAuthStore } from '@/stores/auth'
import { useMobileSidebar } from '@/composables/useMobileSidebar'
import { NAV_SECTIONS } from '@/constants/navigation'

const MES_ABSENCES = '/student/absences'
const JUSTIFICATIFS = '/admin/justificatifs'
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

describe('#687 — les absences au tiroir mobile', () => {
  it('le menu de bureau les garde par la capacité : le tiroir suit la même règle', () => {
    expect(NAV_SECTIONS.find((i) => i.to === MES_ABSENCES)).toMatchObject({ capacite: 'peutInscrireLocalement' })
    expect(NAV_SECTIONS.find((i) => i.to === JUSTIFICATIFS)).toMatchObject({ capacite: 'peutInscrireLocalement' })
  })

  it('élève d’une école qui tient sa liste : « Mes absences », une seule fois', () => {
    expect(tiroir('etudiant', true).filter((c) => c === MES_ABSENCES)).toHaveLength(1)
  })

  it.each([['coordinateur'], ['admin']])('%s d’une école qui tient sa liste : « Justificatifs », une seule fois', (role) => {
    expect(tiroir(role, true).filter((c) => c === JUSTIFICATIFS)).toHaveLength(1)
  })

  it.each([['etudiant'], ['coordinateur'], ['admin']])('%s d’une école KLASSCI (capacité fausse ou absente) : aucune des deux', (role) => {
    for (const capacite of [false, undefined]) {
      const t = tiroir(role, capacite)
      expect(t).not.toContain(MES_ABSENCES)
      expect(t).not.toContain(JUSTIFICATIFS)
    }
  })

  it('un enseignant n’a aucune des deux', () => {
    const t = tiroir('enseignant', true)
    expect(t).not.toContain(MES_ABSENCES)
    expect(t).not.toContain(JUSTIFICATIFS)
  })
})
