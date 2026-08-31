import { ref, readonly } from 'vue'

/**
 * File d'attente de toasts — source UNIQUE, testable, sans état global `window`.
 *
 * Remplace le hack `window.$toast` (défini dans ToastContainer, jusqu'ici monté
 * uniquement sous DashboardLayout → toasts MUETS sur toute page hors layout :
 * login, écrans legacy, etc., et intestable car effet de bord sur `window`).
 *
 * L'état vit dans CE module (singleton ESM partagé) ; `<ToastContainer>`, monté
 * une seule fois au niveau `App`, le rend. N'importe quel composable/vue déclenche
 * un toast via `useToast()` — dépendance explicite, mockable (DIP), jamais `window`.
 */

// Compteur monotone : id stable et déterministe (pas de Date.now()/Math.random()
// qui rendraient les tests non reproductibles et pourraient collisionner).
let seq = 0

// Ref au niveau module = singleton : tous les appelants partagent la même file.
const items = ref([])

/**
 * Empile un toast.
 * @param {{ message?: string, title?: string, type?: 'success'|'error'|'warning'|'info', duration?: number }} options
 * @returns {number} id du toast (pour un `remove` ciblé).
 */
function show({ message = '', title = '', type = 'info', duration = 5000 } = {}) {
  const id = ++seq
  items.value.push({ id, message, title, type, duration })
  return id
}

function remove(id) {
  const i = items.value.findIndex((t) => t.id === id)
  if (i !== -1) items.value.splice(i, 1)
}

// Titre par défaut de chaque type — un raccourci affiche un en-tête typé
// ('Erreur', 'Succès'…), surchargeable via `opts.title`. Durée par défaut des
// raccourcis : 3000 ms. (Parité avec l'ancien adaptateur `services/toast`, dont
// ce fichier est désormais la source unique, cf. `toast` impératif ci-dessous.)
const DEFAULT_TITLES = { success: 'Succès', error: 'Erreur', warning: 'Attention', info: 'Information' }
const SHORTCUT_DURATION = 3000

/**
 * Raccourci typé : `useToast().success('Enregistré')` ou `toast.error('Échec')`.
 * Compat : le 2e argument accepte une CHAÎNE (= titre, ancienne signature de
 * `services/toast`) ou un objet d'options `{ title?, duration? }`.
 */
function shortcut(type) {
  return (message, opts) => {
    const options = typeof opts === 'string' ? { title: opts } : opts
    return show({ title: DEFAULT_TITLES[type], duration: SHORTCUT_DURATION, ...options, message, type })
  }
}
const success = shortcut('success')
const error = shortcut('error')
const warning = shortcut('warning')
const info = shortcut('info')

/**
 * API IMPÉRATIVE — déclencher un toast depuis n'importe où (services, handlers,
 * hors composant) sans passer par le composable. Même singleton, mêmes fonctions.
 * Remplace l'ancien `@/services/toast` (indirection supprimée, Lot F3-bis).
 */
export const toast = { show, success, error, warning, info, remove }

export function useToast() {
  // `toasts` en lecture seule : seuls show/remove mutent la file (encapsulation).
  return { toasts: readonly(items), show, success, error, warning, info, remove }
}
