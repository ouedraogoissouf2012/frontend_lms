/**
 * #626, PR 2 (accord signé n°49 ; lms_backend#1536, PR #1550, déployée). Le tableau de bord enseignant reconnaît
 * SA fiche dans l'annuaire (`/lms/enseignants`) par UN seul id, que le serveur rend déjà dans l'espace de cet
 * annuaire : `user.id_dans_l_annuaire` (id local en école autonome, identité d'enseignant KLASSCI en école KLASSCI ;
 * nul pour un compte non enseignant, ou un enseignant KLASSCI sans identité). Le front ne connaît pas le mode de
 * l'école (#805) et n'en a plus besoin.
 *
 * Les anciens replis sont RETIRÉS (décision de la superviseure) : ni `klassci_id` (un numéro de COMPTE), ni `id`
 * local croisé, ni courriel, ni nom. Un nul ne correspond à RIEN : le tableau de bord passe alors par ses autres
 * sources (matières, séances), jamais par la fiche d'un autre.
 */
import { describe, expect, it, vi } from 'vitest'
import { buildTeacherDashboardFallback } from '@/utils/teacherDashboard'
import { LOGIN_USER_KLASSCI, LOGIN_USER_LOCAL } from '../fixtures/api/loginUser'

const fiche = (id, nom, extra = {}) => ({ id, name: `Enseignant ${nom}`, email: `${nom.toLowerCase()}@ecole.test`, matieres: [{ id: id * 10, nom: `Matiere de ${nom}` }], ...extra })

function lms(annuaire) {
  return {
    getEnseignants: vi.fn(() => Promise.resolve({ success: true, data: annuaire })),
    getMyMatieres: vi.fn(() => Promise.resolve({ success: true, data: [{ id: 1, nom: 'Repli par mes matieres' }] })),
    getMyTeachingSeances: vi.fn(() => Promise.resolve({ success: true, data: [] })),
  }
}

const matieres = async (annuaire, user) => (await buildTeacherDashboardFallback(lms(annuaire), user, null)).matieres.map((m) => m.nom)

describe('#626 PR 2 — la charge de connexion porte id_dans_l_annuaire (forme mesurée, IdentiteDuCompte)', () => {
  it('les deux connexions portent id, klassci_id, klassci_enseignant_id et id_dans_l_annuaire', () => {
    for (const u of [LOGIN_USER_KLASSCI, LOGIN_USER_LOCAL]) {
      expect(Object.keys(u)).toEqual(expect.arrayContaining(['id', 'klassci_id', 'klassci_enseignant_id', 'id_dans_l_annuaire']))
    }
  })
})

describe('#626 PR 2 — la fiche se reconnaît par id_dans_l_annuaire, et par rien d’autre', () => {
  it('école KLASSCI : la fiche dont l’id vaut id_dans_l_annuaire, pas celle dont l’id vaut l’id local ni le klassci_id', async () => {
    const moi = { id: 3, klassci_id: 9303, klassci_enseignant_id: 9401, id_dans_l_annuaire: 9401, name: 'Awa', email: 'awa@ecole.test' }
    expect(await matieres([fiche(3, 'Local'), fiche(9303, 'Compte'), fiche(9401, 'Awa')], moi)).toEqual(['Matiere de Awa'])
  })

  it('école autonome : l’id local, rendu par le serveur dans id_dans_l_annuaire', async () => {
    const moi = { id: 7, klassci_id: null, klassci_enseignant_id: null, id_dans_l_annuaire: 7, name: 'Binta' }
    expect(await matieres([fiche(5, 'Autre'), fiche(7, 'Binta')], moi)).toEqual(['Matiere de Binta'])
  })

  it('deux HOMONYMES ne se confondent pas : même nom, autre id → aucune fiche, le repli par mes matières', async () => {
    const moi = { id: 7, id_dans_l_annuaire: 7, name: 'Enseignant Awa', email: 'moi@ecole.test' }
    expect(await matieres([fiche(8, 'Awa')], moi)).toEqual(['Repli par mes matieres'])
  })

  it('un même COURRIEL sur deux comptes ne se confond pas', async () => {
    const moi = { id: 7, id_dans_l_annuaire: 7, name: 'Moi', email: 'awa@ecole.test' }
    expect(await matieres([fiche(8, 'Awa')], moi)).toEqual(['Repli par mes matieres'])
  })

  it('id_dans_l_annuaire nul (enseignant KLASSCI sans identité) : rien ne correspond, même si id, nom et courriel coïncident', async () => {
    const moi = { id: 9401, klassci_id: 9401, id_dans_l_annuaire: null, name: 'Enseignant Awa', email: 'awa@ecole.test' }
    expect(await matieres([fiche(9401, 'Awa')], moi)).toEqual(['Repli par mes matieres'])
  })

  it('une session ouverte AVANT lms_backend#1536 (clé absente) : rien ne correspond, jamais un repli croisé', async () => {
    const { id_dans_l_annuaire: _absente, ...ancienne } = { ...LOGIN_USER_LOCAL, id: 9 }
    expect(await matieres([fiche(9, 'Bede')], ancienne)).toEqual(['Repli par mes matieres'])
  })

  it('l’id peut arriver en chaîne : la comparaison se fait sur l’id normalisé', async () => {
    expect(await matieres([fiche(12, 'Awa')], { id_dans_l_annuaire: '12' })).toEqual(['Matiere de Awa'])
  })
})
