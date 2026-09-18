/**
 * Le bouton « Copier le lien » ne se tait plus, et COPIE vraiment (#410).
 *
 * ## Pourquoi ce chemin mérite deux voies
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
 * ## Le repli n'est pas une consigne, c'est une copie
 *
 * Mesuré dans un Chrome réel, sur un contexte NON sécurisé où
 * `navigator.clipboard` est indéfini : `document.execCommand('copy')` rend
 * `true` et un Ctrl+V authentique recolle le lien au caractère près. Le premier
 * jet de ce correctif se contentait de sélectionner le champ et de demander un
 * Ctrl+C — il laissait l'utilisateur faire ce que le navigateur savait faire.
 *
 * ## Ce que ces tests NE prouvent PAS
 *
 * Que `execCommand` copie pour de vrai : il est feint ici, comme `select()`.
 * Cette propriété-là a été prouvée dans un vrai navigateur, pas ici. Ces tests
 * verrouillent l'ENCHAÎNEMENT des deux voies et ce qui est DIT à chaque issue.
 *
 * Le garde `if (!lienActivation.value) return` n'est pas testé : la boîte
 * entière est sous `v-if="lienActivation"`, donc le bouton n'existe pas sans
 * lien. Garde défensive inatteignable par l'écran — dit, plutôt que couvert par
 * un test qui feindrait l'inverse.
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

const LIEN = 'https://lms.test/activation/jeton-unique'

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
  let execCommand

  beforeEach(() => {
    success.mockReset()
    warning.mockReset()
    selectionner = vi.spyOn(HTMLInputElement.prototype, 'select').mockImplementation(() => {})
    execCommand = vi.fn().mockReturnValue(true)
    document.execCommand = execCommand
  })

  afterEach(() => {
    selectionner.mockRestore()
    pressePapier(undefined)
    delete document.execCommand
  })

  it('confirme la copie quand la voie moderne réussit', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    pressePapier({ writeText })

    await cliquerSurCopier(monter())

    expect(writeText).toHaveBeenCalledWith(LIEN)
    expect(success).toHaveBeenCalledTimes(1)
    expect(warning).not.toHaveBeenCalled()
    // La voie de repli ne doit pas être empruntée inutilement.
    expect(execCommand).not.toHaveBeenCalled()
    expect(selectionner).not.toHaveBeenCalled()
  })

  it('hors contexte sécurisé, COPIE par le repli au lieu de le demander', async () => {
    // `navigator.clipboard` est absent sur une origine `http://` ou une adresse
    // IP — reproduit dans un vrai Chrome, ce n'est pas un cas théorique.
    pressePapier(undefined)

    await cliquerSurCopier(monter())

    expect(selectionner).toHaveBeenCalledTimes(1)
    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(success).toHaveBeenCalledTimes(1)
    expect(warning).not.toHaveBeenCalled()
  })

  it('quand la permission est refusée, bascule sur le repli sans laisser filer le rejet', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('NotAllowedError'))
    pressePapier({ writeText })

    await cliquerSurCopier(monter())

    expect(execCommand).toHaveBeenCalledWith('copy')
    expect(success).toHaveBeenCalledTimes(1)
    expect(warning).not.toHaveBeenCalled()
  })

  it('si les DEUX voies échouent, laisse la sélection et dit quoi faire', async () => {
    pressePapier(undefined)
    execCommand.mockReturnValue(false)

    await cliquerSurCopier(monter())

    expect(selectionner).toHaveBeenCalledTimes(1)
    expect(success).not.toHaveBeenCalled()
    expect(warning).toHaveBeenCalledTimes(1)
    expect(warning.mock.calls[0][0]).toContain('Ctrl+C')
  })

  it('un execCommand qui LÈVE ne casse pas l\'écran', async () => {
    pressePapier(undefined)
    execCommand.mockImplementation(() => { throw new Error('non supporté') })

    await cliquerSurCopier(monter())

    expect(warning).toHaveBeenCalledTimes(1)
    expect(success).not.toHaveBeenCalled()
  })
})
