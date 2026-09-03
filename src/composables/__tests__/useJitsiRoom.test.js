/**
 * Tests du composable useJitsiRoom — src/composables/useJitsiRoom.js (#673)
 *
 * `useJitsiRoom` est la SEULE frontière du dépôt qui connaît l'IFrame API de
 * Jitsi. Tout est donc testé contre un double injecté : aucun test n'a besoin
 * d'un vrai serveur Jitsi, et la frontière reste substituable (DIP).
 *
 * Ce que ces tests verrouillent, et pourquoi c'est le cœur de #673 :
 * l'ordre d'enregistrement ne « réussit » que lorsque le FOURNISSEUR l'a
 * confirmé. Le défaut corrigé consistait justement à afficher « enregistrement
 * en cours » sur la foi d'une écriture locale, pendant que Jibri restait IDLE.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { useJitsiRoom } from '@/composables/useJitsiRoom'

const ROOM = {
  domain: 'visio.klassci.com',
  roomName: 'lms_cf185e304cbe2bd81a2e1e57adc555e0036f47f7',
  jwt: 'eyJhbG.payload.sig',
  displayName: 'Awa Koné',
}

/**
 * Double de `JitsiMeetExternalAPI`.
 *
 * Il ÉCHOUE s'il est construit sans les options indispensables. Un double
 * permissif laisserait passer un composable qui instancie l'API sans la
 * configurer : le test serait vert et la salle ne s'ouvrirait jamais.
 */
function createFakeJitsiApi() {
  const instances = []

  class FakeApi {
    constructor(domain, options) {
      if (!domain) throw new Error('domaine manquant')
      if (!options?.roomName) throw new Error('roomName manquant')
      if (!options?.jwt) throw new Error('jwt manquant : la salle refuserait l\'entrée')
      if (!options?.parentNode) throw new Error('parentNode manquant : rien ne serait affiché')

      this.domain = domain
      this.options = options
      this.listeners = new Map()
      this.commands = []
      this.disposed = false
      instances.push(this)
    }

    addListener(event, handler) {
      if (!this.listeners.has(event)) this.listeners.set(event, new Set())
      this.listeners.get(event).add(handler)
    }

    removeListener(event, handler) {
      this.listeners.get(event)?.delete(handler)
    }

    executeCommand(name, ...args) {
      this.commands.push({ name, args })
    }

    dispose() {
      this.disposed = true
    }

    /** Simule un événement émis par Jitsi. */
    emit(event, payload) {
      this.listeners.get(event)?.forEach((handler) => handler(payload))
    }

    countListeners() {
      return [...this.listeners.values()].reduce((total, set) => total + set.size, 0)
    }
  }

  return { FakeApi, instances, last: () => instances[instances.length - 1] }
}

function mountRoom(overrides = {}) {
  const { FakeApi, instances, last } = createFakeJitsiApi()
  const room = useJitsiRoom({
    loadExternalApi: vi.fn(async () => FakeApi),
    ...overrides,
  })
  return { room, instances, last }
}

beforeEach(() => vi.useFakeTimers())
afterEach(() => vi.useRealTimers())

describe('useJitsiRoom — montage', () => {
  it('J1 — configure la salle avec le jeton et le nœud parent', async () => {
    const { room, last } = mountRoom()
    const parentNode = document.createElement('div')

    await room.mount({ ...ROOM, parentNode })

    expect(last().domain).toBe(ROOM.domain)
    expect(last().options.roomName).toBe(ROOM.roomName)
    expect(last().options.jwt).toBe(ROOM.jwt)
    expect(last().options.parentNode).toBe(parentNode)
  })

  /**
   * R7 — le jeton ne doit plus transiter par l'URL. Le vérifier ici, sur la
   * frontière, est le seul endroit où la garantie tient quel que soit l'appelant.
   */
  it('J2 — le jeton est passé en option, jamais dans le nom de salle', async () => {
    const { room, last } = mountRoom()

    await room.mount({ ...ROOM, parentNode: document.createElement('div') })

    expect(last().options.roomName).not.toContain('jwt')
    expect(last().options.roomName).not.toContain(ROOM.jwt)
  })

  it('J3 — un montage sans jeton échoue avant toute instanciation', async () => {
    const { room, instances } = mountRoom()

    await expect(
      room.mount({ ...ROOM, jwt: '', parentNode: document.createElement('div') }),
    ).rejects.toThrow()
    expect(instances).toHaveLength(0)
  })

  it('J4 — dispose() détache TOUS les écouteurs et libère l\'instance', async () => {
    const { room, last } = mountRoom()
    await room.mount({ ...ROOM, parentNode: document.createElement('div') })
    expect(last().countListeners()).toBeGreaterThan(0)

    room.dispose()

    expect(last().disposed).toBe(true)
    expect(last().countListeners()).toBe(0)
  })
})

describe('useJitsiRoom — enregistrement (le cœur de #673)', () => {
  async function mounted() {
    const ctx = mountRoom()
    await ctx.room.mount({ ...ROOM, parentNode: document.createElement('div') })
    return ctx
  }

  it('J5 — la promesse ne se résout QUE sur confirmation du fournisseur', async () => {
    const { room, last } = await mounted()

    const started = room.startRecording()
    let resolved = false
    started.then(() => { resolved = true })

    // L'ordre est parti…
    expect(last().commands).toEqual([{ name: 'startRecording', args: [{ mode: 'file' }] }])
    await Promise.resolve()
    // …mais rien n'est confirmé : personne ne doit conclure au succès.
    expect(resolved).toBe(false)

    last().emit('recordingStatusChanged', { on: true, mode: 'file' })
    await expect(started).resolves.toBeUndefined()
  })

  it('J6 — un échec explicite du fournisseur rejette immédiatement', async () => {
    const { room, last } = await mounted()

    const started = room.startRecording()
    last().emit('recordingStatusChanged', { on: false, mode: 'file', error: 'service_unavailable' })

    await expect(started).rejects.toThrow(/service_unavailable/)
  })

  /**
   * MESURÉ sur le serveur : Jibri a mis 8,3 s puis 23,9 s à passer à `on`
   * (journaux Jicofo du 2026-08-31). Et Jicofo lui-même attend
   * `pending-timeout = "90 seconds"` (/run/jicofo/config/jicofo.conf:104).
   * Conclure à l'échec avant Jicofo produirait un enregistrement orphelin :
   * Jibri capturerait sans que le LMS ait rien persisté.
   */
  it('J7 — le délai de garde ne se déclenche pas avant celui de Jicofo', async () => {
    const { room } = await mounted()

    const started = room.startRecording()
    started.catch(() => {})
    let settled = false
    started.finally(() => { settled = true })

    await vi.advanceTimersByTimeAsync(90_000)
    expect(settled).toBe(false)
  })

  it('J8 — au-delà du délai de garde, la promesse est rejetée', async () => {
    const { room } = await mounted()

    const started = room.startRecording()
    const assertion = expect(started).rejects.toThrow(/confirm/i)
    await vi.advanceTimersByTimeAsync(120_000)
    await assertion
  })

  /**
   * Une promesse tenue doit être définitivement tenue. Si l'écouteur de la
   * commande survivait, un `off` ultérieur — l'arrêt normal de la séance —
   * rejetterait une promesse déjà résolue ; et un minuteur non annulé
   * produirait un rejet non intercepté deux minutes plus tard.
   */
  it('J9 — après confirmation, ni écouteur ni minuteur ne survivent', async () => {
    const { room, last } = await mounted()

    const started = room.startRecording()
    // 2 écouteurs : le suivi permanent de `isRecording`, plus celui de la commande.
    expect(last().countListeners()).toBe(2)

    last().emit('recordingStatusChanged', { on: true, mode: 'file' })
    await started

    expect(last().countListeners()).toBe(1)
    await vi.advanceTimersByTimeAsync(300_000)
    expect(last().countListeners()).toBe(1)
  })

  it('J10 — l\'arrêt suit la même règle : confirmation avant résolution', async () => {
    const { room, last } = await mounted()

    const stopped = room.stopRecording()
    expect(last().commands).toEqual([{ name: 'stopRecording', args: [{ mode: 'file' }] }])

    last().emit('recordingStatusChanged', { on: false, mode: 'file' })
    await expect(stopped).resolves.toBeUndefined()
  })

  it('J11 — piloter l\'enregistrement sans salle montée échoue', async () => {
    const { room } = mountRoom()

    await expect(room.startRecording()).rejects.toThrow()
  })
})

describe('useJitsiRoom — sortie de salle (R6)', () => {
  it('J12 — la sortie provient d\'un événement Jitsi, pas d\'une fenêtre sondée', async () => {
    const { room, last } = mountRoom()
    const onLeft = vi.fn()
    room.on('videoConferenceLeft', onLeft)
    await room.mount({ ...ROOM, parentNode: document.createElement('div') })

    last().emit('videoConferenceLeft', { roomName: ROOM.roomName })

    expect(onLeft).toHaveBeenCalledTimes(1)
  })

  it('J13 — readyToClose est relayé aussi', async () => {
    const { room, last } = mountRoom()
    const onClose = vi.fn()
    room.on('readyToClose', onClose)
    await room.mount({ ...ROOM, parentNode: document.createElement('div') })

    last().emit('readyToClose', {})

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
