/**
 * Les classes de l'établissement (lms_backend#1709), par le VRAI client HTTP : `api.js`, ses
 * intercepteurs et les transformations d'axios. Seul l'adaptateur réseau est remplacé.
 *
 * Forme de la réponse : `ClassesDeLEtablissementPage` de `docs/openapi.yaml` (lms_backend),
 * `{ success, data: [{ id, libelle }], meta: { current_page, last_page, per_page, total } }`.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import api from '@/services/api'
import { listerClassesDeLEtablissement, PAR_PAGE, PAGES_MAX } from '@/services/classesDeLEtablissement'
import { useClassesDeLEtablissement } from '@/composables/useClassesDeLEtablissement'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

let adaptateurOrigine
let appels

function page(numero, dernier, classes) {
  return {
    success: true,
    data: classes,
    meta: { current_page: numero, last_page: dernier, per_page: PAR_PAGE, total: 0 },
  }
}

// Le corps arrive en TEXTE, comme du réseau : les transformations par défaut d'axios le lisent.
function servir(repondre) {
  api.defaults.adapter = async (config) => {
    appels.push({ url: config.url, params: config.params })
    const [status, data] = repondre(config)
    const response = { status, statusText: '', data: JSON.stringify(data), headers: { 'content-type': 'application/json' }, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  appels = []
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('classes de l’établissement (vrai client HTTP)', () => {
  it('lit TOUTES les pages, 100 par page, et ne garde que `{ id, libelle }`', async () => {
    servir((config) => {
      const n = config.params.page
      return [200, page(n, 2, [{ id: 40 + n, libelle: `Classe ${n}` }])]
    })

    const classes = await listerClassesDeLEtablissement()

    expect(classes).toEqual([
      { id: 41, libelle: 'Classe 1' },
      { id: 42, libelle: 'Classe 2' },
    ])
    expect(appels.map((a) => a.params)).toEqual([
      { page: 1, per_page: PAR_PAGE },
      { page: 2, per_page: PAR_PAGE },
    ])
    expect(appels[0].url).toMatch(/\/lms\/classes\/etablissement$/)
  })

  it('une réponse qui annonce des pages sans fin s’arrête à la borne', async () => {
    servir((config) => [200, page(config.params.page, 10_000, [])])

    await listerClassesDeLEtablissement()

    expect(appels).toHaveLength(PAGES_MAX)
  })

  it('une réponse sans liste est refusée, avec un message du catalogue', async () => {
    servir(() => [200, { success: true }])

    const erreur = await listerClassesDeLEtablissement().catch((e) => e)

    expect(erreur).toBeInstanceOf(Error)
    expect(erreur.userMessage).toBe(ERROR_MESSAGES.unknown)
  })

  it('le composable : un échec n’est pas définitif, la demande suivante relit', async () => {
    servir(() => [503, { success: false, message: 'indisponible' }])
    const classes = useClassesDeLEtablissement()

    await classes.charger()
    expect(classes.etat.value).toBe('echec')

    servir(() => [200, page(1, 1, [{ id: 7, libelle: 'L1' }])])
    await classes.charger()
    expect(classes.etat.value).toBe('pret')
    expect(classes.classes.value).toEqual([{ id: 7, libelle: 'L1' }])
  })

  it('le composable : deux demandes simultanées partagent une seule lecture', async () => {
    servir(() => [200, page(1, 1, [])])
    const classes = useClassesDeLEtablissement()

    await Promise.all([classes.charger(), classes.charger()])

    expect(appels).toHaveLength(1)
  })
})
