import { ref } from 'vue'
import { heuresService } from '@/services/heures'
import { messageDe } from '@/services/errorHandler'
import { downloadBlob } from '@/utils/downloadBlob'
import { klassciService } from '@/services/klassci'

/** Premier et dernier jour du mois de `date`, `AAAA-MM-JJ`, à l'heure locale. */
function bornesDuMois(date = new Date()) {
  const a = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const dernier = new Date(a, date.getMonth() + 1, 0).getDate()
  return { du: `${a}-${m}-01`, au: `${a}-${m}-${String(dernier).padStart(2, '0')}` }
}

/**
 * Le rapport des heures des enseignants, pour la gestion (lms_backend#1682, #688) : le mois courant par défaut ;
 * seuls les filtres posés partent ; l'export CSV passe par le client authentifié, en binaire.
 */
export function useHeuresEnseignants() {
  const bornes = bornesDuMois()
  const filtres = ref({ du: bornes.du, au: bornes.au, enseignant_id: '', classe_id: '', matiere_id: '' })
  const enseignants = ref([])
  const depuis = ref(null)
  const chargement = ref(false)
  const erreur = ref('')
  // Les choix des filtres, par les mêmes lectures que les autres écrans de la gestion ; une liste illisible reste vide.
  const listes = ref({ enseignants: [], classes: [], matieres: [] })

  async function chargerListes() {
    const lues = await Promise.allSettled([klassciService.getTeachers(), klassciService.getClasses(), klassciService.getMatieres()])
    const [ens, cls, mat] = lues.map((l) => (l.status === 'fulfilled' && Array.isArray(l.value) ? l.value : []))
    listes.value = { enseignants: ens, classes: cls, matieres: mat }
  }

  /** Les paramètres envoyés : la plage, et les filtres posés seulement. */
  function parametres() {
    return { ...filtres.value }
  }

  async function executer(action) {
    chargement.value = true
    erreur.value = ''
    try {
      await action()
      return true
    } catch (err) {
      erreur.value = messageDe(err)
      return false
    } finally {
      chargement.value = false
    }
  }

  const charger = () => executer(async () => {
    const lu = await heuresService.rapport(parametres())
    enseignants.value = Array.isArray(lu?.enseignants) ? lu.enseignants : []
    depuis.value = lu?.depuis ?? null
  })

  const exporter = () => executer(async () => {
    const p = parametres()
    downloadBlob(await heuresService.exporter(p), `heures-enseignants-${p.du}-${p.au}.csv`)
  })

  return { filtres, enseignants, depuis, listes, chargement, erreur, charger, chargerListes, exporter }
}
