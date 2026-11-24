/**
 * #606, 2ᵉ PR — l'écran « Sessions de formation » : la formation d'une session se choisit dans un <select> rempli par
 * `GET /programs` ; un échec de lecture désactive la création, sans champ numérique de repli ; la borne de lecture est
 * dite. Le composable est doublé (sa logique est testée dans choisirProgramme606.test.js).
 */
import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

let etat
vi.mock('@/composables/useAdminTrainingSessions', async (orig) => ({
  ...(await orig()),
  useAdminTrainingSessions: () => etat,
}))

import AdminTrainingSessions from '@/views/admin/AdminTrainingSessions.vue'
import { PROGRAMMES_PAGES_MAX } from '@/composables/useAdminTrainingSessions'

const P = (id, titre, version = 1) => ({ id, titre, version })

async function monter() {
  const w = mount(AdminTrainingSessions, { global: { stubs: { DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: true } } })
  await flushPromises()
  return w
}

beforeEach(() => {
  etat = {
    periodes: ref([]), loading: ref(false), error: ref(''), notice: ref(''), page: ref(1), lastPage: ref(1),
    dernierProgrammeId: ref(null), saving: ref(false), estOccupee: () => false, voirArchivees: ref(false),
    programmes: ref([P(3, 'Alpha'), P(12, 'OHADA', 2)]), programmesErreur: ref(''), programmesTronques: ref(false),
    load: vi.fn(), creerProgramme: vi.fn(), creerPeriode: vi.fn(async () => true), transitionner: vi.fn(),
    basculerArchivees: vi.fn(), chargerProgrammes: vi.fn(async () => true),
  }
})

describe('#606 — l’écran : la formation se choisit dans une liste', () => {
  it('un <select> ÉTIQUETÉ « Formation (programme) », ses options, et plus aucun champ numérique', async () => {
    const w = await monter()
    const select = w.find('select#program_id')
    expect(select.exists()).toBe(true)
    expect(w.find('label[for="program_id"]').text()).toBe('Formation (programme)')
    expect(select.findAll('option').map((o) => o.text())).toEqual(['Choisissez une formation', 'Alpha', 'OHADA (version 2)'])
    expect(w.find('input[type="number"]#program_id').exists()).toBe(false)
    expect(etat.chargerProgrammes).toHaveBeenCalledTimes(1)
  })

  it('le programme choisi part en nombre dans la création de la session', async () => {
    const w = await monter()
    await w.find('select#program_id').setValue('12')
    await w.find('#libelle').setValue('Session fictive')
    await w.findAll('form')[1].trigger('submit')
    expect(etat.creerPeriode).toHaveBeenCalledWith(expect.objectContaining({ program_id: 12, libelle: 'Session fictive' }))
  })

  it('le programme qu’on vient de créer est choisi', async () => {
    const w = await monter()
    etat.dernierProgrammeId.value = 12
    await flushPromises()
    expect(w.find('select#program_id').element.value).toBe('12')
  })

  it('un échec de lecture : le message, la liste et « Créer la période » désactivés, aucun champ de repli', async () => {
    etat.programmes.value = []
    etat.programmesErreur.value = ERROR_MESSAGES.server
    const w = await monter()
    expect(w.find('.programmes-erreur').text()).toBe(ERROR_MESSAGES.server)
    expect(w.find('select#program_id').attributes('disabled')).toBeDefined()
    expect(w.findAll('form')[1].find('button[type="submit"]').attributes('disabled')).toBeDefined()
    expect(w.find('input#program_id').exists()).toBe(false)
  })

  it('la borne atteinte : l’écran le dit, sans prétendre lister tout', async () => {
    etat.programmesTronques.value = true
    const w = await monter()
    expect(w.text()).toContain(`Seules les ${PROGRAMMES_PAGES_MAX * 100} premières formations sont proposées`)
  })
})
