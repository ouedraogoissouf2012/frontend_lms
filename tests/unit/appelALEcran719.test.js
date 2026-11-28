/**
 * #719 (écran de lms_backend#1649, PR #1754 et #1761) — l'enseignant ou la gestion fait l'appel d'une séance commencée,
 * par le VRAI client HTTP (`api.js`, ses intercepteurs) : seul l'adaptateur réseau est remplacé.
 *
 * Contrat serveur : `GET /lms/seances/{id}/appel` rend `data.eleves: [{ user_id, nom, mark, origin, delegated_at,
 * presence_visio }]` ; `PUT …/appel` prend `{ marques: [{ user_id, mark }] }` et rend l'appel relu. Refus nommés :
 * 409 `seance_not_started`, 409 `attendance_managed_by_klassci`, 422 `student_not_in_seance`. Le geste se montre par
 * la CAPACITÉ de la carte (`can_take_attendance`), jamais par le mode de l'école.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import api from '@/services/api'
import { useSeanceAppel } from '@/composables/useSeanceAppel'
import { libellePresenceVisio } from '@/constants/presences'
import SeanceAppelAction from '@/components/seances/SeanceAppelAction.vue'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const PIEGE = 'Texte serveur, jamais affiché'
const APPEL = {
  success: true,
  data: {
    seance_id: 7,
    eleves: [
      { user_id: 11, nom: 'Awa', mark: 'present', origin: 'delegated', delegated_at: '2026-12-02T08:10:00+00:00', presence_visio: 'connected' },
      { user_id: 12, nom: 'Brice', mark: null, origin: null, delegated_at: null, presence_visio: null },
    ],
  },
}
let adaptateurOrigine
let envois

function servir(repondre) {
  api.defaults.adapter = async (config) => {
    envois.push({ methode: config.method, url: config.url, corps: config.data ? JSON.parse(config.data) : null })
    const [status, data] = repondre(config)
    const response = { status, statusText: '', data: JSON.stringify(data), headers: { 'content-type': 'application/json' }, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  envois = []
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('useSeanceAppel (vrai client HTTP)', () => {
  it('charge la classe, chaque élève avec sa marque et sa présence visio', async () => {
    servir(() => [200, APPEL])
    const a = useSeanceAppel(ref({ id: 7 }))
    await a.charger()
    expect(envois[0]).toMatchObject({ methode: 'get' })
    expect(envois[0].url).toMatch(/\/lms\/seances\/7\/appel$/)
    expect(a.eleves.value.map((e) => [e.user_id, e.presence_visio])).toEqual([[11, 'connected'], [12, null]])
    expect(a.marques.value).toEqual({ 11: 'present', 12: null })
  })

  it('enregistre les seules marques posées, puis relit l’appel', async () => {
    servir((config) => [200, config.method === 'put' ? { ...APPEL, message: PIEGE } : APPEL])
    const a = useSeanceAppel(ref({ id: 7 }))
    await a.charger()
    a.marques.value[12] = 'absent'
    expect(await a.enregistrer()).toBe(true)
    const put = envois.find((e) => e.methode === 'put')
    expect(put.corps).toEqual({ marques: [{ user_id: 11, mark: 'present' }, { user_id: 12, mark: 'absent' }] })
  })

  it.each([
    [409, 'seance_not_started', 'seanceAppelNonOuvert'],
    [409, 'attendance_managed_by_klassci', 'appelGereParKlassci'],
    [422, 'student_not_in_seance', 'eleveHorsDeLaSeance'],
  ])('%i %s : le message du catalogue, jamais le texte du serveur', async (status, reason, cle) => {
    servir((config) => (config.method === 'put' ? [status, { success: false, message: PIEGE, reason }] : [200, APPEL]))
    const a = useSeanceAppel(ref({ id: 7 }))
    await a.charger()
    expect(await a.enregistrer()).toBe(false)
    expect(a.erreur.value).toBe(ERROR_MESSAGES[cle])
  })
})

describe('présence visio et geste', () => {
  it('chaque présence visio a son libellé ; sans visio, on le dit', () => {
    expect(['connected', 'disconnected', 'kicked', null].map(libellePresenceVisio)).toEqual([
      'Connecté', 'Venu, puis déconnecté', 'Exclu de la visio', 'Pas de visio',
    ])
  })

  it('le geste « Faire l’appel » suit la seule capacité de la carte', () => {
    const stubs = { Modal: true }
    expect(mount(SeanceAppelAction, { props: { seance: { id: 7, can_take_attendance: false } }, global: { stubs } }).text()).toBe('')
    expect(mount(SeanceAppelAction, { props: { seance: { id: 7, can_take_attendance: true } }, global: { stubs } }).text()).toContain('Faire l’appel')
  })

  for (const carte of ['src/components/seances/SeanceCard.vue', 'src/components/seances/CoordinatorSeanceCard.vue', 'src/components/admin/SeancesList.vue']) {
    it(`monté sur la carte ${carte}`, () => {
      expect(readFileSync(resolve(process.cwd(), carte), 'utf-8')).toMatch(/<SeanceAppelAction[\s\S]*?:seance="seance"/)
    })
  }
})
