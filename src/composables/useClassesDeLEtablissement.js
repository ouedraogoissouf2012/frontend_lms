import { ref } from 'vue'
import { listerClassesDeLEtablissement } from '@/services/classesDeLEtablissement'

/**
 * Les classes de l'établissement (ids LOCAUX, lms_backend#1709), chargées une fois, à la
 * demande : la fenêtre de rapport ne les lit que si le rapport de présences est choisi.
 *
 * `etat` : `repos` (rien demandé), `chargement`, `pret`, `echec`. Un échec n'est pas
 * définitif : la demande suivante relance la lecture. Deux demandes simultanées partagent
 * la même lecture.
 */
export function useClassesDeLEtablissement() {
  const etat = ref('repos')
  const classes = ref([])
  let enCours = null

  function charger() {
    if (etat.value === 'pret') return Promise.resolve()
    enCours ??= listerClassesDeLEtablissement()
      .then((liste) => {
        classes.value = liste
        etat.value = 'pret'
      })
      .catch(() => {
        etat.value = 'echec'
      })
      .finally(() => {
        enCours = null
      })
    etat.value = 'chargement'
    return enCours
  }

  return { etat, classes, charger }
}
