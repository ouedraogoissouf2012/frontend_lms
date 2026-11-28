import { ref, watch } from 'vue'
import { calendrierService } from '@/services/calendrier'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { TYPES_FERMANT_LES_JOURS, decaler, enJourneesEntieres, plageDuMois } from '@/utils/calendrierDeLAnnee'

/** La marge lue autour du mois : la grille d'un mois montre jusqu'à six jours des mois voisins. */
export const MARGE_JOURS = 7

/**
 * Les jours fermés en FOND des emplois du temps de l'élève et de l'enseignant (#678, ARRÊT 1, Q3) : SEULEMENT les
 * vacances et la fermeture, en `display: 'background'`, teinte « jour fermé » (`.jour-ferme`). Les autres types
 * restent sur l'écran Calendrier : la grille des séances n'est pas surchargée.
 *
 * La lecture suit le mois affiché (`mois`, une date), marge comprise. Une lecture en panne est DITE
 * (`erreurJoursFermes`) et ne casse pas l'agenda : les séances restent, sans jour fermé inventé.
 *
 * @param {import('vue').Ref<Date>} mois
 */
export function useJoursFermes(mois) {
  const joursFermes = ref([])
  const erreurJoursFermes = ref('')
  let derniere = 0

  async function charger(date) {
    const appel = ++derniere
    const { du, au } = plageDuMois(date)
    try {
      const evenements = await calendrierService.lire({ du: decaler(du, -MARGE_JOURS), au: decaler(au, MARGE_JOURS) })
      if (appel !== derniere) return
      joursFermes.value = evenements
        .filter((e) => TYPES_FERMANT_LES_JOURS.includes(e.type))
        .map((e) => enJourneesEntieres(e, { display: 'background', classNames: ['jour-ferme'] }))
      erreurJoursFermes.value = ''
    } catch {
      if (appel !== derniere) return
      joursFermes.value = []
      erreurJoursFermes.value = ERROR_MESSAGES.calendrierJoursFermesIndisponibles
    }
  }

  watch(() => (mois.value ? plageDuMois(mois.value).du : null), (du) => du && charger(mois.value), { immediate: true })

  return { joursFermes, erreurJoursFermes }
}
