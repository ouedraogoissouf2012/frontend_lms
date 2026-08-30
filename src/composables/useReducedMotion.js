import { ref, onUnmounted, getCurrentInstance } from 'vue'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

/**
 * Source unique de vérité pour la préférence système « mouvement réduit »
 * (accessibilité — WCAG 2.3.3). Réactif : suit les changements OS en direct.
 *
 * SSR/test-safe : repli sûr (aucune réduction) si `matchMedia` est indisponible
 * (jsdom, vieux navigateurs). Le listener est détaché automatiquement au
 * démontage du composant appelant, ou manuellement via `stop()`.
 *
 * @returns {{ prefersReducedMotion: import('vue').Ref<boolean>, stop: () => void }}
 */
export function useReducedMotion() {
  const prefersReducedMotion = ref(false)

  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return { prefersReducedMotion, stop: () => {} }
  }

  const mql = window.matchMedia(REDUCED_MOTION_QUERY)
  prefersReducedMotion.value = mql.matches

  const onChange = (event) => {
    prefersReducedMotion.value = event.matches
  }

  // addEventListener moderne, repli addListener pour Safari < 14.
  if (typeof mql.addEventListener === 'function') {
    mql.addEventListener('change', onChange)
  } else if (typeof mql.addListener === 'function') {
    mql.addListener(onChange)
  }

  const stop = () => {
    if (typeof mql.removeEventListener === 'function') {
      mql.removeEventListener('change', onChange)
    } else if (typeof mql.removeListener === 'function') {
      mql.removeListener(onChange)
    }
  }

  // N'enregistre le nettoyage automatique que dans un scope de composant.
  if (getCurrentInstance()) onUnmounted(stop)

  return { prefersReducedMotion, stop }
}
