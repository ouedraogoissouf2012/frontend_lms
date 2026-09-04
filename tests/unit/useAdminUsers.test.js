/**
 * Test du composable useAdminUsers (#G1 ≤300) : agrégation étudiants+enseignants,
 * filtres (rôle/recherche/classe), tri et pagination. Services KLASSCI + cache mockés.
 *
 * Les fixtures de classe reproduisent la forme RÉELLE de `/proxy/classes`
 * (`{id, name, libelle:null}`) : l'ancien jeu d'essai inventait un champ `nom`
 * que l'API ne renvoie pas, ce qui verdissait un chemin inexistant en production.
 *
 * Sémantique d'échec vérifiée ici : chaque ressource est MESURÉE indépendamment
 * (`counts`), et les avertissements en découlent (`notices`). Un échec, même
 * total, sur les étudiants ne doit JAMAIS détruire les enseignants déjà chargés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const impl = {
  getClasses: () => Promise.resolve([{ id: 1, name: '6e A', libelle: null, places_occupees: 1 }]),
  getEnseignants: () => Promise.resolve([{ id: 10, nom: 'Zoé Prof', email: 'zoe@e.com' }]),
  getClasseEtudiants: () => Promise.resolve([{ id: 100, nom: 'Aline Eleve', email: 'aline@e.com' }]),
  listAdministrationUsers: () => Promise.resolve({ items: [], counts: null }),
}

let cacheStore = null
vi.mock('@/services/cache', () => ({
  readCache: () => cacheStore,
  writeCache: (_k, v) => { cacheStore = v },
  invalidateEntity: () => {},
}))
vi.mock('@/services/klassci', () => ({
  default: {
    getClasses: (...a) => impl.getClasses(...a),
    getEnseignants: (...a) => impl.getEnseignants(...a),
  },
}))
// Le roster vient des DÉTAILS de classe : /proxy/classes/{id}/etudiants est refusé
// par KLASSCI (403), tandis que /lms/classes/{id} livre déjà `data.etudiants`.
vi.mock('@/services/lmsClasses', () => ({
  lmsClassesService: {
    getClasseDetails: (...a) => impl.getClasseEtudiants(...a)
      .then((etudiants) => ({ success: true, data: { etudiants } })),
  },
}))

// Les enseignants viennent désormais de la liste ENRICHIE (`with_details`), seule
// à porter leurs matières — donc leurs classes.
vi.mock('@/services/lmsTeachers', () => ({
  lmsTeachersService: {
    getEnseignants: (...a) => impl.getEnseignants(...a).then((data) => ({ success: true, data })),
  },
}))

// Troisieme population : les comptes LMS d'encadrement, absents de KLASSCI.
vi.mock('@/services/adminUsers', () => ({
  listAdministrationUsers: (...a) => impl.listAdministrationUsers(...a),
}))

import { useAdminUsers } from '@/composables/useAdminUsers'

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminUsers(); return () => null } })
  mount(Comp)
  await flushPromises()
  await flushPromises()
  return api
}

beforeEach(() => {
  cacheStore = null
  impl.getClasses = () => Promise.resolve([{ id: 1, name: '6e A', libelle: null, places_occupees: 1 }])
  impl.getEnseignants = () => Promise.resolve([{ id: 10, nom: 'Zoé Prof', email: 'zoe@e.com' }])
  impl.getClasseEtudiants = () => Promise.resolve([{ id: 100, nom: 'Aline Eleve', email: 'aline@e.com' }])
  impl.listAdministrationUsers = () => Promise.resolve({ items: [], counts: null })
})

describe('useAdminUsers (#G1)', () => {
  it('agrège étudiants + enseignants en une liste unifiée', async () => {
    const u = await setup()
    expect(u.totalUsers.value).toBe(2)
    expect(u.loading.value).toBe(false)
  })

  describe('troisième population — comptes d’encadrement LMS', () => {
    const ENCADREMENT = [
      { id: 3, name: 'Cora Coord', email: 'cora@e.com', role: 'coordinateur', klassci_id: null },
      { id: 4, name: 'Adam Admin', email: 'adam@e.com', role: 'superAdmin', klassci_id: 77 },
    ]

    it('les ajoute à la liste, en plus des deux populations KLASSCI', async () => {
      impl.listAdministrationUsers = () => Promise.resolve({ items: ENCADREMENT, counts: null })
      const u = await setup()

      // 1 étudiant + 1 enseignant + 2 comptes d'encadrement.
      expect(u.totalUsers.value).toBe(4)
      const emails = u.filteredUsers.value.map(x => x.email)
      expect(emails).toContain('cora@e.com')
      expect(emails).toContain('adam@e.com')
    })

    it('les rend filtrables par rôle', async () => {
      impl.listAdministrationUsers = () => Promise.resolve({ items: ENCADREMENT, counts: null })
      const u = await setup()

      u.filterRole.value = 'coordinateur'
      expect(u.filteredUsers.value.map(x => x.email)).toEqual(['cora@e.com'])

      // `superAdmin` est un admin d'établissement : il doit répondre au filtre
      // « Administrateurs », qui porte le rôle canonique.
      u.filterRole.value = 'admin'
      expect(u.filteredUsers.value.map(x => x.email)).toEqual(['adam@e.com'])
    })

    it('n’efface pas les autres populations si leur chargement échoue', async () => {
      impl.listAdministrationUsers = () => Promise.reject(new Error('500'))
      const u = await setup()

      // Un endpoint en panne ne doit pas vider un écran par ailleurs sain :
      // même sémantique que les autres ressources de ce composable.
      expect(u.totalUsers.value).toBe(2)
      expect(u.loading.value).toBe(false)
    })
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

  it('filtre par matricule', async () => {
    impl.getEnseignants = () => Promise.resolve([
      { id: 10, nom: 'Zoé Prof', email: 'zoe@e.com', matricule: 'ENS-2025-0001' },
    ])
    const u = await setup()
    u.searchQuery.value = '2025-0001'
    expect(u.filteredUsers.value).toHaveLength(1)
    expect(u.filteredUsers.value[0].name).toBe('Zoé Prof')
  })

  it('filtre par classe, sur le libellé réel du payload', async () => {
    const u = await setup()
    expect(u.etudiants.value[0].classe_nom).toBe('6e A') // et non « Classe 1 »
    u.filterClasse.value = 1
    expect(u.filteredUsers.value).toHaveLength(1)
    expect(u.filteredUsers.value[0].role).toBe('etudiant')
  })

  it('filtre par classe : un enseignant apparaît via SES classes (dérivées des matières)', async () => {
    // Un enseignant qui enseigne la classe 1 (via matieres->classes) DOIT ressortir
    // quand on filtre par la classe 1 — comportement central du changeset.
    impl.getEnseignants = () => Promise.resolve([
      { id: 10, nom: 'Zoé Prof', email: 'zoe@e.com', matieres: [{ classes: [{ id: 1, nom: '6e A' }, { id: 2, nom: '5e B' }] }] },
    ])
    const u = await setup()
    u.filterClasse.value = 1
    expect(u.filteredUsers.value.some(x => x.role === 'enseignant')).toBe(true) // le prof de la classe 1
    // Filtrer par une classe qu'il n'enseigne pas → il disparaît.
    u.filterClasse.value = 99
    expect(u.filteredUsers.value.some(x => x.role === 'enseignant')).toBe(false)
  })

  it('filtre par classe : tolère un id de classe en CHAÎNE (types KLASSCI incohérents)', async () => {
    // Les ids de matieres->classes peuvent arriver en chaîne selon l'endpoint ;
    // l'option de filtre porte un number. Sans normalisation en chaîne, le `===`
    // strict laisserait tomber l'enseignant en silence.
    impl.getEnseignants = () => Promise.resolve([
      { id: 11, nom: 'Prof String', email: 'ps@e.com', matieres: [{ classes: [{ id: '1', nom: '6e A' }] }] },
    ])
    const u = await setup()
    u.filterClasse.value = 1 // number, alors que l'id enseignant est '1' (string)
    expect(u.filteredUsers.value.some(x => x.role === 'enseignant')).toBe(true)
  })

  it('trie par nom (asc/desc via sortBy) SANS muter la liste source', async () => {
    const u = await setup()
    const sourceOrder = u.etudiants.value.map(e => e.id)

    expect(u.filteredUsers.value[0].name).toBe('Aline Eleve') // asc
    u.sortBy('name') // bascule desc
    expect(u.filteredUsers.value[0].name).toBe('Zoé Prof')

    // `filteredUsers` triait le tableau d'`allUsers` EN PLACE : le tri d'un
    // computed corrompait ainsi le cache d'un autre.
    expect(u.etudiants.value.map(e => e.id)).toEqual(sourceOrder)
  })

  it('select/closeModal pilotent selectedUser', async () => {
    const u = await setup()
    u.selectUser({ _uid: 'x' })
    expect(u.selectedUser.value).toEqual({ _uid: 'x' })
    u.closeModal()
    expect(u.selectedUser.value).toBe(null)
  })

  it('ne signale rien quand tout réussit', async () => {
    const u = await setup()
    expect(u.notices.value).toEqual([])
    expect(u.counts.value).toEqual({ classes: 1, enseignants: 1, etudiants: 1, classesOk: 1 })
  })

  describe('mesure par ressource et avertissements', () => {
    it('CONSERVE les enseignants quand TOUTES les classes échouent', async () => {
      impl.getClasses = () => Promise.resolve([
        { id: 1, name: '6e A', places_occupees: 6 }, { id: 2, name: '5e B', places_occupees: 5 },
      ])
      impl.getClasseEtudiants = () => Promise.reject(new Error('boom'))

      const u = await setup()

      // Le cœur du correctif : la panne des étudiants ne doit pas emporter
      // l'écran. Les enseignants chargés restent consultables.
      expect(u.enseignants.value).toHaveLength(1)
      expect(u.totalUsers.value).toBe(1)
      expect(u.loading.value).toBe(false)
    })

    it('dit explicitement que la liste des étudiants est indisponible', async () => {
      impl.getClasses = () => Promise.resolve([
        { id: 1, name: '6e A', places_occupees: 6 }, { id: 2, name: '5e B', places_occupees: 5 },
      ])
      impl.getClasseEtudiants = () => Promise.reject(new Error('boom'))

      const u = await setup()

      expect(u.notices.value.join(' ')).toContain('0 classe(s) sur 2')

      // L'EFFECTIF reste connu : KLASSCI le publie sur chaque classe
      // (`places_occupees`), indépendamment du listing nominatif qui, lui, est en
      // panne. Afficher « — » ici serait aussi faux qu'afficher « 0 » : un
      // établissement qui a des étudiants doit annoncer son effectif.
      expect(u.counts.value.etudiants).toBe(11)
    })

    it('traite l’échec PARTIEL comme le total, à un chiffre près', async () => {
      impl.getClasses = () => Promise.resolve([
        { id: 1, name: '6e A', places_occupees: 6 }, { id: 2, name: '5e B', places_occupees: 5 },
      ])
      impl.getClasseEtudiants = (id) => id === 1
        ? Promise.resolve([{ id: 100, nom: 'Aline Eleve' }])
        : Promise.reject(new Error('boom'))

      const u = await setup()

      expect(u.etudiants.value).toHaveLength(1) // une seule classe listée
      expect(u.notices.value.join(' ')).toContain('1 classe(s) sur 2')
      expect(u.counts.value.etudiants).toBe(11) // mais l'effectif total reste connu
    })

    it('CESSE d’interroger les classes dès le premier refus de droits (403)', async () => {
      const tried = []
      impl.getClasses = () => Promise.resolve(
        Array.from({ length: 17 }, (_, i) => ({ id: i + 1, name: `C${i + 1}`, places_occupees: 10 }))
      )
      impl.getClasseEtudiants = (id) => {
        tried.push(id)
        return Promise.reject(Object.assign(new Error('forbidden'), { response: { status: 403 } }))
      }

      const u = await setup()

      // Un 403 est un refus DÉTERMINISTE : il sera identique sur les 16 classes
      // suivantes. Les marteler ne produit que des erreurs et du bruit de log.
      expect(tried.length).toBeLessThan(17)
      expect(u.notices.value.join(' ')).toMatch(/droit|autoris/i)
    })

    it('N’interrompt PAS le parcours sur un échec transitoire', async () => {
      const tried = []
      impl.getClasses = () => Promise.resolve([
        { id: 1, name: 'A', places_occupees: 3 },
        { id: 2, name: 'B', places_occupees: 4 },
        { id: 3, name: 'C', places_occupees: 5 },
      ])
      impl.getClasseEtudiants = (id) => {
        tried.push(id)
        return id === 1
          ? Promise.reject(Object.assign(new Error('indispo'), { response: { status: 503 } }))
          : Promise.resolve([{ id: 100 + id, nom: `E${id}` }])
      }

      const u = await setup()

      expect(tried).toHaveLength(3) // une panne passagère ne condamne pas les autres
      expect(u.etudiants.value).toHaveLength(2)
    })

    it('distingue un établissement RÉELLEMENT vide d’une panne', async () => {
      impl.getClasses = () => Promise.resolve([])

      const u = await setup()

      expect(u.notices.value).toEqual([])
      expect(u.counts.value.classes).toBe(0)
      expect(u.counts.value.etudiants).toBe(0) // mesuré, vraiment nul
    })

    it('signale la panne des CLASSES et l’indisponibilité du filtre', async () => {
      impl.getClasses = () => Promise.reject(new Error('proxy down'))

      const u = await setup()

      expect(u.counts.value.classes).toBe(null)
      expect(u.counts.value.etudiants).toBe(null)
      expect(u.notices.value.join(' ')).toContain('filtre par classe')
      // Un échec sur les classes ne doit pas empêcher le chargement des enseignants.
      expect(u.enseignants.value).toHaveLength(1)
    })

    it('signale la panne des ENSEIGNANTS sans bloquer les étudiants', async () => {
      impl.getEnseignants = () => Promise.reject(new Error('proxy down'))

      const u = await setup()

      expect(u.counts.value.enseignants).toBe(null)
      expect(u.notices.value.join(' ')).toContain('enseignants')
      expect(u.etudiants.value).toHaveLength(1)
    })
  })

  describe('cache', () => {
    it('sert un jeu en cache même SANS étudiant (cas du backend étudiants cassé)', async () => {
      cacheStore = {
        etudiants: [],
        enseignants: [{ id: 10, nom: 'Zoé Prof' }],
        classes: [{ id: 1, name: '6e A' }],
        counts: { classes: 1, enseignants: 1, etudiants: null, classesOk: 0 },
      }
      // Le réseau reste cassé : seul le cache peut peupler l'écran immédiatement.
      impl.getClasseEtudiants = () => Promise.reject(new Error('boom'))

      const u = await setup()

      // La garde `cached.etudiants?.length > 0` rendait le cache inatteignable
      // précisément quand il servait le plus.
      expect(u.enseignants.value).toHaveLength(1)
      expect(u.classes.value).toHaveLength(1)
    })

    it('compte ce qui est AFFICHÉ quand le cache est d’un format antérieur à `counts`', async () => {
      // Entrée écrite avant l'introduction de `counts` : sans dérivation, l'écran
      // affichait 1 classe et 1 enseignant tout en annonçant « — » pour les deux.
      cacheStore = {
        etudiants: [],
        enseignants: [{ id: 10, nom: 'Zoé Prof' }],
        classes: [{ id: 1, name: '6e A' }],
      }
      // Revalidation GELÉE : on observe l'état servi par le cache seul, avant
      // qu'un rechargement réseau ne le remplace.
      impl.getClasses = () => new Promise(() => {})
      impl.getEnseignants = () => new Promise(() => {})

      const u = await setup()

      expect(u.counts.value.classes).toBe(1)
      expect(u.counts.value.enseignants).toBe(1)
      // L'ancien format ne portait pas l'effectif : on ne l'invente pas.
      expect(u.counts.value.etudiants).toBe(null)
    })

    it('n’accuse pas les étudiants d’être incomplets sans mesure de ce chargement', async () => {
      cacheStore = {
        etudiants: [],
        enseignants: [{ id: 10, nom: 'Zoé Prof' }],
        classes: [{ id: 1, name: '6e A' }],
      }
      // `getClasseEtudiants` ne répond jamais : la revalidation reste en vol, donc
      // aucune mesure du chargement des étudiants n'existe encore.
      impl.getClasseEtudiants = () => new Promise(() => {})

      const u = await setup()

      expect(u.counts.value.classesOk).toBe(null)
      expect(u.notices.value).toEqual([])
    })

    it('régression (:192) — un échec des CLASSES en revalidation NE détruit PAS le roster servi par le cache', async () => {
      cacheStore = {
        etudiants: [{ id: 100, nom: 'Aline', email: 'aline@e.com', classe_id: 1, classe_nom: '6e A' }],
        enseignants: [{ id: 10, nom: 'Zoé Prof', email: 'zoe@e.com' }],
        classes: [{ id: 1, name: '6e A', places_occupees: 1 }],
        counts: { classes: 1, enseignants: 1, etudiants: 1, classesOk: 1 },
      }
      // Revalidation d'arrière-plan : les CLASSES tombent (endpoint sans rapport
      // avec le listing des étudiants) ; les enseignants passent.
      impl.getClasses = () => Promise.reject(new Error('proxy 500'))

      const u = await setup()
      await flushPromises()
      await flushPromises()

      // Le roster servi par le cache est PRÉSERVÉ (pas d'effacement par un tiers)…
      expect(u.etudiants.value).toHaveLength(1)
      expect(u.etudiants.value[0].email).toBe('aline@e.com')
      // …le cache n'est pas empoisonné avec une liste vide…
      expect(cacheStore.etudiants).toHaveLength(1)
      // …et le compteur reste cohérent avec la liste affichée (pas de « — »).
      expect(u.counts.value.etudiants).toBe(1)
    })

    it('race (:241) — une revalidation périmée n’écrase pas un force-reload frais', async () => {
      cacheStore = {
        etudiants: [{ id: 1, nom: 'Vieux', email: 'v@e.com', classe_id: 9, classe_nom: 'Vieux' }],
        enseignants: [], classes: [{ id: 9, name: 'Vieux', places_occupees: 1 }],
        counts: { classes: 1, enseignants: 0, etudiants: 1, classesOk: 1 },
      }
      // La revalidation d'arrière-plan reste BLOQUÉE sur getClasses (promesse en vol).
      let resolveSlow
      impl.getClasses = () => new Promise((res) => { resolveSlow = res })
      const u = await setup() // sert le cache + lance la revalidation (bloquée)

      // Force-reload FRAIS et rapide (génération plus récente) — termine en premier.
      impl.getClasses = () => Promise.resolve([{ id: 2, name: 'Neuf', places_occupees: 5 }])
      impl.getEnseignants = () => Promise.resolve([{ id: 20, nom: 'NeufProf', email: 'n@e.com' }])
      impl.getClasseEtudiants = () => Promise.resolve([{ id: 200, nom: 'NeufEleve', email: 'ne@e.com' }])
      await u.loadAllUsers(true)
      await flushPromises()
      expect(u.classes.value[0].name).toBe('Neuf') // le frais est bien appliqué

      // On débloque la revalidation PÉRIMÉE : elle doit être JETÉE (génération obsolète).
      resolveSlow([{ id: 9, name: 'Vieux', places_occupees: 1 }])
      await flushPromises()
      await flushPromises()

      expect(u.classes.value[0].name).toBe('Neuf') // pas écrasé par le périmé
      expect(cacheStore.classes[0].name).toBe('Neuf') // cache non empoisonné
    })
  })
})
