/**
 * #626, PR 1 (accord signé n°49 ; la PR 2, le tableau de bord, attend lms_backend#1536). Un id d'enseignant reste
 * dans SON espace (lms_backend#873, #1396, #1409) : dans une école, l'annuaire, les évaluations et la connexion
 * parlent UN seul espace (id local en école autonome, identité d'enseignant KLASSCI en école KLASSCI). Le front ne
 * mêle plus deux espaces pour joindre :
 *   1. une option d'enseignant se joint par son `id` SEUL, jamais par `klassci_id` (un numéro de COMPTE), ni par
 *      `teacher_id` ;
 *   2. `byId` indexe une ligne par son `id` SEUL : le même nombre peut être l'`id` d'une ligne et le `user_id`
 *      (ou le `klassci_id`) d'une autre ;
 *   4. le calendrier ne reçoit plus un « id d'acteur » jamais envoyé au serveur, mais un booléen « connecté ».
 * Données fictives : le MÊME nombre y désigne deux enseignants dans deux espaces.
 */
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'

const etat = vi.hoisted(() => ({ user: null }))
vi.mock('@/stores/auth', () => ({ useAuthStore: () => ({ currentUser: etat.user }) }))

import { deriveEnseignants, enrichEvaluation, teacherOption } from '@/utils/coordinatorEvaluations'
import { byId } from '@/utils/evaluationDisplay'
import { useScheduleConnexion } from '@/composables/useScheduleConnexion'

const source = (f) => readFileSync(resolve(process.cwd(), f), 'utf8')

describe('#626 (1) — une option d’enseignant se joint par son id SEUL', () => {
  it('l’id gagne : ni klassci_id (numéro de compte), ni teacher_id', () => {
    const option = teacherOption({ id: 9401, klassci_id: 9303, teacher_id: 12, nom: 'Awa Fictive' })
    expect(option).toMatchObject({ id: 9401, cleJointure: 9401, name: 'Awa Fictive' })
    expect(option).not.toHaveProperty('klassci_id')
  })

  it('une ligne SANS id ne désigne personne : aucune option (jamais un id d’un autre espace)', () => {
    expect(teacherOption({ klassci_id: 9303, nom: 'Sans Id' })).toBeNull()
    expect(teacherOption({ teacher_id: 12, nom: 'Sans Id' })).toBeNull()
  })

  it('deux enseignants dont le MÊME nombre vit dans deux espaces ne fusionnent pas', () => {
    const annuaire = [{ id: 7, klassci_id: 3, nom: 'Awa Fictive' }]
    const evaluations = [{ klassci_enseignant_id: 3, enseignant_nom: 'Binta Fictive' }]
    const options = deriveEnseignants(annuaire, evaluations)
    expect(options.map((o) => [String(o.id), o.name])).toEqual([['7', 'Awa Fictive'], ['3', 'Binta Fictive']])
  })
})

describe('#626 (2) — byId indexe par l’id SEUL', () => {
  it('le user_id d’une ligne n’est jamais la clé d’une autre', () => {
    const faux = { id: 5, user_id: 7, nom: 'Faux' }
    const vrai = { id: 7, nom: 'Vrai' }
    const index = byId([faux, vrai])
    expect(index.get('7')).toBe(vrai)
    expect(index.get('5')).toBe(faux)
    expect(index.size).toBe(2)
  })

  it('ni klassci_id, ni class_id, ni aucune autre clé n’indexe une ligne', () => {
    const index = byId([{ id: 1, klassci_id: 70, class_id: 42, teacher_id: 9 }])
    expect([...index.keys()]).toEqual(['1'])
  })

  it('une ligne sans id n’est pas indexée ; une liste absente rend un index vide', () => {
    expect(byId([{ klassci_id: 1 }]).size).toBe(0)
    expect(byId(null).size).toBe(0)
  })

  it('l’évaluation de l’enseignant 7 nomme l’enseignant 7, pas celui dont le user_id vaut 7', () => {
    const enseignants = [{ id: 5, user_id: 7, nom: 'Faux Fictif' }, { id: 7, nom: 'Vrai Fictif' }]
    const evaluation = enrichEvaluation({ klassci_enseignant_id: 7 }, { enseignants, classes: [], matieres: [] })
    expect(evaluation.enseignant_nom).toBe('Vrai Fictif')
  })
})

describe('#626 (4) — le calendrier sait seulement si le compte est connecté', () => {
  it('connecte : vrai avec un compte, faux sans, et jamais un id', () => {
    etat.user = { id: 42, klassci_id: 9303, role: 'etudiant' }
    expect(useScheduleConnexion().connecte.value).toBe(true)
    etat.user = null
    expect(useScheduleConnexion().connecte.value).toBe(false)
    expect(useScheduleConnexion()).not.toHaveProperty('actorId')
  })

  it('les deux agendas passent `connecte`, plus aucun `user-id`', () => {
    for (const f of ['src/views/student/StudentSchedule.vue', 'src/views/teacher/TeacherSchedule.vue']) {
      const vue = source(f)
      expect(vue).toContain(':connecte="connecte"')
      expect(vue).not.toMatch(/user-id|actorId|useScheduleActorId/)
    }
    expect(source('src/components/calendar/UniversalCalendar.vue')).toMatch(/connecte: \{\s*type: Boolean/)
  })

  it('la clé inexistante `klassci_etudiant_id` n’est plus lue nulle part : la dette gelée est soldée', () => {
    expect(existsSync(resolve(process.cwd(), 'src/composables/useScheduleActorId.js'))).toBe(false)
    expect(JSON.parse(source('.cles-inexistantes-baseline.json'))).toEqual({})
  })
})
