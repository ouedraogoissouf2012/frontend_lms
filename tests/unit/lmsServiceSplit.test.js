/**
 * Tests du split lms.js par domaine (#26 PR2).
 * Garantit que la façade rétro-compatible `lmsService` expose bien toutes les
 * méthodes des modules domaine, que chaque module porte sa responsabilité, et
 * que le doublon getClasses a bien été retiré.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getMock = vi.hoisted(() => vi.fn())

vi.mock('@/services/api', () => ({
  default: { get: (...args) => getMock(...args) }
}))

import lmsService, {
  lmsClassesService,
  lmsMatieresService,
  lmsTeachersService,
  lmsSeancesService,
  lmsVisioService
} from '@/services/lms'

const DOMAINS = {
  classes: { svc: lmsClassesService, methods: ['getClasseDetails', 'getClasseEtudiants'] },
  matieres: { svc: lmsMatieresService, methods: ['getMatiereDetails', 'getMyMatieres'] },
  teachers: { svc: lmsTeachersService, methods: ['getEnseignants', 'getTeacherDashboard'] },
  seances: {
    svc: lmsSeancesService,
    methods: [
      'getUpcomingSeances', 'getSeanceDetails', 'getSeanceParticipants',
      'validateParticipant', 'syncVideoAttendances', 'getMyTeachingSeances',
      'getMyClassesSeances', 'hideSeance', 'unhideSeance', 'getAttendanceHistory',
      'getSeancesHistory', 'getSeanceAttendances', 'deleteSeance'
    ]
  },
  visio: {
    svc: lmsVisioService,
    methods: [
      'toggleVisio', 'activateVisio', 'deactivateVisio', 'startVisio', 'endVisio',
      'joinVisio', 'leaveVisio', 'heartbeatVisio', 'getVisioParticipants',
      'getVisioRecording', 'startVisioRecording', 'stopVisioRecording'
    ]
  }
}

describe('lms.js — split par domaine (#26)', () => {
  beforeEach(() => {
    getMock.mockReset()
  })

  it('chaque module domaine porte exactement ses méthodes', () => {
    for (const [name, { svc, methods }] of Object.entries(DOMAINS)) {
      for (const m of methods) {
        expect(typeof svc[m], `${name}.${m}`).toBe('function')
      }
    }
  })

  it('la façade lmsService agrège toutes les méthodes de tous les domaines', () => {
    const all = Object.values(DOMAINS).flatMap((d) => d.methods)
    for (const m of all) {
      expect(typeof lmsService[m], `lmsService.${m}`).toBe('function')
    }
  })

  it('aucune collision de nom entre domaines (total des méthodes uniques)', () => {
    const all = Object.values(DOMAINS).flatMap((d) => d.methods)
    expect(new Set(all).size).toBe(all.length)
  })

  it('le doublon getClasses a été retiré de lmsService (#26)', () => {
    expect(lmsService.getClasses).toBeUndefined()
  })

  it('getUpcomingSeances suit le timeout global, sans surcharge locale', async () => {
    // Le timeout court (5 s) etait un garde-fou delibere (PR #208, « timeout
    // court sur l'endpoint upcoming lent ») contre un endpoint qui parcourait
    // les 452 matieres du tenant et tournait 120 s. Ce N+1 est corrige cote
    // backend (PR #725) : l'endpoint repond en 0,17-0,53 s.
    //
    // Le garde-fou ne protegeait d'ailleurs QUE le client : le serveur, lui,
    // continuait jusqu'a « Maximum execution time of 120 seconds exceeded ».
    // Le laisser en place en ferait un piege : un appel qui echoue 6x plus tot
    // que tout le reste de l'application, sans raison visible.
    getMock.mockResolvedValue({ success: true, data: [] })
    await lmsService.getUpcomingSeances({ days: 30 })
    expect(getMock).toHaveBeenCalledWith('/lms/seances/upcoming', {
      params: { days: 30 }
    })
  })
})
