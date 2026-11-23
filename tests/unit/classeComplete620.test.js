/**
 * #620 (lms_backend#1115, PR #1375) : une classe complète refuse une adhésion par code, 409 `class_full`, sur les
 * deux portes du back : `POST /inscriptions` (anonyme) et `POST /me/inscriptions`. Le front n'a qu'UN écran
 * d'inscription par code, « Rejoindre une classe » (StudentJoinClass, puis /me/inscriptions) : la porte anonyme
 * n'en a aucun. Le motif a son texte au catalogue (D0) : jamais le générique du 409, jamais le texte du serveur,
 * aucun « Réessayer » (refus définitif). Le style de refus de l'écran est celui d'`enrolment_not_active`.
 *
 * Ici le VRAI client HTTP (api.js et ses intercepteurs) : seul l'adaptateur réseau est remplacé.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { REASONS } from '@/services/refusalReasons'
import { messageForReason } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import StudentJoinClass from '@/views/student/StudentJoinClass.vue'

const TEXTE = 'Cette classe est complète. Adressez-vous à votre établissement.'
const PIEGE = 'Texte serveur, jamais affiché'
const stubs = { DashboardLayout: { template: '<div><slot /></div>' }, 'router-link': { template: '<a><slot /></a>' } }
let adaptateurOrigine

// Le corps arrive en TEXTE, comme du réseau : les transformations par défaut d'axios le lisent.
function repondre(status, data) {
  api.defaults.adapter = async (config) => {
    const response = { status, statusText: '', data: JSON.stringify(data), headers: { 'content-type': 'application/json' }, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}

async function rejoindreAvec(code) {
  const w = mount(StudentJoinClass, { global: { stubs } })
  await w.find('#code-inscription').setValue(code)
  await w.find('form').trigger('submit')
  await flushPromises()
  return w
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('#620 — class_full au catalogue des motifs', () => {
  it('le motif a son texte, celui de l’issue', () => {
    expect(ERROR_MESSAGES.classeComplete).toBe(TEXTE)
    expect(messageForReason('class_full')).toBe(TEXTE)
  })

  it('un refus DÉFINITIF : ni transitoire (aucun « Réessayer », aucun délai), ni information, ni état vide', () => {
    expect(REASONS.class_full).toEqual({ categorie: 'classeComplete', transitoire: false })
  })
})

describe('#620 — « Rejoindre une classe » : un 409 class_full de POST /me/inscriptions', () => {
  it('l’écran dit le texte du catalogue, en refus (role="alert"), sans le texte du serveur', async () => {
    repondre(409, { success: false, message: PIEGE, reason: 'class_full' })
    const w = await rejoindreAvec('Q7RT4K')
    const alerte = w.find('[role="alert"]')
    expect(alerte.text()).toBe(TEXTE)
    expect(w.text()).not.toContain(PIEGE)
    expect(w.text()).not.toContain(ERROR_MESSAGES.conflict)
  })

  it('aucun « Réessayer », et le champ n’est pas accusé : le code est valide, la classe est pleine', async () => {
    repondre(409, { success: false, message: PIEGE, reason: 'class_full' })
    const w = await rejoindreAvec('Q7RT4K')
    expect(w.text()).not.toMatch(/réessayer/i)
    expect(w.find('#code-inscription').attributes('aria-invalid')).toBe('false')
    expect(w.find('[role="status"]').text()).toBe('')
  })

  it('témoin : le même 409 SANS motif garde le texte générique du conflit', async () => {
    repondre(409, { success: false, message: PIEGE })
    const w = await rejoindreAvec('Q7RT4K')
    expect(w.find('[role="alert"]').text()).toBe(ERROR_MESSAGES.conflict)
  })
})
