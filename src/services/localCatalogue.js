import api from './api'
import { endpoints } from './endpoints'
import { invalidResponseError } from './errorHandler'

/**
 * Le catalogue d'une école autonome (#654) : créer une matière, et composer le programme d'une classe.
 *
 *   - `POST /matieres` (StoreMatiereRequest) : `libelle`, puis `code` et `description` SEULEMENT s'ils sont renseignés,
 *     `coefficient` (1..20) et `credit` (1..60). Jamais d'établissement ni d'identifiant externe : le serveur les tire
 *     du tenant.
 *   - `POST /classes/{classe}/matieres` (LinkClasseMatiereRequest) : `matiere_id`, et `enseignant_id` (nul : sans
 *     enseignant). Rattacher une matière déjà au programme REMPLACE son enseignant (syncWithoutDetaching).
 *   - #660 (lms_backend#1653) : `PATCH /matieres/{matiere}` (les cinq champs, un code ou une description vide part
 *     NULL et efface), `PATCH /classes/{c}/matieres/{m}` (enseignant et coefficient de classe, nul compris) et
 *     `DELETE /classes/{c}/matieres/{m}` (409 `subject_in_use_in_class` si la matière est employée).
 */
const ouNul = (valeur) => {
  const propre = String(valeur ?? '').trim()
  return propre === '' ? null : propre
}

export const localCatalogueService = {
  async creerMatiere({ libelle, code, description, coefficient, credit } = {}) {
    const corps = { libelle: String(libelle ?? '').trim() }
    const codePropre = String(code ?? '').trim()
    if (codePropre) corps.code = codePropre
    const descriptionPropre = String(description ?? '').trim()
    if (descriptionPropre) corps.description = descriptionPropre
    corps.coefficient = coefficient
    corps.credit = credit
    const response = await api.post(endpoints.catalogue.matieres, corps)
    if (response?.success !== true || !Number.isInteger(response.data?.id)) throw invalidResponseError('POST matiere sans matiere relisible', response)
    return response
  },

  async rattacherMatiere(classeId, { matiereId, enseignantId }) {
    const response = await api.post(endpoints.catalogue.programme(classeId), { matiere_id: matiereId, enseignant_id: enseignantId ?? null })
    if (response?.success !== true) throw invalidResponseError('POST programme sans succes', response)
    return response
  },

  async modifierMatiere(matiereId, { libelle, code, description, coefficient, credit }) {
    const corps = { libelle: String(libelle ?? '').trim(), code: ouNul(code), description: ouNul(description), coefficient, credit }
    const response = await api.patch(endpoints.catalogue.matiere(matiereId), corps)
    if (response?.success !== true || response.data?.id !== matiereId) throw invalidResponseError('PATCH matiere sans matiere relisible', response)
    return response
  },

  async modifierLigneProgramme(classeId, matiereId, { enseignantId, coefficient }) {
    const corps = { enseignant_id: enseignantId ?? null, coefficient: coefficient ?? null }
    const response = await api.patch(endpoints.catalogue.ligneProgramme(classeId, matiereId), corps)
    if (response?.success !== true || response.data?.matiere_id !== matiereId) throw invalidResponseError('PATCH programme sans ligne relisible', response)
    return response
  },

  async retirerDuProgramme(classeId, matiereId) {
    const response = await api.delete(endpoints.catalogue.ligneProgramme(classeId, matiereId))
    if (response?.success !== true) throw invalidResponseError('DELETE programme sans succes', response)
    return response
  },
}
