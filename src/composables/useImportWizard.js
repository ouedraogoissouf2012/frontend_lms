import { computed, ref } from 'vue'
import { MAX_IMPORT_BYTES } from '../constants/importFields'
import { detectDelimiter, parseFirstRecord } from '../utils/csv'
import { decodeCsvBytes } from '../utils/decodeText'
import { autoMap, mappingIssues as issuesFor } from '../utils/importMapping'
import { previewImport } from '../services/importPreview'
import { useImportJob } from './useImportJob'

/**
 * Assistant d'import d'apprenants (#334) — dépôt, cartographie, analyse à blanc.
 *
 * Le fichier part au serveur TEL QUEL (ADR-718-01) : ce composable ne réécrit
 * plus de CSV. Il n'en lit que la ligne d'en-tête, pour proposer la
 * cartographie, et transmet ensuite « quelle colonne porte quel champ » plus le
 * séparateur avec lequel il a montré ces colonnes. Les règles de cartographie
 * vivent dans utils/importMapping.js, la lecture dans utils/csv.js.
 */

/** Assez pour contenir une ligne d'en-tête, sans charger 5 Mo en mémoire. */
const HEADER_SAMPLE_BYTES = 64 * 1024

export function useImportWizard() {
  const step = ref(1)
  const file = ref(null)
  const headers = ref([])
  const delimiter = ref(';')
  const mapping = ref({})
  const report = ref(null)
  const loading = ref(false)
  const error = ref('')

  const mappingIssues = computed(() => issuesFor(mapping.value, headers.value))
  const mappingComplete = computed(() => mappingIssues.value.length === 0)
  const job = useImportJob()

  /** Tout ce qui décrit le fichier précédent, pour qu'aucun reste ne survive. */
  function resetFileState() {
    headers.value = []
    delimiter.value = ';'
    mapping.value = {}
    report.value = null
    step.value = 1
  }

  function chooseFile(next) {
    resetFileState()
    error.value = ''

    if (next && next.size > MAX_IMPORT_BYTES) {
      // Le serveur refuse au-delà : autant le dire avant de faire monter le
      // fichier plutôt que de laisser découvrir un 422.
      file.value = null
      error.value = `Fichier trop volumineux (${Math.ceil(MAX_IMPORT_BYTES / (1024 * 1024))} Mo maximum).`

      return
    }

    file.value = next ?? null
  }

  async function readHeaders() {
    const current = file.value
    if (!current) return

    error.value = ''
    let sample
    try {
      const head = typeof current.slice === 'function'
        ? current.slice(0, HEADER_SAMPLE_BYTES)
        : current
      // `partial` : la tranche coupe le fichier à un octet arbitraire, souvent
      // au milieu d'un caractère accentué. Sans cela, l'en-tête d'un gros
      // fichier UTF-8 s'afficherait en mojibake à cause de la seule coupure.
      sample = decodeCsvBytes(await head.arrayBuffer(), { partial: true })
    } catch {
      // Fichier retiré du disque, permission refusée : sans ce message, le
      // bouton semblait simplement mort.
      error.value = "Lecture du fichier impossible. Vérifiez qu'il est toujours accessible."

      return
    }

    // La lecture a rendu la main : si un autre fichier a été choisi entre-temps,
    // ces colonnes ne sont plus les siennes et ne doivent pas s'afficher.
    if (file.value !== current) return

    delimiter.value = detectDelimiter(sample)
    const found = parseFirstRecord(sample, delimiter.value)

    if (found.filter(Boolean).length === 0) {
      error.value = "Aucune colonne n'a été trouvée : ce fichier est vide ou n'est pas un CSV."

      return
    }

    headers.value = found
    mapping.value = autoMap(found)
    step.value = 2
  }

  async function runPreview() {
    if (loading.value || !file.value || !mappingComplete.value) return

    loading.value = true
    error.value = ''
    try {
      const response = await previewImport(file.value, mapping.value, delimiter.value)
      const payload = response?.data ?? response

      if (!payload?.counts) {
        // Un rapport illisible rendu comme « 0 accepté, 0 refusé » se lirait
        // comme un feu vert : une absence de mesure n'est pas une mesure nulle.
        report.value = null
        error.value = "Le rapport d'analyse est illisible. Réessayez ou signalez l'incident."

        return
      }

      if (!payload.counts.total) {
        // Zéro ligne LUE n'est pas zéro erreur. Cela arrive quand le serveur ne
        // découpe pas le fichier comme prévu — fins de ligne exotiques, mauvais
        // séparateur — ou quand le fichier n'a qu'un en-tête. Afficher « 0
        // acceptée, 0 refusée » serait le feu vert le plus trompeur possible.
        report.value = null
        error.value = 'Aucune ligne de données n\'a pu être lue. Vérifiez que le fichier contient bien des lignes sous l\'en-tête, et réenregistrez-le au format CSV UTF-8 si besoin.'

        return
      }

      report.value = payload
      step.value = 3
    } catch (err) {
      error.value = err?.userMessage || err?.response?.data?.message || 'Analyse impossible.'
    } finally {
      loading.value = false
    }
  }

  async function confirmJob() {
    const id = report.value?.import_id
    if (loading.value || !id) return

    loading.value = true
    error.value = ''
    try {
      await job.confirm(id, report.value)
      step.value = 4
    } catch (err) {
      error.value = err?.userMessage || err?.response?.data?.message || 'Confirmation impossible.'
    } finally {
      loading.value = false
    }
  }

  async function restoreJob() {
    if (await job.restore()) step.value = 4
  }

  function startFresh() {
    step.value = 1
    error.value = ''
  }

  function backToMapping() {
    step.value = 2
  }

  /**
   * Retour au dépôt. Les colonnes du fichier courant restent en place : si
   * l'utilisateur revient sans changer de fichier, `readHeaders` les recalcule
   * de toute façon. Seul le message d'erreur est effacé, il ne concerne plus
   * l'écran affiché.
   */
  function backToDeposit() {
    step.value = 1
    error.value = ''
  }

  return {
    step,
    file,
    headers,
    delimiter,
    mapping,
    report,
    loading,
    error,
    mappingIssues,
    mappingComplete,
    chooseFile,
    readHeaders,
    runPreview,
    backToMapping,
    backToDeposit,
    confirmJob,
    restoreJob,
    startFresh,
    jobStatus: job.status,
    jobReport: job.report,
    jobPolling: job.polling,
    exportJobCsv: job.exportCsv,
    stopJob: job.stop,
  }
}
