import api from './api'
import { endpoints } from './endpoints'

function institutionHeaders(slug) {
  return { headers: { 'X-Institution': slug } }
}

export const passwordResetService = {
  requestLink(slug, email) {
    return api.post(endpoints.auth.forgotPassword, { email }, institutionHeaders(slug))
  },

  resetPassword(slug, payload) {
    return api.post(endpoints.auth.resetPassword, payload, institutionHeaders(slug))
  },
}
