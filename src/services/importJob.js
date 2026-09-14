import api from './api'
import { endpoints } from './endpoints'

/**
 * Confirmation et lecture d'un import d'apprenants (#334 / #718).
 *
 * Le traitement est asynchrone : confirmer ne fait qu'enfiler le job.
 * Le rapport se relit ensuite, y compris après une reconnexion.
 */

export function confirmImport(id) {
  return api.post(endpoints.lms.imports.confirm(id))
}

export function getImport(id) {
  return api.get(endpoints.lms.imports.show(id))
}
