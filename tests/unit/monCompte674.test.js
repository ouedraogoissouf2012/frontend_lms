/**
 * #674 : chacun change SON mot de passe et SON profil depuis ses réglages (admin, enseignant, élève).
 *
 * Contrat serveur (lms_backend#1667, PR #1738) :
 *   - `PUT /auth/me/password` { current_password, password, password_confirmation } : 200 ; les AUTRES sessions du
 *     compte sont fermées, la courante survit. 422 par champ (`current_password` faux, `password` trop court, non
 *     confirmé ou identique). 403 `password_managed_by_klassci` (école reliée à son système de gestion).
 *   - `PATCH /auth/me` { name, phone } : 200 { data: { name, phone } }. 422 par champ. 403 `profile_managed_by_klassci`.
 * Le module « indisponible » (constante, bannière, toasts) disparaît : la fonction existe. Ici le VRAI client HTTP.
 */
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { REASONS } from '@/services/refusalReasons'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { useAuthStore } from '@/stores/auth'
import MonMotDePasseModal from '@/components/compte/MonMotDePasseModal.vue'
import MonProfilForm from '@/components/compte/MonProfilForm.vue'

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

const champ = (w, nom) => w.find(`[data-champ="${nom}"]`)
function description(w, nom) {
  const ids = (champ(w, nom).attributes('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
  return ids.map((id) => w.find(`#${id}`)).filter((e) => e.exists()).map((e) => e.text()).join(' ')
}

beforeEach(() => {
  setActivePinia(createPinia())
  useAuthStore().user = { id: 7, name: 'Awa Fictive', phone: '+226 70 00 00 00', role: 'enseignant' }
  adaptateurOrigine = api.defaults.adapter
  requetes = []
  sessionStorage.clear()
})

afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

// ─────────────────────────────────────────── mot de passe ───────────────────────────────────────────

const monterModale = () => mount(MonMotDePasseModal, { props: { show: true }, global: { stubs: { teleport: true } } })

async function changer(valeurs) {
  const w = monterModale()
  for (const [nom, valeur] of Object.entries(valeurs)) await champ(w, nom).setValue(valeur)
  await w.find('form').trigger('submit')
  await flushPromises()
  return w
}

const BON = { actuel: 'Ancien-mdp-674', nouveau: 'Nouveau-mdp-674', confirmation: 'Nouveau-mdp-674' }

describe('#674 — changer son mot de passe (PUT /auth/me/password)', () => {
  it.each([
    ['actuel', { ...BON, actuel: '' }, ERROR_MESSAGES.monMotDePasseActuelRequis],
    ['nouveau', { ...BON, nouveau: 'court', confirmation: 'court' }, ERROR_MESSAGES.monMotDePasseCourt],
    ['confirmation', { ...BON, confirmation: 'autre-chose-674' }, ERROR_MESSAGES.monMotDePasseConfirmation],
    ['nouveau', { ...BON, nouveau: BON.actuel, confirmation: BON.actuel }, ERROR_MESSAGES.monMotDePasseIdentique],
  ])('%s fautif : le texte du catalogue sous le champ, aucune requête', async (nom, valeurs, texte) => {
    repondre(200, { success: true, message: 'Mot de passe changé.' })
    const w = await changer(valeurs)
    expect(requetes).toEqual([])
    expect(description(w, nom)).toContain(texte)
    expect(champ(w, nom).attributes('aria-invalid')).toBe('true')
  })

  it('200 : le corps EXACT, l’annonce dit que les autres sessions sont fermées, la saisie est vidée', async () => {
    repondre(200, { success: true, message: 'Mot de passe changé.' })
    const w = await changer(BON)
    expect(requetes).toEqual([{ method: 'put', url: '/auth/me/password', corps: {
      current_password: BON.actuel, password: BON.nouveau, password_confirmation: BON.confirmation,
    } }])
    expect(w.find('[role="status"]').text()).toContain(ERROR_MESSAGES.monMotDePasseChange)
    for (const nom of ['actuel', 'nouveau', 'confirmation']) expect(champ(w, nom).element.value).toBe('')
  })

  it('422 sur `current_password` : sous le champ du mot de passe actuel, la saisie gardée', async () => {
    repondre(422, { success: false, errors: { current_password: ['Le mot de passe actuel est incorrect.'] } })
    const w = await changer(BON)
    expect(description(w, 'actuel')).toContain('Le mot de passe actuel est incorrect.')
    expect(champ(w, 'nouveau').element.value).toBe(BON.nouveau)
  })

  it('403 `password_managed_by_klassci` : le texte du CATALOGUE (où le changer), jamais celui du serveur', async () => {
    expect(REASONS.password_managed_by_klassci).toBeDefined()
    repondre(403, { success: false, message: 'Texte serveur', reason: 'password_managed_by_klassci' })
    const w = await changer(BON)
    expect(w.find('[role="alert"]').text()).toContain(ERROR_MESSAGES[REASONS.password_managed_by_klassci.categorie])
    expect(w.find('[role="alert"]').text()).not.toContain('Texte serveur')
  })

  it.each([[null], [500]])('sans réponse / %s : changement INCERTAIN, dit tel quel', async (statut) => {
    repondre(statut, { success: false })
    const w = await changer(BON)
    expect(w.find('[role="alert"]').text()).toContain(ERROR_MESSAGES.monMotDePasseIncertain)
  })
})

// ─────────────────────────────────────────── profil ───────────────────────────────────────────

async function modifierProfil(valeurs) {
  const w = mount(MonProfilForm)
  for (const [nom, valeur] of Object.entries(valeurs)) await champ(w, nom).setValue(valeur)
  await w.find('form').trigger('submit')
  await flushPromises()
  return w
}

describe('#674 — modifier son profil (PATCH /auth/me)', () => {
  it('la saisie part des valeurs du compte connecté', () => {
    const w = mount(MonProfilForm)
    expect([champ(w, 'nom').element.value, champ(w, 'telephone').element.value]).toEqual(['Awa Fictive', '+226 70 00 00 00'])
  })

  it('nom vide : le texte du catalogue, aucune requête', async () => {
    repondre(200, {})
    const w = await modifierProfil({ nom: '  ' })
    expect(requetes).toEqual([])
    expect(description(w, 'nom')).toContain(ERROR_MESSAGES.monProfilNomRequis)
  })

  it('200 : corps EXACT (téléphone vide → nul), le compte connecté est mis à jour et gardé pour la session', async () => {
    repondre(200, { success: true, message: 'Profil mis à jour.', data: { name: 'Awa Nouvelle', phone: null } })
    const w = await modifierProfil({ nom: ' Awa Nouvelle ', telephone: '' })
    expect(requetes).toEqual([{ method: 'patch', url: '/auth/me', corps: { name: 'Awa Nouvelle', phone: null } }])
    expect(useAuthStore().user).toMatchObject({ name: 'Awa Nouvelle', phone: null })
    expect(JSON.parse(sessionStorage.getItem('user'))).toMatchObject({ name: 'Awa Nouvelle', phone: null })
    expect(w.find('[role="status"]').text()).toContain(ERROR_MESSAGES.monProfilModifie)
  })

  it('403 `profile_managed_by_klassci` : le texte du CATALOGUE ; le compte connecté n’est pas touché', async () => {
    expect(REASONS.profile_managed_by_klassci).toBeDefined()
    repondre(403, { success: false, message: 'Texte serveur', reason: 'profile_managed_by_klassci' })
    const w = await modifierProfil({ nom: 'Saisie locale' })
    expect(w.find('[role="alert"]').text()).toContain(ERROR_MESSAGES[REASONS.profile_managed_by_klassci.categorie])
    expect(useAuthStore().user.name).toBe('Awa Fictive')
  })

  it('422 sur `phone` : sous le champ du téléphone', async () => {
    repondre(422, { success: false, errors: { phone: ['Le téléphone compte 40 caractères au plus.'] } })
    const w = await modifierProfil({ telephone: '1'.repeat(41) })
    expect(description(w, 'telephone')).toContain('Le téléphone compte 40 caractères au plus.')
  })
})

// ─────────────────────────────────────────── les trois espaces ───────────────────────────────────────────

function fichiers(dossier) {
  return readdirSync(dossier).flatMap((nom) => {
    const chemin = join(dossier, nom)
    return statSync(chemin).isDirectory() ? fichiers(chemin) : [chemin]
  })
}

describe('#674 — les trois espaces branchés, le module « indisponible » retiré', () => {
  it.each(['src/views/admin/AdminSettings.vue', 'src/views/teacher/TeacherSettings.vue', 'src/views/student/StudentSettings.vue'])(
    '%s monte la modale et le formulaire partagés', (f) => {
      const vue = readFileSync(resolve(process.cwd(), f), 'utf8')
      expect(vue).toContain("import MonMotDePasseModal from '@/components/compte/MonMotDePasseModal.vue'")
      expect(vue).toContain("import MonProfilForm from '@/components/compte/MonProfilForm.vue'")
    },
  )

  it('plus aucune trace du message d’indisponibilité ni de ses composants', () => {
    expect(existsSync(resolve(process.cwd(), 'src/constants/passwordChange.js'))).toBe(false)
    expect(existsSync(resolve(process.cwd(), 'src/components/ui/PasswordChangeUnavailableNotice.vue'))).toBe(false)
    const restes = fichiers(resolve(process.cwd(), 'src')).filter((f) => /PASSWORD_CHANGE_UNAVAILABLE|PasswordChangeUnavailableNotice/.test(readFileSync(f, 'utf8')))
    expect(restes).toEqual([])
  })
})
