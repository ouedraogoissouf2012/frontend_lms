import api from './api'
import { endpoints } from './endpoints'

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
}
