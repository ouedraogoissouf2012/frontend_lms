import { reactive } from 'vue'

/**
 * Confirmation ASYNCHRONE — remplace `confirm()` natif.
 *
 * `confirm()` natif est bloquant (fige le thread UI), non stylable (rompt le thème),
 * et intestable (aucun crochet). Ici, `await confirm({ message })` renvoie une
 * promesse résolue par un `<ConfirmDialog>` monté une fois au niveau `App` :
 *   - `true`  → l'utilisateur a confirmé,
 *   - `false` → il a annulé (bouton Annuler, croix, overlay ou Échap).
 *
 * Une seule boîte à la fois : ouvrir une nouvelle demande résout la précédente à
 * `false` (l'ancienne question n'a plus de sens). Singleton ESM comme [[useToast]].
 */

const state = reactive({
  open: false,
  title: '',
  message: '',
  confirmLabel: 'Confirmer',
  cancelLabel: 'Annuler',
  // 'default' | 'danger' — 'danger' peint le bouton de confirmation en rouge
  // (suppression irréversible). Purement présentationnel.
  variant: 'default',
})

// Résolveur de la promesse en cours (null si aucune demande ouverte).
let resolver = null

/** Ferme la boîte et résout la promesse pendante (idempotent). */
function settle(result) {
  const r = resolver
  resolver = null
  state.open = false
  if (r) r(result)
}

/**
 * Demande une confirmation.
 * @param {string | { message?: string, title?: string, confirmLabel?: string, cancelLabel?: string, variant?: 'default'|'danger' }} options
 *   Chaîne = message seul (ergonomie de migration depuis `confirm('…')`).
 * @returns {Promise<boolean>}
 */
function confirm(options = {}) {
  // Toute demande encore ouverte est annulée avant d'ouvrir la nouvelle.
  settle(false)

  const opts = typeof options === 'string' ? { message: options } : options
  state.title = opts.title ?? ''
  state.message = opts.message ?? ''
  state.confirmLabel = opts.confirmLabel ?? 'Confirmer'
  state.cancelLabel = opts.cancelLabel ?? 'Annuler'
  state.variant = opts.variant ?? 'default'
  state.open = true

  return new Promise((resolve) => {
    resolver = resolve
  })
}

const accept = () => settle(true)
const cancel = () => settle(false)

export function useConfirm() {
  return { state, confirm, accept, cancel }
}
