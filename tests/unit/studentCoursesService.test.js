/**
 * `klassciCoursesService.getMyCourses` (#436) : un succès incomplet ne se déguise plus
 * en liste vide.
 *
 * Le service remplaçait toute réponse sans `success` par `{ data: [] }` : l'écran
 * affichait alors « Vos enseignants n'ont pas encore publié de cours », une valeur
 * fabriquée présentée comme un fait (CONTRIBUTING §10). La réponse réelle porte
 * toujours `success: true` (capture `myCourses.js`) ; son absence est une anomalie,
 * qui doit remonter comme une erreur affichable.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MY_COURSES_CAPTURES } from '../fixtures/api/myCourses'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const get = vi.fn()
vi.mock('@/services/api', () => ({ default: { get: (...a) => get(...a) } }))

import { klassciCoursesService } from '@/services/klassciCourses'

const PAGE_1 = MY_COURSES_CAPTURES.klassci_page_1_defaut.body

beforeEach(() => {
  get.mockReset()
})

describe('klassciCoursesService.getMyCourses (#436)', () => {
  it('rend la réponse réelle telle quelle', async () => {
    get.mockResolvedValue(PAGE_1)

    await expect(klassciCoursesService.getMyCourses()).resolves.toBe(PAGE_1)
  })

  it('rejette une réponse sans success au lieu de fabriquer une liste vide', async () => {
    // Réponse réelle privée de `success` : le scénario du défaut, pas une capture.
    const { success: _absent, ...sansSuccess } = PAGE_1
    get.mockResolvedValue(sansSuccess)

    const erreur = await klassciCoursesService.getMyCourses().catch((e) => e)

    expect(erreur).toBeInstanceOf(Error)
    expect(erreur.userMessage).toBe(ERROR_MESSAGES.unknown)
  })

  // #434 : la page suivante se demande par `page`, sans `per_page` (défaut serveur 15, D1).
  it.each([
    [{}, undefined, '/lessons/my-courses'],
    [{}, 1, '/lessons/my-courses'],
    [{}, 2, '/lessons/my-courses?page=2'],
    [{ matiere_id: 5 }, 2, '/lessons/my-courses?matiere_id=5&page=2'],
    [{ matiere_id: 5, enseignant_id: 7 }, 3, '/lessons/my-courses?matiere_id=5&enseignant_id=7&page=3'],
  ])('filtres %o, page %s → %s', async (filtres, page, url) => {
    get.mockResolvedValue(PAGE_1)
    await klassciCoursesService.getMyCourses(filtres, page)
    expect(get).toHaveBeenCalledWith(url)
  })

  it('rejette aussi un success explicitement faux', async () => {
    get.mockResolvedValue({ ...PAGE_1, success: false })

    await expect(klassciCoursesService.getMyCourses()).rejects.toMatchObject({
      userMessage: ERROR_MESSAGES.unknown,
    })
  })
})
