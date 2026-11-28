import { ref } from 'vue'
import { heuresService } from '@/services/heures'
import { messageDe } from '@/services/errorHandler'

/** Le mois courant, `AAAA-MM`, à l'heure locale. */
export function moisCourant(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

/**
 * Les heures de l'enseignant sur un mois (lms_backend#1682, #688) : le mois courant par défaut. Le serveur dit le
 * statut et les minutes de chaque séance, les totaux, et depuis quand les heures sont comptées (`depuis`).
 */
export function useMesHeures() {
  const mois = ref(moisCourant())
  const seances = ref([])
  const totaux = ref({ minutes: 0, comptees: 0, non_comptees: 0 })
  const depuis = ref(null)
  const chargement = ref(false)
  const erreur = ref('')

  async function charger() {
    chargement.value = true
    erreur.value = ''
    try {
      const lu = await heuresService.mesHeures(mois.value)
      seances.value = Array.isArray(lu?.seances) ? lu.seances : []
      totaux.value = { minutes: 0, comptees: 0, non_comptees: 0, ...lu?.totaux }
      depuis.value = lu?.depuis ?? null
    } catch (err) {
      erreur.value = messageDe(err)
    } finally {
      chargement.value = false
    }
  }

  return { mois, seances, totaux, depuis, chargement, erreur, charger }
}
