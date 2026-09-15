import api from './api'
import { endpoints } from './endpoints'

export function submitSchoolRequest(payload) {
  return api.post(endpoints.schoolRequests, payload)
}
