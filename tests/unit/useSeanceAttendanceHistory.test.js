/**
 * Test du composable useSeanceAttendanceHistory (H7) : chargement des séances,
 * filtres de période/recherche, pagination bornée, ouverture/fermeture de la
 * modale de présences et garde de suppression. Services LMS/export + vue-router
 * mockés. Le bug latent $toast (deleteSeance) est documenté, pas exercé ici.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('vue-router', () => ({ useRoute: () => ({ params: {} }) }))

const getSeancesHistory = vi.fn()
const getSeanceAttendances = vi.fn()
const deleteSeanceSvc = vi.fn()
// confirm() natif -> useConfirm().confirm() async (F3). Défini AVANT l'import du
// composable (ligne ~30) pour être initialisé quand la factory du mock s'exécute.
const confirmMock = vi.fn(() => Promise.resolve(true))
vi.mock('@/composables/useConfirm', () => ({
  useConfirm: () => ({ confirm: confirmMock, accept: vi.fn(), cancel: vi.fn(), state: {} }),
}))
vi.mock('@/services/lms', () => ({
  default: {
    getSeancesHistory: (...a) => getSeancesHistory(...a),
    getSeanceAttendances: (...a) => getSeanceAttendances(...a),
    deleteSeance: (...a) => deleteSeanceSvc(...a)
  }
}))
vi.mock('@/services/attendanceExport', () => ({
  default: { exportPdf: vi.fn(), exportExcel: vi.fn() }
}))

const toast = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }))
vi.mock('@/composables/useToast', () => ({ toast }))

import { useSeanceAttendanceHistory } from '@/composables/useSeanceAttendanceHistory'
import attendanceExport from '@/services/attendanceExport'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const SEANCES = {
  success: true,
  data: [
    { id: 1, klassci_seance_id: 'S1', matiere: { nom: 'Maths' }, taux_presence: 90 },
    { id: 2, klassci_seance_id: 'S2', matiere: { nom: 'SVT' }, taux_presence: 40 }
  ],
  pagination: { current_page: 1, per_page: 50, total: 2, last_page: 3 }
}

async function setup() {
  let api
  const Comp = defineComponent({ setup() { api = useSeanceAttendanceHistory(); return () => null } })
  mount(Comp)
  await flushPromises()
  return api
}

describe('useSeanceAttendanceHistory (H7)', () => {
  beforeEach(() => {
    getSeancesHistory.mockReset().mockResolvedValue(SEANCES)
    getSeanceAttendances.mockReset().mockResolvedValue({ success: true, attendances: [], statistics: {}, seance: {} })
    deleteSeanceSvc.mockReset().mockResolvedValue({})
    confirmMock.mockResolvedValue(true)
  })

  it('charge les séances au montage', async () => {
    const u = await setup()
    expect(getSeancesHistory).toHaveBeenCalled()
    expect(u.seances.value).toHaveLength(2)
    expect(u.loading.value).toBe(false)
  })

  it('selectPeriod recharge sauf en mode custom', async () => {
    const u = await setup()
    getSeancesHistory.mockClear()
    u.selectPeriod('month')
    expect(u.selectedPeriod.value).toBe('month')
    expect(getSeancesHistory).toHaveBeenCalledTimes(1)

    getSeancesHistory.mockClear()
    u.selectPeriod('custom')
    expect(u.selectedPeriod.value).toBe('custom')
    expect(getSeancesHistory).not.toHaveBeenCalled()
  })

  it('changePage ignore les pages hors bornes', async () => {
    const u = await setup()
    getSeancesHistory.mockClear()
    u.changePage(0)
    u.changePage(99)
    expect(getSeancesHistory).not.toHaveBeenCalled()
    u.changePage(2)
    expect(getSeancesHistory).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }))
  })

  it('viewAttendances charge les présences et sélectionne la séance', async () => {
    const u = await setup()
    await u.viewAttendances(SEANCES.data[0])
    expect(getSeanceAttendances).toHaveBeenCalledWith(1)
    expect(u.selectedSeance.value.id).toBe(1)
    expect(u.attendances.value).toBeTruthy()
    expect(u.loadingAttendances.value).toBe(false)
  })

  it('closeModal réinitialise la sélection', async () => {
    const u = await setup()
    await u.viewAttendances(SEANCES.data[0])
    u.closeModal()
    expect(u.selectedSeance.value).toBe(null)
    expect(u.attendances.value).toBe(null)
    expect(u.attendancesError.value).toBe(null)
  })

  it('clearSearch vide la recherche et recharge', async () => {
    const u = await setup()
    u.searchQuery.value = 'maths'
    getSeancesHistory.mockClear()
    u.clearSearch()
    expect(u.searchQuery.value).toBe('')
    expect(getSeancesHistory).toHaveBeenCalled()
  })

  it('deleteSeance respecte le garde de confirmation (annulation → aucun appel)', async () => {
    const u = await setup()
    confirmMock.mockResolvedValue(false) // l'utilisateur annule
    await u.deleteSeance(SEANCES.data[0])
    expect(deleteSeanceSvc).not.toHaveBeenCalled()
  })

  it('formateurs locaux : durée et repli date (parité)', async () => {
    const u = await setup()
    expect(u.formatDuration(90)).toBe('1h 30min')
    expect(u.formatDuration(45)).toBe('45 min')
    expect(u.formatDuration(0)).toBe('-')
    expect(u.formatDate(null)).toBe('-')
  })
})

// Lot « Réessayer », PR B1 : un drapeau par chargement (la liste, puis les présences de la modale),
// jugé sur la MÊME instance : refus → pas de Réessayer ; panne au rechargement → Réessayer.
describe('useSeanceAttendanceHistory — Réessayer seulement sur une panne passagère', () => {
  const refus = () => Object.assign(new Error('HTTP 401'), { response: { status: 401, data: { reason: 'klassci_token_missing' } } })
  const panne = () => Object.assign(new Error('HTTP 503'), { response: { status: 503, headers: { 'retry-after': '30' } } })

  it('liste : refus puis panne au rechargement, puis succès', async () => {
    getSeancesHistory.mockRejectedValue(refus())
    const u = await setup()
    expect(u.canRetry.value).toBe(false)
    getSeancesHistory.mockRejectedValue(panne())
    await u.loadSeances()
    expect(u.canRetry.value).toBe(true)
    getSeancesHistory.mockResolvedValue(SEANCES)
    await u.loadSeances()
    expect(u.canRetry.value).toBe(true)
  })

  it('présences, par la liste (viewAttendances) et par lien direct (openSeanceById)', async () => {
    getSeancesHistory.mockResolvedValue(SEANCES)
    const u = await setup()
    getSeanceAttendances.mockRejectedValue(refus())
    await u.viewAttendances(SEANCES.data[0])
    expect(u.attendancesError.value).toBeTruthy()
    expect(u.attendancesCanRetry.value).toBe(false)
    getSeanceAttendances.mockRejectedValue(panne())
    await u.openSeanceById(1)
    expect(u.attendancesError.value).toBeTruthy()
    expect(u.attendancesCanRetry.value).toBe(true)
    getSeanceAttendances.mockRejectedValue(refus())
    await u.openSeanceById(1)
    expect(u.attendancesCanRetry.value).toBe(false)
  })
})

// Revue de #519 : openSeanceById(1) trouvait la séance dans la liste et passait par viewAttendances ;
// la branche refactorée (séance hors de la liste, lien direct) n'était jamais exercée.
describe('useSeanceAttendanceHistory — lien direct vers une séance hors de la liste', () => {
  const refus = () => Object.assign(new Error('HTTP 403'), { response: { status: 403, data: {} }, userMessage: 'Accès refusé.' })
  const panne = () => Object.assign(new Error('HTTP 503'), { response: { status: 503 }, userMessage: 'Service indisponible.' })

  it('succès : les présences, et la séance complétée depuis la réponse', async () => {
    getSeancesHistory.mockResolvedValue(SEANCES)
    const u = await setup()
    getSeanceAttendances.mockResolvedValue({
      success: true, attendances: [],
      seance: { matiere_nom: 'Physique', date: '2026-11-01', enseignant_nom: 'M. B', klassci_seance_id: 'S99' },
    })
    await u.openSeanceById(99)
    expect(u.attendances.value).toBeTruthy()
    expect(u.selectedSeance.value).toMatchObject({ id: 99, matiere_nom: 'Physique', date: '2026-11-01', enseignant_nom: 'M. B', klassci_seance_id: 'S99' })
    expect(u.loadingAttendances.value).toBe(false)
  })

  it('refus : le message, sans Réessayer ; panne au nouvel essai : Réessayer', async () => {
    getSeancesHistory.mockResolvedValue(SEANCES)
    const u = await setup()
    getSeanceAttendances.mockRejectedValue(refus())
    await u.openSeanceById(99)
    expect(u.attendancesError.value).toBe('Accès refusé.')
    expect(u.attendancesCanRetry.value).toBe(false)
    expect(u.selectedSeance.value).toMatchObject({ id: 99, matiere_nom: '' })
    getSeanceAttendances.mockRejectedValue(panne())
    await u.openSeanceById(99)
    expect(u.attendancesError.value).toBe('Service indisponible.')
    expect(u.attendancesCanRetry.value).toBe(true)
  })
})

// Faux vides (suite du lot « Réessayer », revue de #519) : un 2xx « success: false » se lisait comme
// une liste vide, un FAIT inventé. Il devient une erreur dite ; Réessayer selon la règle commune
// (refus avec un reason connu du catalogue ; anomalie sans reason, qu'un nouvel essai peut lever).
describe('useSeanceAttendanceHistory — un « success: false » est une erreur, pas une liste vide', () => {
  it('liste : anomalie sans reason → erreur et Réessayer ; reason connu → erreur sans Réessayer', async () => {
    getSeancesHistory.mockResolvedValue({ success: false })
    const u = await setup()
    expect(u.error.value).toBeTruthy()
    expect(u.canRetry.value).toBe(true)
    getSeancesHistory.mockResolvedValue({ success: false, reason: 'klassci_token_missing' })
    await u.loadSeances()
    expect(u.error.value).toBeTruthy()
    expect(u.canRetry.value).toBe(false)
  })

  it('présences : « success: false » → erreur dite (plus de modale silencieuse)', async () => {
    getSeancesHistory.mockResolvedValue(SEANCES)
    const u = await setup()
    getSeanceAttendances.mockResolvedValue({ success: false, reason: 'klassci_token_missing' })
    await u.viewAttendances(SEANCES.data[0])
    expect(u.attendancesError.value).toBeTruthy()
    expect(u.attendancesCanRetry.value).toBe(false)
  })
})

describe('useSeanceAttendanceHistory — un export en échec ne montre jamais un texte venu d’ailleurs (D0)', () => {
  it('erreur HTTP : la catégorie ; erreur locale : le repli du front', async () => {
    getSeancesHistory.mockReset().mockResolvedValue(SEANCES)
    getSeanceAttendances.mockReset().mockResolvedValue({ success: true, attendances: [], statistics: {}, seance: {} })
    const u = await setup()
    await u.viewAttendances(SEANCES.data[0])
    attendanceExport.exportPdf.mockRejectedValueOnce({ response: { status: 500, data: { message: 'SQLSTATE[42S22]' } } })
    await u.exportPDF()
    expect(toast.error).toHaveBeenLastCalledWith(ERROR_MESSAGES.server)
    attendanceExport.exportExcel.mockRejectedValueOnce(new Error('Cannot read properties of undefined'))
    await u.exportExcel()
    expect(toast.error).toHaveBeenLastCalledWith('Erreur lors de l\'export Excel')
  })
})
