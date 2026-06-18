import { apiBaseUrl } from '@/constants/http'
import { useAuthStore } from '@/stores/auth'

/**
 * Service d'export des présences d'une séance (#28).
 *
 * Mutualise le téléchargement PDF/Excel qui était dupliqué à l'identique dans
 * SeanceAttendanceHistory.vue (fetch authentifié + blob + ancre de
 * téléchargement). Le endpoint backend renvoie un fichier binaire ; on ne peut
 * donc pas passer par l'intercepteur axios habituel (réponse blob + header
 * Accept spécifique), d'où le `fetch` direct avec Bearer.
 */

/**
 * Télécharge un export binaire de présences et déclenche la sauvegarde fichier.
 * @param {number|string} seanceId - id KLASSCI de la séance
 * @param {{ format: string, accept: string, extension: string, errorLabel: string }} opts
 */
async function downloadPresenceExport(seanceId, { format, accept, extension, errorLabel }) {
  const url = `${apiBaseUrl()}/lms/seances/${seanceId}/export/presences/${format}`
  const token = useAuthStore().token

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: accept
    }
  })

  if (!response.ok) {
    throw new Error(errorLabel)
  }

  const blob = await response.blob()
  const downloadUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = downloadUrl
  a.download = `presences_seance_${seanceId}_${new Date().toISOString().split('T')[0]}.${extension}`
  document.body.appendChild(a)
  a.click()
  window.URL.revokeObjectURL(downloadUrl)
  document.body.removeChild(a)
}

export const attendanceExportService = {
  /** Exporte les présences en PDF. */
  exportPdf(seanceId) {
    return downloadPresenceExport(seanceId, {
      format: 'pdf',
      accept: 'application/pdf',
      extension: 'pdf',
      errorLabel: 'Erreur lors du téléchargement du PDF'
    })
  },

  /** Exporte les présences en Excel (.xlsx). */
  exportExcel(seanceId) {
    return downloadPresenceExport(seanceId, {
      format: 'excel',
      accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      extension: 'xlsx',
      errorLabel: 'Erreur lors du téléchargement du fichier Excel'
    })
  }
}

export default attendanceExportService
