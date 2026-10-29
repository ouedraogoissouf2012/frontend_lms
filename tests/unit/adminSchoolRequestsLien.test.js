/**
 * Demandes d'ouverture (#418, revues de #449) : le lien d'activation est un secret affiché
 * UNE fois et que rien ne permet de réémettre. La vue est montée avec le VRAI composable
 * (seul le service HTTP est doublé) et un vrai routeur : une règle recopiée dans un double
 * laisserait passer ce que la revue a trouvé (remarque 4).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { h } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const success = vi.fn()
const warning = vi.fn()
const erreur = vi.fn()
vi.mock('@/composables/useToast', () => ({
  toast: { success: (...a) => success(...a), warning: (...a) => warning(...a), error: (...a) => erreur(...a) },
}))
const confirmer = vi.fn()
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: (...a) => confirmer(...a) }) }))
const list = vi.fn()
const validate = vi.fn()
const refuse = vi.fn()
vi.mock('@/services/schoolRequests', () => ({
  schoolRequestsService: { list: (...a) => list(...a), validate: (...a) => validate(...a), refuse: (...a) => refuse(...a) },
}))

import AdminSchoolRequests from '@/views/admin/AdminSchoolRequests.vue'

const LIEN = 'https://lms.test/activation/jeton-unique'
const demande = (id) => ({ id, nom_ecole: `Ecole ${id}`, nom_demandeur: 'D', email_demandeur: 'd@x.test', usage_prevu: 'u', created_at: '2026-10-29', slug_souhaite: `ecole-${id}` })
const valide = () => ({ success: true, message: 'École ouverte.', data: { activation_url: LIEN } })
function differe() {
  let resoudre
  const promesse = new Promise((r) => { resoudre = r })
  return { promesse, resoudre }
}

let router
async function monter({ lastPage = 1 } = {}) {
  list.mockResolvedValue({ success: true, data: [demande(1), demande(2)], meta: { current_page: 1, last_page: lastPage } })
  router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/demandes', component: AdminSchoolRequests }, { path: '/ailleurs', component: { render: () => h('p', 'ailleurs') } }],
  })
  await router.push('/demandes')
  const w = mount({ template: '<router-view />' }, {
    attachTo: document.body,
    global: { plugins: [router], stubs: { DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: { template: '<div />' } } },
  })
  await flushPromises()
  return w
}
const boutons = (w, texte) => w.findAll('button').filter((b) => b.text() === texte)
const carte = (w, id) => w.findAll('article.demande').find((a) => a.find('h2').text() === `Ecole ${id}`)
const bouton = (w, id, texte) => carte(w, id).findAll('button').find((b) => b.text() === texte)
async function validerA(w) {
  validate.mockResolvedValueOnce(valide())
  await bouton(w, 1, 'Valider').trigger('click')
  await flushPromises()
}
async function validerAEnVol(w) {
  const d = differe()
  validate.mockReturnValueOnce(d.promesse)
  await bouton(w, 1, 'Valider').trigger('click')
  await flushPromises()
  return d
}

beforeEach(() => {
  document.body.innerHTML = ''
  for (const f of [success, warning, erreur, confirmer, list, validate, refuse]) f.mockReset()
})

describe('« Valider » refusé tant qu’un lien affiché n’a pas été transmis (#418)', () => {
  it('lien affiché : « Valider » est aria-disabled, relié à une raison VISIBLE, et un clic n’envoie rien', async () => {
    const w = await monter()
    await validerA(w)
    const b = bouton(w, 2, 'Valider')
    expect(b.attributes('aria-disabled')).toBe('true')
    expect(b.attributes('disabled')).toBeUndefined()
    expect(document.getElementById(b.attributes('aria-describedby')).textContent).toMatch(/transmis/)
    await b.trigger('click')
    await flushPromises()
    expect(validate).toHaveBeenCalledTimes(1)
    w.unmount()
  })

  it('sans lien : « Valider » est actif, sans raison, et envoie', async () => {
    const w = await monter()
    const b = bouton(w, 1, 'Valider')
    expect(b.attributes('aria-disabled')).toBe('false')
    expect(b.attributes('aria-describedby')).toBeUndefined()
    await validerA(w)
    expect(validate).toHaveBeenCalledWith(1, 'ecole-1')
    w.unmount()
  })
})

describe('validation EN VOL (B1, bloquant 1 du delta, remarques 6 et 7)', () => {
  it('l’autre « Valider » est refusé, sa raison dit « en cours », et un clic n’envoie rien', async () => {
    const w = await monter()
    const d = await validerAEnVol(w)
    const b = bouton(w, 2, 'Valider')
    expect(b.attributes('aria-disabled')).toBe('true')
    const raison = document.getElementById(b.attributes('aria-describedby'))
    expect(raison).not.toBeNull()
    expect(raison.textContent).toMatch(/en cours/)
    await b.trigger('click')
    expect(validate).toHaveBeenCalledTimes(1)
    d.resoudre(valide())
    await flushPromises()
    w.unmount()
  })

  it('bloquant 1 : quitter l’écran AVANT la réponse demande confirmation, et un refus reste', async () => {
    const w = await monter()
    const d = await validerAEnVol(w)
    confirmer.mockResolvedValue(false)
    await router.push('/ailleurs')
    await flushPromises()
    expect(confirmer).toHaveBeenCalledTimes(1)
    expect(confirmer.mock.calls[0][0].message).toMatch(/en cours/)
    expect(router.currentRoute.value.path).toBe('/demandes')
    d.resoudre(valide())
    await flushPromises()
    w.unmount()
  })

  it('bloquant 1 : recharger AVANT la réponse est retenu (beforeunload)', async () => {
    const w = await monter()
    const d = await validerAEnVol(w)
    const e = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(e)
    expect(e.defaultPrevented).toBe(true)
    d.resoudre(valide())
    await flushPromises()
    w.unmount()
  })

  it('remarque 6 : « Actualiser » pendant le vol est refusé et ne relit pas la liste', async () => {
    const w = await monter()
    const d = await validerAEnVol(w)
    list.mockClear()
    const actualiser = boutons(w, 'Actualiser')[0]
    expect(actualiser.attributes('aria-disabled')).toBe('true')
    await actualiser.trigger('click')
    expect(list).not.toHaveBeenCalled()
    d.resoudre(valide())
    await flushPromises()
    w.unmount()
  })
})

describe('accessibilité et focus (D17 : A3, A4, N2, C3, R5)', () => {
  it('les régions alert et status existent DÈS le montage, vides et sans présentation', async () => {
    const w = await monter()
    const alerte = w.find('[role="alert"]')
    expect(alerte.exists()).toBe(true)
    expect(alerte.text()).toBe('')
    expect(alerte.classes()).not.toContain('error-banner')
    expect(w.find('[role="status"]').text()).toBe('')
    w.unmount()
  })

  it('une erreur de validation est annoncée dans la région alert, qui prend sa présentation', async () => {
    const w = await monter()
    validate.mockRejectedValueOnce(Object.assign(new Error('x'), { userMessage: 'Refusé.' }))
    await bouton(w, 1, 'Valider').trigger('click')
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toBe('Refusé.')
    expect(w.find('[role="alert"]').classes()).toContain('error-banner')
    w.unmount()
  })

  it('après « Valider » : la région status annonce, et le focus va au champ du lien, nommé et décrit', async () => {
    const w = await monter()
    await validerA(w)
    expect(w.find('[role="status"]').text()).toBe('École ouverte.')
    const champ = w.find('input.lien-input[readonly]')
    expect(document.activeElement).toBe(champ.element)
    expect(champ.attributes('aria-label')).toBe("Lien d'activation")
    expect(document.getElementById(champ.attributes('aria-describedby')).textContent).toMatch(/ne sera plus affiché/)
    w.unmount()
  })

  it('après « J’ai transmis le lien » puis après « Refuser », le focus va au titre de la page', async () => {
    const w = await monter()
    await validerA(w)
    await boutons(w, "J'ai transmis le lien")[0].trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(w.find('h1').element)
    refuse.mockResolvedValueOnce({ success: true })
    await bouton(w, 2, 'Refuser').trigger('click')
    await flushPromises()
    expect(document.activeElement).toBe(w.find('h1').element)
    w.unmount()
  })

  it('une demande en cours garde ses boutons focalisables (aria-disabled, jamais disabled)', async () => {
    const w = await monter()
    const d = differe()
    refuse.mockReturnValueOnce(d.promesse)
    await bouton(w, 1, 'Refuser').trigger('click')
    await flushPromises()
    for (const b of [bouton(w, 1, 'Valider'), bouton(w, 1, 'Refuser')]) {
      expect(b.attributes('aria-disabled')).toBe('true')
      expect(b.attributes('disabled')).toBeUndefined()
    }
    d.resoudre({ success: true })
    await flushPromises()
    w.unmount()
  })

  it('R5 : la pagination aux bornes reste focalisable et n’appelle rien', async () => {
    const w = await monter({ lastPage: 2 })
    list.mockClear()
    const precedent = boutons(w, 'Précédent')[0]
    expect(precedent.attributes('aria-disabled')).toBe('true')
    expect(precedent.attributes('disabled')).toBeUndefined()
    await precedent.trigger('click')
    expect(list).not.toHaveBeenCalled()
    expect(boutons(w, 'Suivant')[0].attributes('aria-disabled')).toBe('false')
    w.unmount()
  })
})

describe('copie : le message dit vrai (#418)', () => {
  afterEach(() => {
    Object.defineProperty(globalThis.navigator, 'clipboard', { value: undefined, configurable: true, writable: true })
    delete document.execCommand
  })

  it('le champ disparaît PENDANT la copie : aucune affirmation de sélection, une erreur qui le dit', async () => {
    const w = await monter()
    await validerA(w)
    document.execCommand = vi.fn().mockReturnValue(false)
    Object.defineProperty(globalThis.navigator, 'clipboard', {
      value: { writeText: vi.fn(async () => { await boutons(w, "J'ai transmis le lien")[0].trigger('click'); await flushPromises(); throw new Error('refus') }) },
      configurable: true, writable: true,
    })
    await boutons(w, 'Copier le lien')[0].trigger('click')
    await flushPromises()
    expect(warning).not.toHaveBeenCalled()
    expect(success).not.toHaveBeenCalled()
    expect(erreur.mock.calls[0][0]).toMatch(/n'est plus affiché/)
    expect(erreur.mock.calls[0][0]).not.toContain(LIEN)
    w.unmount()
  })

  it('le champ est là mais aucune copie ne réussit : il est sélectionné, et le message le dit', async () => {
    const w = await monter()
    await validerA(w)
    document.execCommand = vi.fn().mockReturnValue(false)
    const select = vi.spyOn(HTMLInputElement.prototype, 'select')
    await boutons(w, 'Copier le lien')[0].trigger('click')
    await flushPromises()
    expect(select).toHaveBeenCalled()
    expect(warning.mock.calls[0][0]).toMatch(/sélectionné/)
    select.mockRestore()
    w.unmount()
  })
})
