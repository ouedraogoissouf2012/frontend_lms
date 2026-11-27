import { getFullName } from '@/utils/formatters'
import { ROLES, normalizeRole } from '@/constants/roles'
import { getEnseignantClassesLabel, getEnseignantUniqueClasses } from '@/utils/enseignants'
import { toId } from '@/utils/toId'

/**
 * Construction des lignes du tableau d'annuaire, à partir des TROIS populations.
 *
 * Extrait de `useAdminUsers` (≤300 l.) quand la troisième population est arrivée :
 * le composable orchestre le chargement, ce module décrit la forme des lignes.
 *
 * #656 (b) : `role_brut` garde le rôle tel que le serveur le classe, pour la règle de gestion d'un compte
 * (`gestionDeCompte`, miroir de `GestionDeCompte::admet`).
 *
 * Le `role` porté par chaque ligne est toujours CANONIQUE : c'est lui que compare
 * le filtre de la barre d'outils. Un `superAdmin` doit répondre au filtre
 * « Administrateurs » (rôle canonique `admin`), sans quoi la ligne existerait
 * dans le tableau mais deviendrait introuvable dès qu'on filtre.
 *
 * #656 : l'ESPACE de l'id d'un élève ou d'un enseignant dépend de l'école, pas de la donnée. Dans une école
 * autonome, le roster (`LocalClasseDetailsReader`) et les enseignants (`LocalInstitutionTeachersReader`) rendent
 * `users.id` : la ligne le porte en `lms_id`, le seul que comprennent les routes de gestion d'un compte. Dans une
 * école KLASSCI, c'est un id KLASSCI (`klassci_id`). Les deux ne se mêlent jamais.
 */

/** Espace d'id des populations élèves et enseignants, décidé par la capacité de l'école. */
export const ESPACES = Object.freeze({ LOCAL: 'local', KLASSCI: 'klassci' })

/**
 * @param {number|string} id
 * @param {string} espace `ESPACES.LOCAL` ou `ESPACES.KLASSCI`
 * @returns {{lms_id: number|string, klassci_id: null}|{klassci_id: number|string}}
 */
const identite = (id, espace) => (espace === ESPACES.LOCAL ? { lms_id: id, klassci_id: null } : { klassci_id: id })

/**
 * Étudiants issus du roster des classes.
 *
 * @param {Array<object>} etudiants
 * @param {string} [espace]
 * @returns {Array<object>}
 */
export function etudiantRows(etudiants, espace = ESPACES.KLASSCI) {
  return (etudiants ?? []).map((e) => ({
    _uid: `etu-${e.id}`,
    ...identite(e.id, espace),
    name: getFullName(e),
    email: e.email,
    role: ROLES.ETUDIANT,
    role_brut: ROLES.ETUDIANT,
    classe_id: e.classe_id,
    classe_nom: e.classe_nom,
    matricule: e.matricule,
    telephone: e.telephone,
  }))
}

/**
 * Enseignants issus de la liste enrichie KLASSCI.
 *
 * Le rôle est FORCÉ : `/proxy/enseignants` renvoie `"role":"etudiant"` pour un
 * professeur (donnée amont fausse, vérifiée contre l'API). La source de vérité
 * est l'endpoint interrogé, pas le champ.
 *
 * @param {Array<object>} enseignants
 * @param {string} [espace]
 * @returns {Array<object>}
 */
export function enseignantRows(enseignants, espace = ESPACES.KLASSCI) {
  return (enseignants ?? []).map((e) => ({
    _uid: `ens-${e.id || e.teacher_id}`,
    ...identite(e.id || e.teacher_id, espace),
    name: getFullName(e),
    email: e.email,
    role: ROLES.ENSEIGNANT,
    role_brut: ROLES.ENSEIGNANT,
    // Classes DÉRIVÉES des matières (helper canonique), jamais un `null` en dur.
    classe_id: null,
    classe_ids: getEnseignantUniqueClasses(e).map((c) => c.id),
    classe_nom: getEnseignantClassesLabel(e),
    matricule: e.matricule,
    telephone: e.telephone,
    specialization: e.specialization,
  }))
}

/**
 * Comptes d'encadrement, issus de la base LMS (`GET /admin/users`).
 *
 * Ces comptes n'ont pas d'équivalent KLASSCI : ni classe, ni matricule, ni
 * téléphone. Ces champs restent `null` — la donnée n'existe pas, elle n'est pas
 * « vide ».
 *
 * @param {Array<object>} administration
 * @returns {Array<object>}
 */
export function administrationRows(administration) {
  return (administration ?? []).map((u) => ({
    _uid: `lms-${u.id}`,
    lms_id: u.id,
    klassci_id: u.klassci_id ?? null,
    name: u.name,
    email: u.email,
    role: normalizeRole(u.role),
    // #656 (b) : le rang serveur (`gestionDeCompte`) ; `superAdmin` y est au-dessus d'`admin`.
    role_brut: u.role ?? null,
    classe_id: null,
    classe_nom: null,
    matricule: null,
    telephone: null,
    created_at: u.created_at ?? null,
  }))
}

/**
 * Élèves d'une école autonome qu'aucune classe n'inscrit (#656), issus de `GET /admin/users?role=etudiant`.
 *
 * Ce compte figure aussi au roster s'il est inscrit : on ne garde que les ABSENTS du roster, comparés par id local
 * (même espace des deux côtés). Sans classe, `classe_id` et `classe_nom` valent `null` : la donnée n'existe pas.
 *
 * @param {Array<object>} comptes
 * @param {Array<object>} roster les élèves déjà lus par classe
 * @returns {Array<object>}
 */
export function elevesSansClasseRows(comptes, roster) {
  const inscrits = new Set((roster ?? []).map((e) => toId(e.id)))
  return (comptes ?? [])
    .filter((u) => !inscrits.has(toId(u.id)))
    .map((u) => ({
      _uid: `etu-${u.id}`,
      ...identite(u.id, ESPACES.LOCAL),
      name: u.name,
      email: u.email,
      role: ROLES.ETUDIANT,
      role_brut: ROLES.ETUDIANT,
      classe_id: null,
      classe_nom: null,
      matricule: null,
      telephone: null,
    }))
}

/**
 * Liste unifiée des populations.
 *
 * @param {{etudiants?: Array<object>, enseignants?: Array<object>, administration?: Array<object>,
 *   elevesLocaux?: Array<object>, espace?: string}} sources `elevesLocaux` n'est lu que dans l'espace LOCAL
 * @returns {Array<object>}
 */
export function buildUserRows({ etudiants, enseignants, administration, elevesLocaux, espace = ESPACES.KLASSCI } = {}) {
  return [
    ...etudiantRows(etudiants, espace),
    ...(espace === ESPACES.LOCAL ? elevesSansClasseRows(elevesLocaux, etudiants) : []),
    ...enseignantRows(enseignants, espace),
    ...administrationRows(administration),
  ]
}
