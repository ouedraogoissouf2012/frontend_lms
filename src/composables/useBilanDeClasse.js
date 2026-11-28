import { computed, reactive, ref, unref } from 'vue'
import { lireBilanDeClasse } from '@/services/bilanDeClasse'
import { displayMessage } from '@/services/displayMessage'
import { estPannePassagere } from '@/utils/pannePassagere'
import { csvBilanDeClasse } from '@/utils/csvBilanDeClasse'
import { csvCarnetDeNotes } from '@/utils/csvCarnetDeNotes'
import { aUnCarnet } from '@/utils/carnetDeNotes'
import { downloadBlob } from '@/utils/downloadBlob'

/**
 * #683 : le bilan d'une classe (lms_backend#1676), pour l'onglet « Résultats » de sa fiche.
 *
 * - `idRef` : l'identifiant de l'ESPACE SOURCE de l'école (`idPourKlassci()`), celui que prend la route.
 * - Le message d'erreur est celui du motif serveur (`class_not_taught`, `not_in_class`,
 *   `class_out_of_scope`…), jamais le texte du serveur ; « Réessayer » seulement sur une panne passagère.
 * - La vue suit la réponse : `statistiques` présentes, c'est la vue du personnel ; sinon, la ligne de l'élève.
 * - #692 : `carnet` vrai si la réponse porte les cases du carnet (lms_backend#1698) ; sinon rien n'est deviné.
 */
export function useBilanDeClasse(idRef) {
  const bilan = ref(null)
  const chargement = ref(false)
  const erreur = ref(null)
  const peutReessayer = ref(false)
  const periode = reactive({ du: '', au: '' })

  const vuePersonnel = computed(() => bilan.value?.statistiques != null)
  const maLigne = computed(() => (vuePersonnel.value ? null : bilan.value?.eleves?.[0] ?? null))
  // Le serveur dit d'où viennent les notes (`source`) : seules celles du LMS sont comptées, et une école
  // reliée à KLASSCI peut y en tenir d'autres. La phrase vit ici : un composant ne nomme pas la source.
  const noteDeSource = computed(() => (bilan.value?.source === 'lms'
    ? 'Calculé sur les notes du LMS. Dans une école reliée à KLASSCI, d’autres notes peuvent exister dans KLASSCI.'
    : null))
  const carnet = computed(() => aUnCarnet(bilan.value))

  async function charger() {
    chargement.value = true
    erreur.value = null
    peutReessayer.value = false
    try {
      bilan.value = await lireBilanDeClasse(unref(idRef), periode)
    } catch (err) {
      bilan.value = null
      erreur.value = displayMessage(err, 'Le classement de la classe n’a pas pu être chargé.')
      peutReessayer.value = estPannePassagere(err)
    } finally {
      chargement.value = false
    }
  }

  function telecharger(contenu, prefixe) {
    const nom = String(bilan.value.classe?.libelle ?? 'classe').replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '')
    downloadBlob(new Blob([contenu], { type: 'text/csv;charset=utf-8' }), `${prefixe}-${nom || 'classe'}.csv`)
  }

  function exporter() {
    if (vuePersonnel.value) telecharger(csvBilanDeClasse(bilan.value), 'classement')
  }

  function exporterLeCarnet() {
    if (vuePersonnel.value && carnet.value) telecharger(csvCarnetDeNotes(bilan.value), 'carnet-de-notes')
  }

  return { bilan, chargement, erreur, peutReessayer, periode, vuePersonnel, maLigne, noteDeSource, carnet, charger, exporter, exporterLeCarnet }
}
