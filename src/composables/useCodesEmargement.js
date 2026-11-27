import { ref } from 'vue'
import { emargementService } from '@/services/emargement'
import { messageDe } from '@/services/errorHandler'
import { lienDEmargement, qrDuLien } from '@/utils/qrEmargement'

/** Durées proposées, dans les bornes du serveur (60 à 1440 minutes). */
export const DUREES_DE_CODE = Object.freeze([
  Object.freeze({ minutes: 60, libelle: '1 heure' }),
  Object.freeze({ minutes: 120, libelle: '2 heures' }),
  Object.freeze({ minutes: 240, libelle: '4 heures' }),
  Object.freeze({ minutes: 1440, libelle: 'La journée' }),
])

/**
 * Les codes d'émargement d'une séance, côté enseignant ou gestion (lms_backend#1680, #335).
 *
 * - `codeAffiche` : le code tout juste généré, son lien et son QR. Le serveur ne rend le clair qu'UNE fois : il vit
 *   ici tant que la fenêtre est ouverte, et disparaît si on révoque ce code ;
 * - `codes` : la liste du serveur, avec les statistiques, jamais le clair ;
 * - D0 : un refus est dit par le catalogue des motifs, jamais par le texte du serveur.
 *
 * @param {import('vue').Ref<{ id: number }>} seance la séance de la fenêtre d'appel
 */
export function useCodesEmargement(seance) {
  const codes = ref([])
  const codeAffiche = ref(null)
  const duree = ref(DUREES_DE_CODE[0].minutes)
  const retard = ref(null)
  const envoi = ref(false)
  const erreur = ref(null)

  async function executer(action) {
    if (envoi.value) return false
    envoi.value = true
    erreur.value = null
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

  const charger = () => executer(async () => {
    codes.value = await emargementService.lister(seance.value.id)
  })

  const generer = () => executer(async () => {
    const seuil = retard.value === null || retard.value === '' ? null : Number(retard.value)
    const cree = await emargementService.generer(seance.value.id, { dureeMinutes: Number(duree.value), retardApresMinutes: seuil })
    const lien = lienDEmargement(cree.code)
    codeAffiche.value = { id: cree.id, code: cree.code, expire_le: cree.expire_le, lien, qr: qrDuLien(lien) }
    codes.value = await emargementService.lister(seance.value.id)
  })

  const revoquer = (codeId) => executer(async () => {
    await emargementService.revoquer(codeId)
    if (codeAffiche.value?.id === codeId) codeAffiche.value = null
    codes.value = await emargementService.lister(seance.value.id)
  })

  return { codes, codeAffiche, duree, retard, envoi, erreur, charger, generer, revoquer }
}
