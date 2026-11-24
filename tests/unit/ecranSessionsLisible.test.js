/**
 * #606 (A+B, ARRÊT 1 validé) : l'écran « Sessions de formation » d'une école autonome dit à quoi il sert, nomme ses deux
 * étapes, et chaque session dit où elle en est dans son cycle et ce qu'on peut en faire. Chaque phrase est PROUVÉE
 * par le code du back (lms bc0c0571) : seul le graphe des transitions est affirmé (TrainingSessionTransitionService,
 * routes/api/sessions.php:39-54). Rien sur la visibilité, les dates d'inscription, les listes ou l'attestation, que le
 * back ne garantit pas (lms_backend#1208). Le choix du programme dans une liste viendra avec lms_backend#1206 (PR 2).
 */
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import { describe, it, expect, vi } from 'vitest'

let etat
vi.mock('@/composables/useAdminTrainingSessions', async (orig) => ({
  ...(await orig()),
  useAdminTrainingSessions: () => etat,
}))

import AdminTrainingSessions from '@/views/admin/AdminTrainingSessions.vue'
import TrainingPeriodCard from '@/components/admin/TrainingPeriodCard.vue'
import { descriptionStatut } from '@/composables/useAdminTrainingSessions'
import { transitionsPermises, LIBELLES_TRANSITION } from '@/constants/trainingSessionTransitions'

const CYCLE = Object.freeze({
  brouillon: 'En préparation. Elle peut être publiée (une date de début est exigée) ou annulée.',
  publiee: 'Elle peut être clôturée ou annulée.',
  cloturee: 'Close. Elle ne peut plus qu’être archivée.',
  annulee: 'Annulée : cela ne se défait pas, et aucune inscription n’est retirée. Elle ne peut plus qu’être archivée.',
  archivee: 'Archivée : plus aucune action n’est possible.',
})
const PHRASE = 'Créez une formation (son programme), puis ses sessions : chacune porte ses dates (inscriptions, début, fin, attestation) et avance de brouillon à publiée, puis close et archivée.'

const periode = (status, extra = {}) => ({
  id: 4, libelle: 'Promo fictive', status, phase: 'a_venir', program_id: 1, starts_on: '2026-11-02', ends_on: null, ...extra,
})

describe('#606 — chaque statut dit ce qu’on peut faire de la session', () => {
  it.each(Object.entries(CYCLE))('%s : « %s »', (status, texte) => {
    expect(descriptionStatut(status)).toBe(texte)
    expect(mount(TrainingPeriodCard, { props: { periode: periode(status) } }).text()).toContain(texte)
  })

  // Les actions que chaque texte NOMME ; elles doivent être exactement les boutons proposés (le graphe, rien de plus).
  const ACTIONS_DITES = Object.freeze({
    brouillon: ['annuler', 'publier'], publiee: ['annuler', 'cloturer'], cloturee: ['archiver'], annulee: ['archiver'], archivee: [],
  })
  it.each(Object.keys(CYCLE))('%s : le texte nomme exactement les actions proposées', (status) => {
    expect([...transitionsPermises({ status })].sort()).toEqual(ACTIONS_DITES[status])
    expect(ACTIONS_DITES[status].every((a) => Object.hasOwn(LIBELLES_TRANSITION, a))).toBe(true)
  })

  it('un statut inconnu (purgée, ou absent) : aucun texte, rien n’est inventé', () => {
    expect(descriptionStatut('purgee')).toBeNull()
    expect(descriptionStatut(undefined)).toBeNull()
    expect(descriptionStatut('toString')).toBeNull()
    expect(mount(TrainingPeriodCard, { props: { periode: periode('purgee') } }).find('.period-cycle').exists()).toBe(false)
  })
})

describe('#606 — l’écran dit à quoi il sert, et nomme ses deux étapes', () => {
  const monter = () => {
    etat = {
      periodes: ref([]), loading: ref(false), error: ref(''), notice: ref(''), page: ref(1), lastPage: ref(1),
      dernierProgrammeId: ref(null), saving: ref(false), estOccupee: () => false,
      load: vi.fn(), creerProgramme: vi.fn(), creerPeriode: vi.fn(), transitionner: vi.fn(),
      // #606 (2ᵉ PR) : la liste des formations, doublée.
      programmes: ref([]), programmesErreur: ref(''), programmesTronques: ref(false), chargerProgrammes: vi.fn(async () => true),
    }
    return mount(AdminTrainingSessions, {
      global: { stubs: { DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: true } },
    })
  }

  it('la phrase de l’écran remplace « Programme, puis période datée »', () => {
    const w = monter()
    expect(w.find('.page-subtitle').text()).toBe(PHRASE)
    expect(w.text()).not.toContain('Programme, puis période datée')
  })

  it('les deux formulaires sont deux étapes nommées', () => {
    const titres = monter().findAll('form h2').map((h) => h.text())
    expect(titres).toEqual(['1. La formation (son programme)', '2. Une session de cette formation'])
  })

  // #606 (2ᵉ PR), RENVERSÉ et déclaré : lms_backend#1206 est livrée, la formation se CHOISIT dans une liste ; le champ
  // numérique « Programme (numéro donné à sa création) » disparaît.
  it('la formation se choisit dans une liste, plus par son numéro', () => {
    const w = monter()
    expect(w.find('label[for="program_id"]').text()).toBe('Formation (programme)')
    expect(w.find('select#program_id').exists()).toBe(true)
    expect(w.text()).not.toContain('numéro donné à sa création')
  })
})
