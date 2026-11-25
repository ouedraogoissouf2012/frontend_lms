import { ROLES, normalizeRole } from '@/constants/roles'

/**
 * Les rôles qu'un acteur peut ATTRIBUER à un compte qu'il crée (#648), miroir des DEUX gardes serveur (lms) :
 *   - `CreateUserRequest::authorize()` : seuls un coordinateur ou un admin créent un compte ;
 *   - `AssignableRole` : un rôle STRICTEMENT inférieur au sien.
 * Le serveur reste juge ; l'écran n'offre que ce qu'il accepterait.
 *
 * Rang serveur : etudiant 1 < enseignant 2 < coordinateur 3 < admin 4 < superAdmin 5. Le `superAdmin` d'établissement
 * est un admin pour le front (`normalizeRole`) : l'écran ne lui offre pas `admin`, réservé à la plateforme.
 */
const OFFERTS = Object.freeze([ROLES.COORDINATEUR, ROLES.ENSEIGNANT, ROLES.ETUDIANT])

const RANG = Object.freeze({ [ROLES.ETUDIANT]: 1, [ROLES.ENSEIGNANT]: 2, [ROLES.COORDINATEUR]: 3, [ROLES.ADMIN]: 4 })

/** `authorize()` : les seuls rôles qui créent un compte. */
const CREATEURS = Object.freeze([ROLES.COORDINATEUR, ROLES.ADMIN])

/**
 * @param {unknown} roleActeur - le rôle brut de l'acteur connecté
 * @returns {string[]} les rôles canoniques offerts, du plus élevé au plus bas ; aucun pour un rôle inconnu
 */
export function rolesAttribuables(roleActeur) {
  const role = normalizeRole(roleActeur)
  return CREATEURS.includes(role) ? OFFERTS.filter((r) => RANG[r] < RANG[role]) : []
}
