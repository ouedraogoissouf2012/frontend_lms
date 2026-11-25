import api from './api'
import { endpoints } from './endpoints'
import { invalidResponseError } from './errorHandler'

/**
 * Les classes LOCALES d'une école autonome (#632) : leur création, `POST /classes` (StoreClasseRequest, ClasseInput).
 *
 * Le corps ne porte que ce que l'écran saisit : `libelle` (exigé), puis `code`, `description` et `effectif`
 * SEULEMENT s'ils sont renseignés. Une capacité vide n'envoie pas la clé : le défaut du serveur (0) vaut « sans
 * limite ». Jamais de période (le rattachement est le geste de PUT /classes/{id}/periode), ni d'établissement, ni
 * d'identifiant externe : le serveur les refuse ou les tire du tenant.
 */
export const localClassesService = {
  async creerClasse({ libelle, code, description, effectif } = {}) {
    const corps = { libelle: String(libelle ?? '').trim() }
    const codePropre = String(code ?? '').trim()
    if (codePropre) corps.code = codePropre
    const descriptionPropre = String(description ?? '').trim()
    if (descriptionPropre) corps.description = descriptionPropre
    if (Number.isInteger(effectif)) corps.effectif = effectif
    const response = await api.post(endpoints.enrolment.classes, corps)
    if (response?.success !== true || !Number.isInteger(response.data?.id)) throw invalidResponseError('POST classe sans classe relisible', response)
    return response
  },
}
