/**
 * Test du composable useAdminUsers (#G1 ≤300) : agrégation étudiants+enseignants,
 * filtres (rôle/recherche), tri et pagination. Services KLASSCI + cache mockés.
 *
 * Couvre aussi la SÉMANTIQUE D'ÉCHEC du chargement par classe : un échec total
 * doit remonter une erreur (et non « 0 étudiant » présenté comme la vérité), un
 * échec partiel doit conserver les données obtenues tout en le signalant.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Implémentations mutables : chaque test décide du comportement des appels KLASSCI.
const impl = {
  getClasses: () => Promise.resolve([{ id: 1, nom: '6e A' }]),
  getEnseignants: () => Promise.resolve([{ id: 10, nom: 'Zoé Prof', email: 'zoe@e.com' }]),
  getClasseEtudiants: () => Promise.resolve([{ id: 100, nom: 'Aline Eleve', email: 'aline@e.com' }]),
}

vi.mock('@/services/cache', () => ({
  readCache: () => null,
  writeCache: () => {},
  invalidateEntity: () => {},
}))
vi.mock('@/services/klassci', () => ({
  default: {
    getClasses: (...a) => impl.getClasses(...a),
    getEnseignants: (...a) => impl.getEnseignants(...a),
    getClasseEtudiants: (...a) => impl.getClasseEtudiants(...a),
  },
}))

import { useAdminUsers } from '@/composables/useAdminUsers'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminUsers(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

/** Réinitialise les mocks au cas nominal (1 classe, 1 prof, 1 élève). */
beforeEach(() => {
  impl.getClasses = () => Promise.resolve([{ id: 1, nom: '6e A' }])
  impl.getEnseignants = () => Promise.resolve([{ id: 10, nom: 'Zoé Prof', email: 'zoe@e.com' }])
  impl.getClasseEtudiants = () => Promise.resolve([{ id: 100, nom: 'Aline Eleve', email: 'aline@e.com' }])
})

describe('useAdminUsers (#G1)', () => {
  it('agrège étudiants + enseignants en une liste unifiée', async () => {
    const u = await setup()
    expect(u.totalUsers.value).toBe(2)
    expect(u.loading.value).toBe(false)
  })

  it('filtre par rôle', async () => {
    const u = await setup()
    u.filterRole.value = 'etudiant'
    expect(u.filteredUsers.value).toHaveLength(1)
    expect(u.filteredUsers.value[0].role).toBe('etudiant')
  })

  it('filtre par recherche (nom/email)', async () => {
    const u = await setup()
    u.searchQuery.value = 'aline'
    expect(u.filteredUsers.value).toHaveLength(1)
    expect(u.filteredUsers.value[0].name).toContain('Aline')
  })

  it('trie par nom (asc/desc via sortBy)', async () => {
    const u = await setup()
    expect(u.filteredUsers.value[0].name).toBe('Aline Eleve') // asc
    u.sortBy('name') // bascule desc
    expect(u.filteredUsers.value[0].name).toBe('Zoé Prof')
  })

  it('select/closeModal pilotent selectedUser', async () => {
    const u = await setup()
    u.selectUser({ _uid: 'x' })
    expect(u.selectedUser.value).toEqual({ _uid: 'x' })
    u.closeModal()
    expect(u.selectedUser.value).toBe(null)
  })

  it('ne signale ni erreur ni avertissement quand tout réussit', async () => {
    const u = await setup()
    expect(u.error.value).toBe(null)
    expect(u.partialWarning.value).toBe(null)
  })

  describe('sémantique d’échec du chargement par classe', () => {
    it('remonte une ERREUR quand TOUTES les classes échouent (jamais « 0 étudiant » muet)', async () => {
      impl.getClasses = () => Promise.resolve([{ id: 1, nom: '6e A' }, { id: 2, nom: '5e B' }])
      impl.getClasseEtudiants = () => Promise.reject(new Error('boom'))

      const u = await setup()

      // Le cœur du défaut : sans erreur, l'écran affiche « 0 étudiant » comme une
      // donnée valide alors que la totalité des appels a échoué.
      expect(u.error.value).toBeTruthy()
      expect(u.etudiants.value).toHaveLength(0)
      expect(u.loading.value).toBe(false)
    })

    it('conserve les données PARTIELLES et signale l’échec sans détruire la liste', async () => {
      impl.getClasses = () => Promise.resolve([{ id: 1, nom: '6e A' }, { id: 2, nom: '5e B' }])
      impl.getClasseEtudiants = (id) => id === 1
        ? Promise.resolve([{ id: 100, nom: 'Aline Eleve', email: 'aline@e.com' }])
        : Promise.reject(new Error('boom'))

      const u = await setup()

      expect(u.error.value).toBe(null) // pas d'écran d'erreur bloquant
      expect(u.etudiants.value).toHaveLength(1) // la donnée obtenue est conservée
      expect(u.partialWarning.value).toBeTruthy() // mais l'échec est dit
      expect(u.partialWarning.value).toContain('1')
    })

    it('n’érige pas « aucune classe » en erreur (établissement réellement vide)', async () => {
      impl.getClasses = () => Promise.resolve([])

      const u = await setup()

      expect(u.error.value).toBe(null)
      expect(u.partialWarning.value).toBe(null)
    })
  })
})
