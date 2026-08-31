/**
 * Garde anti-mensonge sur le changement de mot de passe.
 *
 * Il n'existe AUCUN endpoint backend de changement de mot de passe : les trois
 * écrans concernés (admin, enseignant, étudiant) ne doivent JAMAIS annoncer un
 * succès ni déclencher la moindre requête réseau. Ce test verrouille les deux
 * propriétés, quel que soit le formulaire soumis.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

const h = vi.hoisted(() => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn(), warning: vi.fn() },
  auth: { getUser: vi.fn(() => ({ nom: 'Test', role: 'admin' })), logout: vi.fn() },
  push: vi.fn(),
}))
vi.mock('@/composables/useToast', () => ({ toast: h.toast }))
vi.mock('@/services/api', () => ({ auth: h.auth }))
vi.mock('vue-router', () => ({ useRouter: () => ({ push: h.push }) }))

import AdminPasswordModal from '@/components/admin/SettingsPasswordModal.vue'
import TeacherPasswordModal from '@/components/teacher/PasswordChangeModal.vue'
import StudentPasswordModal from '@/components/student/SettingsPasswordModal.vue'
import { useAdminSettings } from '@/composables/useAdminSettings'
import { useTeacherSettings } from '@/composables/useTeacherSettings'
import { PASSWORD_CHANGE_UNAVAILABLE_MESSAGE } from '@/constants/passwordChange'

const ModalStub = {
  name: 'Modal',
  props: ['modelValue', 'title'],
  template: '<div><slot /><slot name="footer" /></div>',
}
const opts = { global: { stubs: { Modal: ModalStub } } }

const MODALS = [
  ['admin', () => mount(AdminPasswordModal, {
    props: { show: true, form: { currentPassword: '', newPassword: '', confirmPassword: '' } },
    ...opts,
  })],
  ['enseignant', () => mount(TeacherPasswordModal, { props: { modelValue: true }, ...opts })],
  ['étudiant', () => mount(StudentPasswordModal, { props: { modelValue: true }, ...opts })],
]

let sendSpy

beforeEach(() => {
  vi.clearAllMocks()
  localStorage.clear()
  vi.stubGlobal('fetch', vi.fn())
  sendSpy = vi.spyOn(XMLHttpRequest.prototype, 'send').mockImplementation(() => {})
})

afterEach(() => {
  sendSpy.mockRestore()
  vi.unstubAllGlobals()
})

/** Aucune requête n'a quitté l'application (fetch ET XHR, socles d'axios/jsdom). */
function expectNoNetwork() {
  expect(globalThis.fetch).not.toHaveBeenCalled()
  expect(sendSpy).not.toHaveBeenCalled()
}

describe.each(MODALS)('Modale de mot de passe (%s)', (_role, mountModal) => {
  it('explique l\'indisponibilité et verrouille la saisie', () => {
    const w = mountModal()
    expect(w.text()).toContain(PASSWORD_CHANGE_UNAVAILABLE_MESSAGE)
    const inputs = w.findAll('input[type="password"]')
    expect(inputs).toHaveLength(3)
    inputs.forEach((i) => expect(i.attributes('disabled')).toBeDefined())
    expect(w.find('.btn-primary').attributes('disabled')).toBeDefined()
  })

  it('soumission forcée : ni succès ni requête réseau', async () => {
    const w = mountModal()
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(h.toast.success).not.toHaveBeenCalled()
    expectNoNetwork()
  })
})

const COMPOSABLES = [['admin', useAdminSettings], ['enseignant', useTeacherSettings]]

describe.each(COMPOSABLES)('submitPasswordChange (%s)', (_role, useSettings) => {
  async function setup() {
    let api
    mount(defineComponent({ setup() { api = useSettings(); return () => null } }))
    await flushPromises()
    return api
  }

  it('n\'annonce aucun succès et ne déclenche aucune requête', async () => {
    const s = await setup()
    s.passwordForm.currentPassword = 'ancien'
    s.passwordForm.newPassword = 'nouveau1'
    s.passwordForm.confirmPassword = 'nouveau1'
    s.submitPasswordChange()
    await flushPromises()

    expect(h.toast.success).not.toHaveBeenCalled()
    expect(h.toast.info).toHaveBeenCalledWith(PASSWORD_CHANGE_UNAVAILABLE_MESSAGE)
    expectNoNetwork()
  })

  it('reste honnête même sur un formulaire vide ou incohérent', async () => {
    const s = await setup()
    s.passwordForm.newPassword = 'a'
    s.passwordForm.confirmPassword = 'b'
    s.submitPasswordChange()
    s.passwordForm.newPassword = ''
    s.passwordForm.confirmPassword = ''
    s.submitPasswordChange()
    await flushPromises()

    expect(h.toast.success).not.toHaveBeenCalled()
    expectNoNetwork()
  })
})

describe('Message d\'indisponibilité', () => {
  it('oriente l\'utilisateur sans jamais parler de succès', () => {
    expect(PASSWORD_CHANGE_UNAVAILABLE_MESSAGE).toContain('établissement')
    expect(PASSWORD_CHANGE_UNAVAILABLE_MESSAGE.toLowerCase()).not.toContain('succès')
  })

  // Décision produite validée avec le porteur du projet : le message s'adresse à
  // des étudiants, enseignants et parents qui ne connaissent pas forcément le
  // nom du logiciel amont. On nomme l'interlocuteur (« l'administration de votre
  // établissement »), jamais l'outil. Ce test gèle cet arbitrage : réintroduire
  // « KLASSCI » dans le message doit échouer, pas passer en silence.
  it('n\'expose pas le jargon interne « KLASSCI » à l\'utilisateur final', () => {
    expect(PASSWORD_CHANGE_UNAVAILABLE_MESSAGE.toUpperCase()).not.toContain('KLASSCI')
  })
})
