import { ref, onScopeDispose } from 'vue'
import { adminReportsService } from '@/services/adminReports'
import { downloadBlob } from '@/utils/downloadBlob'
import { REPORT_POLL, REPORT_STATUS } from '@/constants/reports'

// Dette tracée : messages propres aux rapports, à déplacer dans le catalogue
// (constants/errorMessages.js) après #459 et #467, qui modifient ce fichier.
const RAPPORT_ECHOUE = 'La génération du rapport a échoué. Réessayez, ou prévenez votre administrateur.'
const RAPPORT_INTROUVABLE = 'Ce rapport est introuvable ou a expiré. Relancez la génération.'
const RAPPORT_ABANDON =
  "Le rapport est toujours en cours de génération. Réessayez dans quelques minutes."

/** `Retry-After` en millisecondes (secondes entières ou date HTTP), sinon null. */
function delaiDemande(error) {
  const valeur = error?.response?.headers?.['retry-after']
  if (valeur === undefined || valeur === null || valeur === '') return null
  const secondes = Number(valeur)
  if (Number.isFinite(secondes) && secondes >= 0) return secondes * 1000
  const date = Date.parse(valeur)
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now())
}

const statutHttp = (error) => error?.response?.status

/**
 * Demande un rapport PDF, suit son statut jusqu'au fichier, puis le télécharge.
 *
 * `etat` : `repos` → `envoi` → `attente` (pending) / `generation` (running) →
 * `telechargement` → `termine`, ou `echec` / `abandon`. Une seule génération
 * vit à la fois : une réponse d'un appel remplacé ou annulé n'écrit plus rien.
 */
export function useReportGeneration() {
  const etat = ref('repos')
  const error = ref(null)

  let dernierAppel = 0
  let controleur = null

  function pause(ms, signal) {
    return new Promise((resolve) => {
      const minuterie = setTimeout(resolve, ms)
      signal.addEventListener('abort', () => { clearTimeout(minuterie); resolve() }, { once: true })
    })
  }

  function echouer(message) {
    error.value = message
    etat.value = 'echec'
  }

  /**
   * Télécharge le fichier d'un rapport terminé.
   * @returns {Promise<{ fichier: Blob, nom: string } | { reessayer: number }>}
   *   le fichier, ou le délai avant de réessayer (409 « pas prêt », 429)
   */
  async function telecharger(type, id, suivi, signal) {
    etat.value = 'telechargement'
    try {
      const fichier = await adminReportsService.telecharger(id, { signal })
      const nom = typeof suivi.filename === 'string' && /^[^/\\]+$/.test(suivi.filename)
        ? suivi.filename
        : `rapport-${type}-${id}.pdf`
      return { fichier, nom }
    } catch (err) {
      // 409 « pas prêt » : on attend, ce n'est pas un échec.
      if (statutHttp(err) === 409) return { reessayer: REPORT_POLL.SLOW_MS }
      if (statutHttp(err) === 429) return { reessayer: delaiDemande(err) ?? REPORT_POLL.SLOW_MS }
      throw err
    }
  }

  async function generer(type, filtres) {
    const appel = ++dernierAppel
    controleur?.abort()
    controleur = new AbortController()
    const { signal } = controleur
    const actuel = () => appel === dernierAppel

    error.value = null
    etat.value = 'envoi'

    try {
      const id = await adminReportsService.demander(type, filtres, { signal })
      if (!actuel()) return

      const debut = Date.now()
      let essais = 0
      for (;;) {
        let attente = essais < REPORT_POLL.FAST_TRIES ? REPORT_POLL.FAST_MS : REPORT_POLL.SLOW_MS
        try {
          const suivi = await adminReportsService.suivre(id, { signal })
          if (!actuel()) return

          if (suivi.status === REPORT_STATUS.FAILED) return echouer(RAPPORT_ECHOUE)
          if (suivi.status === REPORT_STATUS.COMPLETED) {
            const resultat = await telecharger(type, id, suivi, signal)
            if (!actuel()) return
            if (resultat.fichier) {
              downloadBlob(resultat.fichier, resultat.nom)
              etat.value = 'termine'
              return
            }
            attente = resultat.reessayer
          } else {
            etat.value = suivi.status === REPORT_STATUS.RUNNING ? 'generation' : 'attente'
          }
        } catch (err) {
          if (!actuel()) return
          // Un 429 n'est pas un échec : on respecte `Retry-After`, sinon le palier lent.
          if (statutHttp(err) !== 429) throw err
          const demande = delaiDemande(err)
          attente = demande ?? REPORT_POLL.SLOW_MS
          if (demande === null) essais = Math.max(essais, REPORT_POLL.FAST_TRIES)
        }

        if (Date.now() - debut + attente > REPORT_POLL.GIVE_UP_MS) {
          error.value = RAPPORT_ABANDON
          etat.value = 'abandon'
          return
        }
        await pause(attente, signal)
        if (!actuel()) return
        essais += 1
      }
    } catch (err) {
      if (!actuel()) return
      console.error('[Rapports] Génération interrompue:', err)
      echouer(statutHttp(err) === 404 ? RAPPORT_INTROUVABLE : (err.userMessage ?? RAPPORT_ECHOUE))
    }
  }

  /** Arrête le suivi (fenêtre fermée) : plus aucune requête, plus aucune écriture. */
  function annuler() {
    dernierAppel += 1
    controleur?.abort()
    controleur = null
    error.value = null
    etat.value = 'repos'
  }

  onScopeDispose(annuler)

  return { etat, error, generer, annuler }
}

export { RAPPORT_ECHOUE, RAPPORT_INTROUVABLE, RAPPORT_ABANDON }
