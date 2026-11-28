/**
 * #335 (écran de lms_backend#1680, PR #1764) — l'émargement par code d'une séance EN LIGNE, par le VRAI client HTTP
 * (`api.js`, ses intercepteurs) : seul l'adaptateur réseau est remplacé.
 *
 * Contrat serveur :
 * - `POST /lms/codes-emargement { seance_id, duree_minutes, retard_apres_minutes? }` → 201 `{ id, code, expire_le }`,
 *   le code en clair UNE seule fois ;
 * - `GET /lms/codes-emargement?seance_id=` → les codes et leurs statistiques, jamais le clair ;
 * - `DELETE /lms/codes-emargement/{id}` → révocation ;
 * - `POST /lms/emargement { code }` (élève) → `{ seance_id, mark, deja_signe }` ; refus nommés 404
 *   `attendance_code_unknown`, 410 `attendance_code_expired`, 409 `already_marked_by_teacher`, 422
 *   `student_not_in_seance`, 429 `attendance_code_attempts_exceeded` avec `Retry-After`.
 *
 * Périmètre (décision du user du 25/11, 100 % en ligne) : ni file hors ligne ni feuille papier.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { ref } from 'vue'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import api from '@/services/api'
import { useCodesEmargement } from '@/composables/useCodesEmargement'
import { useEmargementEleve } from '@/composables/useEmargementEleve'
import { lienDEmargement, qrDuLien } from '@/utils/qrEmargement'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { studentRoutes } from '@/router/routes/student.routes'
import { NAV_SECTIONS } from '@/constants/navigation'

const PIEGE = 'Texte serveur, jamais affiché'
const CODES = {
  success: true,
  data: [
    { id: 5, expire_le: '2026-12-02T10:05:00+00:00', revoque_le: null, valable: true, signatures: 3, attendus: 25, taux: 12 },
    { id: 4, expire_le: '2026-12-02T09:05:00+00:00', revoque_le: '2026-12-02T08:30:00+00:00', valable: false, signatures: 0, attendus: 25, taux: 0 },
  ],
}
let adaptateurOrigine
let envois

function servir(repondre) {
  api.defaults.adapter = async (config) => {
    envois.push({ methode: config.method, url: config.url, params: config.params, corps: config.data ? JSON.parse(config.data) : null })
    const [status, data, headers = {}] = repondre(config)
    const response = { status, statusText: '', data: JSON.stringify(data), headers: { 'content-type': 'application/json', ...headers }, config }
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

describe('useCodesEmargement : l’enseignant ou la gestion (vrai client HTTP)', () => {
  it('liste les codes de la séance et leurs statistiques, jamais un clair', async () => {
    servir(() => [200, CODES])
    const c = useCodesEmargement(ref({ id: 7 }))
    await c.charger()
    expect(envois[0].methode).toBe('get')
    expect(envois[0].url).toMatch(/\/lms\/codes-emargement$/)
    expect(envois[0].params).toEqual({ seance_id: 7 })
    expect(c.codes.value.map((x) => [x.id, x.valable, x.signatures, x.taux])).toEqual([[5, true, 3, 12], [4, false, 0, 0]])
    expect(c.codeAffiche.value).toBeNull()
  })

  it('génère un code, le montre une fois avec son lien, puis relit la liste', async () => {
    servir((config) => (config.method === 'post'
      ? [201, { success: true, message: PIEGE, data: { id: 6, code: 'K7M2PQ', expire_le: '2026-12-02T10:05:00+00:00' } }]
      : [200, CODES]))
    const c = useCodesEmargement(ref({ id: 7 }))
    c.duree.value = 120
    c.retard.value = 10
    expect(await c.generer()).toBe(true)
    const post = envois.find((e) => e.methode === 'post')
    expect(post.corps).toEqual({ seance_id: 7, duree_minutes: 120, retard_apres_minutes: 10 })
    expect(c.codeAffiche.value).toMatchObject({ code: 'K7M2PQ', lien: lienDEmargement('K7M2PQ') })
    expect(envois.at(-1).methode).toBe('get')
  })

  it('sans seuil de retard, n’en envoie aucun', async () => {
    servir((config) => (config.method === 'post' ? [201, { success: true, data: { id: 6, code: 'K7M2PQ', expire_le: 'x' } }] : [200, CODES]))
    const c = useCodesEmargement(ref({ id: 7 }))
    c.retard.value = null
    await c.generer()
    expect(envois.find((e) => e.methode === 'post').corps).toEqual({ seance_id: 7, duree_minutes: 60, retard_apres_minutes: null })
  })

  it('révoque un code, cache son clair s’il était affiché, puis relit la liste', async () => {
    servir((config) => (config.method === 'post'
      ? [201, { success: true, data: { id: 5, code: 'K7M2PQ', expire_le: 'x' } }]
      : [200, config.method === 'delete' ? { success: true, message: 'Code révoqué' } : CODES]))
    const c = useCodesEmargement(ref({ id: 7 }))
    await c.generer()
    expect(await c.revoquer(5)).toBe(true)
    expect(envois.find((e) => e.methode === 'delete').url).toMatch(/\/lms\/codes-emargement\/5$/)
    expect(c.codeAffiche.value).toBeNull()
  })

  it('un refus est dit par le catalogue, jamais par le texte du serveur', async () => {
    servir(() => [409, { success: false, message: PIEGE, reason: 'attendance_managed_by_klassci' }])
    const c = useCodesEmargement(ref({ id: 7 }))
    expect(await c.generer()).toBe(false)
    expect(c.erreur.value).toBe(ERROR_MESSAGES.appelGereParKlassci)
  })
})

describe('le QR du code', () => {
  it('mène à la page de l’élève, code pré-rempli, et se dessine en image', () => {
    expect(lienDEmargement('K7M2PQ')).toBe(`${window.location.origin}/student/emargement?code=K7M2PQ`)
    expect(qrDuLien(lienDEmargement('K7M2PQ'))).toMatch(/^data:image\/gif;base64,[A-Za-z0-9+/=]{100,}$/)
  })

  it('la section du code vit dans la fenêtre d’appel, sous la même capacité', () => {
    const fenetre = readFileSync(resolve(process.cwd(), 'src/components/seances/SeanceAppelAction.vue'), 'utf-8')
    expect(fenetre).toMatch(/<SeanceCodeEmargement[\s\S]*?:seance="seance"/)
  })
})

describe('useEmargementEleve : l’élève signe (vrai client HTTP)', () => {
  it.each([
    [{ mark: 'present', deja_signe: false }, 'Votre présence est enregistrée.'],
    [{ mark: 'late', deja_signe: false }, 'Votre présence est enregistrée, en retard.'],
    [{ mark: 'present', deja_signe: true }, 'Vous aviez déjà signé cette séance.'],
  ])('%o : « %s »', async (data, attendu) => {
    servir(() => [200, { success: true, message: PIEGE, data: { seance_id: 7, ...data } }])
    const e = useEmargementEleve(' k7m 2pq ')
    expect(await e.signer()).toBe(true)
    expect(envois[0]).toMatchObject({ methode: 'post', corps: { code: 'K7M2PQ' } })
    expect(envois[0].url).toMatch(/\/lms\/emargement$/)
    expect(e.resultat.value).toBe(attendu)
  })

  it('une saisie vide ne part pas', async () => {
    servir(() => [200, {}])
    const e = useEmargementEleve('  ')
    expect(await e.signer()).toBe(false)
    expect(envois).toEqual([])
    expect(e.erreur.value).toBe(ERROR_MESSAGES.codeVide)
  })

  it.each([
    [404, 'attendance_code_unknown', 'codeEmargementInconnu'],
    [410, 'attendance_code_expired', 'codeEmargementPerime'],
    [409, 'already_marked_by_teacher', 'presenceDejaMarquee'],
    [422, 'student_not_in_seance', 'eleveHorsDeLaSeance'],
  ])('%i %s : le message du catalogue', async (status, reason, cle) => {
    servir(() => [status, { success: false, message: PIEGE, reason }])
    const e = useEmargementEleve('K7M2PQ')
    expect(await e.signer()).toBe(false)
    expect(e.erreur.value).toBe(ERROR_MESSAGES[cle])
  })

  it('429 : trop d’essais, avec le délai de Retry-After', async () => {
    servir(() => [429, { success: false, message: PIEGE, reason: 'attendance_code_attempts_exceeded' }, { 'retry-after': '120' }])
    const e = useEmargementEleve('ZZZZZZ')
    await e.signer()
    expect(e.erreur.value).toBe('Trop de codes erronés. Réessayez dans 2 minutes.')
  })

  it('la page de l’élève est une route gardée par la liste locale, et un lien de navigation', () => {
    const route = studentRoutes.find((r) => r.path === '/student/emargement')
    expect(route?.meta).toMatchObject({ requiresAuth: true, roles: ['etudiant'], capacite: 'peutInscrireLocalement' })
    expect(NAV_SECTIONS.find((n) => n.to === '/student/emargement')).toMatchObject({ capacite: 'peutInscrireLocalement' })
  })
})
