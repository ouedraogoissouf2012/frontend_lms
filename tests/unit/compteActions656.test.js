/**
 * #656, lot (b) : dans la fiche d'un compte, l'admin MODIFIE, DÉSACTIVE ou définit le MOT DE PASSE.
 *
 * Contrat lu sur la spec lms (#1728, #1275) :
 *   - `PUT /users/{user}` : `name`, `email`, `role` facultatifs, seuls ceux envoyés changent ; 422 par champ
 *     (`role` égal ou supérieur à celui de l'acteur, `email` déjà pris dans l'école) ;
 *   - `DELETE /users/{user}` : suppression logique, dossier conservé, sessions fermées ;
 *   - `PUT /users/{user}/password` : `password` (8 au moins) et `password_confirmation` ; 403
 *     `password_managed_by_klassci` dans une école KLASSCI ;
 *   - `{user}` est l'id LOCAL de la ligne (`lms_id`), jamais un id KLASSCI.
 * Les actions offertes suivent `gestionDeCompte` (testée à part). Ici le VRAI client HTTP : seul l'adaptateur change.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { useAuthStore } from '@/stores/auth'
import CompteActions from '@/components/admin/CompteActions.vue'

let adaptateurOrigine
let requetes

/** Une réponse par appel, dans l'ordre ; `null` : pas de réponse (délai dépassé). */
function repondre(...reponses) {
  api.defaults.adapter = async (config) => {
    requetes.push({ method: config.method, url: config.url, corps: config.data === undefined ? undefined : JSON.parse(config.data) })
    const [status, data] = reponses.length > 1 ? reponses.shift() : reponses[0]
    if (status === null) throw new AxiosError('timeout of 15000ms exceeded', AxiosError.ECONNABORTED, config)
    const response = { status, statusText: '', data: JSON.stringify(data), headers: { 'content-type': 'application/json' }, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}

const ELEVE = Object.freeze({
  _uid: 'etu-101', lms_id: 101, klassci_id: null, name: 'Bruno Fictif', email: 'bruno@ecole.test',
  role: 'etudiant', role_brut: 'etudiant', classe_nom: null,
})
const OK_MODIFIE = { success: true, message: 'Utilisateur mis à jour', data: { id: 101, name: 'Bruno Corrigé', email: 'bruno@ecole.test', role: 'etudiant', institution_id: 3 } }

function connecter(role, { autonome = true, id = 1 } = {}) {
  const auth = useAuthStore()
  auth.user = { id, name: 'Acteur fictif', role }
  auth.meta = { peut_inscrire_localement: autonome }
}

const monter = (ligne = ELEVE) => mount(CompteActions, { props: { ligne } })
const champ = (w, nom) => w.find(`[data-champ="${nom}"]`)
const actions = (w) => w.findAll('[data-action]').map((b) => b.attributes('data-action'))

/** Le texte de l'élément qui décrit un champ (aria-describedby), ou ''. */
function description(w, nom) {
  const ids = (champ(w, nom).attributes('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
  return ids.map((id) => w.find(`#${id}`)).filter((e) => e.exists()).map((e) => e.text()).join(' ')
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  requetes = []
})

afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('#656 (b) — les actions offertes', () => {
  it('admin d’une école autonome, sur un élève : modifier, désactiver, mot de passe', () => {
    connecter('admin')
    expect(actions(monter())).toEqual(['modifier', 'desactiver', 'mot-de-passe'])
  })

  it('coordinateur : modifier et désactiver, jamais le mot de passe', () => {
    connecter('coordinateur')
    expect(actions(monter())).toEqual(['modifier', 'desactiver'])
  })

  it('école KLASSCI : un élève sans id local n’offre rien ; un coordinateur, modifier et désactiver', () => {
    connecter('admin', { autonome: false })
    expect(monter({ ...ELEVE, lms_id: undefined, klassci_id: 900 }).find('.compte-actions').exists()).toBe(false)
    expect(actions(monter({ ...ELEVE, role: 'coordinateur', role_brut: 'coordinateur' }))).toEqual(['modifier', 'desactiver'])
  })

  it('ni soi-même, ni un rang égal : aucune action', () => {
    connecter('admin', { id: 101 })
    expect(monter().find('.compte-actions').exists()).toBe(false)
    connecter('admin')
    expect(monter({ ...ELEVE, role: 'admin', role_brut: 'admin' }).find('.compte-actions').exists()).toBe(false)
  })
})

describe('#656 (b) — modifier', () => {
  beforeEach(() => connecter('admin'))

  async function ouvrir(ligne = ELEVE) {
    const w = monter(ligne)
    await w.find('[data-action="modifier"]').trigger('click')
    return w
  }

  it('n’envoie que les champs CHANGÉS, à l’id LOCAL, puis annonce le succès', async () => {
    repondre([200, OK_MODIFIE])
    const w = await ouvrir()
    expect(champ(w, 'nom').element.value).toBe('Bruno Fictif')
    await champ(w, 'nom').setValue('Bruno Corrigé')
    await w.find('[data-form="modifier"]').trigger('submit')
    await flushPromises()

    expect(requetes).toEqual([{ method: 'put', url: '/users/101', corps: { name: 'Bruno Corrigé' } }])
    expect(w.emitted('fait')).toEqual([[{ acte: 'modifie' }]])
  })

  it('le rôle offert est strictement inférieur à celui de l’acteur ; le changer l’envoie', async () => {
    repondre([200, OK_MODIFIE])
    const w = await ouvrir()
    const offerts = champ(w, 'role').findAll('option').filter((o) => o.attributes('disabled') === undefined).map((o) => o.attributes('value'))
    expect(offerts).toEqual(['coordinateur', 'enseignant', 'etudiant'])
    await champ(w, 'role').setValue('enseignant')
    await w.find('[data-form="modifier"]').trigger('submit')
    await flushPromises()

    expect(requetes[0].corps).toEqual({ role: 'enseignant' })
  })

  it('rien de changé : aucun appel, et un message le dit', async () => {
    repondre([200, OK_MODIFIE])
    const w = await ouvrir()
    await w.find('[data-form="modifier"]').trigger('submit')
    await flushPromises()

    expect(requetes).toEqual([])
    expect(w.find('[role="alert"]').text()).toBe(ERROR_MESSAGES.compteRienAModifier)
  })

  it('un 422 range chaque erreur sous SON champ, et garde la saisie', async () => {
    repondre([422, { success: false, message: 'Validation', errors: { email: ['Cette adresse est déjà utilisée.'] } }])
    const w = await ouvrir()
    await champ(w, 'courriel').setValue('pris@ecole.test')
    await w.find('[data-form="modifier"]').trigger('submit')
    await flushPromises()

    expect(description(w, 'courriel')).toContain('Cette adresse est déjà utilisée.')
    expect(champ(w, 'courriel').element.value).toBe('pris@ecole.test')
    expect(w.emitted('fait')).toBeUndefined()
  })

  it('sans réponse : l’acte est INCERTAIN, la liste sera relue', async () => {
    repondre([null])
    const w = await ouvrir()
    await champ(w, 'nom').setValue('Bruno Corrigé')
    await w.find('[data-form="modifier"]').trigger('submit')
    await flushPromises()

    expect(w.emitted('incertain')).toHaveLength(1)
    expect(w.find('[role="alert"]').text()).toContain(ERROR_MESSAGES.compteActeIncertain)
  })
})

describe('#656 (b) — désactiver', () => {
  beforeEach(() => connecter('admin'))

  it('demande confirmation, dit ce que fait l’acte, puis DELETE à l’id local', async () => {
    repondre([200, { success: true, message: 'Utilisateur supprimé' }])
    const w = monter()
    await w.find('[data-action="desactiver"]').trigger('click')
    expect(requetes).toEqual([])
    expect(w.text()).toMatch(/dossier.*conservé/i)
    expect(w.text()).toMatch(/sessions/i)

    await w.find('[data-confirmer="desactiver"]').trigger('click')
    await flushPromises()

    expect(requetes).toEqual([{ method: 'delete', url: '/users/101', corps: undefined }])
    expect(w.emitted('fait')).toEqual([[{ acte: 'desactive' }]])
  })

  it('un refus (403) se dit, rien n’est émis', async () => {
    repondre([403, { success: false, message: 'Accès refusé' }])
    const w = monter()
    await w.find('[data-action="desactiver"]').trigger('click')
    await w.find('[data-confirmer="desactiver"]').trigger('click')
    await flushPromises()

    expect(w.find('[role="alert"]').text()).not.toBe('')
    expect(w.emitted('fait')).toBeUndefined()
    expect(w.emitted('incertain')).toBeUndefined()
  })
})

describe('#656 (b) — définir le mot de passe', () => {
  beforeEach(() => connecter('admin'))

  async function saisir(motDePasse, confirmation) {
    const w = monter()
    await w.find('[data-action="mot-de-passe"]').trigger('click')
    await champ(w, 'motDePasse').setValue(motDePasse)
    await champ(w, 'confirmation').setValue(confirmation)
    await w.find('[data-form="mot-de-passe"]').trigger('submit')
    await flushPromises()
    return w
  }

  it('PUT à l’id local, sans jamais afficher le mot de passe ; la saisie est vidée', async () => {
    repondre([200, { success: true, message: 'Mot de passe défini.' }])
    const w = await saisir('nouveau-mdp-8', 'nouveau-mdp-8')

    expect(requetes).toEqual([{ method: 'put', url: '/users/101/password', corps: { password: 'nouveau-mdp-8', password_confirmation: 'nouveau-mdp-8' } }])
    expect(w.emitted('fait')).toEqual([[{ acte: 'mot_de_passe' }]])
    expect(champ(w, 'motDePasse').element.value).toBe('')
    expect(w.text()).not.toContain('nouveau-mdp-8')
  })

  it('trop court ou non confirmé : refusé à l’écran, sans appel', async () => {
    repondre([200, {}])
    const court = await saisir('court', 'court')
    expect(description(court, 'motDePasse')).toBe(ERROR_MESSAGES.compteMotDePasseCourt)
    const different = await saisir('nouveau-mdp-8', 'autre-mdp-88')
    expect(description(different, 'confirmation')).toBe(ERROR_MESSAGES.compteConfirmationDifferente)
    expect(requetes).toEqual([])
  })

  it('école KLASSCI côté serveur : le motif password_managed_by_klassci est dit', async () => {
    repondre([403, { success: false, message: 'Refusé', reason: 'password_managed_by_klassci' }])
    const w = await saisir('nouveau-mdp-8', 'nouveau-mdp-8')

    expect(w.find('[role="alert"]').text()).toBe(ERROR_MESSAGES.motDePasseGereParKlassci)
    expect(w.emitted('fait')).toBeUndefined()
  })
})
