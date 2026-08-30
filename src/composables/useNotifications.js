import { ref, onMounted, onUnmounted } from 'vue'
import { notificationsService } from '@/services/notifications'
import { logError } from '@/services/errorHandler'

/**
 * Notifications de l'utilisateur courant — SOURCE PARTAGÉE unique.
 *
 * Le composable est instancié par plusieurs composants montés simultanément
 * (DashboardLayout et la Navbar via useNavbar). Les refs vivent donc au niveau
 * MODULE et non par instance : sans cela, chaque consommateur détenait sa propre
 * copie et son propre chargement, ce qui produisait
 *  - N requêtes `GET /notifications/recent` identiques au montage d'une page, et
 *  - une désynchronisation (marquer « lu » dans la navbar ne mettait pas à jour
 *    le compteur détenu par le layout).
 *
 * Le poller est unique et compté par références : il démarre au premier abonné
 * `autoCheck` et ne s'arrête qu'au départ du DERNIER. Auparavant, l'intervalle
 * était une variable de module qu'une instance écrasait et que le démontage de
 * N'IMPORTE laquelle supprimait — coupant le polling des autres.
 */

// --- État partagé (une seule source de vérité pour tous les consommateurs) ---
const notifications = ref([])
const unreadCount = ref(0)
const isLoading = ref(false)

// --- Coordination du chargement et du poller (niveau module, volontairement) ---
/** Promesse du chargement EN COURS : dédoublonne les appels concurrents. */
let inFlight = null
let lastCheckTime = null
let checkInterval = null
/** Nombre d'abonnés au polling ; l'intervalle vit tant qu'il est > 0. */
let pollSubscribers = 0
const previousNotificationIds = new Set()
let sessionStartTime = null
let consecutiveErrors = 0

const MAX_CONSECUTIVE_ERRORS = 3
const REMOUNT_COOLDOWN_MS = 60000 // 1 minute entre deux chargements initiaux
const DEFAULT_CHECK_INTERVAL_MS = 120000 // 2 min (limite la charge en mutualisé)

/** Remet à zéro l'état partagé — réservé aux tests (isolation entre cas). */
export function __resetNotificationsPollingState() {
  notifications.value = []
  unreadCount.value = 0
  isLoading.value = false
  inFlight = null
  lastCheckTime = null
  if (checkInterval) clearInterval(checkInterval)
  checkInterval = null
  pollSubscribers = 0
  previousNotificationIds.clear()
  sessionStartTime = null
  consecutiveErrors = 0
}

const countUnread = (data) => (Array.isArray(data) ? data.filter(n => n.is_unread).length : 0)

function getNotificationType(type) {
  const typeMap = {
    'lesson_published': 'success',
    'forum_reply': 'info',
    'quiz_available': 'warning',
    'grade_received': 'success',
    'visio_scheduled': 'info',
    'visio_starting': 'warning'
  }
  return typeMap[type] || 'info'
}

/**
 * Charge les notifications récentes en DÉDOUBLONNANT les appels concurrents.
 *
 * `lastCheckTime` n'était écrit qu'après l'await : plusieurs instances montées
 * dans le même tick lisaient toutes `null` et partaient toutes en requête
 * (TOCTOU). On partage désormais la promesse en vol, si bien que N appelants
 * simultanés produisent UNE requête et se partagent son résultat.
 */
function loadNotifications() {
  if (inFlight) return inFlight

  isLoading.value = true
  // Marqué AVANT l'attente : ferme la fenêtre entre le test et l'écriture.
  lastCheckTime = Date.now()

  inFlight = notificationsService.getRecentNotifications(10)
    .then((data) => {
      notifications.value = Array.isArray(data) ? data : []
      unreadCount.value = countUnread(data)
      notifications.value.forEach(n => previousNotificationIds.add(n.id))
      consecutiveErrors = 0
      return notifications.value
    })
    .catch((error) => {
      logError(error, '[useNotifications] chargement')
      // L'échec ne doit pas bloquer un nouvel essai pendant tout le cooldown.
      lastCheckTime = null
      return []
    })
    .finally(() => {
      isLoading.value = false
      inFlight = null
    })

  return inFlight
}

/** Vérification périodique : met à jour la liste et signale les nouveautés. */
async function checkNewNotifications(showToast) {
  try {
    const data = await notificationsService.getRecentNotifications(10)
    consecutiveErrors = 0

    const newNotifications = (Array.isArray(data) ? data : []).filter(notif => {
      const isNew = !previousNotificationIds.has(notif.id)
      previousNotificationIds.add(notif.id)

      if (isNew && notif.is_unread && sessionStartTime) {
        return new Date(notif.created_at).getTime() > sessionStartTime
      }
      return false
    })

    if (showToast && newNotifications.length > 0 && typeof window !== 'undefined' && window.$toast) {
      newNotifications.forEach(notif => {
        window.$toast({
          title: notif.title,
          message: notif.message,
          type: getNotificationType(notif.type),
          duration: 6000
        })
      })
    }

    notifications.value = Array.isArray(data) ? data : []
    unreadCount.value = countUnread(data)
    lastCheckTime = Date.now()
  } catch (error) {
    consecutiveErrors++
    logError(error, '[useNotifications] vérification périodique')

    // Serveur en difficulté : on cesse de le solliciter.
    if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) stopPolling(true)
  }
}

/** Installe l'intervalle partagé s'il n'existe pas encore. */
function startPolling(intervalMs, showToast) {
  pollSubscribers++
  if (checkInterval) return
  checkInterval = setInterval(() => checkNewNotifications(showToast), intervalMs)
}

/**
 * Retire un abonné ; l'intervalle n'est supprimé qu'au départ du DERNIER
 * (ou immédiatement si `force`, cas de l'arrêt sur erreurs répétées).
 */
function stopPolling(force = false) {
  if (!force) pollSubscribers = Math.max(0, pollSubscribers - 1)
  if (force) pollSubscribers = 0
  if (pollSubscribers === 0 && checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}

/**
 * @param {{autoCheck?: boolean, checkIntervalMs?: number, showToast?: boolean}} [options]
 *   `autoCheck` (défaut true) installe la vérification périodique partagée.
 */
export function useNotifications(options = {}) {
  // Un appel historique passait un BOOLÉEN (`useNotifications(false)`) : la
  // déstructuration boxait le primitif, `autoCheck` retombait sur son défaut
  // `true` et l'intention exprimée était silencieusement inversée. On refuse
  // désormais l'argument au lieu de le mal interpréter.
  if (options === null || typeof options !== 'object') {
    throw new TypeError('useNotifications(options) attend un objet, ex. { autoCheck: false }.')
  }

  const {
    autoCheck = true,
    checkIntervalMs = DEFAULT_CHECK_INTERVAL_MS,
    showToast = true
  } = options

  async function markAsRead(notificationId) {
    const success = await notificationsService.markAsRead(notificationId)
    if (success) {
      const notif = notifications.value.find(n => n.id === notificationId)
      if (notif) notif.is_unread = false
      unreadCount.value = Math.max(0, unreadCount.value - 1)
    }
    return success
  }

  async function markAllAsRead() {
    const success = await notificationsService.markAllAsRead()
    if (success) {
      notifications.value.forEach(n => { n.is_unread = false })
      unreadCount.value = 0
    }
    return success
  }

  async function deleteNotification(notificationId) {
    const success = await notificationsService.deleteNotification(notificationId)
    if (success) {
      const index = notifications.value.findIndex(n => n.id === notificationId)
      if (index !== -1) {
        const wasUnread = notifications.value[index].is_unread
        notifications.value.splice(index, 1)
        if (wasUnread) unreadCount.value = Math.max(0, unreadCount.value - 1)
      }
    }
    return success
  }

  function startAutoCheck() {
    startPolling(checkIntervalMs, showToast)
  }

  onMounted(() => {
    if (sessionStartTime === null) sessionStartTime = Date.now()

    // Un seul chargement initial, quel que soit le nombre d'instances : la
    // promesse en vol est partagée et le cooldown couvre les remontages
    // successifs dus à la navigation.
    const stale = !lastCheckTime || (Date.now() - lastCheckTime) > REMOUNT_COOLDOWN_MS
    if (stale) loadNotifications()

    if (autoCheck) startPolling(checkIntervalMs, showToast)
  })

  onUnmounted(() => {
    if (autoCheck) stopPolling()
  })

  return {
    notifications,
    unreadCount,
    isLoading,
    loadNotifications,
    checkNewNotifications: () => checkNewNotifications(showToast),
    markAsRead,
    markAllAsRead,
    deleteNotification,
    startAutoCheck,
    stopAutoCheck: () => stopPolling(true),
  }
}
