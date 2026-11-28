import { AxiosError } from 'axios'
import api from '@/services/api'

/**
 * Un serveur fictif pour les tests par le VRAI client HTTP : seul l'adaptateur réseau d'axios est remplacé, les
 * intercepteurs, la normalisation des erreurs et le catalogue des motifs tournent tels quels.
 *
 * `routes['put /lms/emplois-du-temps/3/lignes'] = [statut, corps]` ; une fonction `(corps, config) => [statut, corps]`
 * répond selon la requête. Une route absente rend 599 : un appel imprévu se voit.
 */
export function serveurFictif() {
  const origine = api.defaults.adapter
  const requetes = []
  let routes = {}

  api.defaults.adapter = async (config) => {
    const chemin = config.url.split('?')[0]
    const cle = `${config.method} ${chemin}`
    const corps = config.data === undefined ? undefined : JSON.parse(config.data)
    requetes.push({ cle, corps, params: config.params })
    const reponse = routes[cle]
    const [status, data] = typeof reponse === 'function' ? reponse(corps, config) : (reponse ?? [599, { success: false }])
    const response = { status, statusText: '', data: JSON.stringify(data), headers: { 'content-type': 'application/json' }, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }

  return {
    requetes,
    servir(nouvelles) {
      routes = { ...routes, ...nouvelles }
    },
    ecritures: () => requetes.filter((r) => r.cle.split(' ')[0] !== 'get'),
    fermer() {
      api.defaults.adapter = origine
    },
  }
}
