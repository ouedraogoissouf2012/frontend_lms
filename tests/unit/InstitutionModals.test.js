/**
 * Test de RENDU de InstitutionModals (#G1 décompo — extrait d'AdminInstitutions).
 * Modale formulaire (titre create/edit, v-model sur form.* via référence partagée,
 * events save/close) et modale résultat de test de connexion (event close-result).
 * Teleport stubbé.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import InstitutionModals from '@/components/admin/InstitutionModals.vue'

const makeForm = () => ({
  slug: '', name: '', klassci_api_url: '', klassci_api_token: '',
  logo_url: '', primary_color: '#3b82f6', is_active: true,
})

const mountModals = (props = {}) =>
  mount(InstitutionModals, {
    props: { form: makeForm(), ...props },
    global: { stubs: { teleport: true } },
  })

describe('InstitutionModals (#G1) — formulaire', () => {
  it('rien d\'affiché sans showForm ni connectionResult', () => {
    const w = mountModals()
    expect(w.find('.modal-overlay').exists()).toBe(false)
  })

  it('titre "Nouvelle Institution" en création, "Modifier" en édition', () => {
    expect(mountModals({ showForm: true }).find('.modal-title').text()).toBe('Nouvelle Institution')
    expect(mountModals({ showForm: true, editing: true }).find('.modal-title').text()).toContain('Modifier')
  })

  it('v-model écrit dans l\'objet form passé en prop (référence partagée)', async () => {
    const form = makeForm()
    const w = mountModals({ showForm: true, form })
    await w.find('input.form-input').setValue('esbtp-abidjan')
    expect(form.slug).toBe('esbtp-abidjan')
  })

  it('émet save (formulaire et bouton) et close', async () => {
    const w = mountModals({ showForm: true })
    await w.find('form').trigger('submit.prevent')
    await w.find('.modal-btn-primary').trigger('click')
    expect(w.emitted('save')).toHaveLength(2)
    await w.find('.modal-btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })
})

describe('InstitutionModals (#G1) — résultat connexion', () => {
  it('affiche le résultat et émet close-result', async () => {
    const w = mountModals({ connectionResult: { success: true, message: 'Connexion OK' } })
    expect(w.html()).toContain('Test de Connexion')
    expect(w.html()).toContain('Connexion OK')
    await w.find('.modal-sm .modal-btn-secondary').trigger('click')
    expect(w.emitted('close-result')).toBeTruthy()
  })
})
