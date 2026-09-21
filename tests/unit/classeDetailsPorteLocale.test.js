/**
 * #760 — la porte interrogee suit le NOM de la route, pas le hasard.
 *
 * ## Ce que ces tests mesurent, et pourquoi la
 *
 * `/lms/classes/{id}` transmet son identifiant BRUT a KLASSCI. L'onglet
 * « Classes » d'une matiere est le seul appelant a detenir un identifiant
 * LOCAL — il y envoyait ce nombre, et KLASSCI rendait la classe qui le porte
 * chez LUI. Une autre. En 200, sans erreur.
 *
 * Mesure de production du 19/09/2026 : sur 21 classes, une SEULE a le meme
 * nombre dans les deux espaces, et sept sont en collision franche. Asserter un
 * code HTTP ne prouverait donc rien — la porte fautive repond 200 elle aussi.
 * Le seul temoin honnete est **quelle methode de service est appelee**.
 *
 * ## Pourquoi un fichier neuf plutot qu'un ajout a useClasseDetails.test.js
 *
 * Celui-ci monte le composable avec un `$route` reduit a ses `params`, sans
 * `name`. Il reste vert quoi qu'on fasse ici — c'est voulu, il garde le
 * comportement historique. Il ne pouvait donc pas garder la bascule.
 *
 * @see src/composables/useClasseDetails.js
 * @see src/router/routes/academic.routes.js
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const getClasseDetails = vi.fn()
const getClasseDetailsLocal = vi.fn()
const getClasseEtudiants = vi.fn()
const getUpcomingSeances = vi.fn()

vi.mock('@/services/lms', () => ({
  default: {
    getClasseDetails: (...a) => getClasseDetails(...a),
    getClasseDetailsLocal: (...a) => getClasseDetailsLocal(...a),
    getClasseEtudiants: (...a) => getClasseEtudiants(...a),
    getUpcomingSeances: (...a) => getUpcomingSeances(...a)
  }
}))
vi.mock('@/services/klassci', () => ({
  default: { getMatieres: vi.fn().mockResolvedValue([]) }
}))
vi.mock('@/services/api', () => ({ auth: { getUser: () => ({ role: 'enseignant' }) } }))

import { useClasseDetails } from '@/composables/useClasseDetails'

const REPONSE = { success: true, data: { classe: { nom: '6e A' }, matieres_disponibles: [] } }

/** Monte le composable sous un nom de route donne. */
async function monter(nomDeRoute, id = '2') {
  const Comp = defineComponent({ setup() { useClasseDetails(); return () => null } })
  mount(Comp, {
    global: { mocks: { $route: { name: nomDeRoute, params: { id } }, $router: { push: vi.fn(), back: vi.fn() } } }
  })
  await flushPromises()
}

describe('#760 — le nom de la route choisit la porte', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getClasseDetails.mockResolvedValue(REPONSE)
    getClasseDetailsLocal.mockResolvedValue(REPONSE)
    getClasseEtudiants.mockResolvedValue({ success: true, data: { etudiants: [] } })
    getUpcomingSeances.mockResolvedValue({ success: true, data: { seances: [] } })
  })

  it('sous la route LOCALE, interroge la porte locale et jamais celle de KLASSCI', async () => {
    await monter('classe-details-local')

    expect(getClasseDetailsLocal).toHaveBeenCalledWith(2)
    expect(getClasseDetails).not.toHaveBeenCalled()
  })

  it('sous la route historique, rien ne change', async () => {
    await monter('classe-details')

    expect(getClasseDetails).toHaveBeenCalledWith(2)
    expect(getClasseDetailsLocal).not.toHaveBeenCalled()
  })

  /**
   * Le repli, et c'est ce qui protege les deux appelants KLASSCI existants —
   * la liste admin et la carte enseignant. Une route sans nom emprunte la porte
   * d'origine : la bascule ne peut pas deborder sur eux par inadvertance.
   */
  it('sans nom de route, emprunte la porte historique', async () => {
    const Comp = defineComponent({ setup() { useClasseDetails(); return () => null } })
    mount(Comp, {
      global: { mocks: { $route: { params: { id: '2' } }, $router: { push: vi.fn(), back: vi.fn() } } }
    })
    await flushPromises()

    expect(getClasseDetails).toHaveBeenCalledWith(2)
    expect(getClasseDetailsLocal).not.toHaveBeenCalled()
  })
})
