/**
 * #656, lot (b) : chaque ligne de l'annuaire garde le rôle BRUT de son compte (`role_brut`), que lit la règle de gestion
 * (`gestionDeCompte`, miroir de `GestionDeCompte::admet`). Le `role` CANONIQUE reste celui du filtre : un `superAdmin`
 * répond à « Administrateurs », mais le serveur le classe au-dessus d'un `admin`.
 *
 * Et la création (#648) ne promet plus qu'un élève « apparaîtra une fois inscrit dans une classe » : depuis le lot (a),
 * un élève sans classe figure tout de suite dans la liste.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { administrationRows, elevesSansClasseRows, enseignantRows, etudiantRows, ESPACES } from '@/utils/adminUsersRows'
import CompteCreation from '@/components/admin/CompteCreation.vue'
import UserDetailModal from '@/components/admin/UserDetailModal.vue'

describe('#656 (b) — le rôle brut sur chaque ligne', () => {
  it('encadrement : le rôle reçu, tel quel ; le rôle canonique reste pour le filtre', () => {
    const [sa, ad] = administrationRows([
      { id: 5, name: 'Sa', email: 'sa@e.test', role: 'superAdmin' },
      { id: 6, name: 'Ad', email: 'ad@e.test', role: 'administrateur' },
    ])
    expect(sa).toMatchObject({ lms_id: 5, role: 'admin', role_brut: 'superAdmin' })
    expect(ad).toMatchObject({ lms_id: 6, role: 'admin', role_brut: 'administrateur' })
  })

  it('élèves et enseignants : le rôle de leur population', () => {
    expect(etudiantRows([{ id: 1, name: 'E' }], ESPACES.LOCAL)[0].role_brut).toBe('etudiant')
    expect(enseignantRows([{ id: 2, nom: 'P' }], ESPACES.LOCAL)[0].role_brut).toBe('enseignant')
    expect(elevesSansClasseRows([{ id: 3, name: 'S', role: 'student' }], [])[0].role_brut).toBe('etudiant')
  })
})

describe('#656 (b) — la fiche porte les actions du compte', () => {
  it('UserDetailModal rend l’emplacement `actions` sous les informations', () => {
    const w = mount(UserDetailModal, {
      props: { user: { name: 'X', role: 'etudiant' } },
      slots: { actions: '<div class="actions-temoin">actions</div>' },
      global: { stubs: { teleport: true } },
    })
    expect(w.find('.actions-temoin').exists()).toBe(true)
  })
})

describe('#656 (b) — la création n’annonce plus un élève invisible', () => {
  let adaptateurOrigine

  beforeEach(() => {
    setActivePinia(createPinia())
    useAuthStore().user = { id: 1, name: 'Admin fictif', role: 'admin' }
    adaptateurOrigine = api.defaults.adapter
    api.defaults.adapter = async (config) => ({
      status: 201, statusText: '', headers: { 'content-type': 'application/json' }, config,
      data: JSON.stringify({ success: true, data: { id: 40, name: 'Eli', email: 'eli@e.test', role: 'etudiant' } }),
    })
  })

  afterEach(() => {
    api.defaults.adapter = adaptateurOrigine
  })

  it('un élève créé figure tout de suite dans la liste, sans classe', async () => {
    const w = mount(CompteCreation)
    const valeurs = { nom: 'Eli', courriel: 'eli@e.test', role: 'etudiant', motDePasse: 'motdepasse8', confirmation: 'motdepasse8' }
    for (const [nom, valeur] of Object.entries(valeurs)) await w.find(`[data-champ="${nom}"]`).setValue(valeur)
    await w.find('form').trigger('submit')
    await flushPromises()

    const annonce = w.find('[role="status"]').text()
    expect(annonce).not.toMatch(/une fois inscrit/i)
    expect(annonce).toMatch(/sans classe/i)
  })
})
