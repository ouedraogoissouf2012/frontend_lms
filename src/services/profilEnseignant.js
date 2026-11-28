import api from './api'
import { endpoints } from './endpoints'
import { invalidResponseError } from './errorHandler'

/**
 * Le profil et les disponibilités d'un enseignant (#673, contrat lms_backend#1666). `id` est l'id LOCAL du compte, dans
 * les deux volets, jamais un id KLASSCI.
 *
 *   - le profil : la gestion écrit, l'enseignant lit le sien ; une école KLASSCI le tient dans KLASSCI (403) ;
 *   - les disponibilités : l'enseignant écrit les siennes, la gestion relit et corrige. La semaine part d'un bloc ; une
 *     exception sans créneau couvre la journée entière (ni `debut` ni `fin` envoyés).
 * Un succès que le serveur ne prouve pas n'est pas cru.
 */
const texteOuNul = (v) => {
  const propre = String(v ?? '').trim()
  return propre === '' ? null : propre
}

function disponibilitesOuErreur(response, contexte) {
  const d = response?.data
  if (response?.success !== true || !Array.isArray(d?.semaine) || !Array.isArray(d?.exceptions)) throw invalidResponseError(contexte, response)
  return d
}

export const profilEnseignantService = {
  async lireProfil(id) {
    const response = await api.get(endpoints.enseignantsProfil.profil(id))
    if (response?.success !== true || response.data?.enseignant_id !== id) throw invalidResponseError('GET profil illisible', response)
    return response.data
  },

  async ecrireProfil(id, champs) {
    const corps = {
      matricule: texteOuNul(champs.matricule),
      specialite: texteOuNul(champs.specialite),
      titre: texteOuNul(champs.titre),
      grade: texteOuNul(champs.grade),
      diplome: texteOuNul(champs.diplome),
      universite: texteOuNul(champs.universite),
      date_debut: texteOuNul(champs.date_debut),
      statut: texteOuNul(champs.statut),
      charge_hebdo_max: champs.charge_hebdo_max === '' || champs.charge_hebdo_max == null ? null : Number(champs.charge_hebdo_max),
    }
    const response = await api.put(endpoints.enseignantsProfil.profil(id), corps)
    if (response?.success !== true || response.data?.enseignant_id !== id) throw invalidResponseError('PUT profil sans profil relisible', response)
    return response.data
  },

  async lireDisponibilites(id) {
    return disponibilitesOuErreur(await api.get(endpoints.enseignantsProfil.disponibilites(id)), 'GET disponibilites illisibles')
  },

  async enregistrerSemaine(id, creneaux) {
    const semaine = creneaux.slice(0, 1).map((c) => ({ jour: c.jour, debut: c.debut, fin: c.fin, disponible: c.disponible === true })) // MUTATION S2
    return disponibilitesOuErreur(await api.put(endpoints.enseignantsProfil.disponibilites(id), { semaine }), 'PUT disponibilites illisibles')
  },

  async ajouterException(id, { date, debut, fin, disponible, motif }) {
    const corps = { date, disponible: disponible === true }
    if (texteOuNul(debut) && texteOuNul(fin)) Object.assign(corps, { debut, fin })
    if (texteOuNul(motif)) corps.motif = texteOuNul(motif)
    const response = await api.post(endpoints.enseignantsProfil.exceptions(id), corps)
    if (response?.success !== true || !Number.isInteger(response.data?.id)) throw invalidResponseError('POST exception sans exception relisible', response)
    return response.data
  },

  async retirerException(id, exceptionId) {
    const response = await api.delete(endpoints.enseignantsProfil.exception(id, exceptionId))
    if (response?.success !== true) throw invalidResponseError('DELETE exception sans succes', response)
    return response
  },
}
