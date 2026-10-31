/**
 * Double de l'IFrame API de Jitsi, partagé par les tests de `useJitsiRoom` et ceux
 * qui montent la salle (#416). Ce n'est pas un test : Vitest ne collecte que les
 * `*.test.*`. Extrait de `src/composables/__tests__/useJitsiRoom.test.js`, à
 * l'identique, quand ce fichier a atteint la limite de 300 lignes.
 */
import { vi } from 'vitest'
import { useJitsiRoom } from '@/composables/useJitsiRoom'

export const ROOM = {
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
export function createFakeJitsiApi() {
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

export function mountRoom(overrides = {}) {
  const { FakeApi, instances, last } = createFakeJitsiApi()
  const room = useJitsiRoom({
    loadExternalApi: vi.fn(async () => FakeApi),
    ...overrides,
  })
  return { room, instances, last }
}
