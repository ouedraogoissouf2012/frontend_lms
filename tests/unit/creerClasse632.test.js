/**
 * #632 : une école autonome crée ses classes à l'écran, `POST /classes` (StoreClasseRequest, ClasseInput).
 *   - `libelle` exigé (191 au plus) ; `code` facultatif (50 au plus, unique par établissement) ; `description`
 *     facultative (2000 au plus) ; `effectif` facultatif (0 à 10 000). Une capacité VIDE n'envoie PAS la clé :
 *     le défaut du serveur (0) vaut « sans limite ». La période est OMISE (décision de la superviseure) : le
 *     rattachement reste le geste de PUT /classes/{id}/periode.
 *   - 201 `{ data: { id, libelle, code, effectif } }` ; 403 `catalogue_managed_by_klassci` ; 422 par champ ;
 *     422 `class_code_already_used` sur `code` (lms_backend#1521), relié au champ du code.
 * Le formulaire vit sur l'écran des classes locales, renommé « Classes et codes d'inscription » (la route ne change
 * pas). Ici le VRAI client HTTP : seul l'adaptateur réseau est remplacé.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { localClassesService } from '@/services/localClasses'
import { REASONS } from '@/services/refusalReasons'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import { NAV_SECTIONS } from '@/constants/navigation'
import ClasseCreation from '@/components/admin/ClasseCreation.vue'

const PIEGE = 'Texte serveur, jamais affiché'
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

const CREEE = { success: true, data: { id: 12, libelle: '6e C fictive', code: 'F6C', effectif: 28 } }
const champ = (w, nom) => w.find(`[data-champ="${nom}"]`)

async function remplirEtCreer(valeurs) {
  const w = mount(ClasseCreation)
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
  adaptateurOrigine = api.defaults.adapter
  requetes = []
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('#632 — le service localClasses.creerClasse', () => {
  it('POST /classes avec le libellé seul : aucune clé facultative vide n’est envoyée (capacité vide = défaut du serveur)', async () => {
    repondre(201, CREEE)
    await localClassesService.creerClasse({ libelle: '  6e C fictive ', code: ' ', description: '', effectif: null })
    expect(requetes).toEqual([{ method: 'post', url: '/classes', corps: { libelle: '6e C fictive' } }])
  })

  it('tous les champs : nettoyés, et la capacité en nombre', async () => {
    repondre(201, CREEE)
    await localClassesService.creerClasse({ libelle: '6e C fictive', code: ' F6C ', description: 'Groupe fictif', effectif: 28 })
    expect(requetes[0].corps).toEqual({ libelle: '6e C fictive', code: 'F6C', description: 'Groupe fictif', effectif: 28 })
  })

  it('jamais de période, d’établissement ni d’identifiant externe dans le corps', async () => {
    repondre(201, CREEE)
    await localClassesService.creerClasse({ libelle: 'X', training_session_id: 3, institution_id: 9, klassci_id: 7 })
    expect(requetes[0].corps).toEqual({ libelle: 'X' })
  })

  it('un succès sans classe relisible (data.id) n’est pas cru', async () => {
    repondre(201, { success: true, data: {} })
    await expect(localClassesService.creerClasse({ libelle: 'X' })).rejects.toThrow()
  })
})

describe('#632 — le motif du code en double (lms_backend#1521)', () => {
  it('class_code_already_used a son texte au catalogue ; refus définitif', () => {
    expect(REASONS.class_code_already_used).toEqual({ categorie: 'classeCodeDejaEmploye', transitoire: false })
    expect(ERROR_MESSAGES.classeCodeDejaEmploye).toMatch(/^[A-ZÀ-Ý]/)
    expect(ERROR_MESSAGES.classeCodeDejaEmploye).not.toMatch(/klassci|unique|null|422/i)
  })
})

describe('#632 — le formulaire « Nouvelle classe »', () => {
  it('quatre champs ÉTIQUETÉS, avec les bornes du serveur', () => {
    const w = mount(ClasseCreation)
    const attendus = { libelle: ['Libellé', '191'], code: ['Code (facultatif)', '50'], effectif: ['Capacité (facultative)', null], description: ['Description (facultative)', '2000'] }
    for (const [nom, [etiquette, max]] of Object.entries(attendus)) {
      const c = champ(w, nom)
      expect(w.find(`label[for="${c.attributes('id')}"]`).text()).toBe(etiquette)
      if (max) expect(c.attributes('maxlength')).toBe(max)
    }
    expect(champ(w, 'libelle').attributes('aria-required')).toBe('true')
    expect(w.find('h2').text()).toBe('Nouvelle classe')
  })

  it('201 : la classe créée est émise, le formulaire est vidé, l’écran le dit', async () => {
    repondre(201, CREEE)
    const w = await remplirEtCreer({ libelle: '6e C fictive', code: 'F6C', effectif: '28' })
    expect(w.emitted('creee')).toEqual([[CREEE.data]])
    expect(champ(w, 'libelle').element.value).toBe('')
    expect(w.find('[role="status"]').text()).toBe('Classe « 6e C fictive » créée.')
  })

  it('libellé vide : aucun appel, le refus est RELIÉ au champ', async () => {
    repondre(201, CREEE)
    const w = await remplirEtCreer({ libelle: '   ' })
    expect(requetes).toEqual([])
    expect(champ(w, 'libelle').attributes('aria-invalid')).toBe('true')
    expect(description(w, 'libelle')).toContain(ERROR_MESSAGES.classeLibelleRequis)
  })

  it('capacité illisible : aucun appel, le texte de #631 relié au champ', async () => {
    repondre(201, CREEE)
    const w = await remplirEtCreer({ libelle: '6e C fictive', effectif: '12 élèves' })
    expect(requetes).toEqual([])
    expect(champ(w, 'effectif').attributes('aria-invalid')).toBe('true')
    expect(description(w, 'effectif')).toContain(ERROR_MESSAGES.capaciteIllisible)
  })

  it('422 class_code_already_used : le texte du catalogue RELIÉ au champ du code ; la saisie est gardée', async () => {
    repondre(422, { success: false, message: PIEGE, reason: 'class_code_already_used', errors: { code: [PIEGE] } })
    const w = await remplirEtCreer({ libelle: '6e C fictive', code: 'F6C' })
    expect(champ(w, 'code').attributes('aria-invalid')).toBe('true')
    expect(description(w, 'code')).toContain(ERROR_MESSAGES.classeCodeDejaEmploye)
    expect(w.text()).not.toContain(PIEGE)
    expect(champ(w, 'code').element.value).toBe('F6C')
    expect(champ(w, 'libelle').element.value).toBe('6e C fictive')
    expect(w.emitted('creee')).toBeUndefined()
  })

  it('422 de validation sans motif : chaque erreur reste sous SON champ', async () => {
    repondre(422, { success: false, message: PIEGE, errors: { libelle: ['Le libellé est trop long.'] } })
    const w = await remplirEtCreer({ libelle: '6e C fictive' })
    expect(champ(w, 'libelle').attributes('aria-invalid')).toBe('true')
    expect(description(w, 'libelle')).toContain('Le libellé est trop long.')
    expect(champ(w, 'code').attributes('aria-invalid')).toBe('false')
  })

  it('403 catalogue_managed_by_klassci : le texte du catalogue, jamais celui du serveur, aucun « Réessayer »', async () => {
    repondre(403, { success: false, message: PIEGE, reason: 'catalogue_managed_by_klassci' })
    const w = await remplirEtCreer({ libelle: '6e C fictive' })
    expect(w.find('[role="alert"]').text()).toBe(ERROR_MESSAGES.catalogueGereParKlassci)
    expect(w.text()).not.toContain(PIEGE)
    expect(w.text()).not.toMatch(/réessayer/i)
  })

  it('sans réponse (délai) : la création est INCERTAINE, l’écran le dit et la liste est relue', async () => {
    repondre(null)
    const w = await remplirEtCreer({ libelle: '6e C fictive' })
    expect(w.find('[role="alert"]').text()).toContain(ERROR_MESSAGES.classeCreationIncertaine)
    expect(w.emitted('incertaine')).toHaveLength(1)
    expect(w.emitted('creee')).toBeUndefined()
  })

  it('deux envois rapides : une seule requête', async () => {
    let liberer
    api.defaults.adapter = (config) => new Promise((ok) => {
      requetes.push(config.url)
      liberer = () => ok({ status: 201, statusText: '', data: JSON.stringify(CREEE), headers: { 'content-type': 'application/json' }, config })
    })
    const w = mount(ClasseCreation)
    await champ(w, 'libelle').setValue('6e C fictive')
    await w.find('form').trigger('submit')
    await w.find('form').trigger('submit')
    liberer()
    await flushPromises()
    expect(requetes).toHaveLength(1)
  })
})

describe('#632 — l’écran s’appelle « Classes et codes d’inscription » (la route ne change pas)', () => {
  const source = (f) => readFileSync(resolve(process.cwd(), f), 'utf8')

  it('le menu, le menu mobile, le titre de la route et le fil d’Ariane disent le même nom', () => {
    expect(NAV_SECTIONS.find((i) => i.to === '/admin/enrolment-codes').label).toBe("Classes et codes d'inscription")
    expect(source('src/composables/useMobileSidebar.js')).toContain("path: '/admin/enrolment-codes', icon: 'fa-key', label: \"Classes et codes d'inscription\"")
    expect(source('src/router/routes/admin.routes.js')).toContain("title: \"Classes et codes d'inscription\"")
    expect(source('src/composables/useNavbar.js')).toContain("'enrolment-codes': \"Classes et codes d'inscription\"")
  })

  it('le titre de l’écran, et le formulaire relié à la liste', () => {
    const vue = source('src/views/admin/AdminEnrolmentCodes.vue')
    expect(vue).toContain("<h1 class=\"page-title\">Classes et codes d'inscription</h1>")
    expect(vue).toMatch(/<ClasseCreation\s+@creee="load\(\)"\s+@incertaine="load\(\)"\s*\/>/)
  })

  it('la route reste /admin/enrolment-codes, gardée par la capacité', () => {
    expect(source('src/router/routes/admin.routes.js')).toMatch(/path: '\/admin\/enrolment-codes'/)
  })
})
