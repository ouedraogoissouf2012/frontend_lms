/**
 * Demandes d'ouverture (#418) : le lien d'activation est un secret affiché UNE fois et que
 * rien ne permet de réémettre. Ces tests tiennent :
 * - le refus de « Valider » tant qu'un lien affiché n'a pas été marqué transmis (valider
 *   une autre demande effaçait le premier lien), avec la raison VISIBLE et reliée ;
 * - un message de copie qui dit vrai quand le champ a disparu pendant la copie ;
 * - la région d'annonce présente dès le montage et le focus qui ne tombe jamais sur <body>.
 * Le composable est doublé (sa logique est testée dans useAdminSchoolRequestsLien).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const success = vi.fn()
const warning = vi.fn()
const erreur = vi.fn()
vi.mock('@/composables/useToast', () => ({
  toast: { success: (...a) => success(...a), warning: (...a) => warning(...a), error: (...a) => erreur(...a) },
}))

let etat
vi.mock('@/composables/useAdminSchoolRequests', () => ({ useAdminSchoolRequests: () => etat }))

import AdminSchoolRequests from '@/views/admin/AdminSchoolRequests.vue'

const LIEN = 'https://lms.test/activation/jeton-unique'
const demande = (id) => ({ id, nom_ecole: `Ecole ${id}`, nom_demandeur: 'D', email_demandeur: 'd@x.test', usage_prevu: 'u', created_at: '2026-10-29', slug_souhaite: `ecole-${id}` })

function double({ lien = '', actingId = null } = {}) {
  const lienActivation = ref(lien)
  const messageValidation = ref(lien ? 'École ouverte.' : '')
  return {
    demandes: ref([demande(1), demande(2)]), loading: ref(false), error: ref(''), page: ref(1), lastPage: ref(1),
    actingId: ref(actingId), lienActivation, messageValidation,
    load: vi.fn(),
    valider: vi.fn(async () => { lienActivation.value = LIEN; messageValidation.value = 'École ouverte.'; return true }),
    refuser: vi.fn(async () => true),
    fermerLien: vi.fn(() => { lienActivation.value = ''; messageValidation.value = '' }),
  }
}

const monter = () => mount(AdminSchoolRequests, {
  attachTo: document.body,
  global: { stubs: { DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: { template: '<div />' } } },
})
const boutons = (w, texte) => w.findAll('button').filter((b) => b.text() === texte)

beforeEach(() => {
  document.body.innerHTML = ''
  success.mockReset(); warning.mockReset(); erreur.mockReset()
})

describe('« Valider » refusé tant qu’un lien affiché n’a pas été transmis (#418)', () => {
  it('lien affiché : chaque « Valider » est aria-disabled, relié à une raison VISIBLE, et un clic n’appelle rien', async () => {
    etat = double({ lien: LIEN })
    const w = monter()
    const valider = boutons(w, 'Valider')
    expect(valider).toHaveLength(2)
    for (const b of valider) {
      expect(b.attributes('aria-disabled')).toBe('true')
      expect(b.attributes('disabled')).toBeUndefined()
      const raison = document.getElementById(b.attributes('aria-describedby'))
      expect(raison).not.toBeNull()
      expect(raison.textContent).toMatch(/transmis/)
      await b.trigger('click')
    }
    expect(etat.valider).not.toHaveBeenCalled()
    w.unmount()
  })

  it('sans lien affiché : « Valider » est actif et sans raison', async () => {
    etat = double()
    const w = monter()
    const b = boutons(w, 'Valider')[0]
    expect(b.attributes('aria-disabled')).toBe('false')
    expect(b.attributes('aria-describedby')).toBeUndefined()
    await b.trigger('click')
    expect(etat.valider).toHaveBeenCalledWith(1, 'ecole-1')
    w.unmount()
  })

  it('D17 : une demande en cours garde ses boutons focalisables (aria-disabled, pas disabled)', () => {
    etat = double({ actingId: 1 })
    const w = monter()
    const [v1] = boutons(w, 'Valider')
    const [r1] = boutons(w, 'Refuser')
    for (const b of [v1, r1]) {
      expect(b.attributes('aria-disabled')).toBe('true')
      expect(b.attributes('disabled')).toBeUndefined()
    }
    w.unmount()
  })
})

describe('annonce et focus (D17 : A3, A4, N2)', () => {
  it('la région status existe DÈS le montage, vide, puis porte le message de validation', async () => {
    etat = double()
    const w = monter()
    const status = w.find('[role="status"]')
    expect(status.exists()).toBe(true)
    expect(status.text()).toBe('')
    await boutons(w, 'Valider')[0].trigger('click')
    await flushPromises()
    expect(w.find('[role="status"]').text()).toBe('École ouverte.')
    w.unmount()
  })

  it('après « Valider », le focus va au champ du lien (le bouton cliqué a disparu)', async () => {
    etat = double()
    const w = monter()
    await boutons(w, 'Valider')[0].trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(w.find('input.lien-input[readonly]').element)
    w.unmount()
  })

  it('après « J’ai transmis le lien », le focus va au titre de la page, pas sur <body>', async () => {
    etat = double({ lien: LIEN })
    const w = monter()
    const b = boutons(w, "J'ai transmis le lien")[0]
    b.element.focus()
    await b.trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(w.find('h1').element)
    w.unmount()
  })

  it('après « Refuser », le focus va au titre de la page', async () => {
    etat = double()
    const w = monter()
    await boutons(w, 'Refuser')[0].trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(w.find('h1').element)
    w.unmount()
  })
})

describe('copie : le message dit vrai (#418)', () => {
  let execCommand
  beforeEach(() => {
    execCommand = vi.fn().mockReturnValue(false)
    document.execCommand = execCommand
  })
  afterEach(() => {
    Object.defineProperty(globalThis.navigator, 'clipboard', { value: undefined, configurable: true, writable: true })
    delete document.execCommand
  })

  it('le champ disparaît PENDANT la copie : aucune affirmation de sélection, une erreur qui le dit', async () => {
    etat = double({ lien: LIEN })
    const w = monter()
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText: vi.fn(async () => { etat.fermerLien(); await flushPromises(); throw new Error('refus') }) },
      configurable: true, writable: true,
    })
    await boutons(w, 'Copier le lien')[0].trigger('click')
    await flushPromises()
    expect(warning).not.toHaveBeenCalled()
    expect(success).not.toHaveBeenCalled()
    expect(erreur).toHaveBeenCalledTimes(1)
    expect(erreur.mock.calls[0][0]).toMatch(/n'est plus affiché/)
    expect(erreur.mock.calls[0][0]).not.toContain(LIEN)
    w.unmount()
  })

  it('le champ est là mais aucune copie ne réussit : il est sélectionné, et le message le dit', async () => {
    etat = double({ lien: LIEN })
    const w = monter()
    const select = vi.spyOn(HTMLInputElement.prototype, 'select')
    await boutons(w, 'Copier le lien')[0].trigger('click')
    await flushPromises()
    expect(select).toHaveBeenCalled()
    expect(warning.mock.calls[0][0]).toMatch(/sélectionné/)
    select.mockRestore()
    w.unmount()
  })
})
