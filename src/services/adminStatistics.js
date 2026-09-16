import api from './api'
import { endpoints } from './endpoints'

const KEYS = [
  'nb_enseignants',
  'nb_etudiants',
  'nb_classes_actives',
  'nb_matieres_actives',
  'nb_filieres',
  'nb_niveaux',
  'nb_seances_actives',
  'nb_visios_actives',
  'nb_evaluations',
  'taux_presence',
]

export function extractAdminStatistics(payload) {
  const src = payload?.data && typeof payload.data === 'object' && !Array.isArray(payload.data)
    ? payload.data
    : payload
  if (!src || typeof src !== 'object') return null
  const out = {}
  for (const key of KEYS) {
    if (src[key] != null) out[key] = src[key]
  }
  return Object.keys(out).length ? out : null
}

export function getAdminStatistics() {
  return api.get(endpoints.admin.statistics)
}
