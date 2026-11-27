/**
 * #654 : les deux formulaires ne sont offerts QU'À une école qui tient son catalogue (capacité
 * `peutGererCatalogueLocal`, miroir de PorteDuCatalogueLocal côté serveur) ; ailleurs, les matières et les programmes
 * viennent du système de gestion de l'école. Une écriture, même incertaine, fait RELIRE l'écran. La carte d'une classe
 * locale mène à sa fiche, où vit son programme.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount, RouterLinkStub } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { computed, defineComponent, h, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'

const loadMatieres = vi.fn()
vi.mock('@/composables/useAdminMatieres', () => ({
  useAdminMatieres: () => ({
    matieres: ref([]), filieres: ref([]), niveaux: ref([]), loading: ref(false), error: ref(null), canRetry: ref(false),
    filters: ref({ search: '', filiere_id: '', niveau_id: '' }), showNiveauModal: ref(false), selectedNiveau: ref(null),
    showMatiereModal: ref(false), selectedMatiere: ref(null), filteredMatieres: computed(() => []),
    filteredNiveauxWithMatieres: computed(() => []), stats: computed(() => ({})), statsMesurees: computed(() => false),
    viewNiveauDetails: vi.fn(), closeNiveauModal: vi.fn(), viewMatiereDetails: vi.fn(), closeMatiereModal: vi.fn(),
    loadMatieres, refreshData: vi.fn(), applyFilters: vi.fn(), resetFilters: vi.fn(),
  }),
}))

const loadClasseDetails = vi.fn()
vi.mock('@/composables/useClasseDetails', () => ({
  useClasseDetails: () => ({
    loading: ref(false), error: ref(null), canRetry: ref(false), activeTab: ref('matieres'), classe: ref({ id: 12, name: '6e A fictive' }),
    matieres: ref([{ id: 5, nom: 'Maths fictive', enseignants: [] }]), etudiants: ref([]), evaluations: ref([]), rosterVisible: ref(true),
    emploiTemps: ref([]), seances: ref([]), statistiques: ref({}), classeId: ref('12'), tabs: computed(() => [{ id: 'matieres', label: 'Matières', count: 1 }]),
    canManageVisio: ref(false), compteurEvaluations: ref(0),
    loadClasseDetails, loadSeances: vi.fn(), viewMatiere: vi.fn(), viewEvaluation: vi.fn(), goBack: vi.fn(),
  }),
}))

import AdminMatieres from '@/views/admin/AdminMatieres.vue'
import ClasseDetails from '@/views/classes/ClasseDetails.vue'
import EnrolmentCodeCard from '@/components/admin/EnrolmentCodeCard.vue'

const Fente = defineComponent({ setup: (_, { slots }) => () => h('div', slots.default?.()) })
const MatiereCreationFactice = defineComponent({ name: 'MatiereCreation', emits: ['creee', 'incertaine'], setup: () => () => h('form') })
const ProgrammeFactice = defineComponent({ name: 'ProgrammeRattachement', props: ['classeId', 'programme'], emits: ['rattachee', 'incertaine'], setup: () => () => h('form') })

function capacite(valeur) {
  useAuthStore().meta = { peut_gerer_catalogue_local: valeur }
}

const monterMatieres = () => mount(AdminMatieres, { global: { stubs: {
  DashboardLayout: Fente, MatiereCreation: MatiereCreationFactice, MatiereModals: true, MatieresFilters: true, MatieresTable: true, ContentLoader: true,
} } })

const monterClasse = () => mount(ClasseDetails, { global: { stubs: {
  DashboardLayout: Fente, ProgrammeRattachement: ProgrammeFactice, ClasseDetailsHeader: true, ContentLoader: true, ClasseTabsNav: true,
  ClasseMatieresTab: true, ClasseEtudiantsTab: true, ClasseEvaluationsTab: true, ClassePlanningTab: true, ClasseUpcomingSeances: true,
} } })

beforeEach(() => {
  setActivePinia(createPinia())
  useAuthStore().user = { id: 1, name: 'Admin fictif', role: 'admin' }
  loadMatieres.mockClear()
  loadClasseDetails.mockClear()
})

describe('#654 — « Nouvelle matière » suit la capacité de l’école', () => {
  it('peutGererCatalogueLocal : offert ; sans elle (ou méta absente) : absent', () => {
    capacite(true)
    expect(monterMatieres().findComponent({ name: 'MatiereCreation' }).exists()).toBe(true)
    for (const v of [false, undefined]) {
      setActivePinia(createPinia())
      capacite(v)
      expect(monterMatieres().findComponent({ name: 'MatiereCreation' }).exists()).toBe(false)
    }
  })

  it.each([['creee'], ['incertaine']])('`%s` : la liste est relue sans cache', async (evenement) => {
    capacite(true)
    await monterMatieres().findComponent({ name: 'MatiereCreation' }).vm.$emit(evenement, {})
    expect(loadMatieres).toHaveBeenCalledWith(true)
  })
})

describe('#654 — « Rattacher une matière » sur la fiche d’une classe', () => {
  it('peutGererCatalogueLocal : offert dans l’onglet Matières, avec la classe et son programme ; sinon absent', () => {
    capacite(true)
    const programme = monterClasse().findComponent({ name: 'ProgrammeRattachement' })
    expect(programme.exists()).toBe(true)
    expect(programme.props()).toEqual({ classeId: 12, programme: [{ id: 5, nom: 'Maths fictive', enseignants: [] }] })
    setActivePinia(createPinia())
    capacite(false)
    expect(monterClasse().findComponent({ name: 'ProgrammeRattachement' }).exists()).toBe(false)
  })

  it.each([['rattachee'], ['incertaine']])('`%s` : la fiche est relue', async (evenement) => {
    capacite(true)
    await monterClasse().findComponent({ name: 'ProgrammeRattachement' }).vm.$emit(evenement)
    expect(loadClasseDetails).toHaveBeenCalled()
  })
})

describe('#654 — la carte d’une classe locale mène à sa fiche', () => {
  it('« Ouvrir la classe » vise la fiche LOCALE de la classe', () => {
    const w = mount(EnrolmentCodeCard, {
      props: { classe: { id: 12, libelle: '6e A fictive', code_inscription: { etat: 'absent' }, effectif: null } },
      global: { stubs: { RouterLink: RouterLinkStub, ClasseCapacite: true } },
    })
    const lien = w.findAllComponents(RouterLinkStub).find((l) => l.text().includes('Ouvrir la classe'))
    expect(lien?.props('to')).toEqual({ name: 'classe-details-local', params: { id: 12 } })
  })
})
