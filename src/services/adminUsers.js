import api from './api'
import endpoints from './endpoints'
import { extractList } from '@/utils/apiList'
import { normalizeRole, ROLES } from '@/constants/roles'

/**
 * Comptes LMS du tenant — `GET /admin/users`.
 *
 * Raison d'être : le proxy KLASSCI ne connaît que des étudiants et des
 * enseignants. Coordinateurs et administrateurs n'apparaissaient donc nulle part
 * dans l'annuaire, alors que ce sont des comptes qui se connectent réellement.
 *
 * L'API filtre sur UN rôle canonique à la fois, et l'encadrement en couvre
 * plusieurs (coordinateur, admin, superAdmin). On fait donc un seul appel large,
 * puis on retient par EXCLUSION : tout ce qui n'est ni étudiant ni enseignant.
 * Ce choix capte aussi tout rôle d'encadrement ajouté plus tard, sans retoucher
 * ce fichier — et il évite de dupliquer les deux populations déjà fournies par
 * KLASSCI.
 */

/** Une seule page suffit à l'encadrement d'un établissement (plafond serveur). */
const PAGE_SIZE = 100

/** Rôles déjà couverts par les listes KLASSCI, donc exclus d'ici. */
const COVERED_BY_KLASSCI = [ROLES.ETUDIANT, ROLES.ENSEIGNANT]

/**
 * Vrai si le compte relève de l'encadrement.
 *
 * La comparaison passe par `normalizeRole` : la colonne `role` contient
 * indifféremment `etudiant`, `student` ou `étudiant` selon l'époque du sync, et
 * une comparaison brute laisserait passer les alias — la même personne
 * apparaîtrait alors deux fois dans le tableau.
 */
const isAdministration = (user) => {
  const role = normalizeRole(user?.role)
  return role !== null && !COVERED_BY_KLASSCI.includes(role)
}

/**
 * Charge les comptes d'encadrement du tenant.
 *
 * @returns {Promise<{items: Array<object>, counts: object|null}>} `counts` vaut
 *   `null` si le serveur ne l'a pas fourni — non mesuré, à rendre « — », jamais 0.
 */
export async function listAdministrationUsers() {
  const response = await api.get(endpoints.admin.users, {
    params: { per_page: PAGE_SIZE, sort: 'name', direction: 'asc' },
  })

  return {
    items: extractList(response).filter(isAdministration),
    counts: response?.meta?.counts ?? null,
  }
}

export default { listAdministrationUsers }
