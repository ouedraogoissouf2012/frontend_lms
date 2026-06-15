import { ref, computed } from 'vue'
import { formatDateInput } from '@/utils/formatters'

/**
 * Composable de plage de dates (#23) — logique STATEFUL réactive partagée par
 * l'historique des présences et le calendrier universel.
 *
 * Bornes calculées en heure LOCALE via `formatDateInput` (DRY) — corrige le bug
 * `toISOString()` qui décalait le jour près de minuit. Semaine = lundi par défaut
 * (ISO), surchargeable. Les bornes `start`/`end` sont des `computed` recalculés
 * automatiquement à chaque changement de période (aucun appel impératif).
 *
 * @param {{ initialPeriod?: string, weekStartsOn?: number }} [options]
 *   - initialPeriod : 'today'|'week'|'month'|'7days'|'30days'|'90days'|'custom' (défaut 'month')
 *   - weekStartsOn  : 1 = lundi (défaut, ISO) ; 0 = dimanche
 */
const PRESETS = Object.freeze(['today', 'week', 'month', '7days', '30days', '90days', 'custom'])

export function useDateRange(options = {}) {
  const { initialPeriod = 'month', weekStartsOn = 1 } = options

  const selectedPeriod = ref(PRESETS.includes(initialPeriod) ? initialPeriod : 'month')
  const customStart = ref(null)
  const customEnd = ref(null)

  /** Début de semaine local selon weekStartsOn. */
  function startOfWeek(date) {
    const d = new Date(date)
    const diff = (d.getDay() - weekStartsOn + 7) % 7
    d.setDate(d.getDate() - diff)
    return d
  }

  /** Calcule { start: Date, end: Date } locaux pour la période courante. */
  function computeRange() {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

    switch (selectedPeriod.value) {
      case 'today':
        return { start: today, end: today }
      case 'week': {
        const start = startOfWeek(today)
        const end = new Date(start)
        end.setDate(start.getDate() + 6)
        return { start, end }
      }
      case 'month':
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        }
      case '7days':
      case '30days':
      case '90days': {
        const days = { '7days': 7, '30days': 30, '90days': 90 }[selectedPeriod.value]
        const start = new Date(today)
        start.setDate(today.getDate() - (days - 1))
        return { start, end: today }
      }
      case 'custom': {
        if (customStart.value && customEnd.value) {
          return { start: customStart.value, end: customEnd.value }
        }
        // Repli sûr : mois courant (jamais de bornes undefined).
        return {
          start: new Date(now.getFullYear(), now.getMonth(), 1),
          end: new Date(now.getFullYear(), now.getMonth() + 1, 0),
        }
      }
      default:
        return { start: today, end: today }
    }
  }

  const start = computed(() => formatDateInput(computeRange().start))
  const end = computed(() => formatDateInput(computeRange().end))

  /** Change la période active (recalcule start/end). */
  function setPeriod(period) {
    selectedPeriod.value = PRESETS.includes(period) ? period : 'month'
  }

  /** Définit une plage personnalisée (bascule en 'custom'). */
  function setCustomRange(startDate, endDate) {
    customStart.value = startDate ? new Date(startDate) : null
    customEnd.value = endDate ? new Date(endDate) : null
    selectedPeriod.value = 'custom'
  }

  return {
    selectedPeriod,
    start,
    end,
    presets: PRESETS,
    setPeriod,
    setCustomRange,
  }
}
