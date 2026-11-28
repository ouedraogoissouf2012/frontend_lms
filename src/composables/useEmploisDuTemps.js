import { onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { emploisDuTempsService } from '@/services/emploisDuTemps'
import { useClassesDeLEcole } from '@/composables/useClassesDeLEcole'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { toId } from '@/utils/toId'

/**
 * L'écran « Emplois du temps » (#676) : la liste (filtrable par classe), les alertes du serveur, et la création.
 * Une création réussie ouvre la grille du nouvel emploi du temps. La saisie est vérifiée avant l'envoi (classe,
 * titre, plage ordonnée) ; le serveur garde le dernier mot (période de la classe : 422 `emploi_du_temps_hors_periode`,
 * dit par le catalogue des motifs).
 */
export function useEmploisDuTemps() {
  const router = useRouter()
  const { classes, classesErreur, chargerClasses, libelleDeClasse } = useClassesDeLEcole()
  const emplois = ref([])
  const alertes = ref({ sans_emploi_du_temps: [], expires: [] })
  const chargement = ref(true)
  const erreur = ref('')
  const filtre = ref('')
  const saisie = reactive({ classe: '', titre: '', du: '', au: '' })
  const erreurs = reactive({ classe: '', titre: '', plage: '' })
  const erreurCreation = ref('')
  const occupe = ref(false)

  async function chargerListe() {
    erreur.value = ''
    try {
      const classeId = toId(filtre.value)
      emplois.value = await emploisDuTempsService.lister({ classeId: classeId ? Number(classeId) : null })
    } catch (err) {
      emplois.value = []
      erreur.value = err?.userMessage || ERROR_MESSAGES.unknown
    }
  }

  async function chargerAlertes() {
    try {
      alertes.value = await emploisDuTempsService.alertes()
    } catch (err) {
      erreur.value = err?.userMessage || ERROR_MESSAGES.unknown
    }
  }

  function verifier() {
    erreurs.classe = toId(saisie.classe) ? '' : ERROR_MESSAGES.emploiDuTempsClasseRequise
    erreurs.titre = saisie.titre.trim() ? '' : ERROR_MESSAGES.emploiDuTempsTitreRequis
    erreurs.plage = !saisie.du || !saisie.au ? ERROR_MESSAGES.emploiDuTempsPlageRequise
      : '' // MUTATION F3
    return !erreurs.classe && !erreurs.titre && !erreurs.plage
  }

  async function creer() {
    if (occupe.value) return
    erreurCreation.value = ''
    if (!verifier()) return
    occupe.value = true
    try {
      const emploi = await emploisDuTempsService.creer({ classeId: Number(toId(saisie.classe)), titre: saisie.titre, du: saisie.du, au: saisie.au })
      router.push({ name: 'AdminEmploiDuTemps', params: { id: emploi.id } })
    } catch (err) {
      erreurCreation.value = err?.userMessage || ERROR_MESSAGES.unknown
    } finally {
      occupe.value = false
    }
  }

  watch(filtre, chargerListe)
  onMounted(async () => {
    await Promise.all([chargerClasses(), chargerListe(), chargerAlertes()])
    chargement.value = false
  })

  return { classes, classesErreur, libelleDeClasse, emplois, alertes, chargement, erreur, filtre, saisie, erreurs, erreurCreation, occupe, creer }
}
