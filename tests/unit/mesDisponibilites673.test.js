/**
 * #673 (contrat serveur lms_backend#1666, PR #1850) : « Mes disponibilités », la page où l'enseignant remplit lui-même
 * sa semaine type et ses exceptions datées (ARRÊT 1, Q3). Par le VRAI client HTTP.
 *   - `GET|PUT /lms/enseignants/{id}/disponibilites`, `POST …/exceptions`, `DELETE …/exceptions/{exceptionId}` ;
 *   - `{id}` est l'id LOCAL du compte : celui du compte connecté, dans les deux volets, sans aucun rapprochement ;
 *   - motif 422 `disponibilites_en_conflit` ;
 *   - la route, le menu ET le tiroir mobile de l'enseignant (les PR #722, #726, #734 l'avaient oublié).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'

vi.mock('vue-router', () => ({ useRoute: () => ({ path: '/teacher/disponibilites', params: {}, query: {} }), useRouter: () => ({ push: vi.fn() }) }))

import { useAuthStore } from '@/stores/auth'
import { useMobileSidebar } from '@/composables/useMobileSidebar'
import { NAV_SECTIONS } from '@/constants/navigation'
import { teacherRoutes } from '@/router/routes/teacher.routes'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { messageForReason } from '@/services/errorHandler'
import { endpoints } from '@/services/endpoints'
import { profilEnseignantService } from '@/services/profilEnseignant'
import MesDisponibilites from '@/views/teacher/MesDisponibilites.vue'
import { serveurFictif } from '../helpers/serveurFictif'

const MOI = 41
const DISPOS = { success: true, data: { enseignant_id: MOI, semaine: [
  { id: 1, jour: 1, debut: '08:00', fin: '12:00', disponible: true },
  { id: 2, jour: 3, debut: '14:00', fin: '16:00', disponible: false },
], exceptions: [{ id: 9, date: '2026-12-15', debut: null, fin: null, disponible: false, motif: 'Jury' }] } }

let serveur
function connecter(role = 'enseignant') {
  useAuthStore().setSession({ user: { id: MOI, role }, token: 't' }, {})
}
async function monter() {
  connecter()
  const w = mount(MesDisponibilites, { attachTo: document.body, global: { stubs: { DashboardLayout: { template: '<div><slot /></div>' }, ContentLoader: true } } })
  await flushPromises()
  return w
}
const champ = (w, nom) => w.find(`[data-champ="${nom}"]`)
const action = (w, nom) => w.find(`[data-action="${nom}"]`)

beforeEach(() => {
  setActivePinia(createPinia())
  sessionStorage.clear()
  document.body.innerHTML = ''
  serveur = serveurFictif()
  serveur.servir({ [`get /lms/enseignants/${MOI}/disponibilites`]: [200, DISPOS] })
})
afterEach(() => serveur.fermer())

describe('#673 — les chemins et le service, par le vrai client', () => {
  it('les chemins de la spec, sur l’id local', () => {
    const e = endpoints.enseignantsProfil
    expect([e.profil(41), e.disponibilites(41), e.exceptions(41), e.exception(41, 9)]).toEqual([
      '/lms/enseignants/41/profil', '/lms/enseignants/41/disponibilites',
      '/lms/enseignants/41/disponibilites/exceptions', '/lms/enseignants/41/disponibilites/exceptions/9',
    ])
  })

  it('la semaine part d’un bloc ; une réponse illisible n’est pas crue', async () => {
    serveur.servir({ [`put /lms/enseignants/${MOI}/disponibilites`]: [200, DISPOS] })
    await profilEnseignantService.enregistrerSemaine(MOI, [{ jour: 1, debut: '08:00', fin: '12:00', disponible: true }])
    expect(serveur.ecritures()[0].corps).toEqual({ semaine: [{ jour: 1, debut: '08:00', fin: '12:00', disponible: true }] })

    serveur.servir({ [`get /lms/enseignants/${MOI}/disponibilites`]: [200, { success: true, data: { semaine: 'x' } }] })
    await expect(profilEnseignantService.lireDisponibilites(MOI)).rejects.toBeTruthy()
  })

  it('une exception de journée entière n’envoie ni début ni fin', async () => {
    serveur.servir({ [`post /lms/enseignants/${MOI}/disponibilites/exceptions`]: [201, { success: true, data: DISPOS.data.exceptions[0] }] })
    await profilEnseignantService.ajouterException(MOI, { date: '2026-12-15', debut: '', fin: '', disponible: false, motif: ' Jury ' })
    expect(serveur.ecritures()[0].corps).toEqual({ date: '2026-12-15', disponible: false, motif: 'Jury' })
  })

  it('le motif disponibilites_en_conflit a son texte', () => {
    expect(messageForReason('disponibilites_en_conflit')).toBe(ERROR_MESSAGES.disponibilitesEnConflit)
  })
})

describe('#673 — la page « Mes disponibilités »', () => {
  it('lit les disponibilités du compte connecté (son id local)', async () => {
    const w = await monter()
    expect(serveur.requetes[0].cle).toBe(`get /lms/enseignants/${MOI}/disponibilites`)
    expect(w.find('[data-jour="1"]').text()).toMatch(/08:00.*12:00.*Disponible/)
    expect(w.find('[data-jour="3"]').text()).toMatch(/14:00.*16:00.*Indisponible/)
    expect(w.findAll('[data-exception]')[0].text()).toMatch(/15\/12\/2026.*journée entière.*Jury/)
    w.unmount()
  })

  it('ajoute un créneau puis enregistre la semaine d’un bloc', async () => {
    serveur.servir({ [`put /lms/enseignants/${MOI}/disponibilites`]: [200, DISPOS] })
    const w = await monter()
    await w.find('[data-ajouter="2"]').trigger('click')
    await champ(w, 'debut').setValue('09:00')
    await champ(w, 'fin').setValue('11:00')
    await champ(w, 'disponible').setValue('non')
    await action(w, 'valider-creneau').trigger('click')
    await action(w, 'enregistrer').trigger('click')
    await flushPromises()
    expect(serveur.ecritures()[0].corps).toEqual({ semaine: [
      { jour: 1, debut: '08:00', fin: '12:00', disponible: true },
      { jour: 3, debut: '14:00', fin: '16:00', disponible: false },
      { jour: 2, debut: '09:00', fin: '11:00', disponible: false },
    ] })
    expect(w.find('[role="status"]').text()).toContain('enregistr')
    w.unmount()
  })

  it('la fin avant le début : refusé avant l’envoi', async () => {
    const w = await monter()
    await w.find('[data-ajouter="2"]').trigger('click')
    await champ(w, 'debut').setValue('11:00')
    await champ(w, 'fin').setValue('09:00')
    await action(w, 'valider-creneau').trigger('click')
    expect(w.text()).toContain(ERROR_MESSAGES.disponibiliteFinAvantDebut)
    expect(w.find('[data-jour="2"] [data-creneau]').exists()).toBe(false)
    w.unmount()
  })

  it('un chevauchement refusé par le serveur est dit par le catalogue, et la saisie reste', async () => {
    serveur.servir({ [`put /lms/enseignants/${MOI}/disponibilites`]: [422, { success: false, message: 'Texte du serveur', reason: 'disponibilites_en_conflit' }] })
    const w = await monter()
    await action(w, 'enregistrer').trigger('click')
    await flushPromises()
    expect(w.find('[role="alert"]').text()).toBe(ERROR_MESSAGES.disponibilitesEnConflit)
    expect(w.findAll('[data-creneau]')).toHaveLength(2)
    w.unmount()
  })

  it('ajoute puis retire une exception datée', async () => {
    serveur.servir({
      [`post /lms/enseignants/${MOI}/disponibilites/exceptions`]: [201, { success: true, data: { id: 10, date: '2026-12-16', debut: '14:00', fin: '16:00', disponible: true, motif: null } }],
      [`delete /lms/enseignants/${MOI}/disponibilites/exceptions/9`]: [200, { success: true, message: 'Exception retirée' }],
    })
    const w = await monter()
    await champ(w, 'exception-date').setValue('2026-12-16')
    await champ(w, 'exception-debut').setValue('14:00')
    await champ(w, 'exception-fin').setValue('16:00')
    await champ(w, 'exception-disponible').setValue('oui')
    await w.find('[data-exception-form]').trigger('submit')
    await flushPromises()
    await w.findAll('[data-action="retirer-exception"]')[0].trigger('click')
    await flushPromises()
    expect(serveur.ecritures().map((r) => [r.cle, r.corps])).toEqual([
      [`post /lms/enseignants/${MOI}/disponibilites/exceptions`, { date: '2026-12-16', debut: '14:00', fin: '16:00', disponible: true }],
      [`delete /lms/enseignants/${MOI}/disponibilites/exceptions/9`, undefined],
    ])
    expect(w.findAll('[data-exception]').map((e) => e.text())).toEqual([expect.stringMatching(/16\/12\/2026/)])
    w.unmount()
  })
})

describe('#673 — l’accès : route, menu et tiroir de l’enseignant, dans les deux volets', () => {
  function tiroir(role) {
    connecter(role)
    let rendu
    mount({ template: '<div />', setup() { rendu = useMobileSidebar({ isOpen: true }, () => {}); return {} } })
    return [...rendu.secondaryNavItems.value, ...rendu.adminNavItems.value].map((i) => i.path)
  }

  it('la route est réservée à l’enseignant, sans capacité', () => {
    const route = teacherRoutes.find((r) => r.path === '/teacher/disponibilites')
    expect(route?.meta).toMatchObject({ requiresAuth: true })
    expect(route.meta.roles).toEqual(expect.arrayContaining(['enseignant']))
    expect(route.meta.capacite).toBeUndefined()
  })

  it('le menu de bureau et le tiroir mobile de l’enseignant portent l’entrée, une seule fois', () => {
    expect(NAV_SECTIONS.find((i) => i.to === '/teacher/disponibilites')).toMatchObject({ roles: ['enseignant'] })
    expect(tiroir('enseignant').filter((c) => c === '/teacher/disponibilites')).toHaveLength(1)
  })

  it.each([['etudiant'], ['coordinateur'], ['admin']])('%s : pas d’entrée au tiroir', (role) => {
    expect(tiroir(role)).not.toContain('/teacher/disponibilites')
  })
})
