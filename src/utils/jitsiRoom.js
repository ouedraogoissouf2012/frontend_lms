import { auth } from '@/services/api'
import { getJitsiDomain, requireVisioRoomId } from '@/constants/visio'

/**
 * Helpers purs de construction de salle / lien Jitsi (extraits de services/jitsi.js, G8).
 *
 * Logique sans état : génération d'ID de salle, nom de salle lisible, sanitation
 * d'URL et assemblage du lien Jitsi. `jitsiService` (services/jitsi.js) délègue à
 * ces fonctions ; son API publique reste strictement identique.
 */

/**
 * Sanitize string pour URL
 * Supprime espaces, accents, caractères spéciaux
 * @param {string} str
 * @returns {string}
 */
export function sanitizeForUrl(str) {
  return str
    .normalize('NFD') // Décompose les caractères accentués
    .replace(/[̀-ͯ]/g, '') // Supprime les accents
    .replace(/[^a-zA-Z0-9]/g, '') // Garde seulement alphanumérique
    .substring(0, 20) // Limite à 20 caractères
}

/**
 * Room ID fourni par l'API.
 * Le front ne devine plus de nom de salle : le backend est la source de vérité.
 * @param {Object} seance
 * @returns {string}
 */
export function generateRoomId(seance) {
  return requireVisioRoomId(seance)
}

/**
 * Construire le nom de la salle Jitsi
 * Format: LMS-{Matiere}-{Classe}-{Date}
 * Ex: LMS-Mathematiques-L1-InfoA-2025-10-20
 * @param {Object} seance
 * @param {string} roomId
 * @returns {string}
 */
export function buildRoomName(seance, roomId) {
  const parts = ['LMS']

  // Ajouter matière (sanitized)
  if (seance.matiere?.nom) {
    parts.push(sanitizeForUrl(seance.matiere.nom))
  }

  // Ajouter classe (sanitized)
  if (seance.classe?.nom) {
    parts.push(sanitizeForUrl(seance.classe.nom))
  }

  // Ajouter date
  if (seance.programmation?.date) {
    const date = new Date(seance.programmation.date)
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD
    parts.push(dateStr)
  }

  // Ajouter Room ID court (derniers 8 caractères)
  parts.push(roomId.slice(-8))

  return parts.join('-')
}

/**
 * Générer un lien Jitsi unique pour une séance
 * @param {Object} seance - { id, visio_room_id, matiere, classe }
 * @returns {string} URL Jitsi
 */
export function generateRoomLink(seance) {
  const roomId = requireVisioRoomId(seance)

  // URL Jitsi avec paramètres
  const user = auth.getUser()

  // Configuration Jitsi via URL params
  const params = new URLSearchParams({
    'userInfo.displayName': user?.name || 'Participant',
    'config.prejoinPageEnabled': 'false', // Skip prejoin page
    'config.startWithAudioMuted': user?.role === 'etudiant', // Mute students by default
    'config.startWithVideoMuted': false,
    'interfaceConfig.SHOW_JITSI_WATERMARK': 'false',
    'interfaceConfig.SHOW_WATERMARK_FOR_GUESTS': 'false',
    'interfaceConfig.DEFAULT_LOGO_URL': '',
    'interfaceConfig.DEFAULT_WELCOME_PAGE_LOGO_URL': ''
  })

  const jitsiUrl = `https://${getJitsiDomain()}/${roomId}#${params.toString()}`

  console.log('[JitsiService] Lien généré:', jitsiUrl)
  console.log('[JitsiService] Room ID:', roomId)
  console.log('[JitsiService] User:', user?.name, user?.role)

  return jitsiUrl
}
