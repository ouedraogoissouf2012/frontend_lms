/**
 * #631 (lms_backend#1358, PR #1424) : une école autonome règle la capacité d'une classe à l'écran.
 *
 * Contrat : `PUT /classes/{classe}/capacite`, corps `{ effectif: 0..10000 | null }` EXIGÉ (null ou 0 =
 * sans limite), réponse `data: { id, effectif | null }`. `GET /classes` rend `effectif`, la capacité, ou
 * null sans limite (jamais 0). En école KLASSCI : 403 `catalogue_managed_by_klassci`.
 *
 * Le geste vit sur les cartes de « Codes d'inscription », la seule liste des classes LOCALES (l'écran est
 * gardé par `peutInscrireLocalement`). Contrôle local d'abord (aucun appel pour une saisie illisible),
 * puis le PUT, puis la RELECTURE de `data.effectif` : l'écran dit ce que le serveur a enregistré, pas
 * ce qui a été tapé. Aucun avertissement sur l'effectif inscrit : la liste ne le porte pas.
 *
 * Ici le VRAI client HTTP (api.js et ses intercepteurs) : seul l'adaptateur réseau est remplacé.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { endpoints } from '@/services/endpoints'
import { enrolmentCodesService } from '@/services/enrolmentCodes'
import { useEnrolmentCodes } from '@/composables/useEnrolmentCodes'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import ClasseCapacite from '@/components/admin/ClasseCapacite.vue'
import EnrolmentCodeCard from '@/components/admin/EnrolmentCodeCard.vue'

const PIEGE = 'Texte serveur, jamais affiché'
const AIDE = "Laissez vide pour ne pas limiter. Baisser la capacité n'exclut aucun élève déjà inscrit : seules les nouvelles adhésions sont refusées."
let adaptateurOrigine
let requetes

// Le corps arrive en TEXTE, comme du réseau. `status: null` : aucune réponse (délai, réseau).
function repondre(status, data) {
  api.defaults.adapter = async (config) => {
    requetes.push({ method: config.method, url: config.url, corps: config.data === undefined ? undefined : JSON.parse(config.data) })
    if (status === null) throw new AxiosError('timeout of 15000ms exceeded', AxiosError.ECONNABORTED, config)
    const response = { status, statusText: '', data: JSON.stringify(data), headers: { 'content-type': 'application/json' }, config }
    if (status >= 200 && status < 300) return response
    throw new AxiosError(`HTTP ${status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
  }
}

const classe = (extra = {}) => ({ id: 7, libelle: '6e A fictive', code: 'F6A', effectif: 30, code_inscription: { etat: 'absent', valeur: null }, ...extra })

async function regler(saisie, cl = classe()) {
  const w = mount(ClasseCapacite, { props: { classe: cl } })
  await w.find('button.capacite-modifier').trigger('click')
  await w.find('input.capacite-saisie').setValue(saisie)
  await w.find('form').trigger('submit')
  await flushPromises()
  return w
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  requetes = []
})
afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('#631 — le chemin et le service', () => {
  it('enrolment.capacite(id) → /classes/{id}/capacite (spec du back, sans préfixe /lms)', () => {
    expect(endpoints.enrolment.capacite(7)).toBe('/classes/7/capacite')
  })

  it('reglerCapacite envoie PUT { effectif } et rend la réponse', async () => {
    repondre(200, { success: true, data: { id: 7, effectif: 25 } })
    await expect(enrolmentCodesService.reglerCapacite(7, 25)).resolves.toMatchObject({ data: { id: 7, effectif: 25 } })
    expect(requetes).toEqual([{ method: 'put', url: '/classes/7/capacite', corps: { effectif: 25 } }])
  })

  it('« sans limite » envoie effectif: null, la clé est TOUJOURS présente (le back l’exige)', async () => {
    repondre(200, { success: true, data: { id: 7, effectif: null } })
    await enrolmentCodesService.reglerCapacite(7, null)
    expect(requetes[0].corps).toEqual({ effectif: null })
  })

  it('un faux succès (sans success: true) lève : rien de connu n’a été enregistré', async () => {
    repondre(200, { message: 'ok' })
    await expect(enrolmentCodesService.reglerCapacite(7, 25)).rejects.toThrow()
  })
})

describe('#631 — la capacité affichée dit ce que porte la liste', () => {
  it.each([
    [30, 'Capacité : 30 élèves'],
    [1, 'Capacité : 1 élève'],
    [null, 'Capacité : sans limite'],
  ])('effectif %s → « %s »', (effectif, texte) => {
    const w = mount(ClasseCapacite, { props: { classe: classe({ effectif }) } })
    expect(w.find('.capacite-valeur').text()).toBe(texte)
  })

  it('clé absente (serveur antérieur à #1424) : non communiquée, jamais un « sans limite » inventé', () => {
    const { effectif, ...sansCle } = classe()
    expect(effectif).toBe(30)
    const w = mount(ClasseCapacite, { props: { classe: sansCle } })
    expect(w.find('.capacite-valeur').text()).toBe('Capacité : non communiquée')
  })
})

describe('#631 — « Modifier la capacité »', () => {
  it('le formulaire a un champ ÉTIQUETÉ, pré-rempli, et la phrase d’aide lui est reliée', async () => {
    const w = mount(ClasseCapacite, { props: { classe: classe() } })
    await w.find('button.capacite-modifier').trigger('click')
    const champ = w.find('input.capacite-saisie')
    expect(w.find(`label[for="${champ.attributes('id')}"]`).text()).toBe('Capacité (nombre d’élèves)')
    expect(champ.element.value).toBe('30')
    expect(w.find(`#${champ.attributes('aria-describedby')}`).text()).toBe(AIDE)
  })

  it('25 : PUT { effectif: 25 }, puis la carte émet la valeur RELUE du serveur', async () => {
    repondre(200, { success: true, data: { id: 7, effectif: 25 } })
    const w = await regler('25')
    expect(requetes).toEqual([{ method: 'put', url: '/classes/7/capacite', corps: { effectif: 25 } }])
    expect(w.emitted('regle')).toEqual([[25]])
    expect(w.find('form').exists()).toBe(false)
  })

  it('vide : PUT { effectif: null }, « sans limite »', async () => {
    repondre(200, { success: true, data: { id: 7, effectif: null } })
    const w = await regler('  ')
    expect(requetes[0].corps).toEqual({ effectif: null })
    expect(w.emitted('regle')).toEqual([[null]])
  })

  it('0 : envoyé tel quel ; le serveur le relit null, et c’est null qui est émis', async () => {
    repondre(200, { success: true, data: { id: 7, effectif: null } })
    const w = await regler('0')
    expect(requetes[0].corps).toEqual({ effectif: 0 })
    expect(w.emitted('regle')).toEqual([[null]])
  })

  it.each(['abc', '-3', '10001', '2.5', '1e3', '12 élèves'])('saisie illisible « %s » : texte du catalogue, AUCUN appel', async (saisie) => {
    repondre(200, { success: true, data: { id: 7, effectif: 1 } })
    const w = await regler(saisie)
    expect(requetes).toEqual([])
    expect(w.find('[role="alert"]').text()).toBe(ERROR_MESSAGES.capaciteIllisible)
    expect(w.find('input.capacite-saisie').attributes('aria-invalid')).toBe('true')
    expect(w.emitted('regle')).toBeUndefined()
  })

  it('« Annuler » ferme le formulaire sans appel', async () => {
    repondre(200, { success: true, data: { id: 7, effectif: 1 } })
    const w = mount(ClasseCapacite, { props: { classe: classe() } })
    await w.find('button.capacite-modifier').trigger('click')
    await w.find('button.capacite-annuler').trigger('click')
    expect(w.find('form').exists()).toBe(false)
    expect(requetes).toEqual([])
  })
})

describe('#631 — les refus sont lus dans le catalogue (D0)', () => {
  it('403 catalogue_managed_by_klassci : le texte du catalogue, jamais celui du serveur, aucun « Réessayer »', async () => {
    repondre(403, { success: false, message: PIEGE, reason: 'catalogue_managed_by_klassci' })
    const w = await regler('25')
    expect(w.find('[role="alert"]').text()).toBe(ERROR_MESSAGES.catalogueGereParKlassci)
    expect(w.text()).not.toContain(PIEGE)
    expect(w.text()).not.toMatch(/réessayer/i)
    expect(w.emitted('regle')).toBeUndefined()
  })

  it('404 (classe hors de l’établissement) : le texte du catalogue', async () => {
    repondre(404, { success: false, message: PIEGE })
    const w = await regler('25')
    expect(w.find('[role="alert"]').text()).toBe(ERROR_MESSAGES.notFound)
    expect(w.text()).not.toContain(PIEGE)
  })

  it('sans réponse (délai) : la capacité devient INCERTAINE, plus affichée comme sûre', async () => {
    repondre(null)
    const w = await regler('25')
    expect(w.find('[role="alert"]').text()).not.toBe('')
    expect(w.find('.capacite-valeur').text()).toBe(ERROR_MESSAGES.capaciteIncertaine)
    expect(w.emitted('regle')).toBeUndefined()
  })

  it('un succès sans effectif relisible n’est pas cru : rien n’est émis', async () => {
    repondre(200, { success: true, data: { id: 7 } })
    const w = await regler('25')
    expect(w.emitted('regle')).toBeUndefined()
    expect(w.find('[role="alert"]').text()).not.toBe('')
  })

  it('les textes du front sont sans jargon', () => {
    for (const t of [ERROR_MESSAGES.capaciteIllisible, ERROR_MESSAGES.capaciteIncertaine]) {
      expect(t).toMatch(/^[A-ZÀ-Ý]/)
      expect(t).not.toMatch(/effectif|null|klassci|undefined/i)
    }
  })
})

describe('#631 — la liste garde la valeur relue', () => {
  it('majCapacite ne change que la classe visée, et seulement son effectif', () => {
    const codes = useEnrolmentCodes()
    codes.classes.value = [classe(), classe({ id: 8, libelle: '5e B fictive', effectif: null })]
    codes.majCapacite(7, 12)
    expect(codes.classes.value.map((c) => [c.id, c.effectif, c.libelle])).toEqual([[7, 12, '6e A fictive'], [8, null, '5e B fictive']])
  })

  it('l’écran relie l’événement de la carte à la liste', () => {
    const vue = readFileSync(resolve(process.cwd(), 'src/views/admin/AdminEnrolmentCodes.vue'), 'utf8')
    expect(vue).toMatch(/@capacite="majCapacite\(c\.id, \$event\)"/)
  })
})

describe('#631 — la carte de « Codes d’inscription » porte la capacité', () => {
  it('la carte affiche la capacité et relaie la valeur relue en « capacite »', async () => {
    repondre(200, { success: true, data: { id: 7, effectif: 12 } })
    const w = mount(EnrolmentCodeCard, { props: { classe: classe() } })
    expect(w.text()).toContain('Capacité : 30 élèves')
    await w.find('button.capacite-modifier').trigger('click')
    await w.find('input.capacite-saisie').setValue('12')
    await w.find('form').trigger('submit')
    await flushPromises()
    expect(w.emitted('capacite')).toEqual([[12]])
  })
})
