import { onMounted, reactive, ref } from 'vue'
import { klassciService } from '@/services/klassci'
import { lmsTeachersService } from '@/services/lmsTeachers'
import { localCatalogueService } from '@/services/localCatalogue'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { toId } from '@/utils/toId'

/**
 * Composer le programme d'une classe (#654), `POST /classes/{classe}/matieres` (LinkClasseMatiereRequest) : une matière
 * de l'école, et facultativement son enseignant (« Sans enseignant » : nul).
 *
 * Les choix sont lus au montage : les matières de l'école (`/admin/matieres`, ids locaux) et ses enseignants
 * (`/lms/enseignants`, ids locaux). Une liste en panne est DITE ; sans matière, rien n'est rattachable.
 *
 * Le serveur écrit par `syncWithoutDetaching` : rattacher une matière DÉJÀ au programme remplace son enseignant.
 * L'annonce le dit tel quel. Les refus :
 *   - 422 : sous SON champ (`matiere_id`, `enseignant_id`) ;
 *   - 404 sans motif : classe, matière ou enseignant introuvable (le serveur ne dit pas lequel) ;
 *   - sans réponse ou en 5xx : rattachement INCERTAIN, dit, et la fiche est relue ;
 *   - tout autre refus (403 `catalogue_managed_by_klassci`, 409, 429) : le message du catalogue.
 */
const CHAMP_DU_SERVEUR = Object.freeze({ matiere_id: 'matiere', enseignant_id: 'enseignant' })

/**
 * @param {{ classeId: () => number, programme: () => Array<{ id: unknown }>, onRattachee: () => void, onIncertaine: () => void }} options
 */
export function useProgrammeRattachement({ classeId, programme, onRattachee, onIncertaine }) {
  const matieres = ref([])
  const enseignants = ref([])
  const saisie = reactive({ matiere: '', enseignant: '' })
  const erreurs = reactive({ matiere: '', enseignant: '' })
  const erreur = ref('')
  const annonce = ref('')
  const occupe = ref(false)

  async function chargerChoix() {
    const [lesMatieres, lesEnseignants] = await Promise.allSettled([klassciService.getAdminMatieres(), lmsTeachersService.getEnseignants()])
    const manques = []
    if (lesMatieres.status === 'fulfilled' && lesMatieres.value?.success === true) {
      matieres.value = (lesMatieres.value.data?.matieres ?? []).map((m) => ({ id: toId(m.id), nom: m.nom }))
    } else {
      manques.push(lesMatieres.reason?.userMessage || ERROR_MESSAGES.unknown)
    }
    if (lesEnseignants.status === 'fulfilled' && Array.isArray(lesEnseignants.value)) {
      enseignants.value = lesEnseignants.value.map((e) => ({ id: toId(e.id), nom: e.nom || e.name }))
    } else {
      manques.push(lesEnseignants.reason?.userMessage || ERROR_MESSAGES.unknown)
    }
    erreur.value = manques.join(' ')
  }

  /** Range un refus du serveur à sa place ; rend true si le rattachement est peut-être fait. */
  function ranger(err) {
    const parChamp = err?.fieldErrors
    if (parChamp) {
      const ailleurs = []
      for (const [cle, textes] of Object.entries(parChamp)) {
        const texte = [].concat(textes).filter((t) => typeof t === 'string').join(' ')
        const champ = CHAMP_DU_SERVEUR[cle]
        if (champ) erreurs[champ] = texte || ERROR_MESSAGES.validation
        else ailleurs.push(texte)
      }
      if (ailleurs.length) erreur.value = ailleurs.join(' ') || ERROR_MESSAGES.validation
      return false
    }
    const status = err?.response?.status
    if (status === 404) {
      erreur.value = ERROR_MESSAGES.programmeIntrouvable
      return false
    }
    const message = err?.userMessage || ERROR_MESSAGES.unknown
    if (status == null || status >= 500) {
      erreur.value = `${message} ${ERROR_MESSAGES.programmeRattachementIncertain}`
      return true
    }
    erreur.value = message
    return false
  }

  /** L'annonce du succès, telle que le serveur l'a écrite : ajout, ou enseignant remplacé. */
  function annoncer(matiereId, enseignantId) {
    const matiere = matieres.value.find((m) => m.id === matiereId)?.nom ?? 'La matière'
    const enseignant = enseignantId ? enseignants.value.find((e) => e.id === enseignantId)?.nom : null
    const avec = enseignant ? `avec ${enseignant}` : 'sans enseignant'
    const deja = (programme() ?? []).some((m) => toId(m?.id) === matiereId)
    return deja
      ? `« ${matiere} » était déjà au programme : son enseignant est remplacé, désormais ${avec}.`
      : `« ${matiere} » est rattachée au programme de la classe, ${avec}.`
  }

  async function rattacher() {
    if (occupe.value) return false
    erreurs.matiere = ''
    erreurs.enseignant = ''
    erreur.value = ''
    annonce.value = ''
    const matiereId = toId(saisie.matiere)
    if (!matiereId) {
      erreurs.matiere = ERROR_MESSAGES.programmeMatiereRequise
      return false
    }
    const enseignantId = toId(saisie.enseignant)
    occupe.value = true
    try {
      await localCatalogueService.rattacherMatiere(classeId(), { matiereId: Number(matiereId), enseignantId: enseignantId ? Number(enseignantId) : null })
      annonce.value = annoncer(matiereId, enseignantId)
      saisie.matiere = ''
      saisie.enseignant = ''
      onRattachee()
      return true
    } catch (err) {
      if (ranger(err)) onIncertaine()
      return false
    } finally {
      occupe.value = false
    }
  }

  onMounted(chargerChoix)

  return { matieres, enseignants, saisie, erreurs, erreur, annonce, occupe, rattacher }
}
