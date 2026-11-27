/**
 * #648 : l'admin d'une école autonome crée un compte (enseignant, élève, coordinateur) à l'écran, `POST /users`.
 *
 * Contrat lu sur lms (AdminController::createUser, CreateUserRequest, AssignableRole) :
 *   - corps : `name` (exigé, 255 au plus), `email` (exigé, unique DANS l'établissement), `password` (exigé, 8 au
 *     moins) et `password_confirmation` (règle `confirmed`), `role` (exigé, STRICTEMENT inférieur au rôle de
 *     l'acteur : etudiant 1 < enseignant 2 < coordinateur 3 < admin 4) ;
 *   - mode d'accès : un MOT DE PASSE INITIAL choisi par l'admin, aucun lien d'activation ;
 *   - 201 `{ data: user }` ; 422 par champ ; 403 motivé (acteur sans établissement, garde `gestion`).
 * Le formulaire vit sur `/admin/users`, ouvert par la capacité `peutInscrireLocalement` (école autonome) ; fermé en
 * école KLASSCI, dont les comptes viennent de KLASSCI. Ici le VRAI client HTTP : seul l'adaptateur réseau change.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { REASONS } from '@/services/refusalReasons'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { useAuthStore } from '@/stores/auth'
import { rolesAttribuables } from '@/utils/rolesAttribuables'
import CompteCreation from '@/components/admin/CompteCreation.vue'

let adaptateurOrigine
let requetes

function repondre(status, data) {
  api.defaults.adapter = async (config) => {
    requetes.push({ method: config.method, url: config.url, corps: config.data === undefined ? undefined : JSON.parse(config.data) })
    if (status === null) throw new AxiosError('timeout of 15000ms exceeded', AxiosError.ECONNABORTED, config)
    const response = { status, statusText: '', data: JSON.stringify(data), headers: { 'content-type': 'application/json' }, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}

const CREE = { success: true, data: { id: 31, name: 'Awa Fictive', email: 'awa@ecole.test', role: 'enseignant' } }
const SAISIE = { nom: 'Awa Fictive', courriel: 'awa@ecole.test', role: 'enseignant', motDePasse: 'motdepasse8', confirmation: 'motdepasse8' }
const champ = (w, nom) => w.find(`[data-champ="${nom}"]`)

async function remplirEtCreer(valeurs = SAISIE) {
  const w = mount(CompteCreation)
  for (const [nom, valeur] of Object.entries(valeurs)) await champ(w, nom).setValue(valeur)
  await w.find('form').trigger('submit')
  await flushPromises()
  return w
}

/** Le texte de l'élément qui décrit un champ (aria-describedby), ou ''. */
function description(w, nom) {
  const ids = (champ(w, nom).attributes('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
  return ids.map((id) => w.find(`#${id}`)).filter((e) => e.exists()).map((e) => e.text()).join(' ')
}

beforeEach(() => {
  setActivePinia(createPinia())
  useAuthStore().user = { id: 1, name: 'Admin fictif', role: 'admin' }
  adaptateurOrigine = api.defaults.adapter
  requetes = []
})

afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('#648 — les rôles offerts : strictement inférieurs à celui de l’acteur (miroir d’AssignableRole)', () => {
  it('admin (et superAdmin d’établissement) : coordinateur, enseignant, élève', () => {
    expect(rolesAttribuables('admin')).toEqual(['coordinateur', 'enseignant', 'etudiant'])
    expect(rolesAttribuables('superAdmin')).toEqual(['coordinateur', 'enseignant', 'etudiant'])
  })

  it('coordinateur : enseignant, élève ; enseignant, élève, inconnu : aucun', () => {
    expect(rolesAttribuables('coordinateur')).toEqual(['enseignant', 'etudiant'])
    for (const r of ['enseignant', 'etudiant', 'supradmin', null, 'xyz']) expect(rolesAttribuables(r)).toEqual([])
  })

  it('le sélecteur du formulaire offre ces rôles, avec leur nom affiché', () => {
    const w = mount(CompteCreation)
    const options = champ(w, 'role').findAll('option').filter((o) => o.attributes('value'))
    expect(options.map((o) => [o.attributes('value'), o.text()])).toEqual([
      ['coordinateur', 'Coordinateur'], ['enseignant', 'Enseignant'], ['etudiant', 'Étudiant'],
    ])
  })
})

describe('#648 — contrôle local, sans appel réseau', () => {
  it.each([
    ['nom', { ...SAISIE, nom: '  ' }, ERROR_MESSAGES.compteNomRequis],
    ['courriel', { ...SAISIE, courriel: '' }, ERROR_MESSAGES.compteCourrielRequis],
    ['role', { ...SAISIE, role: '' }, ERROR_MESSAGES.compteRoleRequis],
    ['motDePasse', { ...SAISIE, motDePasse: 'court', confirmation: 'court' }, ERROR_MESSAGES.compteMotDePasseCourt],
    ['confirmation', { ...SAISIE, confirmation: 'autrechose' }, ERROR_MESSAGES.compteConfirmationDifferente],
  ])('%s fautif : le texte du catalogue sous le champ, aucune requête', async (nom, valeurs, texte) => {
    repondre(201, CREE)
    const w = await remplirEtCreer(valeurs)
    expect(requetes).toEqual([])
    expect(description(w, nom)).toContain(texte)
    expect(champ(w, nom).attributes('aria-invalid')).toBe('true')
  })
})

describe('#648 — POST /users', () => {
  it('201 : le corps EXACT du contrat, l’annonce, la saisie vidée (mots de passe compris), `cree` émis', async () => {
    repondre(201, CREE)
    const w = await remplirEtCreer()
    expect(requetes).toEqual([{ method: 'post', url: '/users', corps: {
      name: 'Awa Fictive', email: 'awa@ecole.test', password: 'motdepasse8', password_confirmation: 'motdepasse8', role: 'enseignant',
    } }])
    expect(w.find('[role="status"]').text()).toContain('Awa Fictive')
    expect(w.find('[role="status"]').text()).toContain('Enseignant')
    for (const nom of ['nom', 'courriel', 'motDePasse', 'confirmation']) expect(champ(w, nom).element.value).toBe('')
    expect(w.emitted('cree')).toEqual([[CREE.data]])
  })

  it('422 sur `email` : le texte sous le champ du courriel, relié (aria-describedby) ; la saisie GARDÉE', async () => {
    repondre(422, { success: false, message: 'Erreur de validation', errors: { email: ['Un compte existe déjà avec cette adresse.'] } })
    const w = await remplirEtCreer()
    expect(description(w, 'courriel')).toContain('Un compte existe déjà avec cette adresse.')
    expect(champ(w, 'courriel').attributes('aria-invalid')).toBe('true')
    expect(champ(w, 'nom').element.value).toBe('Awa Fictive')
    expect(w.emitted('cree')).toBeUndefined()
  })

  it('422 sur `password` et `role` : chacun sous SON champ', async () => {
    repondre(422, { success: false, errors: { password: ['Trop faible.'], role: ['Rôle refusé.'] } })
    const w = await remplirEtCreer()
    expect(description(w, 'motDePasse')).toContain('Trop faible.')
    expect(description(w, 'role')).toContain('Rôle refusé.')
  })

  it('422 sur un champ absent de l’écran : le message général', async () => {
    repondre(422, { success: false, errors: { klassci_id: ['Doit être un entier.'] } })
    const w = await remplirEtCreer()
    expect(w.find('[role="alert"]').text()).toContain('Doit être un entier.')
  })

  it('403 `no_institution` (le refus réel de createUser) : le texte du CATALOGUE, jamais celui du serveur ; rien n’est émis', async () => {
    expect(REASONS.no_institution).toBeDefined()
    repondre(403, { success: false, message: 'Texte serveur, jamais affiché', reason: 'no_institution' })
    const w = await remplirEtCreer()
    expect(w.find('[role="alert"]').text()).not.toContain('Texte serveur, jamais affiché')
    expect(w.find('[role="alert"]').text()).toContain(ERROR_MESSAGES[REASONS.no_institution.categorie])
    expect(w.emitted('cree')).toBeUndefined()
    expect(w.emitted('incertain')).toBeUndefined()
  })

  it.each([[null], [500]])('sans réponse / %s : création INCERTAINE, dite, et la liste est relue (`incertain`)', async (statut) => {
    repondre(statut, { success: false })
    const w = await remplirEtCreer()
    expect(w.find('[role="alert"]').text()).toContain(ERROR_MESSAGES.compteCreationIncertaine)
    expect(w.emitted('incertain')).toHaveLength(1)
  })

  it('un second envoi pendant le premier est ignoré (un seul POST)', async () => {
    let liberer
    api.defaults.adapter = (config) => {
      requetes.push(config.url)
      return new Promise((r) => { liberer = () => r({ status: 201, statusText: '', data: JSON.stringify(CREE), headers: { 'content-type': 'application/json' }, config }) })
    }
    const w = mount(CompteCreation)
    for (const [nom, valeur] of Object.entries(SAISIE)) await champ(w, nom).setValue(valeur)
    await w.find('form').trigger('submit')
    await w.find('form').trigger('submit')
    liberer()
    await flushPromises()
    expect(requetes).toEqual(['/users'])
  })
})
