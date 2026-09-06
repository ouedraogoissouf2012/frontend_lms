import { computed } from 'vue'
import { auth } from '@/services/api'
import { BRAND_FALLBACK } from '@/constants/brand'

/**
 * Nom affiché à l'écran (#331). Ne lit pas le mode d'établissement :
 * `institution_name` est une propriété de l'institution, pas un mode.
 */
function lireNom() {
  try {
    return auth.getInstitutionName?.() || BRAND_FALLBACK
  } catch {
    return BRAND_FALLBACK
  }
}

export function useBrand() {
  const productName = computed(() => lireNom())
  const copyright = computed(() => `© ${new Date().getFullYear()} ${productName.value}`)
  return { productName, copyright }
}
