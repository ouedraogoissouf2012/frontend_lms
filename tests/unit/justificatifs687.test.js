/**
 * #687 (écran de lms_backend#1681, PR #1771) — l'élève justifie ses absences, la gestion de l'école tranche, par le
 * VRAI client HTTP (`api.js`, ses intercepteurs) : seul l'adaptateur réseau est remplacé.
 *
 * Contrat serveur :
 * - élève : `GET /lms/mes-absences`, `GET /lms/mes-justificatifs`, `POST /lms/justificatifs` (multipart : motif,
 *   seance_ids[] ou du/au, pièce facultative) ;
 * - gestion : `GET /lms/justificatifs?etat=&page=` (compteurs par état), `POST …/{id}/valider`, `POST …/{id}/rejeter
 *   { motif }` ; `GET …/{id}/piece` (binaire) ;
 * - refus nommés : 422 `seance_not_justifiable` / `no_absence_in_range`, 409 `justification_already_decided`.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import api from '@/services/api'
import { useMesAbsences } from '@/composables/useMesAbsences'
import { useJustificatifsGestion } from '@/composables/useJustificatifsGestion'
import { libelleEtatJustificatif } from '@/constants/justificatifs'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { studentRoutes } from '@/router/routes/student.routes'
import { adminRoutes } from '@/router/routes/admin.routes'
import { NAV_SECTIONS } from '@/constants/navigation'

const PIEGE = 'Texte serveur, jamais affiché'
const JUSTIFICATIF = {
  id: 5, eleve_id: 11, eleve_nom: 'Awa', motif: 'Malade', du: null, au: null,
  seances: [{ id: 7, titre: 'Algèbre', date_seance: '2026-12-01T10:00:00+00:00' }],
  piece: true, etat: 'en_attente', motif_rejet: null, decide_le: null, cree_le: '2026-12-02T09:00:00+00:00',
}
const ABSENCES = {
  success: true,
  data: [
    { seance_id: 8, titre: 'Physique', date_seance: '2026-12-01T14:00:00+00:00', marque: null, justificatif_etat: null },
    { seance_id: 7, titre: 'Algèbre', date_seance: '2026-12-01T10:00:00+00:00', marque: 'absent', justificatif_etat: 'en_attente' },
  ],
}
const GESTION = { success: true, data: { justificatifs: [JUSTIFICATIF], compteurs: { en_attente: 1, validee: 2, rejetee: 0 }, page: 1, derniere_page: 1, total: 1 } }
let adaptateurOrigine
let envois

function corpsDe(data) {
  if (data instanceof FormData) return { formulaire: [...data.entries()].map(([k, v]) => [k, v instanceof File ? `fichier:${v.name}` : v]) }
  return data ? JSON.parse(data) : null
}

function servir(repondre) {
  api.defaults.adapter = async (config) => {
    envois.push({ methode: config.method, url: config.url, params: config.params, corps: corpsDe(config.data), config })
    const [status, data] = repondre(config)
    const corps = data instanceof Blob ? data : JSON.stringify(data)
    const response = { status, statusText: '', data: corps, headers: { 'content-type': data instanceof Blob ? data.type : 'application/json' }, config }
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
  vi.restoreAllMocks()
})

describe('useMesAbsences : l’élève (vrai client HTTP)', () => {
  it('charge ses absences et ses justificatifs', async () => {
    servir((config) => [200, config.url.endsWith('/mes-absences') ? ABSENCES : { success: true, data: [JUSTIFICATIF] }])
    const m = useMesAbsences()
    await m.charger()
    expect(envois.map((e) => e.url.replace(/^.*\/lms/, '/lms'))).toEqual(['/lms/mes-absences', '/lms/mes-justificatifs'])
    expect(m.absences.value.map((a) => [a.seance_id, a.justifiable])).toEqual([[8, true], [7, false]])
    expect(m.justificatifs.value.map((j) => j.id)).toEqual([5])
  })

  it('dépose les séances choisies, le motif et la pièce en multipart, puis relit', async () => {
    servir((config) => [config.method === 'post' ? 201 : 200, config.method === 'post' ? { success: true, message: PIEGE, data: JUSTIFICATIF } : ABSENCES])
    const m = useMesAbsences()
    m.selection.value = [8]
    m.motif.value = '  Malade  '
    m.piece.value = new File(['%PDF'], 'certificat.pdf', { type: 'application/pdf' })
    expect(await m.deposer()).toBe(true)
    const post = envois.find((e) => e.methode === 'post')
    expect(post.url).toMatch(/\/lms\/justificatifs$/)
    expect(post.corps.formulaire).toEqual([['motif', 'Malade'], ['seance_ids[]', '8'], ['piece', 'fichier:certificat.pdf']])
    expect(post.config.headers['Content-Type']).toBeFalsy()
    expect(m.message.value).toBe('Justificatif envoyé : la gestion de l’école va le traiter.')
  })

  it('sans séance choisie ou sans motif, rien ne part', async () => {
    servir(() => [200, ABSENCES])
    const m = useMesAbsences()
    m.motif.value = 'Malade'
    expect(await m.deposer()).toBe(false)
    expect(m.erreur.value).toBe(ERROR_MESSAGES.justificatifSansSeance)
    m.selection.value = [8]
    m.motif.value = '   '
    expect(await m.deposer()).toBe(false)
    expect(m.erreur.value).toBe(ERROR_MESSAGES.justificatifSansMotif)
    expect(envois).toEqual([])
  })

  it('422 seance_not_justifiable : le message du catalogue', async () => {
    servir(() => [422, { success: false, message: PIEGE, reason: 'seance_not_justifiable' }])
    const m = useMesAbsences()
    m.selection.value = [8]
    m.motif.value = 'Malade'
    expect(await m.deposer()).toBe(false)
    expect(m.erreur.value).toBe(ERROR_MESSAGES.seanceNonJustifiable)
  })
})

describe('useJustificatifsGestion : la gestion (vrai client HTTP)', () => {
  it('charge l’onglet et ses compteurs', async () => {
    servir(() => [200, GESTION])
    const g = useJustificatifsGestion()
    await g.charger()
    expect(envois[0].params).toEqual({ etat: 'en_attente', page: 1 })
    expect(g.compteurs.value).toEqual({ en_attente: 1, validee: 2, rejetee: 0 })
    expect(g.justificatifs.value.map((j) => j.id)).toEqual([5])
  })

  it('valide, puis relit l’onglet', async () => {
    servir(() => [200, GESTION])
    const g = useJustificatifsGestion()
    expect(await g.valider(5)).toBe(true)
    expect(envois[0]).toMatchObject({ methode: 'post' })
    expect(envois[0].url).toMatch(/\/lms\/justificatifs\/5\/valider$/)
    expect(envois.at(-1).methode).toBe('get')
  })

  it('rejeter exige un motif, puis l’envoie', async () => {
    servir(() => [200, GESTION])
    const g = useJustificatifsGestion()
    expect(await g.rejeter(5, '  ')).toBe(false)
    expect(g.erreur.value).toBe(ERROR_MESSAGES.motifDeRejetObligatoire)
    expect(envois).toEqual([])
    expect(await g.rejeter(5, ' Pièce illisible ')).toBe(true)
    expect(envois[0]).toMatchObject({ methode: 'post', corps: { motif: 'Pièce illisible' } })
    expect(envois[0].url).toMatch(/\/lms\/justificatifs\/5\/rejeter$/)
  })

  it('409 justification_already_decided : le message du catalogue', async () => {
    servir(() => [409, { success: false, message: PIEGE, reason: 'justification_already_decided' }])
    const g = useJustificatifsGestion()
    expect(await g.valider(5)).toBe(false)
    expect(g.erreur.value).toBe(ERROR_MESSAGES.justificatifDejaTranche)
  })

  it('ouvre la pièce par le client authentifié, en binaire', async () => {
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:piece')
    globalThis.URL.revokeObjectURL = vi.fn()
    servir(() => [200, new Blob(['%PDF'], { type: 'application/pdf' })])
    const g = useJustificatifsGestion()
    expect(await g.ouvrirPiece(5)).toBe(true)
    expect(envois[0].url).toMatch(/\/lms\/justificatifs\/5\/piece$/)
    expect(envois[0].config.responseType).toBe('blob')
    expect(URL.createObjectURL).toHaveBeenCalledOnce()
  })
})

describe('états, routes et navigation', () => {
  it('chaque état a son libellé', () => {
    expect(['en_attente', 'validee', 'rejetee'].map(libelleEtatJustificatif)).toEqual(['En attente', 'Validé', 'Refusé'])
  })

  it('les deux pages sont gardées par la liste locale, et dans la navigation', () => {
    expect(studentRoutes.find((r) => r.path === '/student/absences')?.meta).toMatchObject({ roles: ['etudiant'], capacite: 'peutInscrireLocalement' })
    expect(adminRoutes.find((r) => r.path === '/admin/justificatifs')?.meta).toMatchObject({
      roles: ['superAdmin', 'admin', 'coordinateur'], capacite: 'peutInscrireLocalement',
    })
    for (const to of ['/student/absences', '/admin/justificatifs']) {
      expect(NAV_SECTIONS.find((n) => n.to === to)).toMatchObject({ capacite: 'peutInscrireLocalement' })
    }
  })
})
