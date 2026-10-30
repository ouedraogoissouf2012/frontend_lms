/**
 * Les réponses de structure KLASSCI sont VÉRIFIÉES, jamais remplacées par un vide.
 *
 * Le serveur relaie le corps de KLASSCI tel quel : un 200 `{ success: false }` n'est
 * pas exclu. `klassciStructure` le rendait `[]` (ou une structure vide), et l'écran
 * affichait un compteur à 0 — « 0 classe » — au lieu d'un « non mesuré ». Une erreur
 * HTTP, elle, remontait déjà : le refus prend désormais le même chemin.
 * Modèle : `klassciCourses.getMyCourses` (#436), `klassciEvaluations` (#462).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const reponses = vi.hoisted(() => ({ parRoute: {} }))
const getMock = vi.hoisted(() => vi.fn())
vi.mock('@/services/api', () => ({
  default: { get: (...a) => getMock(...a) },
  auth: { getUser: () => ({ role: 'superAdmin' }), getMeta: () => ({ institution: 'presentation' }) },
}))
vi.mock('@/services/cache', () => ({
  readCache: () => null,
  readCacheStale: () => ({ data: null }),
  writeCache: () => {},
}))

import { klassciStructureService } from '@/services/klassciStructure'
import { useAdminStats } from '@/composables/useAdminStats'

const refus = { success: false, message: 'refus' }

beforeEach(() => {
  reponses.parRoute = {}
  getMock.mockReset()
  getMock.mockImplementation((url) => {
    const cle = Object.keys(reponses.parRoute).find((r) => url.endsWith(r))
    return Promise.resolve(cle ? reponses.parRoute[cle] : { success: true, data: [] })
  })
})

describe('klassciStructure — un 200 { success: false } est un ÉCHEC, jamais un vide', () => {
  it.each([
    ['getClasses', '/proxy/classes', () => klassciStructureService.getClasses()],
    ['getMatieres', '/proxy/matieres', () => klassciStructureService.getMatieres()],
    ['getEnseignants', '/proxy/enseignants', () => klassciStructureService.getEnseignants()],
    ['getTeachers (alias)', '/proxy/enseignants', () => klassciStructureService.getTeachers()],
    ['getClasseEtudiants', '/proxy/classes/3/etudiants', () => klassciStructureService.getClasseEtudiants(3)],
    ['getStructure', '/proxy/structure', () => klassciStructureService.getStructure()],
  ])('%s rejette, avec le message du catalogue', async (_nom, route, appel) => {
    reponses.parRoute[route] = refus
    const echec = await appel().catch((e) => e)
    expect(echec).toBeInstanceOf(Error)
    expect(echec.userMessage).toBe(ERROR_MESSAGES.unknown)
  })

  it('une réponse conforme rend toujours la liste, enveloppe nommée ou non', async () => {
    reponses.parRoute['/proxy/classes'] = { success: true, data: { classes: [{ id: 1 }] } }
    reponses.parRoute['/proxy/matieres'] = { success: true, data: [{ id: 2 }] }
    await expect(klassciStructureService.getClasses()).resolves.toEqual([{ id: 1 }])
    await expect(klassciStructureService.getMatieres()).resolves.toEqual([{ id: 2 }])
  })

  it('une structure conforme est rendue telle quelle', async () => {
    reponses.parRoute['/proxy/structure'] = { success: true, data: { filieres: [{ id: 1 }], niveaux_etude: [] } }
    await expect(klassciStructureService.getStructure()).resolves.toEqual({ filieres: [{ id: 1 }], niveaux_etude: [] })
  })
})

describe('écran des statistiques admin — un refus ne s affiche plus comme « 0 classe »', () => {
  it('les classes refusées valent « non mesuré » (null), les matières reçues restent comptées', async () => {
    reponses.parRoute['/proxy/classes'] = refus
    reponses.parRoute['/proxy/matieres'] = { success: true, data: [{ id: 1 }, { id: 2 }] }
    let s
    mount(defineComponent({ setup() { s = useAdminStats(); return () => null } }))
    await flushPromises()
    await flushPromises()
    expect(s.stats.value.nb_classes_actives).toBeNull()
    expect(s.stats.value.nb_matieres_actives).toBe(2)
  })
})
