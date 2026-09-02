/**
 * Service `adminUsers` — client de `GET /admin/users`, la liste des COMPTES LMS.
 *
 * Cet endpoint est la seule source des coordinateurs et administrateurs : le proxy
 * KLASSCI ne renvoie que des étudiants et des enseignants, si bien que ces comptes
 * étaient absents de l'écran d'annuaire.
 *
 * Pourquoi un appel LARGE plutôt qu'un appel par rôle : l'API filtre sur un rôle
 * canonique à la fois, et l'administration en couvre trois (coordinateur, admin,
 * superAdmin). Un seul appel évite trois allers-retours ; la sélection se fait
 * ensuite par exclusion (ni étudiant, ni enseignant), ce qui capte aussi tout rôle
 * d'encadrement futur sans changer ce code.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const get = vi.fn()
vi.mock('@/services/api', () => ({
  default: { get: (...a) => get(...a) },
}))

import { listAdministrationUsers } from '@/services/adminUsers'
import endpoints from '@/services/endpoints'

describe('adminUsers service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    get.mockResolvedValue({ success: true, data: { data: [], total: 0 }, meta: { counts: null } })
  })

  it('interroge le chemin du registre, jamais une URL en dur', async () => {
    await listAdministrationUsers()
    expect(get).toHaveBeenCalledWith(endpoints.admin.users, expect.anything())
    expect(endpoints.admin.users).toBe('/admin/users')
  })

  it('ne retient que les comptes d’encadrement', async () => {
    get.mockResolvedValue({
      success: true,
      data: {
        data: [
          { id: 1, name: 'Eleve', email: 'e@e.com', role: 'etudiant' },
          { id: 2, name: 'Prof', email: 'p@e.com', role: 'enseignant' },
          { id: 3, name: 'Coord', email: 'c@e.com', role: 'coordinateur' },
          { id: 4, name: 'Admin', email: 'a@e.com', role: 'superAdmin' },
        ],
        total: 4,
      },
      meta: { counts: { total: 4, etudiants: 1, enseignants: 1, administration: 2 } },
    })

    const { items } = await listAdministrationUsers()

    // Étudiants et enseignants sont déjà fournis par KLASSCI : les reprendre ici
    // dupliquerait chaque ligne du tableau.
    expect(items.map(u => u.id)).toEqual([3, 4])
  })

  it('retient les alias EN/FR des rôles déjà couverts par KLASSCI', async () => {
    get.mockResolvedValue({
      success: true,
      data: {
        data: [
          { id: 5, name: 'Student', email: 's@e.com', role: 'student' },
          { id: 6, name: 'Teacher', email: 't@e.com', role: 'teacher' },
          { id: 7, name: 'Coord', email: 'c@e.com', role: 'coordinateur' },
        ],
        total: 3,
      },
    })

    const { items } = await listAdministrationUsers()

    // `student` / `teacher` sont les mêmes personnes que `etudiant` / `enseignant` :
    // l'exclusion doit passer par la normalisation, pas par une comparaison brute.
    expect(items.map(u => u.id)).toEqual([7])
  })

  it('expose les compteurs mesurés par le serveur', async () => {
    get.mockResolvedValue({
      success: true,
      data: { data: [], total: 0 },
      meta: { counts: { total: 4, etudiants: 1, enseignants: 1, administration: 2 } },
    })

    const { counts } = await listAdministrationUsers()

    expect(counts.administration).toBe(2)
  })

  it('rend counts null quand la réponse ne le porte pas — jamais un 0 fabriqué', async () => {
    get.mockResolvedValue({ success: true, data: { data: [], total: 0 } })

    const { counts } = await listAdministrationUsers()

    expect(counts).toBeNull()
  })
})
