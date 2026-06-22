/**
 * Test de RENDU de InstitutionFormModal (#G1 décompo — extrait d'InstitutionModals).
 * Modale formulaire : titre create/edit, v-model sur form.* via référence partagée
 * (mutation par référence, identique à l'original), events save/close. Teleport stubbé.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import InstitutionFormModal from '@/components/admin/InstitutionFormModal.vue'

const makeForm = () => ({
  slug: '', name: '', klassci_api_url: '', klassci_api_token: '',
  logo_url: '', primary_color: '#3b82f6', is_active: true,
})

const mountModal = (props = {}) =>
  mount(InstitutionFormModal, {
    props: { form: makeForm(), ...props },
    global: { stubs: { teleport: true } },
  })

describe('InstitutionFormModal (#G1)', () => {
  it('rien d\'affiché sans showForm', () => {
    expect(mountModal().find('.modal-overlay').exists()).toBe(false)
  })

  it('titre "Nouvelle Institution" en création, "Modifier" en édition', () => {
    expect(mountModal({ showForm: true }).find('.modal-title').text()).toBe('Nouvelle Institution')
    expect(mountModal({ showForm: true, editing: true }).find('.modal-title').text()).toContain('Modifier')
  })

  it('v-model écrit dans l\'objet form passé en prop (référence partagée)', async () => {
    const form = makeForm()
    const w = mountModal({ showForm: true, form })
    await w.find('input.form-input').setValue('esbtp-abidjan')
    expect(form.slug).toBe('esbtp-abidjan')
  })

  it('émet save (formulaire et bouton) et close', async () => {
    const w = mountModal({ showForm: true })
    await w.find('form').trigger('submit.prevent')
    await w.find('.modal-btn-primary').trigger('click')
    expect(w.emitted('save')).toHaveLength(2)
    await w.find('.modal-btn-secondary').trigger('click')
    expect(w.emitted('close')).toBeTruthy()
  })

  it('affiche les erreurs de validation', () => {
    const w = mountModal({ showForm: true, formErrors: { slug: ['déjà pris'] } })
    expect(w.find('.form-errors').text()).toContain('déjà pris')
  })
})
