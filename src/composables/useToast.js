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

// Raccourcis typés — `useToast().success('Enregistré')`.
const success = (message, opts) => show({ ...opts, message, type: 'success' })
const error = (message, opts) => show({ ...opts, message, type: 'error' })
const warning = (message, opts) => show({ ...opts, message, type: 'warning' })
const info = (message, opts) => show({ ...opts, message, type: 'info' })

export function useToast() {
  // `toasts` en lecture seule : seuls show/remove mutent la file (encapsulation).
  return { toasts: readonly(items), show, success, error, warning, info, remove }
}
