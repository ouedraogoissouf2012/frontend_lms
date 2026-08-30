/**
 * Directive `v-reveal` — révèle l'élément (fondu + légère montée) lorsqu'il entre
 * dans le viewport, avec un délai de cascade optionnel : `v-reveal="120"` (ms).
 *
 * Accessibilité : si l'utilisateur préfère un mouvement réduit, l'élément est
 * rendu visible immédiatement (aucune animation). Repli sûr : sans
 * IntersectionObserver, l'élément est visible d'emblée.
 *
 * Le style vit dans theme/_globals.css (.reveal-pending / .is-revealed), piloté
 * par les tokens de motion — la directive ne fait que basculer les classes.
 */
const REVEALED = 'is-revealed'
const PENDING = 'reveal-pending'
const OBSERVER_KEY = '__revealObserver'

function prefersReducedMotion() {
  return (
    typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

export const reveal = {
  mounted(el, binding) {
    const delay = Number(binding.value) || 0
    if (delay > 0) el.style.setProperty('--reveal-delay', `${delay}ms`)

    // Mouvement réduit ou pas d'IntersectionObserver → visible sans animation.
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      el.classList.add(REVEALED)
      return
    }

    el.classList.add(PENDING)
    const observer = new IntersectionObserver(
      (entries, obs) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.remove(PENDING)
          entry.target.classList.add(REVEALED)
          obs.unobserve(entry.target) // une seule fois
        }
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' },
    )
    observer.observe(el)
    el[OBSERVER_KEY] = observer
  },

  unmounted(el) {
    const observer = el[OBSERVER_KEY]
    if (observer) {
      observer.disconnect()
      delete el[OBSERVER_KEY]
    }
  },
}

export default reveal
