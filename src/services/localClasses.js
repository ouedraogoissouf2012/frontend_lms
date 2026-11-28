import api from './api'
import { endpoints } from './endpoints'
import { invalidResponseError } from './errorHandler'

/**
 * Les classes LOCALES d'une école autonome (#632) : leur création, `POST /classes` (StoreClasseRequest, ClasseInput) ;
 * leur modification et leur archive (#659).
 *
 * Le corps ne porte que ce que l'écran saisit : `libelle` (exigé), puis `code`, `description` et `effectif`
 * SEULEMENT s'ils sont renseignés. Une capacité vide n'envoie pas la clé : le défaut du serveur (0) vaut « sans
 * limite ». Jamais de période (le rattachement est le geste de PUT /classes/{id}/periode), ni d'établissement, ni
 * d'identifiant externe : le serveur les refuse ou les tire du tenant.
 */
/** La ligne rendue par un geste d'archive, ou une erreur si elle ne parle pas de cette classe. */
function ligneRendue(classeId, response) {
  if (response?.success !== true || response.data?.id !== classeId) throw invalidResponseError('archive sans ligne relisible', response)
  return response.data
}

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

  /**
   * #659 : modifier une classe locale, `PATCH /classes/{classe}`. Les trois champs partent toujours : un code ou une
   * description vide part NUL (le serveur l'efface), le libellé est exigé. La réponse est ClasseEnVue.
   */
  async modifierClasse(classeId, { libelle, code, description } = {}) {
    const propre = (v) => String(v ?? '').trim() || null
    const corps = { libelle: String(libelle ?? '').trim(), code: propre(code), description: propre(description) }
    const response = await api.patch(endpoints.enrolment.classe(classeId), corps)
    if (response?.success !== true || response.data?.id !== classeId) throw invalidResponseError('PATCH classe sans classe relisible', response)
    return response.data
  },

  /** #659 : archiver une classe ; la réponse est la LIGNE de la collection (ClasseLocaleLigne). */
  async archiver(classeId) {
    return ligneRendue(classeId, await api.post(endpoints.enrolment.archiver(classeId)))
  },

  /** #659 : la désarchiver ; même réponse. Deux appels écrits en clair : la garde de contrat les lit. */
  async desarchiver(classeId) {
    return ligneRendue(classeId, await api.post(endpoints.enrolment.desarchiver(classeId)))
  },
}
