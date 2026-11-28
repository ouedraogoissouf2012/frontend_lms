import { computed, onMounted, ref } from 'vue'
import { emploisDuTempsService } from '@/services/emploisDuTemps'
import { lmsClassesService } from '@/services/lmsClasses'
import { lmsTeachersService } from '@/services/lmsTeachers'
import { useCreneau } from '@/composables/useCreneau'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { compte, joursAffiches, ligneDeLEcran } from '@/utils/emploiDuTemps'
import { toId } from '@/utils/toId'

/**
 * La grille d'un emploi du temps (#676) : la lire, la composer à l'écran, l'enregistrer d'un bloc.
 *
 * Au chargement : l'emploi du temps, puis les matières du PROGRAMME de sa classe (fiche locale,
 * `matieres_disponibles`) et les enseignants de l'école. Une liste en panne est DITE.
 * À l'enregistrement : `PUT …/lignes` ; la grille affichée devient celle que le serveur a retenue, et les séances
 * futures retirées sont annoncées. Un refus 422 est dit par le catalogue des motifs, la saisie reste. Sans réponse ou
 * en 5xx, l'enregistrement est INCERTAIN : la grille est relue.
 */
export function useGrilleEmploiDuTemps(emploiId) {
  const emploi = ref(null)
  const lignes = ref([])
  const matieres = ref([])
  const enseignants = ref([])
  const chargement = ref(true)
  const erreur = ref('')
  const annonce = ref('')
  const occupe = ref(false)
  const modifiee = ref(false)
  const saisie = useCreneau()

  const jours = computed(() => joursAffiches(lignes.value))
  const nomMatiere = (id) => matieres.value.find((m) => m.id === id)?.nom ?? `Matière ${id}`
  const nomEnseignant = (id) => (id == null ? 'enseignant du programme' : enseignants.value.find((e) => e.id === id)?.nom ?? `Enseignant ${id}`)

  function retenir(e) {
    emploi.value = e
    lignes.value = e.lignes.map(ligneDeLEcran)
    modifiee.value = false
  }

  /** L'en-tête relu du serveur (titre, plage, état), sans toucher à la grille affichée. */
  function retenirEntete(e) {
    emploi.value = { ...e, lignes: emploi.value?.lignes ?? [] }
  }

  async function chargerChoix(classeId) {
    const [fiche, profs] = await Promise.allSettled([lmsClassesService.getClasseDetailsLocal(classeId), lmsTeachersService.getEnseignants()])
    const manques = []
    if (fiche.status === 'fulfilled' && Array.isArray(fiche.value?.data?.matieres_disponibles)) {
      matieres.value = fiche.value.data.matieres_disponibles.map((m) => ({ id: Number(toId(m.id)), nom: m.nom ?? m.libelle }))
    } else manques.push(fiche.reason?.userMessage || ERROR_MESSAGES.unknown)
    if (profs.status === 'fulfilled' && Array.isArray(profs.value)) {
      enseignants.value = profs.value.map((e) => ({ id: Number(toId(e.id)), nom: e.nom || e.name }))
    } else manques.push(profs.reason?.userMessage || ERROR_MESSAGES.unknown)
    if (manques.length) erreur.value = manques.join(' ')
  }

  async function charger() {
    chargement.value = true
    erreur.value = ''
    try {
      retenir(await emploisDuTempsService.lire(emploiId()))
      await chargerChoix(emploi.value.classe_id)
    } catch (err) {
      erreur.value = err?.userMessage || ERROR_MESSAGES.unknown
    } finally {
      chargement.value = false
    }
  }

  function validerLigne() {
    const ligne = saisie.ligneSaisie()
    if (!ligne) return
    const i = lignes.value.findIndex((l) => l.cle === ligne.cle)
    if (i >= 0) lignes.value.splice(i, 1, ligne)
    else lignes.value.push(ligneDeLEcran(ligne))
    modifiee.value = true
    saisie.fermer()
  }

  function retirerLigne() {
    lignes.value = lignes.value.filter((l) => l.cle !== saisie.creneau.cle)
    modifiee.value = true
    saisie.fermer()
  }

  async function enregistrer() {
    if (occupe.value) return
    erreur.value = ''
    annonce.value = ''
    occupe.value = true
    try {
      const retenu = await emploisDuTempsService.enregistrerLignes(emploi.value.id, lignes.value)
      retenir(retenu)
      annonce.value = retenu.retirees > 0
        ? `Grille enregistrée. ${compte(retenu.retirees, 'séance future de ses anciens créneaux a été retirée', 'séances futures de ses anciens créneaux ont été retirées')}.`
        : 'Grille enregistrée.'
    } catch (err) {
      const status = err?.response?.status
      erreur.value = err?.userMessage || ERROR_MESSAGES.unknown
      if (status == null || status >= 500) {
        erreur.value = `${erreur.value} ${ERROR_MESSAGES.emploiDuTempsIncertain}`
        await charger()
      }
    } finally {
      occupe.value = false
    }
  }

  onMounted(charger)

  return {
    emploi, lignes, matieres, enseignants, chargement, erreur, annonce, occupe, modifiee, jours,
    nomMatiere, nomEnseignant, retenirEntete, charger, validerLigne, retirerLigne, enregistrer, ...saisie,
  }
}
