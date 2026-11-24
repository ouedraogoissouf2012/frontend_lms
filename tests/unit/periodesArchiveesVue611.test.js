/**
 * #611 — l'écran « Sessions de formation » : une vraie case « Voir les périodes archivées », un message de liste vide
 * honnête selon la case, et le focus qui ne se perd pas quand la carte archivée quitte la liste. Le composable est
 * doublé (sa logique est testée dans periodesArchivees611.test.js).
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

const ANNULEE = { id: 4, libelle: 'Promo fictive', status: 'annulee', phase: 'a_venir', program_id: 1 }

const monter = async () => {
  const w = mount(AdminTrainingSessions, {
    attachTo: document.body,
    global: { stubs: { DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: true } },
  })
  await flushPromises()
  return w
}

beforeEach(() => {
  document.body.innerHTML = ''
  etat = {
    periodes: ref([]), loading: ref(false), error: ref(''), notice: ref(''), page: ref(1), lastPage: ref(1),
    dernierProgrammeId: ref(null), saving: ref(false), estOccupee: () => false, voirArchivees: ref(false),
    load: vi.fn(), creerProgramme: vi.fn(), creerPeriode: vi.fn(), transitionner: vi.fn(),
    basculerArchivees: vi.fn(async (v) => { etat.voirArchivees.value = v }),
    // #606 (2ᵉ PR) : la liste des formations, doublée.
    programmes: ref([]), programmesErreur: ref(''), programmesTronques: ref(false), chargerProgrammes: vi.fn(async () => true),
  }
})

describe('#611 — l’écran des sessions de formation', () => {
  it('une vraie case ÉTIQUETÉE, décochée ; la cocher le dit au composable', async () => {
    const w = await monter()
    const caseA = w.find('input[type="checkbox"]#voir-archivees')
    expect(w.find('label[for="voir-archivees"]').text()).toBe('Voir les périodes archivées')
    expect(caseA.element.checked).toBe(false)
    await caseA.setValue(true)
    expect(etat.basculerArchivees).toHaveBeenCalledWith(true)
    w.unmount()
  })

  it('liste vide, case décochée : l’écran dit que les archivées sont masquées', async () => {
    const w = await monter()
    expect(w.text()).toContain(ERROR_MESSAGES.periodesArchiveesMasquees)
    expect(w.text()).not.toContain('Aucune période pour le moment.')
    w.unmount()
  })

  it('liste vide, case cochée : « Aucune période pour le moment. »', async () => {
    etat.voirArchivees.value = true
    const w = await monter()
    expect(w.text()).toContain('Aucune période pour le moment.')
    expect(w.text()).not.toContain(ERROR_MESSAGES.periodesArchiveesMasquees)
    w.unmount()
  })

  it('la carte archivée a quitté la liste : le focus va à la case, jamais sur <body>', async () => {
    etat.periodes.value = [{ ...ANNULEE }]
    etat.transitionner = vi.fn(async () => { etat.periodes.value = []; return true })
    const w = await monter()
    await w.find('[data-periode-id="4"] button.transition-btn').trigger('click')
    await flushPromises()
    expect(document.activeElement?.id).toBe('voir-archivees')
    w.unmount()
  })
})
