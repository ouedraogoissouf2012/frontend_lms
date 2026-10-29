/**
 * Câblage des deux écrans du code d'inscription (#391) : chaque vue relaie son
 * composable (doublé ici ; sa logique est testée à part).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, it, expect, vi } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

let codes
let join
vi.mock('@/composables/useEnrolmentCodes', () => ({ useEnrolmentCodes: () => codes }))
vi.mock('@/composables/useJoinClass', () => ({ useJoinClass: () => join }))

import AdminEnrolmentCodes from '@/views/admin/AdminEnrolmentCodes.vue'
import StudentJoinClass from '@/views/student/StudentJoinClass.vue'

const stubs = { DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: true, 'router-link': { template: '<a><slot /></a>' } }
const classe = (id, etat, valeur = null) => ({ id, libelle: `Classe ${id}`, code: `C${id}`, training_session_id: null, code_inscription: { etat, valeur } })

describe('AdminEnrolmentCodes (#391)', () => {
  it('charge au montage et relaie émettre / retirer pour la bonne classe', async () => {
    codes = {
      classes: ref([classe(1, 'absent'), classe(2, 'actif', 'Q7RT4K')]), loading: ref(false), error: ref(''), notice: ref(''),
      page: ref(1), lastPage: ref(1), estOccupee: () => false, load: vi.fn(), emettre: vi.fn(), retirer: vi.fn(),
    }
    const w = mount(AdminEnrolmentCodes, { global: { stubs } })
    await flushPromises()
    expect(codes.load).toHaveBeenCalledTimes(1)
    const cartes = w.findAll('.code-card')
    expect(cartes).toHaveLength(2)
    await cartes[0].find('button').trigger('click')
    expect(codes.emettre).toHaveBeenCalledWith(codes.classes.value[0])
    await cartes[1].findAll('button')[1].trigger('click')
    expect(codes.retirer).toHaveBeenCalledWith(codes.classes.value[1])
  })

  it('C2 : seule la carte occupée a ses boutons désactivés', () => {
    codes = {
      classes: ref([classe(1, 'absent'), classe(2, 'actif', 'Q7RT4K')]), loading: ref(false), error: ref(''), notice: ref(''),
      page: ref(1), lastPage: ref(1), estOccupee: (id) => id === 2, load: vi.fn(), emettre: vi.fn(), retirer: vi.fn(),
    }
    const cartes = mount(AdminEnrolmentCodes, { global: { stubs } }).findAll('.code-card')
    // D17 : aria-disabled, jamais disabled (un bouton désactivé perd le focus clavier)
    expect(cartes[0].find('button').attributes('aria-disabled')).toBe('false')
    expect(cartes[1].findAll('button').every((b) => b.attributes('aria-disabled') === 'true')).toBe(true)
    expect(cartes[1].findAll('button').every((b) => b.attributes('disabled') === undefined)).toBe(true)
  })

  it('R4 : les régions alert et status existent DÈS le montage, vides', () => {
    codes = { classes: ref([]), loading: ref(true), error: ref(''), notice: ref(''), page: ref(1), lastPage: ref(1), estOccupee: () => false, load: vi.fn(), emettre: vi.fn(), retirer: vi.fn() }
    const w = mount(AdminEnrolmentCodes, { global: { stubs } })
    expect(w.find('[role="alert"]').exists()).toBe(true)
    expect(w.find('[role="alert"]').text()).toBe('')
    expect(w.find('[role="status"]').exists()).toBe(true)
    expect(w.find('[role="status"]').text()).toBe('')
  })

  it('affiche l’erreur dans une alerte', () => {
    codes = { classes: ref([]), loading: ref(false), error: ref('Refusé.'), notice: ref(''), page: ref(1), lastPage: ref(1), estOccupee: () => false, load: vi.fn(), emettre: vi.fn(), retirer: vi.fn() }
    const w = mount(AdminEnrolmentCodes, { global: { stubs } })
    expect(w.find('[role="alert"]').text()).toBe('Refusé.')
  })
})

describe('StudentJoinClass (#391)', () => {
  it('soumettre le formulaire appelle rejoindre ; le succès affiche message, classe et lien', async () => {
    join = { code: ref(''), submitting: ref(false), error: ref(''), saisieInvalide: ref(false), result: ref(null), rejoindre: vi.fn() }
    const w = mount(StudentJoinClass, { global: { stubs } })
    await w.find('input#code-inscription').setValue('q7rt4k')
    expect(join.code.value).toBe('q7rt4k')
    await w.find('form').trigger('submit')
    expect(join.rejoindre).toHaveBeenCalledTimes(1)
    join.result.value = { classe: { id: 9, libelle: 'Session Data' }, message: 'Vous avez rejoint la classe.' }
    await flushPromises()
    expect(w.find('[role="status"]').text()).toContain('Vous avez rejoint la classe. — Session Data')
    expect(w.text()).toContain('Voir mes cours')
  })

  it('affiche l’erreur dans une alerte, reliée au champ (aria-invalid, aria-describedby)', async () => {
    join = { code: ref(''), submitting: ref(false), error: ref('Ce code ne correspond à aucune classe.'), saisieInvalide: ref(true), result: ref(null), rejoindre: vi.fn() }
    const w = mount(StudentJoinClass, { global: { stubs } })
    const alerte = w.find('[role="alert"]')
    expect(alerte.text()).toBe('Ce code ne correspond à aucune classe.')
    const champ = w.find('input#code-inscription')
    expect(champ.attributes('aria-invalid')).toBe('true')
    expect(champ.attributes('aria-describedby')).toBe(alerte.attributes('id'))
  })

  it('R4 : sans erreur, le champ n’est pas invalide, et les régions existent dès le montage', () => {
    join = { code: ref(''), submitting: ref(false), error: ref(''), saisieInvalide: ref(false), result: ref(null), rejoindre: vi.fn() }
    const w = mount(StudentJoinClass, { global: { stubs } })
    const champ = w.find('input#code-inscription')
    expect(champ.attributes('aria-invalid')).toBe('false')
    expect(champ.attributes('aria-describedby')).toBeUndefined()
    expect(w.find('[role="alert"]').exists()).toBe(true)
    expect(w.find('[role="status"]').exists()).toBe(true)
    expect(w.find('[role="status"]').text()).toBe('')
  })

  it('N6 : une erreur qui n’est PAS de saisie (panne, quota) est annoncée, sans rendre le champ invalide', () => {
    join = { code: ref(''), submitting: ref(false), error: ref('Une erreur est survenue côté serveur.'), saisieInvalide: ref(false), result: ref(null), rejoindre: vi.fn() }
    const w = mount(StudentJoinClass, { global: { stubs } })
    const champ = w.find('input#code-inscription')
    expect(champ.attributes('aria-invalid')).toBe('false')
    expect(champ.attributes('aria-describedby')).toBe(w.find('[role="alert"]').attributes('id'))
  })

  it('D17 : pendant l’envoi, le bouton reste focalisable (aria-disabled, pas disabled)', () => {
    join = { code: ref('Q7RT4K'), submitting: ref(true), error: ref(''), saisieInvalide: ref(false), result: ref(null), rejoindre: vi.fn() }
    const btn = mount(StudentJoinClass, { global: { stubs } }).find('button.join-btn')
    expect(btn.attributes('aria-disabled')).toBe('true')
    expect(btn.attributes('disabled')).toBeUndefined()
  })

  it('N2 : la région vide ne porte que sa classe de base ; la présentation suit le contenu', async () => {
    join = { code: ref(''), submitting: ref(false), error: ref(''), saisieInvalide: ref(false), result: ref(null), rejoindre: vi.fn() }
    const w = mount(StudentJoinClass, { global: { stubs } })
    expect(w.find('[role="alert"]').classes()).not.toContain('join-message')
    join.error.value = 'Refusé.'
    await flushPromises()
    expect(w.find('[role="alert"]').classes()).toContain('join-message')
  })
})

describe('N2 : aucune règle ne retire une région live de l’arbre d’accessibilité', () => {
  it.each(['../../src/views/student/StudentJoinClass.vue', '../../src/views/admin/AdminEnrolmentCodes.vue'])('%s', (chemin) => {
    const source = readFileSync(fileURLToPath(new URL(chemin, import.meta.url)), 'utf-8')
    expect(source).not.toMatch(/:empty/)
  })
})
