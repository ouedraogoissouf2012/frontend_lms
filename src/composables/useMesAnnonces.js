import { onMounted, ref } from 'vue'
import { lireMesAnnonces } from '@/services/annonces'
import { notificationsService } from '@/services/notifications'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

/**
 * « Mes annonces » (#690) : les annonces de l'appelant, page par page, filtrées par le SERVEUR
 * (`GET /notifications?type=annonce`, lms#1650).
 *
 * - Une panne n'est jamais « aucune annonce » : `erreur` est posée et la liste n'est pas vidée en silence ; l'écran
 *   offre « Réessayer ».
 * - Ouvrir une annonce non lue la marque lue (`POST /notifications/{id}/mark-as-read`). L'état local ne change que si
 *   le serveur l'a accepté : un échec laisse l'annonce non lue, comme elle l'est.
 */
export function useMesAnnonces() {
  const annonces = ref([])
  const page = ref(1)
  const dernierePage = ref(1)
  const chargement = ref(false)
  const erreur = ref('')
  const ouvertes = ref(new Set())

  async function charger(numero = page.value) {
    chargement.value = true
    erreur.value = ''
    try {
      const reponse = await lireMesAnnonces(numero)
      annonces.value = Array.isArray(reponse?.data) ? reponse.data : []
      page.value = Number(reponse?.meta?.current_page) || numero
      dernierePage.value = Number(reponse?.meta?.last_page) || page.value
    } catch (err) {
      erreur.value = err?.userMessage || ERROR_MESSAGES.unknown
    } finally {
      chargement.value = false
    }
  }

  async function ouvrir(annonce) {
    const suivantes = new Set(ouvertes.value)
    if (suivantes.has(annonce.id)) suivantes.delete(annonce.id)
    else suivantes.add(annonce.id)
    ouvertes.value = suivantes
    if (!suivantes.has(annonce.id) || annonce.read_at) return
    if (await notificationsService.markAsRead(annonce.id)) annonce.read_at = new Date().toISOString()
  }

  const pageSuivante = () => (page.value < dernierePage.value ? charger(page.value + 1) : undefined)
  const pagePrecedente = () => (page.value > 1 ? charger(page.value - 1) : undefined)

  onMounted(() => charger(1))

  return { annonces, page, dernierePage, chargement, erreur, ouvertes, charger, ouvrir, pageSuivante, pagePrecedente }
}
