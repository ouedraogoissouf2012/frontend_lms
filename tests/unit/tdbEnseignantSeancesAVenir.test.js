/**
 * Tableau de bord enseignant, carte « Séances à venir » (R4, point front 2). Elle lisait `seances`, une
 * clé que KLASSCI n'envoie pas : `EMPTY_TEACHER_DASHBOARD` la posait à `[]`, et la carte montrait un 0
 * FABRIQUÉ, même dans une école KLASSCI (défaut existant, déclaré). Elle lit la clé du contrat,
 * `prochaines_seances`, par UNE règle d'origine partagée avec `deriveTeacherCounters` (D172) :
 * - liste reçue avec la marque `source: 'lms_local'` (R4, `meta.source`) : mesure, vide = 0 ;
 * - sans marque (école KLASSCI) : vide = « — », tant que #739 n'est pas tranché
 *   (« KLASSCI remplit-il prochaines_seances aujourd'hui ? », à mesurer, sans deviner).
 *
 * Les charges partent de la réponse CAPTURÉE `TEACHER_DASHBOARD` (garde des fixtures KLASSCI) : sa
 * liste à venir est réellement vide, sans marque. La variante « source locale » ne fait qu'y ajouter
 * la marque que R4 émettra (`meta.source`, reportée sur la charge par le service).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const api = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/services/api', () => ({ default: api }))

import { prochainesSeancesMesurees } from '@/utils/teacherDashboardCounts'
import { deriveTeacherCounters, normalizeTeacherDashboard } from '@/utils/teacherDashboard'
import { klassciDashboardService } from '@/services/klassciDashboard'
import DashboardStatCards from '@/components/teacher/DashboardStatCards.vue'
import { TEACHER_DASHBOARD } from '../fixtures/klassci/teacherDashboard'

// La charge capturée, avec une autre liste à venir et, au besoin, la marque d'origine de R4.
const avec = (liste, source) => ({ ...TEACHER_DASHBOARD, prochaines_seances: liste, ...(source ? { source } : {}) })
const LOCALE_VIDE = { ...TEACHER_DASHBOARD, source: 'lms_local' }

const originalMatchMedia = window.matchMedia
beforeEach(() => {
  window.matchMedia = vi.fn(() => ({ matches: true, media: '', addEventListener() {}, removeEventListener() {} }))
  api.get.mockReset()
})
afterEach(() => { window.matchMedia = originalMatchMedia })

const AUJOURDHUI = new Date().toISOString().slice(0, 10)

describe('prochainesSeancesMesurees — la règle d’origine', () => {
  it('source locale : une liste reçue est une mesure, vide comprise', () => {
    expect(prochainesSeancesMesurees(LOCALE_VIDE)).toEqual([])
    expect(prochainesSeancesMesurees(avec([{ id: 1 }], 'lms_local'))).toEqual([{ id: 1 }])
  })

  it('sans marque (KLASSCI) : vide = non mesuré (null) ; non vide = mesure', () => {
    // La réponse KLASSCI réelle : liste vide, sans marque → non mesurée.
    expect(prochainesSeancesMesurees(TEACHER_DASHBOARD)).toBeNull()
    expect(prochainesSeancesMesurees(avec([{ id: 2 }]))).toEqual([{ id: 2 }])
  })

  it('liste absente → null ; l’ancienne clé `seances` n’est pas lue', () => {
    expect(prochainesSeancesMesurees({})).toBeNull()
    expect(prochainesSeancesMesurees({ seances: [{ id: 3 }] })).toBeNull()
    expect(prochainesSeancesMesurees(null)).toBeNull()
  })
})

describe('deriveTeacherCounters — même règle pour seances_aujourdhui', () => {
  it('source locale, liste vide → 0 (une vraie mesure) ; sans marque → null', () => {
    expect(deriveTeacherCounters(LOCALE_VIDE, null).seances_aujourdhui).toBe(0)
    expect(deriveTeacherCounters(TEACHER_DASHBOARD, null).seances_aujourdhui).toBeNull()
  })

  it('séances d’aujourd’hui comptées dans les deux écoles', () => {
    const p = [{ id: 1, date_seance: AUJOURDHUI }, { id: 2, date_seance: '2099-01-01' }]
    expect(deriveTeacherCounters(avec(p), null).seances_aujourdhui).toBe(1)
    expect(deriveTeacherCounters(avec(p, 'lms_local'), null).seances_aujourdhui).toBe(1)
  })
})

describe('normalizeTeacherDashboard — plus de 0 fabriqué', () => {
  it('aucune clé de séances inventée par défaut', () => {
    const d = normalizeTeacherDashboard({ matieres: [] })
    expect(d).not.toHaveProperty('seances')
    expect(d).not.toHaveProperty('prochaines_seances')
  })
})

describe('DashboardStatCards — la carte lit prochaines_seances', () => {
  const valeurSeances = (dashboardData) =>
    mount(DashboardStatCards, { props: { dashboardData } }).findAll('.stat-value').map((n) => n.text())[3]

  it('liste mesurée → son nombre ; vide mesurée → 0', () => {
    expect(valeurSeances(avec([1, 2, 3]))).toBe('3')
    expect(valeurSeances(avec([]))).toBe('0')
  })

  it('non mesurée (null, absente, ou seule l’ancienne clé) → « — », jamais 0', () => {
    expect(valeurSeances(avec(null))).toBe('—')
    expect(valeurSeances({})).toBe('—')
    expect(valeurSeances({ seances: [1, 2] })).toBe('—')
  })
})

describe('klassciDashboardService.getTeacherDashboard — la marque d’origine n’est pas perdue', () => {
  it('meta.source est reportée sur la charge ; sans meta, rien n’est ajouté', async () => {
    api.get.mockResolvedValue({ success: true, data: { matieres: [] }, meta: { source: 'lms_local' } })
    expect(await klassciDashboardService.getTeacherDashboard()).toEqual({ matieres: [], source: 'lms_local' })
    api.get.mockResolvedValue({ success: true, data: { matieres: [] } })
    expect(await klassciDashboardService.getTeacherDashboard()).toEqual({ matieres: [] })
  })
})
