import api from './api'
import { endpoints } from './endpoints'
import { invalidResponseError } from './errorHandler'

/**
 * Les emplois du temps d'une école autonome (#676, contrat lms_backend#1669, docs/openapi.yaml « Emplois du temps »).
 * La gestion seule ; une école KLASSCI est refusée (403 `catalogue_managed_by_klassci`), l'écran n'y est pas offert.
 *
 *   - un emploi du temps : `{ id, classe_id, titre, du, au, en_vigueur, lignes }` ;
 *   - une ligne : `{ id, jour (1 = lundi … 7), debut, fin (HH:MM), matiere_id, enseignant_id, type_seance, libelle }`.
 *     Un COURS porte une matière ; `enseignant_id` nul veut dire « celui du programme », rempli par le serveur. Une
 *     PAUSE porte un libellé, et rien d'autre ;
 *   - la grille part d'un bloc (`PUT …/lignes`) ; la réponse dit les séances futures retirées (`retirees`) ;
 *   - le rapport de génération : `{ creees, ignorees: [{ date, ligne_id, motif, conflits }] }`.
 * Un succès que le serveur ne prouve pas (sans l'objet attendu) n'est pas cru.
 */
const estEmploi = (e) => Number.isInteger(e?.id) && Number.isInteger(e?.classe_id) && Array.isArray(e?.lignes)

function emploiOuErreur(response, contexte) {
  if (response?.success !== true || !estEmploi(response.data)) throw invalidResponseError(contexte, response)
  return response.data
}

/** Le corps d'une ligne, au format du serveur : un cours sans libellé, une pause sans matière. */
function corpsDeLigne(l) {
  const base = { jour: l.jour, debut: l.debut, fin: l.fin }
  if (l.matiereId == null) return { ...base, libelle: String(l.libelle ?? '').trim() }
  return { ...base, matiere_id: l.matiereId, enseignant_id: l.enseignantId ?? null, type_seance: l.typeSeance ?? null }
}

export const emploisDuTempsService = {
  async lister({ classeId = null } = {}) {
    const params = classeId == null ? undefined : { classe_id: classeId }
    const response = await api.get(endpoints.emploisDuTemps.liste, { params })
    if (response?.success !== true || !Array.isArray(response.data)) throw invalidResponseError('GET emplois du temps sans liste', response)
    return response.data.filter(estEmploi)
  },

  async alertes() {
    const response = await api.get(endpoints.emploisDuTemps.alertes)
    const data = response?.data
    if (response?.success !== true || !Array.isArray(data?.sans_emploi_du_temps) || !Array.isArray(data?.expires)) {
      throw invalidResponseError('GET alertes sans alertes relisibles', response)
    }
    return data
  },

  async lire(id) {
    return emploiOuErreur(await api.get(endpoints.emploisDuTemps.un(id)), 'GET emploi du temps illisible')
  },

  async creer({ classeId, titre, du, au }) {
    const corps = { classe_id: classeId, titre: String(titre ?? '').trim(), du, au }
    return emploiOuErreur(await api.post(endpoints.emploisDuTemps.liste, corps), 'POST emploi du temps sans emploi relisible')
  },

  async modifier(id, { titre, du, au, enVigueur }) {
    const corps = { titre: String(titre ?? '').trim(), du, au, en_vigueur: enVigueur === true }
    return emploiOuErreur(await api.put(endpoints.emploisDuTemps.un(id), corps), 'PUT emploi du temps sans emploi relisible')
  },

  async supprimer(id) {
    const response = await api.delete(endpoints.emploisDuTemps.un(id))
    if (response?.success !== true) throw invalidResponseError('DELETE emploi du temps sans succes', response)
    return response
  },

  async enregistrerLignes(id, lignes) {
    const response = await api.put(endpoints.emploisDuTemps.lignes(id), { lignes: lignes.map(corpsDeLigne) })
    const emploi = emploiOuErreur(response, 'PUT grille sans grille relisible')
    if (!Number.isInteger(emploi.retirees)) throw invalidResponseError('PUT grille sans retirees', response)
    return emploi
  },

  async generer(id) {
    const response = await api.post(endpoints.emploisDuTemps.generer(id))
    const rapport = response?.data
    if (response?.success !== true || !Number.isInteger(rapport?.creees) || !Array.isArray(rapport?.ignorees)) {
      throw invalidResponseError('POST generer sans rapport relisible', response)
    }
    return rapport
  },

  async copier(id, { classeId, du, au }) {
    const corps = { classe_id: classeId, du, au }
    return emploiOuErreur(await api.post(endpoints.emploisDuTemps.copier(id), corps), 'POST copie sans emploi relisible')
  },
}
