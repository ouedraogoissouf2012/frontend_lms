/**
 * #656, lot (b) : la règle qui dit quelles actions l'écran OFFRE sur un compte. C'est le miroir des gardes du serveur
 * (lms) ; le serveur reste juge.
 *
 *   - `GestionDeCompte::admet` : cible de rang STRICTEMENT inférieur, jamais soi-même, sur le rôle BRUT
 *     (`Role::permissivity` : etudiant 1 < enseignant 2 < coordinateur 3 < admin 4 < superAdmin 5 < supradmin 6,
 *     alias de `Role::aliases`, en correspondance exacte) ;
 *   - `PUT`/`DELETE /users/{user}` : coordinateur, admin, superAdmin ;
 *   - `PUT /users/{user}/password` : admin et superAdmin seulement, et dans une école qui tient ses comptes
 *     (`peutInscrireLocalement`) ; une école KLASSCI rend 403 `password_managed_by_klassci` ;
 *   - une route de compte ne comprend qu'un id LOCAL : une ligne sans `lms_id` n'est pas gérable.
 *
 * Le rang BRUT compte : `normalizeRole` range `superAdmin` sous `admin`, alors que le serveur laisse un superAdmin
 * gérer un admin, et refuse l'inverse.
 */
import { describe, it, expect } from 'vitest'
import { rangBrut, peutGerer, peutDefinirMotDePasse } from '@/utils/gestionDeCompte'

const acteur = (role, id = 1) => ({ id, role })
const ligne = (role_brut, lms_id = 101) => ({ lms_id, role_brut })

describe('#656 (b) — le rang brut, miroir de Role::permissivity', () => {
  it('les six rôles et leurs alias, en correspondance exacte', () => {
    expect([
      'etudiant', 'student', 'étudiant', 'enseignant', 'teacher', 'coordinateur', 'coordinator',
      'admin', 'administrateur', 'superAdmin', 'supradmin',
    ].map(rangBrut)).toEqual([1, 1, 1, 2, 2, 3, 3, 4, 4, 5, 6])
  })

  it('un rôle inconnu, une autre casse ou une espace : aucun rang', () => {
    for (const r of ['Admin', 'superadmin', ' admin', 'administrator', 'eleve', '', null, undefined, 4]) expect(rangBrut(r)).toBeNull()
  })
})

describe('#656 (b) — modifier et désactiver : peutGerer', () => {
  it('admin : élève, enseignant, coordinateur ; jamais un admin ni un superAdmin', () => {
    expect(['etudiant', 'enseignant', 'coordinateur'].map((r) => peutGerer(acteur('admin'), ligne(r)))).toEqual([true, true, true])
    expect(['admin', 'superAdmin'].map((r) => peutGerer(acteur('admin'), ligne(r)))).toEqual([false, false])
  })

  it('superAdmin gère un admin : le rang brut, pas le rôle normalisé', () => {
    expect(peutGerer(acteur('superAdmin'), ligne('admin'))).toBe(true)
    expect(peutGerer(acteur('superAdmin'), ligne('superAdmin'))).toBe(false)
  })

  it('coordinateur : élève et enseignant ; ni un coordinateur ni un admin', () => {
    expect(['etudiant', 'enseignant', 'coordinateur', 'admin'].map((r) => peutGerer(acteur('coordinateur'), ligne(r))))
      .toEqual([true, true, false, false])
  })

  it('enseignant, élève, supradmin de plateforme, rôle inconnu : rien', () => {
    for (const r of ['enseignant', 'etudiant', 'supradmin', 'Admin', null]) expect(peutGerer(acteur(r), ligne('etudiant'))).toBe(false)
  })

  it('jamais soi-même', () => {
    expect(peutGerer(acteur('superAdmin', 7), { lms_id: 7, role_brut: 'admin' })).toBe(false)
    expect(peutGerer(acteur('superAdmin', '7'), { lms_id: 7, role_brut: 'admin' })).toBe(false)
  })

  it('une ligne sans id local (élève d’une école KLASSCI) ou au rôle inconnu : rien', () => {
    expect(peutGerer(acteur('admin'), { klassci_id: 900, role_brut: 'etudiant' })).toBe(false)
    expect(peutGerer(acteur('admin'), { lms_id: null, role_brut: 'etudiant' })).toBe(false)
    expect(peutGerer(acteur('admin'), ligne('eleve'))).toBe(false)
    expect(peutGerer(null, ligne('etudiant'))).toBe(false)
    expect(peutGerer(acteur('admin'), null)).toBe(false)
  })
})

describe('#656 (b) — définir le mot de passe : peutDefinirMotDePasse', () => {
  it('admin et superAdmin, dans une école qui tient ses comptes', () => {
    expect(peutDefinirMotDePasse(acteur('admin'), ligne('etudiant'), true)).toBe(true)
    expect(peutDefinirMotDePasse(acteur('superAdmin'), ligne('admin'), true)).toBe(true)
  })

  it('jamais le coordinateur : définir un mot de passe, c’est pouvoir se connecter à la place du compte', () => {
    expect(peutDefinirMotDePasse(acteur('coordinateur'), ligne('etudiant'), true)).toBe(false)
  })

  it('école KLASSCI : le mot de passe est celui de KLASSCI', () => {
    expect(peutDefinirMotDePasse(acteur('admin'), ligne('coordinateur'), false)).toBe(false)
    expect(peutDefinirMotDePasse(acteur('admin'), ligne('coordinateur'), undefined)).toBe(false)
  })

  it('la borne de la gestion vaut aussi : ni soi-même, ni un rang égal', () => {
    expect(peutDefinirMotDePasse(acteur('admin', 7), { lms_id: 7, role_brut: 'coordinateur' }, true)).toBe(false)
    expect(peutDefinirMotDePasse(acteur('admin'), ligne('admin'), true)).toBe(false)
  })
})
