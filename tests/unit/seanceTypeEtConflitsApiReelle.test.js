/**
 * #675 (écran de lms_backend#1668) — le type d'une séance et ses conflits d'horaire, par le VRAI client HTTP
 * (`api.js`, ses intercepteurs, les transformations d'axios) : seul l'adaptateur réseau est remplacé.
 *
 * Contrat serveur (`ConflitDHoraireRefus` de docs/openapi.yaml, commentaire final de #675) :
 * 409 `seance_schedule_conflict`, `conflicts: [{ id, titre, date_seance, fin_effective, motifs: ['teacher'|'class'] }]` ;
 * `forcer_conflit` réservé à la gestion, 403 `conflict_override_forbidden` sinon ; à la modification, 422
 * `seance_end_before_start`. `type_seance` : cm, td, tp, projet, travail_personnel, examen, ou null.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { ref } from 'vue'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { useSeanceCreate } from '@/composables/useSeanceCreate'
import { useSeanceEdit } from '@/composables/useSeanceEdit'
import { TYPES_DE_SEANCE, libelleDuType } from '@/constants/typesDeSeance'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

vi.mock('@/services/cache', () => ({ clearCache: vi.fn(), clearCacheByPrefix: vi.fn() }))
vi.mock('@/services/teacherReferentials', () => ({ fetchTeacherMatieres: vi.fn(async () => CATALOGUE) }))

const CATALOGUE = [{ id: 5, nom: 'Maths', source: 'lms_local', classes: [{ id: 11, nom: '6e A' }] }]
const PIEGE = 'Texte serveur, jamais affiché'
const CONFLIT = {
  success: false,
  message: PIEGE,
  reason: 'seance_schedule_conflict',
  conflicts: [{ id: 12, titre: 'Algèbre', date_seance: '2026-12-02T08:00:00+00:00', fin_effective: '2026-12-02T10:00:00+00:00', motifs: ['teacher', 'class'] }],
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

function connecte(role) {
  useAuthStore().user = { id: 1, name: 'Compte', role }
}

function creation() {
  const c = useSeanceCreate({ matieres: ref(CATALOGUE) })
  Object.assign(c.form, { matiereId: 5, classeId: 11, titre: 'Révision', debut: '2026-12-02T09:00' })
  return c
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  envois = []
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('type de séance', () => {
  it('la liste fermée, dans l’ordre du serveur, et un libellé pour chaque valeur', () => {
    expect(TYPES_DE_SEANCE.map((t) => t.valeur)).toEqual(['cm', 'td', 'tp', 'projet', 'travail_personnel', 'examen'])
    expect(libelleDuType('travail_personnel')).toBe('Travail personnel')
    expect(libelleDuType(null)).toBeNull()
    expect(libelleDuType('inconnu')).toBeNull()
  })

  it('création : le type et la fin choisis partent ; absents, ils ne partent pas', async () => {
    connecte('enseignant')
    servir(() => [201, { success: true, message: 'Séance créée', data: { id: 42 } }])
    const c = creation()
    Object.assign(c.form, { type: 'td', fin: '2026-12-02T11:00' })
    await c.creer()
    expect(envois[0].corps).toMatchObject({ type_seance: 'td' })
    expect(envois[0].corps.fin_seance).toMatch(/^2026-12-02T11:00:00[+-]\d{2}:\d{2}$/)

    const sans = creation()
    await sans.creer()
    expect(envois[1].corps).not.toHaveProperty('type_seance')
    expect(envois[1].corps).not.toHaveProperty('fin_seance')
  })

  it('une fin qui ne suit pas le début est refusée avant l’envoi', async () => {
    connecte('enseignant')
    servir(() => [201, { success: true, data: { id: 42 } }])
    const c = creation()
    c.form.fin = '2026-12-02T08:00'
    expect(await c.creer()).toBeNull()
    expect(c.erreurs.value.fin).toBeTruthy()
    expect(envois).toHaveLength(0)
  })
})

describe('conflits d’horaire', () => {
  it('409 : la séance en cause est nommée, avec ses motifs traduits ; le texte du serveur ne paraît pas', async () => {
    connecte('enseignant')
    servir(() => [409, CONFLIT])
    const c = creation()
    expect(await c.creer()).toBeNull()
    expect(c.erreur.value).toBe(ERROR_MESSAGES.seanceConflitHoraire)
    expect(c.conflits.value).toEqual([
      { id: 12, titre: 'Algèbre', debut: '2026-12-02T08:00:00+00:00', fin: '2026-12-02T10:00:00+00:00', motifs: ['Même enseignant', 'Même classe'] },
    ])
    expect(JSON.stringify(c.conflits.value)).not.toContain(PIEGE)
  })

  it('la gestion peut créer quand même : la même charge repart avec forcer_conflit', async () => {
    connecte('coordinateur')
    let n = 0
    servir(() => (++n === 1 ? [409, CONFLIT] : [201, { success: true, data: { id: 43 } }]))
    const c = creation()
    await c.creer()
    expect(c.peutForcer.value).toBe(true)
    expect(await c.creerQuandMeme()).toEqual({ id: 43 })
    expect(envois[1].corps).toEqual({ ...envois[0].corps, forcer_conflit: true })
    expect(c.conflits.value).toEqual([])
  })

  it('un enseignant ne se voit pas offrir le forçage', async () => {
    connecte('enseignant')
    servir(() => [409, CONFLIT])
    const c = creation()
    await c.creer()
    expect(c.peutForcer.value).toBe(false)
  })

  it('403 conflict_override_forbidden : le message du catalogue', async () => {
    connecte('coordinateur')
    servir(() => [403, { success: false, message: PIEGE, reason: 'conflict_override_forbidden' }])
    const c = creation()
    await c.creerQuandMeme()
    expect(c.erreur.value).toBe(ERROR_MESSAGES.seanceForcageInterdit)
  })

  it('modification : le type, la fin et le conflit, comme à la création', async () => {
    connecte('coordinateur')
    const seance = ref({ id: 7, titre: 'Algèbre', date_debut: '2026-12-02T08:00:00+00:00', matiere: { id: 5 }, classe: { id: 11 }, type_seance: 'cm' })
    let n = 0
    servir(() => (++n === 1 ? [409, CONFLIT] : [200, { success: true, data: { id: 7 } }]))
    const e = useSeanceEdit(seance)
    await e.ouvrir()
    expect(e.form.type).toBe('cm')
    e.form.type = 'tp'
    await e.modifier()
    expect(envois[0].corps).toMatchObject({ type_seance: 'tp' })
    expect(e.conflits.value).toHaveLength(1)
    await e.modifierQuandMeme()
    expect(envois[1].corps.forcer_conflit).toBe(true)
  })

  it('modification, 422 seance_end_before_start : rattaché au champ « fin »', async () => {
    connecte('enseignant')
    const seance = ref({ id: 7, titre: 'Algèbre', date_debut: '2026-12-02T08:00:00+00:00', matiere: { id: 5 }, classe: { id: 11 } })
    servir(() => [422, { success: false, message: PIEGE, reason: 'seance_end_before_start' }])
    const e = useSeanceEdit(seance)
    await e.ouvrir()
    await e.modifier()
    expect(e.erreurs.value.fin).toBeTruthy()
    expect(e.erreur.value).toBe(ERROR_MESSAGES.seanceFinAvantDebut)
  })
})
