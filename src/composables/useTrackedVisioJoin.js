import { useAuthStore } from '@/stores/auth'
import { useVisioStore } from '@/stores/visio'
import { buildJitsiUrl, getVisioRoomId, VISIO_ROOM_REQUIRED_MESSAGE } from '@/constants/visio'

const SEANCE_ID_REQUIRED_MESSAGE = 'Identifiant de séance visio introuvable.'

export function resolveSeanceId(source) {
  if (source === null || source === undefined) return null
  if (typeof source !== 'object') return source
  return source.id ?? source.klassci_seance_id ?? source.seance_id ?? null
}

export function useTrackedVisioJoin(defaultDisplayName = 'Utilisateur') {
  const authStore = useAuthStore()
  const visioStore = useVisioStore()

  async function joinTrackedVisio(seance, options = {}) {
    const seanceId = resolveSeanceId(seance)
    if (!seanceId) throw new Error(SEANCE_ID_REQUIRED_MESSAGE)

    const roomSource = options.roomSource ?? seance
    const roomId = getVisioRoomId(roomSource) || getVisioRoomId(seance)
    if (!roomId) throw new Error(options.roomRequiredMessage || VISIO_ROOM_REQUIRED_MESSAGE)

    const displayName = options.displayName ?? authStore.currentUser?.name ?? defaultDisplayName
    const jitsiLink = buildJitsiUrl(roomId, {
      displayName,
      prejoinDisabled: options.prejoinDisabled ?? true,
    })

    return visioStore.joinVisio(seanceId, jitsiLink)
  }

  return { joinTrackedVisio }
}
