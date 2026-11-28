/**
 * #690 : le personnel annonce à toute une classe, depuis la fiche de la classe (onglet « Annonce »).
 *
 * Contrat lu sur la spec lms (#1650, PR #1784) : `POST /annonces { classe_id, titre ≤ 150, message ≤ 2 000 }`.
 *   - `classe_id` est l'id de l'ESPACE SOURCE de l'école (`idEspaceSource` de la fiche, celui de l'onglet Résultats) ;
 *   - 201 `{ data: { id, classe_id, titre, destinataires, courriel } }` ;
 *   - 422 par champ ; 403 (enseignant hors de ses classes) ; 404 (classe introuvable) ; 429.
 * Un envoi sans réponse lisible a PEUT-ÊTRE eu lieu : le renvoyer doublerait l'annonce. L'écran le dit et garde la
 * saisie. Ici le VRAI client HTTP : seul l'adaptateur réseau change.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { AxiosError } from 'axios'
import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import api from '@/services/api'
import { useAuthStore } from '@/stores/auth'
import { ERROR_MESSAGES } from '@/constants/errorMessages'
import AnnonceAClasse from '@/components/classes/AnnonceAClasse.vue'

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

const ENVOYEE = (courriel = false) => ({
  success: true, message: 'Annonce envoyée',
  data: { id: 9, classe_id: 7001, titre: 'Sortie au musée', destinataires: 2, courriel },
})
const champ = (w, nom) => w.find(`[data-champ="${nom}"]`)
const alerte = (w) => w.find('[role="alert"]').text()
const statut = (w) => w.find('[role="status"]').text()

/** Le texte de l'élément qui décrit un champ (aria-describedby), ou ''. */
function description(w, nom) {
  const ids = (champ(w, nom).attributes('aria-describedby') ?? '').split(/\s+/).filter(Boolean)
  return ids.map((id) => w.find(`#${id}`)).filter((e) => e.exists()).map((e) => e.text()).join(' ')
}

async function envoyer(titre = 'Sortie au musée', message = 'Rendez-vous vendredi à 8 h.') {
  const w = mount(AnnonceAClasse, { props: { classeId: 7001 } })
  await champ(w, 'titre').setValue(titre)
  await champ(w, 'message').setValue(message)
  await w.find('form').trigger('submit')
  await flushPromises()
  return w
}

beforeEach(() => {
  // Le client HTTP lit la session (store) à chaque requête, comme en production.
  setActivePinia(createPinia())
  useAuthStore().user = { id: 1, name: 'Compte fictif', role: 'enseignant' }
  adaptateurOrigine = api.defaults.adapter
  requetes = []
})

afterEach(() => {
  api.defaults.adapter = adaptateurOrigine
})

describe('#690 — annoncer à la classe', () => {
  it('201 : le corps EXACT, l’id de l’espace source, l’annonce du nombre d’élèves, la saisie vidée', async () => {
    repondre(201, ENVOYEE())
    const w = await envoyer()

    expect(requetes).toEqual([{ method: 'post', url: '/annonces', corps: {
      classe_id: 7001, titre: 'Sortie au musée', message: 'Rendez-vous vendredi à 8 h.',
    } }])
    expect(statut(w)).toContain('2 élèves')
    expect(statut(w)).not.toMatch(/courriel/i)
    expect(champ(w, 'titre').element.value).toBe('')
    expect(champ(w, 'message').element.value).toBe('')
    expect(w.emitted('envoyee')).toHaveLength(1)
  })

  it('un courriel parti aussi : l’écran le dit', async () => {
    repondre(201, ENVOYEE(true))
    expect(statut(await envoyer())).toMatch(/courriel/i)
  })

  it('contrôle local, sans appel : titre et message requis, bornes 150 et 2 000', async () => {
    repondre(201, ENVOYEE())
    const vide = await envoyer('   ', '')
    expect(description(vide, 'titre')).toContain(ERROR_MESSAGES.annonceTitreRequis)
    expect(description(vide, 'message')).toContain(ERROR_MESSAGES.annonceMessageRequis)
    const long = await envoyer('a'.repeat(151), 'b'.repeat(2001))
    expect(description(long, 'titre')).toContain(ERROR_MESSAGES.annonceTitreLong)
    expect(description(long, 'message')).toContain(ERROR_MESSAGES.annonceMessageLong)
    expect(requetes).toEqual([])
  })

  it('422 : l’erreur sous SON champ, la saisie gardée', async () => {
    repondre(422, { success: false, message: 'Validation', errors: { message: ['Le message compte au plus 2 000 caractères.'] } })
    const w = await envoyer()

    expect(description(w, 'message')).toContain('Le message compte au plus 2 000 caractères.')
    expect(champ(w, 'titre').element.value).toBe('Sortie au musée')
    expect(w.emitted('envoyee')).toBeUndefined()
  })

  it.each([[403], [404]])('%s : le refus est dit, rien n’est envoyé, la saisie est gardée', async (status) => {
    repondre(status, { success: false, message: 'Refusé' })
    const w = await envoyer()

    expect(alerte(w)).not.toBe('')
    expect(champ(w, 'message').element.value).toBe('Rendez-vous vendredi à 8 h.')
    expect(w.emitted('envoyee')).toBeUndefined()
  })

  it('sans réponse : l’envoi est INCERTAIN, l’écran demande de vérifier avant de renvoyer', async () => {
    repondre(null)
    const w = await envoyer()

    expect(alerte(w)).toContain(ERROR_MESSAGES.annonceIncertaine)
    expect(champ(w, 'titre').element.value).toBe('Sortie au musée')
  })
})
