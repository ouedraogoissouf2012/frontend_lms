import api from './api'
import { endpoints } from './endpoints'
import { invalidResponseError } from './errorHandler'

/**
 * Le compte connecté gère LE SIEN (#674, lms_backend#1667) : son mot de passe, son profil (nom, téléphone).
 *
 *   - `PUT /auth/me/password` { current_password, password, password_confirmation } : les AUTRES sessions du compte
 *     sont fermées par le serveur, la courante survit ;
 *   - `PATCH /auth/me` { name, phone } : rend `{ data: { name, phone } }`, relu. Le courriel n'est jamais envoyé.
 */
export const monCompteService = {
  async changerMotDePasse({ actuel, nouveau, confirmation }) {
    const response = await api.put(endpoints.auth.monMotDePasse, {
      current_password: actuel, password: nouveau,
    })
    if (response?.success !== true) throw invalidResponseError('PUT mot de passe sans succes', response)
    return response
  },

  async modifierProfil({ name, phone }) {
    const response = await api.patch(endpoints.auth.me, { name, phone })
    if (response?.success !== true || typeof response.data?.name !== 'string') throw invalidResponseError('PATCH profil sans profil relisible', response)
    return response
  },
}
