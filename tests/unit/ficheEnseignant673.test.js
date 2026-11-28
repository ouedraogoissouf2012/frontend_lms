/**
 * #673 — la fiche enseignant de la gestion, par le VRAI client HTTP (PR 1 : école qui gère son propre catalogue).
 *   - le profil se lit et s'écrit (`GET|PUT /lms/enseignants/{id}/profil`) seulement sous la capacité
 *     `peutGererCatalogueLocal` : c'est la porte que le serveur applique au profil (la source par école de
 *     CatalogueServiceProvider ; mode déclaré, RosterAuthorityFactory.php:100-104 et :146-150) ;
 *   - l'onglet Disponibilités relit et corrige celles de l'enseignant ;
 *   - les filtres statut et spécialité s'appliquent à la liste chargée, sur la valeur rendue (comme le filtre serveur).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/admin/enseignants', params: {}, query: {} }), useRouter: () => ({ push: vi.fn() }) }))

import { useAuthStore } from '@/stores/auth'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { messageForReason } from '@/services/errorHandler'
import { filtrerEnseignants, specialitesDe } from '@/utils/enseignants'
import ProfilEnseignantForm from '@/components/admin/ProfilEnseignantForm.vue'
import EnseignantDetailModal from '@/components/admin/EnseignantDetailModal.vue'
import { serveurFictif } from '../helpers/serveurFictif'

const PROFIL = { success: true, data: {
  enseignant_id: 7, matricule: 'P-1', specialite: 'Maths', titre: 'Dr', grade: 'maitre_assistant', diplome: 'Doctorat',
  universite: 'UFHB', date_debut: '2019-09-02', statut: 'en_activite', charge_hebdo_max: 18,
} }
const AWA = { id: 7, nom: 'Awa Koné', email: 'awa@ecole.test', matricule: 'P-1', specialization: 'Maths', status: 'en_activite', matieres: [], classes: [] }

let serveur
function connecter(capacite) {
  useAuthStore().setSession({ user: { id: 1, role: 'coordinateur' }, token: 't' }, capacite === undefined ? {} : { peut_gerer_catalogue_local: capacite })
}
const champ = (w, nom) => w.find(`[data-champ="${nom}"]`)

beforeEach(() => {
  setActivePinia(createPinia())
  sessionStorage.clear()
  document.body.innerHTML = ''
  serveur = serveurFictif()
  serveur.servir({
    'get /lms/enseignants/7/profil': [200, PROFIL],
    'get /lms/enseignants/7/disponibilites': [200, { success: true, data: { enseignant_id: 7, semaine: [], exceptions: [] } }],
  })
})
afterEach(() => serveur.fermer())

describe('#673 — les filtres de la liste', () => {
  const liste = [AWA, { ...AWA, id: 8, specialization: 'Physique', status: 'inactif' }, { ...AWA, id: 9, specialization: null, status: null }]

  it('statut et spécialité, sur la valeur rendue, combinés', () => {
    expect(filtrerEnseignants(liste, { statut: 'inactif', specialite: '' }).map((e) => e.id)).toEqual([8])
    expect(filtrerEnseignants(liste, { statut: 'en_activite', specialite: 'Maths' }).map((e) => e.id)).toEqual([7])
    // La spécialité SEULE : sinon le statut départagerait à sa place, et un filtre de spécialité ignoré passerait.
    expect(filtrerEnseignants(liste, { statut: '', specialite: 'Physique' }).map((e) => e.id)).toEqual([8])
    expect(filtrerEnseignants(liste, { statut: '', specialite: '' }).map((e) => e.id)).toEqual([7, 8, 9])
  })

  it('les spécialités proposées : celles de la liste, sans doublon ni vide, triées', () => {
    expect(specialitesDe([...liste, AWA])).toEqual(['Maths', 'Physique'])
  })
})

describe('#673 — le profil (gestion)', () => {
  async function monter() {
    connecter(true)
    const w = mount(ProfilEnseignantForm, { props: { enseignantId: 7 }, attachTo: document.body })
    await flushPromises()
    return w
  }

  it('se lit, prérempli', async () => {
    const w = await monter()
    expect([champ(w, 'matricule').element.value, champ(w, 'grade').element.value, champ(w, 'statut').element.value, champ(w, 'charge_hebdo_max').element.value])
      .toEqual(['P-1', 'maitre_assistant', 'en_activite', '18'])
    w.unmount()
  })

  it('s’écrit en entier ; un champ vidé part nul', async () => {
    serveur.servir({ 'put /lms/enseignants/7/profil': [200, PROFIL] })
    const w = await monter()
    await champ(w, 'matricule').setValue('')
    await champ(w, 'charge_hebdo_max').setValue('20')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(serveur.ecritures()[0].corps).toEqual({
      matricule: null, specialite: 'Maths', titre: 'Dr', grade: 'maitre_assistant', diplome: 'Doctorat', universite: 'UFHB',
      date_debut: '2019-09-02', statut: 'en_activite', charge_hebdo_max: 20,
    })
    expect(w.find('[role="status"]').text()).toContain('enregistr')
    w.unmount()
  })

  it('une charge hors 1..60 est refusée avant l’envoi', async () => {
    const w = await monter()
    await champ(w, 'charge_hebdo_max').setValue('61')
    await w.find('form').trigger('submit')
    expect(serveur.ecritures()).toEqual([])
    expect(w.text()).toContain(ERROR_MESSAGES.profilChargeIllisible)
    w.unmount()
  })

  it.each([
    [422, 'matricule_deja_pris', 'matriculeDejaPris'],
    [403, 'teacher_profile_managed_by_klassci', 'profilGereParKlassci'],
  ])('un refus %i (%s) est dit par le catalogue', async (statut, reason, cle) => {
    serveur.servir({ 'put /lms/enseignants/7/profil': [statut, { success: false, message: 'Texte du serveur', reason }] })
    const w = await monter()
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toBe(ERROR_MESSAGES[cle])
    expect(messageForReason(reason)).toBe(ERROR_MESSAGES[cle])
    w.unmount()
  })
})

describe('#673 — la fiche : ses onglets suivent la porte du serveur', () => {
  const monter = async (capacite) => {
    connecter(capacite)
    // La modale téléporte son contenu : neutralisé, comme dans EnseignantDetailModal.test.js.
    const w = mount(EnseignantDetailModal, { props: { enseignant: AWA }, attachTo: document.body, global: { stubs: { teleport: true } } })
    await flushPromises()
    return w
  }

  it('école qui gère son catalogue : onglets Profil et Disponibilités, lus sur l’id de la ligne', async () => {
    const w = await monter(true)
    expect(w.find('[data-onglet="profil"]').exists()).toBe(true)
    await w.find('[data-onglet="disponibilites"]').trigger('click')
    await flushPromises()
    expect(serveur.requetes.map((r) => r.cle)).toContain('get /lms/enseignants/7/disponibilites')
    w.unmount()
  })

  it.each([[false], [undefined]])('capacité %s (école KLASSCI) : aucun onglet, aucune lecture du profil', async (capacite) => {
    const w = await monter(capacite)
    expect(w.find('[data-onglet="profil"]').exists()).toBe(false)
    expect(w.find('[data-onglet="disponibilites"]').exists()).toBe(false)
    expect(serveur.requetes).toEqual([])
    w.unmount()
  })
})
