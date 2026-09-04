/**
 * Tests du split klassci.js par domaine (G9 — miroir de lmsServiceSplit #26).
 *
 * Garantit que la façade rétro-compatible `klassciService` expose TOUTES les
 * méthodes publiques d'origine (parité d'API : aucun appelant cassé), que chaque
 * module domaine porte sa responsabilité, et qu'il n'y a aucune collision de nom.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

// api mocké : on vérifie le câblage des endpoints sans requête réelle.
const getMock = vi.fn()
vi.mock('@/services/api', () => ({
  default: { get: (...args) => getMock(...args) }
}))

import klassciService, {
  klassciStructureService,
  klassciDashboardService,
  klassciSeancesService,
  klassciEvaluationsService,
  klassciCoursesService,
  klassciAdminService
} from '@/services/klassci'

const DOMAINS = {
  structure: {
    svc: klassciStructureService,
    methods: ['getClasses', 'getMatieres', 'getEnseignants', 'getEmploiTemps',
      'getClasseEtudiants', 'getStructure', 'getTeachers']
  },
  dashboard: {
    svc: klassciDashboardService,
    methods: ['getStudentDashboard', 'getTeacherDashboard', 'getMyMatieres']
  },
  seances: {
    svc: klassciSeancesService,
    methods: ['getSeances', 'getUpcomingSeances', 'getMyVisioConferences']
  },
  evaluations: {
    svc: klassciEvaluationsService,
    methods: ['getEvaluations', 'getMyEvaluations']
  },
  courses: { svc: klassciCoursesService, methods: ['getMyCourses'] },
  admin: { svc: klassciAdminService, methods: ['getLmsEnseignants', 'getAdminMatieres'] }
}

// API publique complète attendue (18 méthodes ; getClasseDetails a été retiré,
// sans appelant et pointant vers /proxy/classes/{id}, une route qui renvoie 404).
const PUBLIC_API = Object.values(DOMAINS).flatMap((d) => d.methods)

describe('klassci.js — split par domaine (G9)', () => {
  beforeEach(() => getMock.mockReset())

  it('chaque module domaine porte exactement ses méthodes', () => {
    for (const [name, { svc, methods }] of Object.entries(DOMAINS)) {
      for (const m of methods) {
        expect(typeof svc[m], `${name}.${m}`).toBe('function')
      }
    }
  })

  it('la façade klassciService agrège toutes les méthodes (parité d\'API)', () => {
    for (const m of PUBLIC_API) {
      expect(typeof klassciService[m], `klassciService.${m}`).toBe('function')
    }
    expect(PUBLIC_API).toHaveLength(18)
  })

  it('aucune collision de nom entre domaines', () => {
    expect(new Set(PUBLIC_API).size).toBe(PUBLIC_API.length)
  })

  it('parité de câblage : getClasses → GET /proxy/classes', async () => {
    getMock.mockResolvedValue({ success: true, data: [{ id: 1 }] })
    const data = await klassciService.getClasses()
    expect(getMock).toHaveBeenCalledWith('/proxy/classes')
    expect(data).toEqual([{ id: 1 }])
  })

  it('getTeachers délègue à getEnseignants (GET /proxy/enseignants) via la façade', async () => {
    getMock.mockResolvedValue({ success: true, data: [{ id: 9 }] })
    const data = await klassciService.getTeachers()
    expect(getMock).toHaveBeenCalledWith('/proxy/enseignants')
    expect(data).toEqual([{ id: 9 }])
  })

  it('getMyMatieres dérive du dashboard élève (GET /proxy/me/dashboard) via la façade', async () => {
    getMock.mockResolvedValue({ success: true, data: { cours: [{ id: 3 }] } })
    const data = await klassciService.getMyMatieres()
    expect(getMock).toHaveBeenCalledWith('/proxy/me/dashboard')
    expect(data).toEqual([{ id: 3 }])
  })

  it('getMyCourses construit la query string identique à l\'original', async () => {
    getMock.mockResolvedValue({ success: true, data: [], total: 0 })
    await klassciService.getMyCourses({ matiere_id: 5, enseignant_id: 7 })
    expect(getMock).toHaveBeenCalledWith('/lessons/my-courses?matiere_id=5&enseignant_id=7')
  })

  it('getUpcomingSeances applique un timeout court pour ne pas bloquer le dashboard', async () => {
    getMock.mockResolvedValue({ success: true, data: [] })
    const data = await klassciService.getUpcomingSeances({ days: 30 })
    expect(getMock).toHaveBeenCalledWith('/lms/seances/upcoming', {
      params: { days: 30 },
      timeout: 5000
    })
    expect(data).toEqual([])
  })

  it('getSeances applique aussi le timeout court sur l’endpoint lent', async () => {
    getMock.mockResolvedValue({ success: true, data: [] })
    await klassciService.getSeances({ days: 30 })
    expect(getMock).toHaveBeenCalledWith('/lms/seances/upcoming', {
      params: { days: 30 },
      timeout: 5000
    })
  })
})
