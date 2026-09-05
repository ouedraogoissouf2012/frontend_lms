/**
 * Tests du composant VisioRoom — src/components/visio/VisioRoom.vue (#673)
 *
 * Le composant est monté à la racine de l'application, hors de <router-view> :
 * c'est ce qui fait survivre la salle à la navigation interne, propriété que
 * l'onglet séparé apportait avant #673.
 *
 * Ce fichier verrouille surtout un défaut trouvé en relecture : un échec de
 * montage était affiché dans un élément du composant lui-même, alors que la
 * compensation qui suit remet `roomConfig` à `null` — donc le `v-if` démonte
 * tout et le message n'est JAMAIS lu. Un échec silencieux, exactement la classe
 * de défaut que ce chantier corrige.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { setActivePinia, createPinia } from 'pinia'

const { mockMount, mockDispose, mockOn, mockNotifyError, mockOnProviderStatus, mockStartRecording, mockStopRecording, mockGetActive } = vi.hoisted(() => ({
  mockMount: vi.fn(),
  mockDispose: vi.fn(),
  mockOn: vi.fn(),
  mockNotifyError: vi.fn(),
  mockStartRecording: vi.fn(),
  mockStopRecording: vi.fn(),
  mockOnProviderStatus: vi.fn(),
  mockGetActive: vi.fn(),
}))

vi.mock('@/composables/useJitsiRoom', () => ({
  useJitsiRoom: () => ({
    isRecording: { value: false },
    mount: mockMount,
    dispose: mockDispose,
    on: mockOn,
    startRecording: mockStartRecording,
    stopRecording: mockStopRecording,
  }),
}))

vi.mock('@/composables/useVisioRecordingMirror', () => ({
  useVisioRecordingMirror: () => ({
    mirroredOn: { value: null },
    onProviderStatus: mockOnProviderStatus,
    reset: vi.fn(),
  }),
}))

vi.mock('@/services/lms', () => ({
  default: { getActiveVisioParticipation: mockGetActive },
}))

let jeton = 'jeton-de-session'
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ token: jeton, currentUser: { role: 'enseignant' } }) }))

vi.mock('@/services/visioFeedback', () => ({
  notifyVisioError: mockNotifyError,
  notifyVisioSuccess: vi.fn(),
  notifyVisioWarning: vi.fn(),
  confirmVisioAction: vi.fn(),
}))

import VisioRoom from '@/components/visio/VisioRoom.vue'
import { useVisioStore } from '@/stores/visio'

const ROOM_CONFIG = {
  domain: 'visio.klassci.com',
  roomName: 'lms_abc',
  jwt: 'jeton',
  displayName: 'Awa',
}

beforeEach(() => {
  setActivePinia(createPinia())
  mockMount.mockReset().mockResolvedValue(undefined)
  mockDispose.mockReset()
  mockOn.mockReset()
  mockNotifyError.mockReset()
  mockStartRecording.mockReset().mockResolvedValue(undefined)
  mockStopRecording.mockReset().mockResolvedValue(undefined)
  mockGetActive.mockReset().mockResolvedValue({ success: true, data: null })
  jeton = 'jeton-de-session'
})

/**
 * Depuis #328, un mode reseau doit etre choisi AVANT tout montage : l'ecran de
 * choix remplace le pre-join natif de Jitsi, desactive en #327. Les tests qui
 * portent sur le MONTAGE passent donc par ce helper ; le comportement de
 * l'ecran lui-meme est verrouille par R13-R15.
 */
async function ouvrirSalle(wrapper, store, config = ROOM_CONFIG) {
  store.roomConfig = config
  await wrapper.vm.$nextTick()
  await wrapper.findComponent({ name: 'VisioJoinChoice' }).vm.$emit('rejoindre', 'complet')
  await wrapper.vm.$nextTick()
  await wrapper.vm.$nextTick()
}

describe('VisioRoom', () => {
  it('R1 — sans salle décrite, rien n\'est rendu ni monté', async () => {
    const wrapper = mount(VisioRoom)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.visio-room').exists()).toBe(false)
    expect(mockMount).not.toHaveBeenCalled()
  })

  /**
   * Les écouteurs de sortie et d'enregistrement sont posés AVANT le montage :
   * un enregistrement déjà en cours à l'entrée en salle doit être reflété, et
   * un départ immédiat ne doit pas passer inaperçu.
   */
  it('R2 — les écouteurs sont posés dès la construction', () => {
    mount(VisioRoom)

    const events = mockOn.mock.calls.map(([event]) => event)
    expect(events).toContain('recordingStatusChanged')
    expect(events).toContain('videoConferenceLeft')
    expect(events).toContain('readyToClose')
  })

  it('R3 — une salle décrite est montée avec le nœud du composant', async () => {
    const wrapper = mount(VisioRoom, { attachTo: document.body })
    const store = useVisioStore()

    await ouvrirSalle(wrapper, store)

    expect(mockMount).toHaveBeenCalledTimes(1)
    const args = mockMount.mock.calls[0][0]
    expect(args.roomName).toBe(ROOM_CONFIG.roomName)
    expect(args.jwt).toBe(ROOM_CONFIG.jwt)
    expect(args.parentNode).toBeTruthy()
  })

  /**
   * LE test du défaut trouvé en relecture. La compensation démonte le
   * composant : le message DOIT donc sortir par un toast, qui survit au
   * démontage. Sinon l'utilisateur voit une salle qui ne s'ouvre pas, sans
   * aucune explication.
   */
  it('R4 — un échec de montage est notifié hors du composant, et compensé', async () => {
    mockMount.mockRejectedValue(new Error('module de visioconférence indisponible'))
    const wrapper = mount(VisioRoom, { attachTo: document.body })
    const store = useVisioStore()
    const leaveVisio = vi.spyOn(store, 'leaveVisio').mockResolvedValue(undefined)

    await ouvrirSalle(wrapper, store)
    await Promise.resolve()

    expect(mockNotifyError).toHaveBeenCalledTimes(1)
    expect(leaveVisio).toHaveBeenCalledTimes(1)
  })

  it('R5 — la disparition de la salle libère l\'instance Jitsi', async () => {
    const wrapper = mount(VisioRoom, { attachTo: document.body })
    const store = useVisioStore()

    await ouvrirSalle(wrapper, store)
    mockDispose.mockClear()

    store.roomConfig = null
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(mockDispose).toHaveBeenCalled()
  })

  /**
   * Le bouton d'enregistrement de l'ecran seance commande la SALLE, pas la
   * base. Les commandes ne doivent donc etre publiees qu'apres un montage
   * reussi — sinon un ordre atteindrait une instance Jitsi inexistante, et on
   * retomberait dans le defaut d'origine de #673.
   */
  it('R6 — les commandes ne sont publiees qu apres un montage reussi', async () => {
    const wrapper = mount(VisioRoom, { attachTo: document.body })
    const store = useVisioStore()

    await expect(store.startRoomRecording()).rejects.toThrow(/salle/i)

    await ouvrirSalle(wrapper, store)

    await expect(store.startRoomRecording()).resolves.toBeUndefined()
  })

  it('R7 — un montage en echec ne publie AUCUNE commande', async () => {
    mockMount.mockRejectedValue(new Error('indisponible'))
    const wrapper = mount(VisioRoom, { attachTo: document.body })
    const store = useVisioStore()
    vi.spyOn(store, 'leaveVisio').mockResolvedValue(undefined)

    await ouvrirSalle(wrapper, store)
    await Promise.resolve()

    await expect(store.startRoomRecording()).rejects.toThrow(/salle/i)
  })

  it('R8 — la sortie de salle retire les commandes', async () => {
    const wrapper = mount(VisioRoom, { attachTo: document.body })
    const store = useVisioStore()
    await ouvrirSalle(wrapper, store)

    store.roomConfig = null
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    await expect(store.startRoomRecording()).rejects.toThrow(/salle/i)
  })

  // ─────────────────────────── Reprise apres rechargement (R8) ──────────────
  //
  // La salle est embarquee : un F5 la detruit. Le serveur fait autorite sur la
  // participation en cours — aucune persistance client, le depot ayant
  // delibrement demonte celle qui existait.

  it('R9 — au demarrage, une participation ouverte fait reprendre la salle', async () => {
    mockGetActive.mockResolvedValue({ success: true, data: { seance_id: 349 } })
    const wrapper = mount(VisioRoom, { attachTo: document.body })
    const store = useVisioStore()
    const joinVisio = vi.spyOn(store, 'joinVisio').mockResolvedValue({ success: true })

    await wrapper.vm.$nextTick()
    await Promise.resolve()
    await Promise.resolve()

    expect(mockGetActive).toHaveBeenCalledTimes(1)
    expect(joinVisio).toHaveBeenCalledWith(349)
  })

  it('R10 — sans participation ouverte, rien n est rejoint', async () => {
    const wrapper = mount(VisioRoom, { attachTo: document.body })
    const store = useVisioStore()
    const joinVisio = vi.spyOn(store, 'joinVisio')

    await wrapper.vm.$nextTick()
    await Promise.resolve()

    expect(joinVisio).not.toHaveBeenCalled()
  })

  /**
   * Le composant est monte a la RACINE, donc aussi sur l ecran de connexion.
   * Interroger le serveur sans jeton produirait un 401 a chaque chargement de
   * page, pour tous les visiteurs non connectes.
   */
  it('R11 — sans session authentifiee, aucune requete n est emise', async () => {
    jeton = null
    const wrapper = mount(VisioRoom, { attachTo: document.body })

    await wrapper.vm.$nextTick()
    await Promise.resolve()

    expect(mockGetActive).not.toHaveBeenCalled()
  })

  /** Une reprise impossible ne doit jamais empecher l application de demarrer. */
  it('R12 — un echec de reprise ne casse pas le demarrage', async () => {
    mockGetActive.mockRejectedValue(new Error('503'))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const wrapper = mount(VisioRoom, { attachTo: document.body })
    await wrapper.vm.$nextTick()
    await Promise.resolve()

    expect(wrapper.exists()).toBe(true)
  })

  // ── Choix du mode reseau (#328) ─────────────────────────────────────────

  /**
   * LE test qui rend l'ecran opposable plutot que decoratif. #327 a desactive
   * le pre-join natif de Jitsi, seul endroit ou l'apprenant pouvait couper sa
   * camera avant de depenser sa data. Si la salle se montait quand meme, on
   * aurait retire le garde-fou et affiche un ecran sans effet.
   */
  it('R13 — aucune salle n est montee tant qu aucun mode n est choisi', async () => {
    const wrapper = mount(VisioRoom, { attachTo: document.body })
    const store = useVisioStore()

    store.roomConfig = ROOM_CONFIG
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(wrapper.findComponent({ name: 'VisioJoinChoice' }).exists()).toBe(true)
    expect(wrapper.find('.visio-room').exists()).toBe(false)
    expect(mockMount).not.toHaveBeenCalled()
  })

  it('R14 — le mode choisi est transmis a la salle', async () => {
    const wrapper = mount(VisioRoom, { attachTo: document.body })
    const store = useVisioStore()

    store.roomConfig = ROOM_CONFIG
    await wrapper.vm.$nextTick()
    await wrapper.findComponent({ name: 'VisioJoinChoice' }).vm.$emit('rejoindre', 'audio')
    await wrapper.vm.$nextTick()
    await wrapper.vm.$nextTick()

    expect(mockMount).toHaveBeenCalledTimes(1)
    // `channelLastN: 0` est la seule facon de ne recevoir aucun flux video.
    expect(mockMount.mock.calls[0][0].configOverwrite.channelLastN).toBe(0)
  })

  /**
   * La participation est DEJA ecrite cote serveur quand l'ecran s'affiche.
   * Refuser d'entrer sans compenser laisserait l'apprenant marque present a une
   * seance qu'il a explicitement refusee — et cette ligne alimente les rapports.
   */
  it('R15 — refuser d entrer compense la participation deja ecrite', async () => {
    const wrapper = mount(VisioRoom, { attachTo: document.body })
    const store = useVisioStore()
    const leave = vi.spyOn(store, 'leaveVisio').mockResolvedValue(undefined)

    store.roomConfig = ROOM_CONFIG
    await wrapper.vm.$nextTick()
    await wrapper.findComponent({ name: 'VisioJoinChoice' }).vm.$emit('annuler')
    await wrapper.vm.$nextTick()

    expect(leave).toHaveBeenCalled()
    expect(mockMount).not.toHaveBeenCalled()
  })
})
