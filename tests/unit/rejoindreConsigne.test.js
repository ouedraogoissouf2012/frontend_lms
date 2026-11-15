/**
 * D625 : une consigne n'est jamais identique à un message d'erreur.
 *
 * Le sous-titre de « Rejoindre une classe » (StudentJoinClass.vue) était mot pour mot `ERROR_MESSAGES.codeVide`
 * (« Saisissez le code que votre formateur vous a donné. »), l'erreur d'une saisie vide. L'élève lisait l'erreur
 * avant d'avoir rien fait, et l'E2E, qui juge un écran aux erreurs du catalogue qu'il affiche (D616), l'a vu ROUGE
 * (run 43714135376). La page doit rester une consigne, et aucune erreur du catalogue ne s'affiche à l'ouverture.
 */
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, it, expect, vi } from 'vitest'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

const join = { code: ref(''), submitting: ref(false), error: ref(''), saisieInvalide: ref(false), result: ref(null), rejoindre: vi.fn() }
vi.mock('@/composables/useJoinClass', () => ({ useJoinClass: () => join }))

import StudentJoinClass from '@/views/student/StudentJoinClass.vue'

const stubs = { DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: true, 'router-link': { template: '<a><slot /></a>' } }

describe('D625 — la consigne de « Rejoindre une classe » n’est pas une erreur', () => {
  it('à l’ouverture, aucun texte du catalogue d’erreurs n’est affiché', () => {
    const texte = mount(StudentJoinClass, { global: { stubs } }).text()
    expect(Object.values(ERROR_MESSAGES).filter((t) => texte.includes(t))).toEqual([])
  })

  it('le sous-titre reste une consigne sur le code d’inscription', () => {
    const consigne = mount(StudentJoinClass, { global: { stubs } }).find('.page-subtitle').text()
    expect(consigne).toMatch(/code/i)
    expect(consigne).not.toBe(ERROR_MESSAGES.codeVide)
  })
})
