/**
 * Câblage des deux écrans du code d'inscription (#391) : chaque vue relaie son
 * composable (doublé ici ; sa logique est testée à part).
 */
import { mount, flushPromises } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, it, expect, vi } from 'vitest'

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
      page: ref(1), lastPage: ref(1), busyId: ref(null), load: vi.fn(), emettre: vi.fn(), retirer: vi.fn(),
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

  it('affiche l’erreur dans une alerte', () => {
    codes = { classes: ref([]), loading: ref(false), error: ref('Refusé.'), notice: ref(''), page: ref(1), lastPage: ref(1), busyId: ref(null), load: vi.fn(), emettre: vi.fn(), retirer: vi.fn() }
    const w = mount(AdminEnrolmentCodes, { global: { stubs } })
    expect(w.find('[role="alert"]').text()).toBe('Refusé.')
  })
})

describe('StudentJoinClass (#391)', () => {
  it('soumettre le formulaire appelle rejoindre ; le succès affiche message, classe et lien', async () => {
    join = { code: ref(''), submitting: ref(false), error: ref(''), result: ref(null), rejoindre: vi.fn() }
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

  it('affiche l’erreur dans une alerte', async () => {
    join = { code: ref(''), submitting: ref(false), error: ref('Ce code ne correspond à aucune classe.'), result: ref(null), rejoindre: vi.fn() }
    const w = mount(StudentJoinClass, { global: { stubs } })
    expect(w.find('[role="alert"]').text()).toBe('Ce code ne correspond à aucune classe.')
  })
})
