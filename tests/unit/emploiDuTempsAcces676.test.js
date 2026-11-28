/**
 * #676 (contrat serveur lms_backend#1669, PR #1826) : les emplois du temps d'une école autonome.
 *
 * Contrat lu sur la PR serveur (docs/openapi.yaml, tag « Emplois du temps ») :
 *   - `GET|POST /lms/emplois-du-temps`, `GET /lms/emplois-du-temps/alertes`,
 *     `GET|PUT|DELETE /lms/emplois-du-temps/{id}`, `PUT …/{id}/lignes`, `POST …/{id}/generer`, `POST …/{id}/copier` ;
 *   - la gestion seule (coordinateur, administrateur), et l'école qui gère son propre catalogue : le serveur répond
 *     403 `catalogue_managed_by_klassci` sinon. Le front ne lit aucun mode : la CAPACITÉ `peutGererCatalogueLocal`
 *     garde l'entrée de menu, le tiroir mobile et la route ;
 *   - motifs 422 : `emploi_du_temps_hors_periode`, `matiere_hors_programme`, `grille_en_conflit`,
 *     `enseignant_hors_ecole`.
 * Ici le service par le VRAI client HTTP : seul l'adaptateur réseau est remplacé.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

const getUser = vi.fn()
vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/' }), useRouter: () => ({ push: vi.fn() }) }))

import { useAuthStore } from '@/stores/auth'
import { useNavigation } from '@/composables/useNavigation'
import { useMobileSidebar } from '@/composables/useMobileSidebar'
import { NAV_SECTIONS } from '@/constants/navigation'
import { adminRoutes } from '@/router/routes/admin.routes'
import { messageForReason } from '@/services/errorHandler'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { endpoints } from '@/services/endpoints'
import { emploisDuTempsService } from '@/services/emploisDuTemps'
import { serveurFictif } from '../helpers/serveurFictif'

const LISTE = '/admin/emplois-du-temps'
const CAPACITE = 'peutGererCatalogueLocal'
const chemins = (items) => items.map((i) => i.to ?? i.path)

function connecter(role, capacite) {
  getUser.mockReturnValue({ id: 1, role })
  useAuthStore().setSession({ user: { id: 1, role }, token: 't' }, capacite === undefined ? {} : { peut_gerer_catalogue_local: capacite })
}

const EMPLOI = { id: 3, classe_id: 9, titre: 'Semestre 1', du: '2026-12-07', au: '2027-01-31', en_vigueur: true, lignes: [] }

let serveur
beforeEach(() => {
  setActivePinia(createPinia())
  sessionStorage.clear()
  serveur = serveurFictif()
})
afterEach(() => serveur.fermer())

describe('#676 — les chemins suivent la spec du serveur', () => {
  it('neuf opérations, sous /lms/emplois-du-temps', () => {
    const e = endpoints.emploisDuTemps
    expect([e.liste, e.alertes, e.un(3), e.lignes(3), e.generer(3), e.copier(3)]).toEqual([
      '/lms/emplois-du-temps', '/lms/emplois-du-temps/alertes', '/lms/emplois-du-temps/3',
      '/lms/emplois-du-temps/3/lignes', '/lms/emplois-du-temps/3/generer', '/lms/emplois-du-temps/3/copier',
    ])
  })
})

describe('#676 — le service, par le vrai client', () => {
  it('lister passe le filtre de classe, et rend le tableau', async () => {
    serveur.servir({ 'get /lms/emplois-du-temps': [200, { success: true, data: [EMPLOI] }] })
    expect(await emploisDuTempsService.lister({ classeId: 9 })).toEqual([EMPLOI])
    expect(serveur.requetes[0].params).toEqual({ classe_id: 9 })
  })

  it('créer envoie la classe, le titre, la plage ; un succès sans emploi du temps relisible n’est pas cru', async () => {
    serveur.servir({ 'post /lms/emplois-du-temps': [201, { success: true, data: EMPLOI }] })
    expect(await emploisDuTempsService.creer({ classeId: 9, titre: ' Semestre 1 ', du: '2026-12-07', au: '2027-01-31' })).toEqual(EMPLOI)
    expect(serveur.requetes[0].corps).toEqual({ classe_id: 9, titre: 'Semestre 1', du: '2026-12-07', au: '2027-01-31' })

    serveur.servir({ 'post /lms/emplois-du-temps': [201, { success: true }] })
    await expect(emploisDuTempsService.creer({ classeId: 9, titre: 'S', du: '2026-12-07', au: '2026-12-08' })).rejects.toBeTruthy()
  })

  it('la grille part d’un bloc : un cours sans enseignant choisi envoie null (celui du programme)', async () => {
    serveur.servir({ 'put /lms/emplois-du-temps/3/lignes': [200, { success: true, data: { ...EMPLOI, retirees: 2 } }] })
    const rendu = await emploisDuTempsService.enregistrerLignes(3, [
      { jour: 1, debut: '08:00', fin: '10:00', matiereId: 4, enseignantId: null, typeSeance: 'cm', libelle: null },
      { jour: 1, debut: '10:00', fin: '10:15', matiereId: null, enseignantId: null, typeSeance: null, libelle: 'Récréation' },
    ])
    expect(rendu.retirees).toBe(2)
    expect(serveur.requetes[0].corps).toEqual({ lignes: [
      { jour: 1, debut: '08:00', fin: '10:00', matiere_id: 4, enseignant_id: null, type_seance: 'cm' },
      { jour: 1, debut: '10:00', fin: '10:15', libelle: 'Récréation' },
    ] })
  })

  it('générer rend le rapport ; un rapport illisible n’est pas cru', async () => {
    const rapport = { creees: 2, ignorees: [{ date: '2026-12-14', ligne_id: 5, motif: 'conflit', conflits: [77] }] }
    serveur.servir({ 'post /lms/emplois-du-temps/3/generer': [200, { success: true, data: rapport }] })
    expect(await emploisDuTempsService.generer(3)).toEqual(rapport)

    // Chaque défaut SEUL, l'autre clé étant lisible : sinon une seule des deux vérifications serait mesurée.
    for (const illisible of [{ creees: '2', ignorees: [] }, { creees: 2, ignorees: null }]) {
      serveur.servir({ 'post /lms/emplois-du-temps/3/generer': [200, { success: true, data: illisible }] })
      await expect(emploisDuTempsService.generer(3)).rejects.toBeTruthy()
    }
  })

  it('modifier, supprimer, copier, alertes : la méthode et le chemin de la spec', async () => {
    serveur.servir({
      'put /lms/emplois-du-temps/3': [200, { success: true, data: EMPLOI }],
      'delete /lms/emplois-du-temps/3': [200, { success: true, message: 'Emploi du temps supprimé' }],
      'post /lms/emplois-du-temps/3/copier': [201, { success: true, data: { ...EMPLOI, id: 8 } }],
      'get /lms/emplois-du-temps/alertes': [200, { success: true, data: { sans_emploi_du_temps: [], expires: [] } }],
    })
    await emploisDuTempsService.modifier(3, { titre: 'S2', du: '2026-12-07', au: '2027-02-28', enVigueur: false })
    await emploisDuTempsService.supprimer(3)
    expect((await emploisDuTempsService.copier(3, { classeId: 11, du: '2027-02-01', au: '2027-06-30' })).id).toBe(8)
    expect(await emploisDuTempsService.alertes()).toEqual({ sans_emploi_du_temps: [], expires: [] })
    expect(serveur.requetes.map((r) => [r.cle, r.corps])).toEqual([
      ['put /lms/emplois-du-temps/3', { titre: 'S2', du: '2026-12-07', au: '2027-02-28', en_vigueur: false }],
      ['delete /lms/emplois-du-temps/3', undefined],
      ['post /lms/emplois-du-temps/3/copier', { classe_id: 11, du: '2027-02-01', au: '2027-06-30' }],
      ['get /lms/emplois-du-temps/alertes', undefined],
    ])
  })
})

describe('#676 — l’accès suit la capacité du serveur, jamais un mode', () => {
  it.each([['admin'], ['coordinateur']])('%s : le menu offre l’entrée avec la capacité, jamais sans', (role) => {
    expect(NAV_SECTIONS.find((i) => i.to === LISTE)).toMatchObject({ capacite: CAPACITE })
    connecter(role, true)
    expect(chemins(useNavigation().sections.value)).toContain(LISTE)
    connecter(role, false)
    expect(chemins(useNavigation().sections.value)).not.toContain(LISTE)
    connecter(role, undefined)
    expect(chemins(useNavigation().sections.value)).not.toContain(LISTE)
  })

  it.each([['coordinateur', 'secondaryNavItems'], ['admin', 'adminNavItems']])('%s : le tiroir mobile (%s) suit la capacité', (role, liste) => {
    const tiroir = () => {
      let rendu
      mount({ template: '<div />', setup() { rendu = useMobileSidebar({ isOpen: true }, () => {}); return {} } })
      return rendu
    }
    connecter(role, true)
    expect(chemins(tiroir()[liste].value)).toContain(LISTE)
    connecter(role, false)
    expect(chemins(tiroir()[liste].value)).not.toContain(LISTE)
  })

  it('les deux routes exigent la gestion et la capacité', () => {
    for (const chemin of [LISTE, `${LISTE}/:id`]) {
      const route = adminRoutes.find((r) => r.path === chemin)
      expect(route?.meta).toMatchObject({ requiresAuth: true, roles: ['superAdmin', 'admin', 'coordinateur'], capacite: CAPACITE })
    }
  })
})

describe('#676 — chaque motif du serveur a son texte (jamais celui du serveur)', () => {
  it.each([
    ['emploi_du_temps_hors_periode', 'emploiDuTempsHorsPeriode'],
    ['matiere_hors_programme', 'emploiDuTempsMatiereHorsProgramme'],
    ['grille_en_conflit', 'emploiDuTempsGrilleEnConflit'],
    ['enseignant_hors_ecole', 'emploiDuTempsEnseignantHorsEcole'],
    // lms_backend#1826 (#1763) : 409 de créer, générer, copier vers une classe archivée ; motif partagé avec l'inscription.
    ['class_archived', 'classeArchivee'],
  ])('%s', (reason, cle) => {
    expect(typeof ERROR_MESSAGES[cle]).toBe('string')
    expect(ERROR_MESSAGES[cle].length).toBeGreaterThan(10)
    expect(messageForReason(reason)).toBe(ERROR_MESSAGES[cle])
  })
})
