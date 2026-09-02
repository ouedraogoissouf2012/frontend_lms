import { useAuthStore } from '@/stores/auth'
import { useVisioStore } from '@/stores/visio'
import { getVisioRoomId, VISIO_ROOM_REQUIRED_MESSAGE } from '@/constants/visio'

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

    // Garde AVANT tout appel réseau : une séance sans salle doit échouer ici,
    // et surtout pas après `join`, qui écrit déjà la présence en base. Sans
    // cette vérification, un échec plus loin laisserait l'utilisateur marqué
    // présent à une séance qu'il n'a jamais rejointe (#469).
    //
    // La salle utilisée pour construire l'URL vient ensuite de la RÉPONSE de
    // `join`, seule source qui porte aussi le jeton — d'où la disparition de
    // `options.roomSource` du chemin de construction : le garder aurait donné
    // l'illusion qu'il fait autorité alors qu'il n'est plus lu.
    const roomSource = options.roomSource ?? seance
    if (!getVisioRoomId(roomSource) && !getVisioRoomId(seance)) {
      throw new Error(options.roomRequiredMessage || VISIO_ROOM_REQUIRED_MESSAGE)
    }

    return visioStore.joinVisio(seanceId, {
      displayName: options.displayName ?? authStore.currentUser?.name ?? defaultDisplayName,
      prejoinDisabled: options.prejoinDisabled ?? true,
    })
  }

  return { joinTrackedVisio }
}
