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

/** Plafond d'une page côté serveur (`ListUsersRequest` : per_page ≤ 100) ; il suffit à l'encadrement. */
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

/**
 * Tous les comptes LMS d'un rôle, TOUTES pages lues (#656) : `GET /admin/users?role=…`.
 *
 * Sert l'école autonome, où un élève qu'aucune classe n'inscrit (créé à l'écran, #648) n'a pas d'autre source.
 * Une école dépasse vite le plafond d'une page (100) : on suit `last_page`. Les pages sont lues l'une après
 * l'autre, pour ne pas solliciter le serveur en rafale. Une page en échec fait échouer l'ensemble : une liste à
 * moitié lue ne doit jamais passer pour complète.
 *
 * @param {{ role: string }} filtre rôle canonique (`ROLES`)
 * @returns {Promise<Array<object>>} les comptes `{ id, name, email, role, klassci_id, created_at }`, id LOCAUX
 */
export async function listComptesLocaux({ role }) {
  const comptes = []
  let page = 1
  let derniere = 1
  do {
    const response = await api.get(endpoints.admin.users, {
      params: { role, page, per_page: PAGE_SIZE, sort: 'name', direction: 'asc' },
    })
    comptes.push(...extractList(response))
    // Sans `last_page` lisible, on ne devine pas d'autres pages : on s'arrête à celle-ci.
    derniere = Number(response?.data?.last_page) || page
    page += 1
  } while (page <= derniere)
  return comptes
}

/**
 * Crée un compte dans l'établissement de l'acteur (#648), `POST /users` (CreateUserRequest) : un mot de passe
 * INITIAL, confirmé ; le rôle est jugé par le serveur (strictement inférieur à celui de l'acteur).
 * @param {{ nom: string, courriel: string, role: string, motDePasse: string, confirmation: string }} saisie
 * @returns {Promise<object>} le corps de la réponse (`{ data: user }`)
 */
export async function creerCompte({ nom, courriel, role, motDePasse, confirmation }) {
  return api.post(endpoints.admin.creerCompte, {
    name: nom, email: courriel, password: motDePasse, password_confirmation: confirmation, role,
  })
}

/**
 * Modifie un compte de l'établissement (#656 b), `PUT /users/{user}` : seuls les champs ENVOYÉS changent. La cible et le
 * nouveau rôle sont jugés par le serveur (rang strictement inférieur à celui de l'acteur).
 * @param {number|string} id l'id LOCAL du compte (`lms_id`), jamais un id KLASSCI
 * @param {{ name?: string, email?: string, role?: string }} changements
 * @returns {Promise<object>} le corps de la réponse (`{ data: user }`)
 */
export async function modifierCompte(id, changements) {
  return api.put(endpoints.admin.compte(id), changements)
}

/**
 * Désactive un compte (#656 b), `DELETE /users/{user}` : suppression logique, dossier conservé, sessions fermées.
 * @param {number|string} id l'id LOCAL du compte
 * @returns {Promise<object>}
 */
export async function desactiverCompte(id) {
  return api.delete(endpoints.admin.compte(id))
}

/**
 * Définit le mot de passe d'un compte (#656 b), `PUT /users/{user}/password`. Le serveur ferme ses sessions ; le mot
 * de passe ne revient jamais dans la réponse.
 * @param {number|string} id l'id LOCAL du compte
 * @param {{ motDePasse: string, confirmation: string }} saisie
 * @returns {Promise<object>}
 */
export async function definirMotDePasse(id, { motDePasse, confirmation }) {
  return api.put(endpoints.admin.motDePasse(id), { password: motDePasse, password_confirmation: confirmation })
}

export default { listAdministrationUsers, listComptesLocaux, creerCompte, modifierCompte, desactiverCompte, definirMotDePasse }
