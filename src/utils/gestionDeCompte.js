import { toId } from '@/utils/toId'

/**
 * Quelles actions l'écran OFFRE sur un compte (#656, lot b), miroir des gardes du serveur (lms). Le serveur reste juge :
 * l'écran n'offre que ce qu'il accepterait.
 *
 *   - `GestionDeCompte::admet` : la cible est de rang STRICTEMENT inférieur à l'acteur, jamais l'acteur lui-même ;
 *   - `PUT`/`DELETE /users/{user}` : coordinateur, admin, superAdmin ;
 *   - `PUT /users/{user}/password` (`DefinirLeMotDePasseRequest`) : admin et superAdmin seulement, et dans une école
 *     qui tient ses comptes (`peutInscrireLocalement`) ; ailleurs, le mot de passe est celui de KLASSCI ;
 *   - une route de compte ne comprend qu'un id LOCAL : une ligne sans `lms_id` n'est pas gérable.
 *
 * Le rang se lit sur le rôle BRUT, comme `Role::tryFromString` : correspondance exacte, sans casse ni espace. Le rôle
 * normalisé du front (`normalizeRole`) range `superAdmin` sous `admin`, alors que le serveur laisse un superAdmin gérer
 * un admin et refuse l'inverse.
 */

/** `Role::aliases` et `Role::permissivity` (lms `app/Enums/Role.php`). */
const RANGS = Object.freeze({
  etudiant: 1, student: 1, 'étudiant': 1,
  enseignant: 2, teacher: 2,
  coordinateur: 3, coordinator: 3,
  admin: 4, administrateur: 4,
  superAdmin: 4, // SONDE #656 (b) : le rang du rôle normalisé
  supradmin: 6,
})

/** Les rangs qui gèrent un compte d'établissement : coordinateur (3), admin (4), superAdmin (5). */
const GESTION = Object.freeze([3, 4, 5])

/** Les rangs qui définissent un mot de passe : admin (4), superAdmin (5). */
const MOT_DE_PASSE = Object.freeze([4, 5])

/**
 * @param {unknown} role le rôle brut
 * @returns {number|null} son rang serveur, ou `null` pour un rôle inconnu
 */
export function rangBrut(role) {
  return typeof role === 'string' && Object.hasOwn(RANGS, role) ? RANGS[role] : null
}

/**
 * Modifier et désactiver.
 *
 * @param {{ id: unknown, role: unknown }|null} acteur le compte connecté
 * @param {{ lms_id?: unknown, role_brut?: unknown }|null} ligne la ligne de l'annuaire
 * @returns {boolean}
 */
export function peutGerer(acteur, ligne) {
  // `toId` rend '' pour un id absent : une ligne sans id local, ou un acteur sans id, ne se comparent à rien.
  const cible = toId(ligne?.lms_id)
  if (cible === '' || cible === toId(acteur?.id)) return false
  const rangActeur = rangBrut(acteur?.role)
  const rangCible = rangBrut(ligne?.role_brut)
  return GESTION.includes(rangActeur) && rangCible !== null && rangActeur > rangCible
}

/**
 * Définir le mot de passe.
 *
 * @param {{ id: unknown, role: unknown }|null} acteur
 * @param {{ lms_id?: unknown, role_brut?: unknown }|null} ligne
 * @param {unknown} peutInscrireLocalement la capacité de l'école (`true` seulement compte)
 * @returns {boolean}
 */
export function peutDefinirMotDePasse(acteur, ligne, peutInscrireLocalement) {
  return peutInscrireLocalement === true && MOT_DE_PASSE.includes(rangBrut(acteur?.role)) && peutGerer(acteur, ligne)
}
