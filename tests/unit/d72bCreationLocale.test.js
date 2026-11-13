/**
 * D72-b, volet 2 : dans une école créée depuis le LMS, l'enseignant ne pouvait créer AUCUNE évaluation
 * (les deux créateurs partent de la programmation KLASSCI). Saisie locale, règles de l'ARRÊT 2 :
 * - offerte seulement sur un catalogue `source: 'lms_local'` (D172 : l'origine vient du serveur) ;
 * - `classe_id` et `matiere_id` pris sur la MÊME carte, jamais un id local sous un nom `klassci_*` (D132) ;
 * - date de l'évaluation exigée (sans elle, la fenêtre locale reste fermée, E2a), en ISO avec décalage ;
 * - un 422 de champ dit NOS messages (D-a1), un refus motivé son message du catalogue (D0), un envoi à la fois.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { ref } from 'vue'
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const m = vi.hoisted(() => ({ createEvaluation: vi.fn() }))
vi.mock('@/services/evaluation', () => ({ default: { createEvaluation: (...a) => m.createEvaluation(...a) } }))

import { matieresLocales, classesDeLaMatiere } from '@/utils/couplesLocaux'
import { useCreationEvaluationLocale } from '@/composables/useCreationEvaluationLocale'
import EvaluationCreateLocaleAction from '@/components/evaluations/EvaluationCreateLocaleAction.vue'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const LOCAL = [
  { id: 3, nom: 'Maths', source: 'lms_local', classes: [{ id: 9, nom: '6e A' }, { id: 10, nom: '5e B' }] },
  { id: 4, nom: 'Physique', source: 'lms_local', classes: [] },
]
const KLASSCI = [{ id: 30, nom: 'Maths', classes: [{ id: 90, nom: '6e A' }] }]

function remplir(c, o = {}) {
  Object.assign(c.form, { matiereId: 3, titre: 'Contrôle 1', debut: '2026-11-20T08:00', duree_minutes: 60, ...o })
  c.form.classeId = o.classeId === undefined ? 9 : o.classeId
}

beforeEach(() => { m.createEvaluation.mockReset() })

describe('couplesLocaux — l’origine vient du serveur', () => {
  it('seules les cartes lms_local ; les classes sont celles de la carte choisie', () => {
    expect(matieresLocales([...LOCAL, ...KLASSCI]).map((x) => x.id)).toEqual([3, 4])
    expect(classesDeLaMatiere(LOCAL, 3).map((x) => x.id)).toEqual([9, 10])
    expect(classesDeLaMatiere(LOCAL, 99)).toEqual([])
    expect(matieresLocales(null)).toEqual([])
  })
})

describe('useCreationEvaluationLocale', () => {
  it('indisponible sur un catalogue KLASSCI ou vide ; disponible sur un catalogue local', () => {
    expect(useCreationEvaluationLocale({ matieres: ref(KLASSCI) }).disponible.value).toBe(false)
    expect(useCreationEvaluationLocale({ matieres: ref([]) }).disponible.value).toBe(false)
    expect(useCreationEvaluationLocale({ matieres: ref(LOCAL) }).disponible.value).toBe(true)
  })

  it('charge : classe_id et matiere_id de la même carte, jamais de clé klassci_*, date ISO avec décalage', async () => {
    m.createEvaluation.mockResolvedValue({ success: true, data: { id: 70 } })
    const c = useCreationEvaluationLocale({ matieres: ref(LOCAL) })
    remplir(c, { titre: '  Contrôle 1  ' })
    expect(await c.creer()).toEqual({ id: 70 })
    const charge = m.createEvaluation.mock.calls[0][0]
    expect(charge).toMatchObject({ classe_id: 9, matiere_id: 3, titre: 'Contrôle 1', type: 'qcm', duree_minutes: 60, questions: [] })
    expect(Object.keys(charge).some((k) => k.startsWith('klassci_'))).toBe(false)
    expect(charge.date_evaluation).toMatch(/^2026-11-20T08:00:00[+-]\d{2}:\d{2}$/)
  })

  it('validation locale : titre court, date, matière ou classe manquantes → aucun envoi, chaque champ dit', async () => {
    const c = useCreationEvaluationLocale({ matieres: ref(LOCAL) })
    remplir(c, { matiereId: null, classeId: null, titre: 'ab', debut: '', duree_minutes: 0 })
    expect(await c.creer()).toBeNull()
    expect(m.createEvaluation).not.toHaveBeenCalled()
    expect(Object.keys(c.erreurs.value).sort()).toEqual(['classe', 'date', 'duree', 'matiere', 'titre'])
  })

  it('422 de champ (classe_id hors école) : NOTRE message, jamais le texte du serveur', async () => {
    m.createEvaluation.mockRejectedValue({
      response: { status: 422, data: { errors: { classe_id: ['TEXTE SERVEUR'] } } }, fieldErrors: { classe_id: ['TEXTE SERVEUR'] },
    })
    const c = useCreationEvaluationLocale({ matieres: ref(LOCAL) })
    remplir(c)
    await c.creer()
    expect(c.erreurs.value.classe).toBeTruthy()
    expect(JSON.stringify(c.erreurs.value) + c.erreur.value).not.toContain('TEXTE SERVEUR')
    expect(c.erreur.value).toBe(ERROR_MESSAGES.validation)
  })

  it('refus motivé (teacher_not_assigned) : le message du catalogue, sans Réessayer', async () => {
    m.createEvaluation.mockRejectedValue({ response: { status: 403, data: { reason: 'teacher_not_assigned' } }, userMessage: 'du catalogue' })
    const c = useCreationEvaluationLocale({ matieres: ref(LOCAL) })
    remplir(c)
    await c.creer()
    expect(c.erreur.value).toBe('du catalogue')
    expect(c.canRetry.value).toBe(false)
  })

  it('un envoi à la fois', async () => {
    let fin
    m.createEvaluation.mockReturnValue(new Promise((r) => { fin = r }))
    const c = useCreationEvaluationLocale({ matieres: ref(LOCAL) })
    remplir(c)
    const premier = c.creer()
    expect(await c.creer()).toBeNull()
    fin({ success: true, data: { id: 1 } })
    await premier
    expect(m.createEvaluation).toHaveBeenCalledTimes(1)
  })
})

describe('EvaluationCreateLocaleAction', () => {
  const monter = (matieres) => mount(EvaluationCreateLocaleAction, { props: { matieres }, global: { stubs: { teleport: true } } })

  it('catalogue KLASSCI : aucun bouton ; catalogue local : le bouton', () => {
    expect(monter(KLASSCI).find('button.btn-create').exists()).toBe(false)
    expect(monter(LOCAL).find('button.btn-create').exists()).toBe(true)
  })

  it('une création réussie émet « created »', async () => {
    m.createEvaluation.mockResolvedValue({ success: true, data: { id: 70 } })
    const w = monter(LOCAL)
    await w.find('button.btn-create').trigger('click')
    await w.find('select[name="matiere"]').setValue('3')
    await w.find('select[name="classe"]').setValue('9')
    await w.find('input[name="titre"]').setValue('Contrôle 1')
    await w.find('input[name="debut"]').setValue('2026-11-20T08:00')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(w.emitted('created')?.[0]).toEqual([{ id: 70 }])
  })

  it('monté sur l’écran des évaluations de l’enseignant, qui recharge sa liste', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/views/evaluations/TeacherEvaluations.vue'), 'utf-8')
    expect(source).toMatch(/<EvaluationCreateLocaleAction[\s\S]*?@created="loadEvaluationsLMS"/)
  })
})
