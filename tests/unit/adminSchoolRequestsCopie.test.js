/**
 * Le bouton « Copier le lien » ne se tait plus (#410).
 *
 * ## Pourquoi ce chemin mérite des tests
 *
 * Ce bouton porte un secret affiché UNE SEULE FOIS, jamais réaffiché, et qui ne
 * peut pas être réémis : côté back, `ActivationTokenService::emettre()` n'est
 * appelé qu'à la validation, et `SchoolRequestDecisionService:195` refuse de
 * rejouer une demande déjà tranchée. C'est le pire endroit du produit pour un
 * échec muet.
 *
 * La version précédente se taisait trois fois : aucune confirmation de succès,
 * un garde `navigator.clipboard` qui ne faisait RIEN quand le presse-papier
 * était absent, et un `await` non gardé dont le rejet partait en silence.
 *
 * ## Ce que ces tests NE prouvent PAS
 *
 * Que le repli fonctionne pour de vrai : `select()` est ici un espion sur le
 * prototype jsdom, pas une vraie sélection dans un vrai navigateur. Ils prouvent
 * que le repli est DÉCLENCHÉ, pas qu'un Ctrl+C aboutit.
 *
 * Le garde `if (!lienActivation.value) return` n'est pas testé non plus : la
 * boîte entière est sous `v-if="lienActivation"`, donc le bouton n'existe pas
 * sans lien. C'est une garde défensive inatteignable par l'écran — dit, plutôt
 * que couvert par un test qui feindrait l'inverse.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const success = vi.fn()
const warning = vi.fn()
vi.mock('@/composables/useToast', () => ({
  toast: { success: (...a) => success(...a), warning: (...a) => warning(...a), error: vi.fn() }
}))

// Le composable est feint : le SUJET est le chemin de copie, qui vit dans la
// vue. Son état réel est déjà couvert par useAdminSchoolRequests.test.js.
vi.mock('@/composables/useAdminSchoolRequests', async () => {
  const { ref } = await import('vue')

  return {
    useAdminSchoolRequests: () => ({
      demandes: ref([]),
      loading: ref(false),
      error: ref(''),
      page: ref(1),
      lastPage: ref(1),
      actingId: ref(null),
      lienActivation: ref('https://lms.test/activation/jeton-unique'),
      messageValidation: ref('École ouverte.'),
      load: vi.fn(),
      valider: vi.fn(),
      refuser: vi.fn(),
      fermerLien: vi.fn()
    })
  }
})

import AdminSchoolRequests from '@/views/admin/AdminSchoolRequests.vue'

const monter = () =>
  mount(AdminSchoolRequests, {
    global: {
      stubs: {
        DashboardLayout: { template: '<div><slot /></div>' },
        ContentLoader: { template: '<div />' }
      }
    }
  })

/** Remplace `navigator.clipboard` ; `undefined` simule un contexte non sécurisé. */
function pressePapier(implementation) {
  Object.defineProperty(globalThis.navigator, 'clipboard', {
    value: implementation,
    configurable: true,
    writable: true
  })
}

const cliquerSurCopier = async (vue) => {
  const bouton = vue.findAll('button').find((b) => b.text() === 'Copier le lien')
  expect(bouton).toBeDefined()
  await bouton.trigger('click')
  await flushPromises()
}

describe('bouton « Copier le lien » (#410)', () => {
  let selectionner

  beforeEach(() => {
    success.mockReset()
    warning.mockReset()
    selectionner = vi.spyOn(HTMLInputElement.prototype, 'select').mockImplementation(() => {})
  })

  afterEach(() => {
    selectionner.mockRestore()
    pressePapier(undefined)
  })

  it('confirme la copie quand elle réussit', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    pressePapier({ writeText })

    await cliquerSurCopier(monter())

    expect(writeText).toHaveBeenCalledWith('https://lms.test/activation/jeton-unique')
    expect(success).toHaveBeenCalledTimes(1)
    expect(warning).not.toHaveBeenCalled()
    expect(selectionner).not.toHaveBeenCalled()
  })

  it('hors contexte sécurisé, sélectionne le lien au lieu de ne rien faire', async () => {
    // `navigator.clipboard` est absent sur une origine `http://` ou une adresse
    // IP — le cas d'un test depuis un téléphone sur le réseau local.
    pressePapier(undefined)

    await cliquerSurCopier(monter())

    expect(warning).toHaveBeenCalledTimes(1)
    expect(selectionner).toHaveBeenCalledTimes(1)
    expect(success).not.toHaveBeenCalled()
  })

  it('quand la permission est refusée, ne laisse PAS le rejet filer en silence', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('NotAllowedError'))
    pressePapier({ writeText })

    await cliquerSurCopier(monter())

    expect(warning).toHaveBeenCalledTimes(1)
    expect(selectionner).toHaveBeenCalledTimes(1)
    expect(success).not.toHaveBeenCalled()
  })

  it('le message de repli DIT quoi faire, il ne constate pas l\'échec', async () => {
    pressePapier(undefined)

    await cliquerSurCopier(monter())

    expect(warning.mock.calls[0][0]).toContain('Ctrl+C')
  })
})
