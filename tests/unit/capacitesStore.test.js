/**
 * Capacité LUE dans le vrai store (#391) : `peut_inscrire_localement` du `meta` de
 * connexion ouvre les entrées « Codes d'inscription » et « Rejoindre une classe », dans
 * le menu déclaratif (useNavigation) comme dans le menu mobile (useMobileSidebar).
 * Aucun mode n'est lu : seule la capacité publiée par le serveur décide.
 */
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getUser = vi.fn()
vi.mock('@/services/api', () => ({ auth: { getUser: () => getUser(), logout: vi.fn() } }))
vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/' }), useRouter: () => ({ push: vi.fn() }) }))

import { useAuthStore } from '@/stores/auth'
import { useNavigation } from '@/composables/useNavigation'
import { useMobileSidebar } from '@/composables/useMobileSidebar'

function avecCapacite(valeur) {
  useAuthStore().meta = { peut_inscrire_localement: valeur }
}

function mobile() {
  let api
  mount({ template: '<div />', setup() { api = useMobileSidebar({ isOpen: true }, () => {}); return {} } })
  return api
}

const chemins = (items) => items.map((i) => i.to ?? i.path)

beforeEach(() => {
  setActivePinia(createPinia())
  sessionStorage.clear()
})

describe('capacité lue dans le store (#391)', () => {
  it.each([
    ['coordinateur', '/admin/enrolment-codes'],
    ['etudiant', '/student/rejoindre'],
  ])('menu déclaratif, %s : entrée visible avec la capacité, absente sans', (role, chemin) => {
    getUser.mockReturnValue({ id: 1, role })
    avecCapacite(true)
    expect(chemins(useNavigation().sections.value)).toContain(chemin)
    avecCapacite(false)
    expect(chemins(useNavigation().sections.value)).not.toContain(chemin)
  })

  it('menu mobile, coordinateur : « Codes d’inscription » suit la capacité', () => {
    getUser.mockReturnValue({ id: 1, role: 'coordinateur' })
    avecCapacite(true)
    expect(chemins(mobile().secondaryNavItems.value)).toContain('/admin/enrolment-codes')
    avecCapacite(false)
    expect(chemins(mobile().secondaryNavItems.value)).not.toContain('/admin/enrolment-codes')
  })

  it('menu mobile, admin : « Codes d’inscription » suit la capacité', () => {
    getUser.mockReturnValue({ id: 1, role: 'admin' })
    avecCapacite(true)
    expect(chemins(mobile().adminNavItems.value)).toContain('/admin/enrolment-codes')
    avecCapacite(false)
    expect(chemins(mobile().adminNavItems.value)).not.toContain('/admin/enrolment-codes')
  })

  it('menu mobile, élève : « Rejoindre une classe » suit la capacité', () => {
    getUser.mockReturnValue({ id: 1, role: 'etudiant' })
    avecCapacite(true)
    expect(chemins(mobile().secondaryNavItems.value)).toContain('/student/rejoindre')
    avecCapacite(false)
    expect(chemins(mobile().secondaryNavItems.value)).not.toContain('/student/rejoindre')
  })
})
