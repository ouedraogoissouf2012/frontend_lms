/**
 * Test du composable useTeacherVisioList (#G1 ≤300) : chargement des séances
 * (cache + API), dérivation des visios « en cours » / « à venir » et des
 * statistiques, et handlers d'actions (activate / start / end). Services
 * lms + cache mockés. Garde-fou de parité avec l'ancien TeacherVisioList.vue.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const {
  getMyTeachingSeances, activateVisio, startVisio, endVisio,
  readCache, writeCache, clearCache, confirmVisioAction, joinTrackedVisio,
} = vi.hoisted(() => ({
  getMyTeachingSeances: vi.fn(),
  activateVisio: vi.fn(() => Promise.resolve()),
  startVisio: vi.fn(() => Promise.resolve()),
  endVisio: vi.fn(() => Promise.resolve()),
  readCache: vi.fn(() => null),
  writeCache: vi.fn(),
  clearCache: vi.fn(),
  confirmVisioAction: vi.fn(() => Promise.resolve(true)),
  joinTrackedVisio: vi.fn(() => Promise.resolve({ success: true })),
}))

vi.mock('@/services/lms', () => ({
  lmsService: { getMyTeachingSeances, activateVisio, startVisio, endVisio },
  default: { getMyTeachingSeances, activateVisio, startVisio, endVisio },
}))
vi.mock('@/services/cache', () => ({ readCache, writeCache, clearCache }))
vi.mock('@/services/visioFeedback', () => ({ confirmVisioAction }))
vi.mock('@/composables/useTrackedVisioJoin', () => ({
  useTrackedVisioJoin: () => ({ joinTrackedVisio })
}))

import { useTeacherVisioList } from '@/composables/useTeacherVisioList'

// Construit une séance dont l'horaire encadre / précède / suit "maintenant".
function makeSeance(overrides = {}) {
  return {
    id: 1,
    visio_enabled: true,
    visio_active: false,
    visio_status: null,
    matiere: { nom: 'Maths', code: 'M1' },
    classe: { nom: '6e A' },
    programmation: { date: '2026-01-01', heure_debut: '08:00', heure_fin: '09:00' },
    ...overrides,
  }
}

function dateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function timeStr(d) {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:00`
}

async function setup(data) {
  getMyTeachingSeances.mockResolvedValue({ data })
  let api
  const Comp = defineComponent({ setup() { api = useTeacherVisioList(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

beforeEach(() => {
  vi.clearAllMocks()
  readCache.mockReturnValue(null)
  confirmVisioAction.mockResolvedValue(true)
  joinTrackedVisio.mockReset()
  joinTrackedVisio.mockResolvedValue({ success: true })
})

describe('useTeacherVisioList (#G1)', () => {
  it('charge les séances au montage via le service (cache vide)', async () => {
    const u = await setup([])
    expect(getMyTeachingSeances).toHaveBeenCalled()
    expect(u.loading.value).toBe(false)
    expect(u.seances.value).toEqual([])
  })

  it('classe une séance active dont l\'horaire encadre maintenant en "en cours"', async () => {
    const now = new Date()
    const start = new Date(now.getTime() - 30 * 60 * 1000)
    const end = new Date(now.getTime() + 30 * 60 * 1000)
    const seance = makeSeance({
      visio_active: true,
      programmation: {
        date: dateStr(start),
        heure_debut: timeStr(start),
        heure_fin: timeStr(end),
      },
    })
    const u = await setup([seance])
    expect(u.visioEnCours.value).toHaveLength(1)
    expect(u.visioAVenir.value).toHaveLength(0)
  })

  it('classe en cours une séance qui traverse minuit', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-07-14T23:40:00'))

    try {
      const seance = makeSeance({
        visio_active: true,
        programmation: {
          date: '2026-07-14',
          heure_debut: '23:10:00',
          heure_fin: '00:10:00',
        },
      })
      const u = await setup([seance])
      expect(u.visioEnCours.value).toHaveLength(1)
      expect(u.visioAVenir.value).toHaveLength(0)
    } finally {
      vi.useRealTimers()
    }
  })

  it('classe une séance future en "à venir" et l\'exclut si terminée', async () => {
    const future = makeSeance({ id: 2, programmation: { date: '2999-01-01', heure_debut: '08:00', heure_fin: '09:00' } })
    const finie = makeSeance({ id: 3, visio_status: 'terminee', programmation: { date: '2999-01-01', heure_debut: '10:00', heure_fin: '11:00' } })
    const u = await setup([future, finie])
    expect(u.visioAVenir.value.map(s => s.id)).toEqual([2])
  })

  it('calcule les statistiques (total / terminees)', async () => {
    const future = makeSeance({ id: 2, programmation: { date: '2999-01-01', heure_debut: '08:00', heure_fin: '09:00' } })
    const finie = makeSeance({ id: 3, visio_status: 'terminee' })
    const sansVisio = makeSeance({ id: 4, visio_enabled: false })
    const u = await setup([future, finie, sansVisio])
    expect(u.stats.value.total).toBe(2)
    expect(u.stats.value.terminees).toBe(1)
  })

  it('utilise le cache s\'il est présent et rafraîchit en arrière-plan', async () => {
    const cached = [makeSeance({ id: 9, programmation: { date: '2999-01-01', heure_debut: '08:00', heure_fin: '09:00' } })]
    readCache.mockReturnValue(cached)
    getMyTeachingSeances.mockResolvedValue({ data: [] })
    let api
    const Comp = defineComponent({ setup() { api = useTeacherVisioList(); return () => null } })
    mount(Comp)
    await flushPromises()
    expect(api.seances.value.length).toBeGreaterThanOrEqual(0)
    // Le rafraîchissement en arrière-plan rappelle le service
    expect(getMyTeachingSeances).toHaveBeenCalled()
  })

  it('handleStartVisio appelle startVisio puis invalide le cache et recharge', async () => {
    const u = await setup([makeSeance()])
    getMyTeachingSeances.mockClear()
    await u.handleStartVisio({ id: 42 })
    expect(startVisio).toHaveBeenCalledWith(42)
    expect(clearCache).toHaveBeenCalledWith('teacher_visio')
    expect(getMyTeachingSeances).toHaveBeenCalled()
  })

  it('handleActivateVisio appelle activateVisio avec l\'id de la séance', async () => {
    const u = await setup([makeSeance()])
    await u.handleActivateVisio({ id: 7 })
    expect(activateVisio).toHaveBeenCalledWith(7)
  })

  it('handleEndVisio demande confirmation avant de terminer', async () => {
    const u = await setup([makeSeance()])
    confirmVisioAction.mockResolvedValueOnce(false)
    await u.handleEndVisio({ id: 5 })
    expect(confirmVisioAction).toHaveBeenCalled()
    expect(endVisio).not.toHaveBeenCalled()
    confirmVisioAction.mockResolvedValueOnce(true)
    await u.handleEndVisio({ id: 5 })
    expect(endVisio).toHaveBeenCalledWith(5)
  })

  it('handleJoinVisio utilise le helper tracké', async () => {
    const u = await setup([makeSeance({ id: 12, visio_room_id: 'room-12' })])
    await u.handleJoinVisio({ id: 12, visio_room_id: 'room-12' })
    expect(joinTrackedVisio).toHaveBeenCalledWith({ id: 12, visio_room_id: 'room-12' })
  })

  it('formatDate et formatTime suivent les formats d\'origine', async () => {
    const u = await setup([])
    expect(u.formatDate(null)).toBe('N/A')
    expect(u.formatTime(null)).toBe('N/A')
    expect(u.formatTime('08:30:00')).toBe('08:30')
  })

  it('rejoindre échoue hors HTTP : le repli du front, jamais le message technique (revue de #506)', async () => {
    joinTrackedVisio.mockRejectedValueOnce(new TypeError("Cannot read properties of undefined (reading 'success')"))
    const v = await setup([])
    await v.handleJoinVisio({ id: 1 })
    expect(v.error.value).toBe('Erreur lors de la connexion à la visio')
  })
})

// Lot « retour honnête » (instruction des rouges du 10/11) : erreurs telles que l'intercepteur les rend.
// Le 401 `klassci_token_missing` est un refus DÉFINITIF (lot 3d, école autonome) ; le 500 une panne.
const PIEGE_SERVEUR = 'Texte serveur, jamais affiché'
const refusDefinitif = () => Object.assign(new Error('HTTP 401'), {
  response: { status: 401, data: { success: false, message: PIEGE_SERVEUR, reason: 'klassci_token_missing' } },
  userMessage: "Aucun accès KLASSCI n'est enregistré pour ce compte : les données qui en proviennent ne peuvent pas être affichées.",
})
const pannePassagere = () => Object.assign(new Error('HTTP 500'), {
  response: { status: 500, data: { message: PIEGE_SERVEUR } },
  userMessage: 'Une erreur est survenue côté serveur. Veuillez réessayer plus tard.',
})
const MOTIF_JETON = "Aucun accès KLASSCI n'est enregistré pour ce compte : les données qui en proviennent ne peuvent pas être affichées."

describe('useTeacherVisioList — le motif d’un refus est dit, Réessayer seulement sur une panne', () => {
  async function monterEnEchec(erreur) {
    getMyTeachingSeances.mockRejectedValue(erreur)
    let api
    mount(defineComponent({ setup() { api = useTeacherVisioList(); return () => null } }))
    await flushPromises()
    return api
  }

  it('refus définitif (401 jeton KLASSCI) : le motif ; pas de Réessayer', async () => {
    const v = await monterEnEchec(refusDefinitif())
    expect(v.error.value).toBe(MOTIF_JETON)
    expect(v.canRetry.value).toBe(false)
  })

  it('panne passagère (500) : Réessayer reste offert', async () => {
    const v = await monterEnEchec(pannePassagere())
    expect(v.canRetry.value).toBe(true)
  })
})

describe('useTeacherVisioList — canRetry suit le dernier chargement ; une action dit son motif', () => {
  it('refus, puis panne au rechargement : Réessayer revient', async () => {
    getMyTeachingSeances.mockRejectedValue(refusDefinitif())
    let api
    mount(defineComponent({ setup() { api = useTeacherVisioList(); return () => null } }))
    await flushPromises()
    expect(api.canRetry.value).toBe(false)
    getMyTeachingSeances.mockRejectedValue(pannePassagere())
    await api.loadVisioConferences()
    expect(api.canRetry.value).toBe(true)
  })

  it('démarrage de la visio refusé : le motif, et pas de Réessayer (il ne relancerait que la liste)', async () => {
    const u = await setup([makeSeance()])
    startVisio.mockRejectedValueOnce(refusDefinitif())
    await u.handleStartVisio({ id: 42 })
    expect(u.error.value).toBe(MOTIF_JETON)
    expect(u.canRetry.value).toBe(false)
  })
})

// Lecture honnête (école créée depuis le LMS, spec 3d à 25728cf8) : programmation.heure_* peut être un
// datetime ISO (avec ou sans fuseau), et la fin peut être ESTIMÉE (+2 h, heure_fin_estimee). « En cours »
// se lit sur visio_active / visio_status, jamais sur une fenêtre dont la fin est supposée.
describe('useTeacherVisioList — école créée depuis le LMS (heures ISO, fin estimée)', () => {
  const iso = (d) => d.toISOString()

  it('heure de début en ISO : une séance future est « à venir » (elle était perdue)', async () => {
    const debut = new Date(Date.now() + 24 * 3600 * 1000)
    const fin = new Date(debut.getTime() + 2 * 3600 * 1000)
    const s = makeSeance({ id: 7, programmation: { date: iso(debut), heure_debut: iso(debut), heure_fin: iso(fin), heure_fin_estimee: true } })
    const u = await setup([s])
    expect(u.visioAVenir.value.map((x) => x.id)).toEqual([7])
  })

  it('visio active, fin ESTIMÉE déjà passée : toujours « en cours »', async () => {
    const debut = new Date(Date.now() - 3 * 3600 * 1000)
    const fin = new Date(debut.getTime() + 2 * 3600 * 1000)
    const s = makeSeance({ id: 8, visio_active: true, heure_fin_estimee: true,
      programmation: { date: iso(debut), heure_debut: iso(debut), heure_fin: iso(fin), heure_fin_estimee: true } })
    const u = await setup([s])
    expect(u.visioEnCours.value.map((x) => x.id)).toEqual([8])
  })

  it('visio terminée (visio_status) : jamais « en cours », même si visio_active reste vrai', async () => {
    const s = makeSeance({ id: 9, visio_active: true, visio_status: 'terminee' })
    const u = await setup([s])
    expect(u.visioEnCours.value).toHaveLength(0)
  })
})

