/**
 * Messages figés (E2E local du 30/10, A-E2, A-E8, A-E26) : trois écrans remplaçaient
 * le motif du serveur par un texte fixe. « Impossible de charger les classes.
 * Veuillez réessayer. » s'affichait même quand réessayer n'y changeait rien (compte
 * sans accès KLASSCI, compte sans établissement).
 *
 * La réponse traverse le VRAI client HTTP (api.js et son intercepteur, qui pose
 * `userMessage`) et les VRAIS services : seul l'adaptateur réseau d'axios est doublé.
 * Corps recopiés des réponses VUES (bilan E2E : 401 `klassci_token_missing` sur le
 * banc local, 403 `no_institution` en production).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { AxiosError } from 'axios'
import { setActivePinia, createPinia } from 'pinia'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }), useRoute: () => ({ params: {} }) }))

import api from '@/services/api'
import { useCoordinatorSeances } from '@/composables/useCoordinatorSeances'
import { useAdminClasses } from '@/composables/useAdminClasses'
import { useTeacherMatieres } from '@/composables/useTeacherMatieres'

const SANS_ACCES_KLASSCI = {
  status: 401,
  data: {
    success: false,
    message: "Aucun accès KLASSCI n'est enregistré pour ce compte : ces données, qui proviennent de KLASSCI, ne peuvent pas être affichées.",
    reason: 'klassci_token_missing',
  },
}
const SANS_ETABLISSEMENT = {
  status: 403,
  data: { success: false, message: "Cet espace est réservé aux comptes d'un établissement.", reason: 'no_institution' },
}

const FIGES = /Impossible de charger les (séances|classes|matières)/

let adaptateurOrigine
let requetes
/** La route nommée reçoit le refus ; toute autre requête reçoit une liste vide. */
function refuser(cheminRefuse, refus) {
  api.defaults.adapter = async (config) => {
    requetes.push(config.url)
    if (config.url.includes(cheminRefuse)) {
      const response = { status: refus.status, statusText: '', data: refus.data, headers: {}, config }
      throw new AxiosError(`Request failed with status code ${refus.status}`, AxiosError.ERR_BAD_REQUEST, config, {}, response)
    }
    return { status: 200, statusText: 'OK', data: { success: true, data: [] }, headers: {}, config }
  }
}

async function monter(composable) {
  let exposed
  mount(defineComponent({ setup() { exposed = composable(); return () => null } }))
  await flushPromises()
  return exposed
}

beforeEach(() => {
  setActivePinia(createPinia())
  adaptateurOrigine = api.defaults.adapter
  requetes = []
  localStorage.clear()
  sessionStorage.clear()
})
afterEach(() => { api.defaults.adapter = adaptateurOrigine })

describe('Séances (coordinateur) : le motif du serveur n\'est plus écrasé', () => {
  it('un 401 klassci_token_missing dit le motif du catalogue', async () => {
    refuser('/lms/seances/upcoming', SANS_ACCES_KLASSCI)
    const c = await monter(useCoordinatorSeances)
    await c.loadSeances()
    expect(requetes.some((u) => u.includes('/lms/seances/upcoming'))).toBe(true)
    expect(c.error.value).toBe(ERROR_MESSAGES.klassciTokenMissing)
    expect(c.error.value).not.toMatch(FIGES)
  })

  it('un refus sans établissement dit le motif du catalogue', async () => {
    refuser('/lms/seances/upcoming', SANS_ETABLISSEMENT)
    const c = await monter(useCoordinatorSeances)
    await c.loadSeances()
    expect(c.error.value).toBe(ERROR_MESSAGES.noInstitution)
  })
})

describe('Classes (admin) : plus de « Veuillez réessayer » sur un refus définitif', () => {
  it('un 401 klassci_token_missing dit le motif du catalogue', async () => {
    refuser('/proxy/classes', SANS_ACCES_KLASSCI)
    const c = await monter(useAdminClasses)
    expect(requetes.some((u) => u.includes('/proxy/classes'))).toBe(true)
    expect(c.error.value).toBe(ERROR_MESSAGES.klassciTokenMissing)
    expect(c.error.value).not.toMatch(FIGES)
  })

  it('un refus sans établissement dit le motif du catalogue', async () => {
    refuser('/proxy/classes', SANS_ETABLISSEMENT)
    const c = await monter(useAdminClasses)
    expect(c.error.value).toBe(ERROR_MESSAGES.noInstitution)
  })
})

describe('Mes matières (enseignant) : le motif du serveur est dit', () => {
  it('un 401 klassci_token_missing dit le motif du catalogue', async () => {
    refuser('/lms/teacher/my-matieres', SANS_ACCES_KLASSCI)
    const m = await monter(useTeacherMatieres)
    expect(requetes.some((u) => u.includes('/lms/teacher/my-matieres'))).toBe(true)
    expect(m.error.value).toBe(ERROR_MESSAGES.klassciTokenMissing)
    expect(m.error.value).not.toMatch(FIGES)
  })

  it('un refus sans établissement dit le motif du catalogue', async () => {
    refuser('/lms/teacher/my-matieres', SANS_ETABLISSEMENT)
    const m = await monter(useTeacherMatieres)
    expect(m.error.value).toBe(ERROR_MESSAGES.noInstitution)
  })
})
