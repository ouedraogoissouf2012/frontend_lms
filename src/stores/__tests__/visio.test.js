/**
 * Tests du store visio — src/stores/visio.js (#673, tâche 2.1)
 *
 * ## Ce que ce fichier protège
 *
 * La participation est écrite CÔTÉ SERVEUR par `POST /seances/{id}/join`, avant
 * toute entrée en salle. Tout échec au-delà de ce point doit être compensé,
 * sans quoi l'utilisateur reste marqué présent à une séance qu'il n'a jamais
 * rejointe — et cette ligne alimente les rapports de présence.
 *
 * ## Pourquoi il est écrit AVANT le refactor
 *
 * #673 remplace l'onglet séparé (`window.open`) par une salle embarquée. Ces
 * tests figent le comportement de présence **de part et d'autre** de ce
 * changement : aucun n'observe `window.open` ni l'URL construite, seulement les
 * appels de service et l'état du store. S'il faut les retoucher après le
 * refactor, c'est que la présence a changé de comportement — donc que R6 est
 * violé.
 */
import { setActivePinia, createPinia } from 'pinia'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'

const { mockJoinVisio, mockLeaveVisio, mockHeartbeat } = vi.hoisted(() => ({
  mockJoinVisio: vi.fn(),
  mockLeaveVisio: vi.fn(),
  mockHeartbeat: vi.fn(),
}))

vi.mock('@/services/lms', () => ({
  default: {
    joinVisio: mockJoinVisio,
    leaveVisio: mockLeaveVisio,
    heartbeatVisio: mockHeartbeat,
  },
}))

// La sortie par Beacon touche `fetch` et `navigator.sendBeacon` : hors sujet ici.
vi.mock('@/services/visioLeave', () => ({ sendVisioLeaveBeacon: vi.fn(async () => true) }))
vi.mock('@/constants/roles', async (importActual) => ({
  ...(await importActual()),
  isTeacher: () => true,
}))

import { useVisioStore } from '@/stores/visio'
import { VISIO_TOKEN_REQUIRED_MESSAGE } from '@/constants/visio'
import { sendVisioLeaveBeacon } from '@/services/visioLeave'

const SEANCE_ID = 349

const joinResponse = (data) => ({ success: true, message: 'Accès à la visio autorisé', data })

const VALID_DATA = {
  visio_room_id: 'lms_cf185e304cbe2bd81a2e1e57adc555e0036f47f7',
  visio_token: 'eyJhbG.payload.sig',
  visio_token_available: true,
  participants_count: 1,
}

let originalOpen

beforeEach(() => {
  setActivePinia(createPinia())
  mockJoinVisio.mockReset()
  mockLeaveVisio.mockReset().mockResolvedValue({ success: true })
  mockHeartbeat.mockReset().mockResolvedValue({ success: true })
  sendVisioLeaveBeacon.mockClear()

  // jsdom ne sait pas ouvrir de fenêtre : sans ce double, le parcours actuel
  // échouerait pour une raison étrangère au comportement testé. Après le
  // passage à la salle embarquée, ce double devient simplement inutilisé.
  originalOpen = window.open
  window.open = vi.fn(() => ({ closed: false, close: vi.fn() }))
})

afterEach(() => {
  window.open = originalOpen
  vi.restoreAllMocks()
})

describe('store visio — la participation (R6)', () => {
  it('S1 — rejoindre appelle le service de participation avec la séance', async () => {
    mockJoinVisio.mockResolvedValue(joinResponse(VALID_DATA))
    const store = useVisioStore()

    await store.joinVisio(SEANCE_ID)

    expect(mockJoinVisio).toHaveBeenCalledTimes(1)
    expect(mockJoinVisio).toHaveBeenCalledWith(SEANCE_ID)
  })

  it('S2 — une participation réussie pose l\'état global', async () => {
    mockJoinVisio.mockResolvedValue(joinResponse(VALID_DATA))
    const store = useVisioStore()

    await store.joinVisio(SEANCE_ID)

    expect(store.isInVisio).toBe(true)
    expect(store.activeSeanceId).toBe(SEANCE_ID)
  })

  /**
   * Le serveur a refusé : AUCUNE présence n'a été écrite. Compenser ici
   * enverrait un `leave` pour une participation inexistante.
   */
  it('S3 — un refus serveur ne déclenche aucune compensation', async () => {
    mockJoinVisio.mockResolvedValue({ success: false, message: 'La visio n\'est pas active' })
    const store = useVisioStore()

    await expect(store.joinVisio(SEANCE_ID)).rejects.toThrow(/pas active/)
    expect(mockLeaveVisio).not.toHaveBeenCalled()
    expect(store.isInVisio).toBe(false)
  })

  /**
   * LE test qui compte. Le serveur a accepté — donc la présence EST écrite —
   * mais la réponse ne porte aucun jeton : la salle refusera l'entrée. La
   * participation doit être annulée, sinon l'utilisateur figure présent à un
   * cours qu'il n'a jamais suivi.
   *
   * Ce déclencheur est délibérément le jeton manquant, et non l'échec
   * d'ouverture de fenêtre : il survit au passage à la salle embarquée.
   */
  it('S4 — un jeton absent compense la participation déjà écrite', async () => {
    mockJoinVisio.mockResolvedValue(
      joinResponse({ ...VALID_DATA, visio_token: null, visio_token_available: false }),
    )
    const store = useVisioStore()

    await expect(store.joinVisio(SEANCE_ID)).rejects.toThrow(VISIO_TOKEN_REQUIRED_MESSAGE)

    expect(mockLeaveVisio).toHaveBeenCalledWith(SEANCE_ID)
    expect(store.isInVisio).toBe(false)
    expect(store.activeSeanceId).toBe(null)
  })

  it('S5 — un jeton présent mais vide est traité comme absent', async () => {
    mockJoinVisio.mockResolvedValue(
      joinResponse({ ...VALID_DATA, visio_token: '   ', visio_token_available: true }),
    )
    const store = useVisioStore()

    await expect(store.joinVisio(SEANCE_ID)).rejects.toThrow(VISIO_TOKEN_REQUIRED_MESSAGE)
    expect(mockLeaveVisio).toHaveBeenCalledWith(SEANCE_ID)
  })

  /**
   * L'échec de compensation ne doit jamais masquer l'erreur d'origine : c'est
   * elle que l'utilisateur doit lire.
   */
  it('S6 — une compensation en échec ne masque pas l\'erreur d\'origine', async () => {
    mockJoinVisio.mockResolvedValue(
      joinResponse({ ...VALID_DATA, visio_token: null, visio_token_available: false }),
    )
    mockLeaveVisio.mockRejectedValue(new Error('réseau indisponible'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const store = useVisioStore()

    await expect(store.joinVisio(SEANCE_ID)).rejects.toThrow(VISIO_TOKEN_REQUIRED_MESSAGE)
  })
})

describe('store visio — la sortie', () => {
  it('S7 — quitter émet la sortie et réinitialise l\'état', async () => {
    mockJoinVisio.mockResolvedValue(joinResponse(VALID_DATA))
    const store = useVisioStore()
    await store.joinVisio(SEANCE_ID)

    await store.leaveVisio()

    expect(sendVisioLeaveBeacon).toHaveBeenCalledWith(SEANCE_ID)
    expect(store.isInVisio).toBe(false)
    expect(store.activeSeanceId).toBe(null)
  })

  it('S8 — quitter sans participation active n\'émet rien', async () => {
    const store = useVisioStore()

    await store.leaveVisio()

    expect(sendVisioLeaveBeacon).not.toHaveBeenCalled()
  })
})

describe('store visio — sortie de salle (#673)', () => {
  /**
   * Jitsi emet `videoConferenceLeft` PUIS `readyToClose` pour une seule et meme
   * sortie. `leaveVisio()` etant asynchrone, `isInVisio` vaut encore true quand
   * le second arrive : sans garde synchrone, l'enseignant se voit proposer DEUX
   * fois de « terminer pour tous ».
   */
  it('S9 — deux evenements pour une meme sortie ne notifient qu une fois', async () => {
    mockJoinVisio.mockResolvedValue(joinResponse(VALID_DATA))
    const store = useVisioStore()
    await store.joinVisio(SEANCE_ID)

    const dispatch = vi.spyOn(window, 'dispatchEvent')

    store.handleRoomLeft()
    store.handleRoomLeft()
    await Promise.resolve()

    const notifications = dispatch.mock.calls.filter(([e]) => e.type === 'visio:teacher-left')
    expect(notifications).toHaveLength(1)
    expect(notifications[0][0].detail.seanceId).toBe(SEANCE_ID)
  })

  it('S10 — une sortie sans participation active ne notifie pas', async () => {
    const store = useVisioStore()
    const dispatch = vi.spyOn(window, 'dispatchEvent')

    store.handleRoomLeft()
    await Promise.resolve()

    expect(dispatch.mock.calls.filter(([e]) => e.type === 'visio:teacher-left')).toHaveLength(0)
  })
})

describe('store visio — pilotage de l enregistrement depuis la salle (#673)', () => {
  /**
   * On n'enregistre pas une reunion qu'on n'a pas rejointe. Le refus doit etre
   * EXPLICITE : c'est ce qui empeche le bouton de retomber dans le defaut
   * d'origine — ecrire une ligne en base sans que Jibri en sache rien.
   */
  it('S11 — sans salle ouverte, la commande est refusee avec un motif', async () => {
    const store = useVisioStore()

    await expect(store.startRoomRecording()).rejects.toThrow(/salle/i)
    await expect(store.stopRoomRecording()).rejects.toThrow(/salle/i)
  })

  it('S12 — la commande est deleguee a la salle montee', async () => {
    const store = useVisioStore()
    const startRecording = vi.fn().mockResolvedValue(undefined)
    const stopRecording = vi.fn().mockResolvedValue(undefined)

    store.registerRoomCommands({ startRecording, stopRecording })

    await store.startRoomRecording()
    await store.stopRoomRecording()

    expect(startRecording).toHaveBeenCalledTimes(1)
    expect(stopRecording).toHaveBeenCalledTimes(1)
  })

  /**
   * La salle est demontee a la sortie : sans desenregistrement, le bouton
   * commanderait une instance Jitsi detruite.
   */
  it('S13 — desenregistrer la salle rend la commande a nouveau impossible', async () => {
    const store = useVisioStore()
    store.registerRoomCommands({ startRecording: vi.fn(), stopRecording: vi.fn() })

    store.registerRoomCommands(null)

    await expect(store.startRoomRecording()).rejects.toThrow(/salle/i)
  })
})
