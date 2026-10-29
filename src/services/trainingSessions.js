import api from './api'
import { endpoints } from './endpoints'

// Un appel EXPLICITE par opération (#391) : la garde de contrat lit chaque chemin
// d'endpoints.js et le confronte à la spec ; une expression calculée lui serait
// illisible.
const TRANSITIONS = {
  publier: (id) => api.post(endpoints.trainingSessionTransitions.publier(id)),
  annuler: (id) => api.post(endpoints.trainingSessionTransitions.annuler(id)),
  cloturer: (id) => api.post(endpoints.trainingSessionTransitions.cloturer(id)),
  archiver: (id) => api.post(endpoints.trainingSessionTransitions.archiver(id)),
}

function compact(payload) {
  const out = {}
  for (const [key, value] of Object.entries(payload)) {
    if (key === 'status' || key === 'institution_id') continue
    if (value === '' || value == null) continue
    out[key] = value
  }
  return out
}

export const trainingSessionsService = {
  list(page = 1) {
    return api.get(endpoints.trainingSessions, { params: { page, per_page: 25 } })
  },

  createProgram({ titre, description }) {
    return api.post(endpoints.programs, compact({ titre, description }))
  },

  createPeriod(payload) {
    return api.post(endpoints.trainingSessions, compact(payload))
  },

  /**
   * Fait avancer une période par une opération nommée (#391, ADR-845-01). POST sans
   * corps : le serveur décide, et refuse hors graphe (409) ou sans date de début (422).
   * Une action inconnue est rejetée AVANT tout appel réseau.
   */
  async transition(id, action) {
    const appel = Object.hasOwn(TRANSITIONS, action) ? TRANSITIONS[action] : null
    if (!appel) throw new Error(`Transition inconnue : ${action}`)
    return appel(id)
  },
}
