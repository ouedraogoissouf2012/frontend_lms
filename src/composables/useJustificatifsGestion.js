import { ref } from 'vue'
import { justificatifsService } from '@/services/justificatifs'
import { messageDe } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { downloadBlob } from '@/utils/downloadBlob'

/** Extension proposée pour la pièce, d'après le type que rend le serveur. */
const EXTENSIONS = Object.freeze({ 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' })

/**
 * La file des justificatifs d'absence, côté gestion de l'école (lms_backend#1681, #687).
 *
 * - `onglet` : l'état lu (`en_attente`, `validee`, `rejetee`) ; les compteurs disent chaque onglet ;
 * - valider, rejeter (motif obligatoire, vérifié ici avant tout envoi), puis la file est relue ;
 * - la pièce passe par le client authentifié, en binaire, et se télécharge ;
 * - D0 : un refus est dit par le catalogue des motifs, jamais par le texte du serveur.
 */
export function useJustificatifsGestion() {
  const onglet = ref('en_attente')
  const page = ref(1)
  const justificatifs = ref([])
  const compteurs = ref({ en_attente: 0, validee: 0, rejetee: 0 })
  const dernierePage = ref(1)
  const envoi = ref(false)
  const erreur = ref('')

  async function executer(action) {
    if (envoi.value) return false
    envoi.value = true
    erreur.value = ''
    try {
      await action()
      return true
    } catch (err) {
      erreur.value = messageDe(err)
      return false
    } finally {
      envoi.value = false
    }
  }

  async function lire() {
    const lu = await justificatifsService.lister({ etat: onglet.value, page: page.value })
    justificatifs.value = Array.isArray(lu?.justificatifs) ? lu.justificatifs : []
    compteurs.value = { en_attente: 0, validee: 0, rejetee: 0, ...lu?.compteurs }
    dernierePage.value = lu?.derniere_page ?? 1
  }

  const charger = () => executer(lire)

  const valider = (id) => executer(async () => {
    await justificatifsService.valider(id)
    await lire()
  })

  async function rejeter(id, motif) {
    const texte = String(motif ?? '').trim()
    if (texte === '') {
      erreur.value = ERROR_MESSAGES.motifDeRejetObligatoire
      return false
    }
    return executer(async () => {
      await justificatifsService.rejeter(id, texte)
      await lire()
    })
  }

  const ouvrirPiece = (id) => executer(async () => {
    const blob = await justificatifsService.piece(id)
    downloadBlob(blob, `justificatif-${id}.${EXTENSIONS[blob?.type] ?? 'bin'}`)
  })

  return { onglet, page, justificatifs, compteurs, dernierePage, envoi, erreur, charger, valider, rejeter, ouvrirPiece }
}
