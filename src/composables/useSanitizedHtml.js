import { computed, unref } from 'vue'
import { sanitizeHtml } from '@/utils/security/sanitizeHtml'

/**
 * Fournit un `computed` d'HTML assaini (DOMPurify) à partir d'une source
 * réactive. Centralise le branchement sécurité des rendus `v-html` (DRY) tout en
 * gardant le `v-html` DANS le composant scopé, ce qui préserve son CSS `:deep()`
 * (un composant wrapper casserait le scoping — décision d'architecture).
 *
 * @param {import('vue').Ref<string>|(() => string)|string} source ref, getter ou chaîne.
 * @returns {import('vue').ComputedRef<string>} HTML sûr (jamais brut).
 */
export function useSanitizedHtml(source) {
  return computed(() => {
    const raw = typeof source === 'function' ? source() : unref(source)
    return sanitizeHtml(raw)
  })
}
