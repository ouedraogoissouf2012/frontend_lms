/**
 * Test du composable useAdminVisio (#G1 ≤300) : dérivation des visioconférences depuis
 * les séances (filtre visio_enabled), stats, statut temporel, filtres (statut/recherche)
 * et formats. Service KLASSCI + cache mockés.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getSeances = vi.fn()

vi.mock('@/services/cache', () => ({ readCache: () => null, writeCache: () => {} }))
vi.mock('@/services/klassci', () => ({
  klassciService: { getSeances: (...a) => getSeances(...a) },
}))

import { useAdminVisio } from '@/composables/useAdminVisio'

// Dates relatives à "maintenant" pour piloter le statut temporel.
const now = Date.now()
const iso = (ms) => new Date(now + ms).toISOString()

function makeSeances() {
  return [
    {
      id: 1, visio_enabled: true,
      matiere: { nom: 'Maths' }, classe: { name: '6e A' },
      enseignant: { nom: 'Dupont', prenom: 'Jean' },
      date_debut: iso(-3600 * 1000), date_fin: iso(3600 * 1000), // en cours
      room_name: 'room-1', participants_count: 5,
    },
    {
      id: 2, visio_enabled: true,
      matiere: { nom: 'Histoire' }, classe: { name: '5e B' },
      enseignant: { nom: 'Martin', prenom: 'Alice' },
      date_debut: iso(7200 * 1000), date_fin: iso(10800 * 1000), // planifiée
      room_name: 'room-2', participants_count: 0,
    },
    {
      id: 3, visio_enabled: true,
      matiere: { nom: 'Physique' }, classe: { name: '4e C' },
      enseignant: { nom: 'Bernard', prenom: 'Bob' },
      date_debut: iso(-10800 * 1000), date_fin: iso(-7200 * 1000), // terminée
      room_name: 'room-3', participants_count: 3,
    },
    { id: 4, visio_enabled: false, matiere: { nom: 'Exclu' } }, // ignorée
  ]
}

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useAdminVisio(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useAdminVisio (#G1)', () => {
  beforeEach(() => {
    getSeances.mockReset()
    getSeances.mockResolvedValue({ success: true, data: makeSeances() })
  })

  it('ne garde que les séances visio_enabled et calcule les stats par statut', async () => {
    const v = await setup()
    expect(v.loading.value).toBe(false)
    expect(v.visioconferences.value).toHaveLength(3)
    expect(v.stats.value).toEqual({ active: 1, scheduled: 1, completed: 1, total: 3 })
  })

  it('mappe matière/classe/enseignant et le statut temporel', async () => {
    const v = await setup()
    const active = v.visioconferences.value.find(x => x.id === 1)
    expect(active.matiere).toBe('Maths')
    expect(active.classe).toBe('6e A')
    expect(active.enseignant).toBe('Dupont Jean')
    expect(active.status).toBe('active')
  })

  it('filtre par statut', async () => {
    const v = await setup()
    v.filters.value.status = 'scheduled'
    expect(v.filteredVisioconferences.value).toHaveLength(1)
    expect(v.filteredVisioconferences.value[0].matiere).toBe('Histoire')
  })

  it('filtre par recherche (matière/classe/enseignant)', async () => {
    const v = await setup()
    v.filters.value.search = 'bernard'
    expect(v.filteredVisioconferences.value).toHaveLength(1)
    expect(v.filteredVisioconferences.value[0].matiere).toBe('Physique')
  })

  it('getStatusLabel traduit les statuts connus et inconnus', async () => {
    const v = await setup()
    expect(v.getStatusLabel('active')).toBe('En cours')
    expect(v.getStatusLabel('scheduled')).toBe('Planifiée')
    expect(v.getStatusLabel('completed')).toBe('Terminée')
    expect(v.getStatusLabel('???')).toBe('Inconnu')
  })

  it('formatDate/formatTime renvoient N/A sans date', async () => {
    const v = await setup()
    expect(v.formatDate(null)).toBe('N/A')
    expect(v.formatTime(null)).toBe('N/A')
  })

  it('normalise les variantes de room et ouvre Jitsi avec la room résolue', async () => {
    const open = vi.fn()
    vi.stubGlobal('open', open)
    getSeances.mockResolvedValue({
      success: true,
      data: [{
        id: 10,
        visio_enabled: true,
        matiere: { nom: 'SVT' },
        classe: { name: '3e A' },
        enseignant: { nom: 'Diallo', prenom: 'Awa' },
        date_debut: iso(-3600 * 1000),
        date_fin: iso(3600 * 1000),
        visio: { room_id: 'nested-room' },
      }]
    })

    const v = await setup()
    const visio = v.visioconferences.value[0]

    expect(visio.room_id).toBe('nested-room')
    v.joinVisio(visio)
    expect(open).toHaveBeenCalledWith(expect.stringContaining('/nested-room'), '_blank')
    vi.unstubAllGlobals()
  })

  it('expose une erreur quand le service échoue', async () => {
    getSeances.mockResolvedValue({ success: false, message: 'Boom' })
    const v = await setup()
    expect(v.error.value).toBe('Boom')
    expect(v.loading.value).toBe(false)
  })
})
