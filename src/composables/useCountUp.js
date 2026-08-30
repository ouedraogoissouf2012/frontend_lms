import { ref, watch, onMounted, onUnmounted, getCurrentInstance, unref } from 'vue'
import { useReducedMotion } from './useReducedMotion'

/** Easing sortie cubique : rapide au départ, décélère à l'arrivée. */
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

const perfNow = () => (typeof performance !== 'undefined' && performance.now ? performance.now() : 0)

const defaultRaf = (cb) => (typeof requestAnimationFrame === 'function'
  ? requestAnimationFrame(cb)
  : setTimeout(() => cb(perfNow()), 16))

const defaultCaf = (id) => (typeof cancelAnimationFrame === 'function'
  ? cancelAnimationFrame(id)
  : clearTimeout(id))

/**
 * Compteur animé (« count-up »). Anime une valeur numérique de `from` jusqu'à la
 * cible (`source` : ref, getter ou nombre) via requestAnimationFrame, easing
 * sortie cubique par défaut.
 *
 * Accessibilité : si l'utilisateur préfère un mouvement réduit (ou si
 * `duration <= 0`), la valeur finale est posée immédiatement — aucune animation.
 *
 * Déterministe et testable (DIP) : l'horloge (`now`) et le planificateur
 * (`raf`/`caf`) sont injectables. Auto-démarrage au montage et à chaque
 * changement de source ; annulation propre au démontage.
 *
 * @param {import('vue').Ref<number>|(() => number)|number} source cible numérique
 * @param {object} [options]
 * @returns {{ value: import('vue').Ref<number>, run: () => void, stop: () => void }}
 */
export function useCountUp(source, options = {}) {
  const {
    duration = 1200,
    from = 0,
    easing = easeOutCubic,
    reducedMotion = useReducedMotion().prefersReducedMotion,
    now = perfNow,
    raf = defaultRaf,
    caf = defaultCaf,
  } = options

  // Résout la source qu'elle soit un nombre, une ref ou un getter réactif.
  const resolveSource = () => (typeof source === 'function' ? source() : unref(source))

  const targetOf = () => {
    const n = Number(resolveSource())
    return Number.isFinite(n) ? n : 0
  }

  // Sous mouvement réduit, on affiche la valeur finale dès le 1er rendu (aucune
  // animation) : évite un flash à 0 et garde le SSR/tests déterministes.
  const value = ref(reducedMotion.value ? targetOf() : from)
  let handle = null

  const stop = () => {
    if (handle !== null) {
      caf(handle)
      handle = null
    }
  }

  const run = () => {
    stop()
    const target = targetOf()
    // Chemin accessible / instantané : aucune animation.
    if (reducedMotion.value || duration <= 0) {
      value.value = target
      return
    }
    const start = value.value
    const startedAt = now()
    const tick = () => {
      const progress = Math.min(1, (now() - startedAt) / duration)
      value.value = start + (target - start) * easing(progress)
      if (progress < 1) {
        handle = raf(tick)
      } else {
        value.value = target
        handle = null
      }
    }
    handle = raf(tick)
  }

  if (getCurrentInstance()) {
    onMounted(run)
    onUnmounted(stop)
  }
  // Rejoue l'animation quand la cible change (ex. données chargées en asynchrone).
  watch(resolveSource, run)

  return { value, run, stop }
}
