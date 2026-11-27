/**
 * #656, lot (a) : dans l'annuaire d'une école AUTONOME, chaque compte porte son id LOCAL (`lms_id`), le seul que
 * comprennent les routes de gestion d'un compte (`PUT`/`DELETE /users/{user}`).
 *
 * Ce que le serveur rend dans une école autonome (lu, pas supposé) :
 *  - le roster d'une classe (`/lms/classes/{id}`, `LocalClasseDetailsReader::rosterActif`) : `id` = `users.id` ;
 *  - les enseignants (`/lms/enseignants`, `LocalInstitutionTeachersReader::ligne`) : `id` = `users.id`.
 * L'écran les rangeait sous `klassci_id`, ce qui mêle deux espaces d'id. Et un élève qu'aucune classe n'inscrit
 * (créé à l'écran, #648) n'apparaissait nulle part : il vient de `/admin/users?role=etudiant`.
 *
 * Dans une école KLASSCI, rien ne change : ces id sont KLASSCI, et la liste des comptes élèves n'est pas lue.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const auth = { peutInscrireLocalement: true }
const impl = {}
const listComptesLocaux = vi.fn()

vi.mock('@/stores/auth', () => ({ useAuthStore: () => auth }))
vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: () => {}, invalidateEntity: () => {} }))
vi.mock('@/services/klassci', () => ({ default: { getClasses: () => impl.getClasses() } }))
vi.mock('@/services/lmsClasses', () => ({
  lmsClassesService: { getClasseDetails: (id) => impl.roster(id).then((etudiants) => ({ success: true, data: { etudiants } })) },
}))
vi.mock('@/services/lmsTeachers', () => ({
  lmsTeachersService: { getEnseignants: () => impl.enseignants().then((data) => ({ success: true, data })) },
}))
vi.mock('@/services/adminUsers', () => ({
  listAdministrationUsers: () => impl.administration(),
  listComptesLocaux: (...a) => listComptesLocaux(...a),
}))

import { useAdminUsers } from '@/composables/useAdminUsers'

async function setup() {
  let api
  mount(defineComponent({ setup() { api = useAdminUsers(); return () => null } }))
  await flushPromises()
  await flushPromises()
  return api
}

const ligne = (u, email) => u.filteredUsers.value.find((x) => x.email === email)

beforeEach(() => {
  auth.peutInscrireLocalement = true
  listComptesLocaux.mockReset()
  impl.getClasses = () => Promise.resolve([{ id: 1, name: '6e A', libelle: null }])
  impl.roster = () => Promise.resolve([{ id: 100, name: 'Aline Inscrite', email: 'aline@e.com' }])
  impl.enseignants = () => Promise.resolve([{ id: 10, nom: 'Zoé Prof', email: 'zoe@e.com' }])
  impl.administration = () => Promise.resolve({ items: [{ id: 3, name: 'Cora', email: 'cora@e.com', role: 'coordinateur' }], counts: null })
  listComptesLocaux.mockResolvedValue([
    { id: 100, name: 'Aline Inscrite', email: 'aline@e.com', role: 'etudiant', klassci_id: null },
    { id: 101, name: 'Bruno Sans Classe', email: 'bruno@e.com', role: 'etudiant', klassci_id: null },
  ])
})

describe('#656 (a) — école autonome : des id LOCAUX', () => {
  it('l’élève inscrit et l’enseignant portent leur id local, jamais rangé sous klassci_id', async () => {
    const u = await setup()

    expect(ligne(u, 'aline@e.com')).toMatchObject({ lms_id: 100, klassci_id: null, classe_nom: '6e A' })
    expect(ligne(u, 'zoe@e.com')).toMatchObject({ lms_id: 10, klassci_id: null })
  })

  it('l’élève qu’aucune classe n’inscrit apparaît, une fois, sans classe', async () => {
    const u = await setup()

    expect(listComptesLocaux).toHaveBeenCalledWith({ role: 'etudiant' })
    expect(ligne(u, 'bruno@e.com')).toMatchObject({ lms_id: 101, klassci_id: null, role: 'etudiant', classe_id: null, classe_nom: null })
    // L'élève inscrit figure AUSSI dans /admin/users : il ne doit pas compter deux fois.
    expect(u.filteredUsers.value.filter((x) => x.email === 'aline@e.com')).toHaveLength(1)
    expect(u.totalUsers.value).toBe(4)
  })

  it('le filtre « Étudiants » retient l’élève sans classe', async () => {
    const u = await setup()

    u.filterRole.value = 'etudiant'
    expect(u.filteredUsers.value.map((x) => x.email).sort()).toEqual(['aline@e.com', 'bruno@e.com'])
  })

  it('une lecture des comptes élèves en échec est SIGNALÉE et ne vide pas l’écran', async () => {
    listComptesLocaux.mockRejectedValue(new Error('500'))
    const u = await setup()

    expect(u.totalUsers.value).toBe(3)
    expect(u.notices.value.some((n) => /sans classe/i.test(n))).toBe(true)
  })

  it('roster INCOMPLET : un élève d’une classe non lue n’est jamais présenté « sans classe »', async () => {
    // Bruno est inscrit en 6e B, dont le roster n'a pas pu être lu : on ne sait pas qu'il est sans classe.
    impl.getClasses = () => Promise.resolve([{ id: 1, name: '6e A', libelle: null }, { id: 2, name: '6e B', libelle: null }])
    impl.roster = (id) => (id === 1
      ? Promise.resolve([{ id: 100, name: 'Aline Inscrite', email: 'aline@e.com' }])
      : Promise.reject(new Error('500')))
    const u = await setup()

    expect(ligne(u, 'bruno@e.com')).toBeUndefined()
    expect(u.notices.value.some((n) => /incompl/i.test(n))).toBe(true)
  })

  it('classes illisibles : aucun élève n’est déduit « sans classe »', async () => {
    impl.getClasses = () => Promise.reject(new Error('500'))
    const u = await setup()

    expect(u.filteredUsers.value.filter((x) => x.role === 'etudiant')).toEqual([])
  })
})

describe('#656 (a) — école KLASSCI : rien ne change', () => {
  beforeEach(() => { auth.peutInscrireLocalement = false })

  it('les id restent KLASSCI, et la liste des comptes élèves n’est pas lue', async () => {
    const u = await setup()

    expect(listComptesLocaux).not.toHaveBeenCalled()
    expect(ligne(u, 'aline@e.com')).toMatchObject({ klassci_id: 100 })
    expect(ligne(u, 'aline@e.com').lms_id).toBeUndefined()
    expect(ligne(u, 'zoe@e.com')).toMatchObject({ klassci_id: 10 })
    expect(ligne(u, 'zoe@e.com').lms_id).toBeUndefined()
    expect(u.totalUsers.value).toBe(3)
    expect(u.notices.value.some((n) => /sans classe/i.test(n))).toBe(false)
  })
})
