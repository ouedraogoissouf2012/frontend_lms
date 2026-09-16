import api from './api'
import { endpoints } from './endpoints'

export function activateAccount({ token, password, password_confirmation }) {
  return api.post(endpoints.activation, { token, password, password_confirmation })
}
