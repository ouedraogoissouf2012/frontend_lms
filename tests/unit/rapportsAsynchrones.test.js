/**
 * Rapports PDF globaux : la demande est ASYNCHRONE depuis D10.
 *
 * `POST /admin/reports/{attendance,grades,activity}` rend par défaut 202 et un
 * identifiant à suivre ; l'écran, lui, enregistrait ce JSON comme un « PDF » et
 * annonçait un succès. Ici : demande → suivi du statut → téléchargement.
 *
 * Les réponses traversent le VRAI client HTTP (api.js et son intercepteur) : seul
 * l'adaptateur réseau d'axios est doublé. Corps recopiés de la spec de lms (#991,
 * docs/openapi.yaml @9d9202cf) : RapportAccepte, RapportSuivi, RapportRefus.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import { effectScope } from 'vue'

const telechargerFichier = vi.fn()
vi.mock('@/utils/downloadBlob', () => ({ downloadBlob: (...a) => telechargerFichier(...a) }))

import api from '@/services/api'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { REPORT_POLL } from '@/constants/reports'
import { useReportGeneration, RAPPORT_ECHOUE, RAPPORT_INTROUVABLE, RAPPORT_ABANDON } from '@/composables/useReportGeneration'

const ID = '9b2c7f3e-1d4a-4c8b-9e2f-0a1b2c3d4e5f'
/** RapportAccepte — 202. */
const ACCEPTE = {
  success: true,
  data: { id: ID, status: 'pending', status_url: `/api/admin/reports/async/${ID}`, download_url: `/api/admin/reports/async/${ID}/download` },
}
/** RapportSuivi — 200. */
const suivi = (status, extra = {}) => ({
  success: true,
  data: { id: ID, type: 'attendance', status, created_at: '2026-10-30T04:00:00Z', updated_at: '2026-10-30T04:00:05Z', meta: { filters: {} }, ...extra },
})
const PDF = new Blob(['%PDF-1.7'], { type: 'application/pdf' })

let requetes
let reponses
/**
 * Chaque appel consomme la prochaine réponse prévue pour son chemin :
 * un corps (200/202), `{ status, data, headers }` d'erreur, ou un Blob.
 */
function servir(plan) {
  reponses = Object.fromEntries(Object.entries(plan).map(([c, liste]) => [c, [...liste]]))
  api.defaults.adapter = async (config) => {
    requetes.push(config)
    const chemin = Object.keys(reponses).find((c) => config.url.endsWith(c))
    if (!chemin || reponses[chemin].length === 0) throw new Error(`requête non prévue : ${config.method} ${config.url}`)
    const r = reponses[chemin].length > 1 ? reponses[chemin].shift() : reponses[chemin][0]
    if (r?.erreur) {
      const response = { status: r.erreur, statusText: '', data: r.data ?? {}, headers: r.headers ?? {}, config }
      throw new AxiosError(`HTTP ${r.erreur}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
    }
    return { status: r === ACCEPTE ? 202 : 200, statusText: 'OK', data: r, headers: {}, config }
  }
}

const SUIVI = `/admin/reports/async/${ID}`
const TELECHARGEMENT = `/admin/reports/async/${ID}/download`
const appels = (suffixe) => requetes.filter((r) => r.url.endsWith(suffixe)).length

let adaptateurOrigine
let portee
function generation() {
  portee = effectScope()
  return portee.run(() => useReportGeneration())
}

beforeEach(() => {
  vi.useFakeTimers()
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  requetes = []
  telechargerFichier.mockReset()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  portee?.stop()
  api.defaults.adapter = adaptateurOrigine
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('demande, suivi, téléchargement', () => {
  it('202 → pending → running → completed : télécharge le PDF sous le nom donné par le serveur', async () => {
    servir({
      '/admin/reports/attendance': [ACCEPTE],
      [SUIVI]: [suivi('pending'), suivi('running'), suivi('completed', { filename: 'presences-2026-10.pdf' })],
      [TELECHARGEMENT]: [PDF],
    })
    const g = generation()
    const fin = g.generer('attendance', { date_start: '2026-10-01', date_end: '2026-10-30' })
    await vi.advanceTimersByTimeAsync(10_000)
    await fin

    const demande = requetes[0]
    expect(demande.method).toBe('post')
    expect(JSON.parse(demande.data)).toEqual({ date_start: '2026-10-01', date_end: '2026-10-30' })
    expect(appels(SUIVI)).toBe(3)
    expect(telechargerFichier).toHaveBeenCalledTimes(1)
    expect(telechargerFichier.mock.calls[0][1]).toBe('presences-2026-10.pdf')
    expect(g.etat.value).toBe('termine')
    expect(g.error.value).toBeNull()
  })

  it('pendant l’attente, l’état dit où en est le serveur', async () => {
    servir({ '/admin/reports/grades': [ACCEPTE], [SUIVI]: [suivi('pending'), suivi('running')] })
    const g = generation()
    void g.generer('grades', {})
    await vi.advanceTimersByTimeAsync(0)
    expect(g.etat.value).toBe('attente')
    await vi.advanceTimersByTimeAsync(REPORT_POLL.FAST_MS)
    expect(g.etat.value).toBe('generation')
    g.annuler()
  })

  it('failed : le message des rapports, aucun téléchargement', async () => {
    servir({
      '/admin/reports/activity': [ACCEPTE],
      [SUIVI]: [suivi('failed', { message: 'report_generation_failed' })],
    })
    const g = generation()
    await g.generer('activity', {})
    expect(g.etat.value).toBe('echec')
    expect(g.error.value).toBe(RAPPORT_ECHOUE)
    expect(telechargerFichier).not.toHaveBeenCalled()
  })

  it('409 au téléchargement : « pas prêt », on attend puis on télécharge', async () => {
    servir({
      '/admin/reports/attendance': [ACCEPTE],
      [SUIVI]: [suivi('completed', { filename: 'r.pdf' })],
      [TELECHARGEMENT]: [{ erreur: 409, data: { success: false, message: 'Rapport non prêt' } }, PDF],
    })
    const g = generation()
    const fin = g.generer('attendance', {})
    await vi.advanceTimersByTimeAsync(10_000)
    await fin
    expect(appels(TELECHARGEMENT)).toBe(2)
    expect(telechargerFichier).toHaveBeenCalledTimes(1)
    expect(g.etat.value).toBe('termine')
  })
})

describe('refus et réponses inattendues', () => {
  it('404 au suivi : « introuvable ou expiré », et le suivi s’arrête', async () => {
    servir({ '/admin/reports/attendance': [ACCEPTE], [SUIVI]: [{ erreur: 404, data: { success: false, message: 'Rapport introuvable' } }] })
    const g = generation()
    await g.generer('attendance', {})
    await vi.advanceTimersByTimeAsync(60_000)
    expect(g.error.value).toBe(RAPPORT_INTROUVABLE)
    expect(appels(SUIVI)).toBe(1)
  })

  it('403 à la demande : la catégorie du catalogue, jamais le texte du serveur', async () => {
    servir({ '/admin/reports/grades': [{ erreur: 403, data: { success: false, message: 'Texte interne du serveur' } }] })
    const g = generation()
    await g.generer('grades', {})
    expect(g.error.value).toBe(ERROR_MESSAGES.forbidden)
    expect(appels(SUIVI)).toBe(0)
  })

  it('une réponse qui n’est pas un RapportAccepte (ex. un PDF synchrone) est refusée, sans suivi', async () => {
    servir({ '/admin/reports/attendance': [PDF] })
    const g = generation()
    await g.generer('attendance', {})
    expect(g.etat.value).toBe('echec')
    expect(g.error.value).toBe(ERROR_MESSAGES.unknown)
    expect(appels(SUIVI)).toBe(0)
  })

  it('un RapportAccepte dont le statut n’est pas « pending » est refusé', async () => {
    const deja = { success: true, data: { ...ACCEPTE.data, status: 'completed' } }
    servir({ '/admin/reports/attendance': [deja] })
    const g = generation()
    await g.generer('attendance', {})
    expect(g.error.value).toBe(ERROR_MESSAGES.unknown)
    expect(appels(SUIVI)).toBe(0)
  })

  it('un status_url qui ne désigne pas ce rapport est refusé (fail-secure)', async () => {
    const autre = { success: true, data: { ...ACCEPTE.data, status_url: '/api/admin/reports/async/autre-id' } }
    servir({ '/admin/reports/attendance': [autre] })
    const g = generation()
    await g.generer('attendance', {})
    expect(g.error.value).toBe(ERROR_MESSAGES.unknown)
    expect(appels(SUIVI)).toBe(0)
  })
})

describe('rythme du suivi', () => {
  it(`d’abord toutes les ${REPORT_POLL.FAST_MS} ms, puis ${REPORT_POLL.SLOW_MS} ms après ${REPORT_POLL.FAST_TRIES} essais`, async () => {
    servir({ '/admin/reports/attendance': [ACCEPTE], [SUIVI]: [suivi('running')] })
    const g = generation()
    void g.generer('attendance', {})
    await vi.advanceTimersByTimeAsync(REPORT_POLL.FAST_MS * REPORT_POLL.FAST_TRIES)
    expect(appels(SUIVI)).toBe(REPORT_POLL.FAST_TRIES + 1)
    await vi.advanceTimersByTimeAsync(REPORT_POLL.SLOW_MS - 1)
    expect(appels(SUIVI)).toBe(REPORT_POLL.FAST_TRIES + 1)
    await vi.advanceTimersByTimeAsync(1)
    expect(appels(SUIVI)).toBe(REPORT_POLL.FAST_TRIES + 2)
    g.annuler()
  })

  it('429 avec Retry-After : ce n’est pas un échec, la prochaine interrogation attend le délai demandé', async () => {
    servir({
      '/admin/reports/attendance': [ACCEPTE],
      [SUIVI]: [{ erreur: 429, headers: { 'retry-after': '7' } }, suivi('running')],
    })
    const g = generation()
    void g.generer('attendance', {})
    await vi.advanceTimersByTimeAsync(0)
    expect(appels(SUIVI)).toBe(1)
    expect(g.error.value).toBeNull()
    await vi.advanceTimersByTimeAsync(6_999)
    expect(appels(SUIVI)).toBe(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(appels(SUIVI)).toBe(2)
    expect(g.etat.value).toBe('generation')
    g.annuler()
  })

  it('429 sans Retry-After : on passe au palier lent', async () => {
    servir({ '/admin/reports/attendance': [ACCEPTE], [SUIVI]: [{ erreur: 429 }, suivi('running')] })
    const g = generation()
    void g.generer('attendance', {})
    await vi.advanceTimersByTimeAsync(REPORT_POLL.SLOW_MS - 1)
    expect(appels(SUIVI)).toBe(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(appels(SUIVI)).toBe(2)
    expect(g.error.value).toBeNull()
    g.annuler()
  })

  it('au-delà du délai d’abandon : on le dit, et plus aucune requête ne part', async () => {
    servir({ '/admin/reports/attendance': [ACCEPTE], [SUIVI]: [suivi('running')] })
    const g = generation()
    const fin = g.generer('attendance', {})
    await vi.advanceTimersByTimeAsync(REPORT_POLL.GIVE_UP_MS + REPORT_POLL.SLOW_MS)
    await fin
    expect(g.etat.value).toBe('abandon')
    expect(g.error.value).toBe(RAPPORT_ABANDON)
    const avant = appels(SUIVI)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(appels(SUIVI)).toBe(avant)
  })

  it('annuler (fermeture de la fenêtre) arrête le suivi, et une réponse tardive n’écrit plus l’état', async () => {
    servir({ '/admin/reports/attendance': [ACCEPTE], [SUIVI]: [suivi('running')] })
    const g = generation()
    void g.generer('attendance', {})
    await vi.advanceTimersByTimeAsync(0)
    g.annuler()
    expect(g.etat.value).toBe('repos')
    const avant = appels(SUIVI)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(appels(SUIVI)).toBe(avant)
    expect(g.etat.value).toBe('repos')
  })

  it('une réponse arrivée APRÈS l’annulation, d’un client qui ignore le signal, n’écrit rien', async () => {
    servir({ '/admin/reports/attendance': [ACCEPTE] })
    let repondreSuivi
    const adaptateurDemande = api.defaults.adapter
    api.defaults.adapter = (config) => {
      if (!config.url.endsWith(SUIVI)) return adaptateurDemande(config)
      requetes.push(config)
      return new Promise((resolve) => {
        repondreSuivi = () => resolve({ status: 200, statusText: 'OK', data: suivi('completed', { filename: 'r.pdf' }), headers: {}, config })
      })
    }
    const g = generation()
    const fin = g.generer('attendance', {})
    await vi.waitFor(() => expect(repondreSuivi).toBeTypeOf('function'))
    g.annuler()
    repondreSuivi()
    await fin
    expect(g.etat.value).toBe('repos')
    expect(appels(TELECHARGEMENT)).toBe(0)
  })
})
