import api from './api'
import { endpoints } from './endpoints'

/**
 * front#664 (contrat back #1797) : le dossier d'un élève et ses tuteurs. `eleve` est l'id LOCAL du compte. Le serveur
 * juge qui lit (gestion, l'élève lui-même, son enseignant) et qui écrit (la gestion d'une école autonome).
 */

/** `{ eleve_id, source: 'lms'|'klassci', dossier|null }` */
export async function lireDossier(eleve) {
  return (await api.get(endpoints.eleves.dossier(eleve))).data
}

/**
 * Crée ou met à jour le dossier. Rend `{ eleve_id, source, dossier }`. Un doublon possible rejette en 409
 * (`reason: doublon_possible`, `candidats`) ; `confirmerDoublon` passe outre.
 */
export async function ecrireDossier(eleve, identite, confirmerDoublon = false) {
  const corps = confirmerDoublon ? { ...identite, confirmer_doublon: true } : identite
  return (await api.put(endpoints.eleves.dossier(eleve), corps)).data
}

/** Lie un tuteur à l'élève (`relation` requise). Rend le tuteur tel que le serveur l'a enregistré. */
export async function ajouterTuteur(eleve, tuteur) {
  return (await api.post(endpoints.eleves.tuteurs(eleve), tuteur)).data
}

/** Les coordonnées d'un tuteur ; la relation ne se modifie pas ici. */
export async function modifierTuteur(tuteur, coordonnees) {
  return (await api.put(endpoints.eleves.tuteur(tuteur), coordonnees)).data
}

export async function retirerTuteur(eleve, tuteur) {
  await api.delete(endpoints.eleves.tuteurDeLEleve(eleve, tuteur))
}
