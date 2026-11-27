/**
 * #655 : l'admin et le coordinateur importent leurs élèves à l'écran.
 *
 * Le serveur ouvre l'import (preview, confirm, show) à l'enseignant, au coordinateur et au
 * superAdmin (lms `routes/api/imports.php:26-37`). L'écran n'était routé que pour l'enseignant.
 *
 * - `/admin/import` : les rôles de `/admin/enrolment-codes`, sous la capacité
 *   `peutInscrireLocalement` (jamais un test du mode), et LE MÊME écran que `/teacher/import`.
 * - Le menu du personnel y mène, sous la même capacité.
 * - L'étape de dépôt explique `code_classe` : le code de la CLASSE, pas le code d'inscription
 *   (lms `StudentEnrolmentService::inscrireParCodeDeClasse`).
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { useAuthStore } from '@/stores/auth'
import { navigationGuard } from '@/router/guards'
import { adminRoutes } from '@/router/routes/admin.routes'
import { teacherRoutes } from '@/router/routes/teacher.routes'
import { filterSectionsByRole } from '@/composables/useNavigation'
import { NAV_SECTIONS } from '@/constants/navigation'
import ImportDeposit from '@/components/import/ImportDeposit.vue'

const routeAdmin = () => adminRoutes.find((r) => r.path === '/admin/import')
const routeEnseignant = () => teacherRoutes.find((r) => r.path === '/teacher/import')

describe('#655 — la route d import du personnel', () => {
  it('/admin/import : rôles du personnel, capacité exigée', () => {
    const route = routeAdmin()

    expect(route).toBeDefined()
    expect(route.meta).toMatchObject({ requiresAuth: true, capacite: 'peutInscrireLocalement' })
    expect(route.meta.roles).toEqual(['superAdmin', 'admin', 'coordinateur'])
  })

  it('ouvre LE MÊME écran que /teacher/import : réutilisé, pas recopié', async () => {
    const [admin, enseignant] = await Promise.all([routeAdmin().component(), routeEnseignant().component()])

    expect(admin.default).toBe(enseignant.default)
  })

  it('/teacher/import reste ouverte à l enseignant, sous la même capacité', () => {
    expect(routeEnseignant().meta).toMatchObject({ roles: ['enseignant', 'teacher'], capacite: 'peutInscrireLocalement' })
  })
})

describe('#655 — la garde de /admin/import', () => {
  const session = (role, accordee) => {
    setActivePinia(createPinia())
    useAuthStore().setSession({ user: { id: 1, role }, token: 't' }, { peut_inscrire_localement: accordee })
  }
  const destination = () => {
    let arg = 'non-appele'
    navigationGuard(routeAdmin(), { path: '/admin/dashboard' }, (a) => { arg = a })
    return arg
  }

  beforeEach(() => { sessionStorage.clear() })

  it.each(['coordinateur', 'admin'])('%s avec la capacité : l écran s ouvre', (role) => {
    session(role, true)

    expect(destination()).toBeUndefined()
  })

  it('sans la capacité : renvoyé ailleurs, jamais un écran que le serveur refuse', () => {
    session('coordinateur', false)

    expect(destination()).toBeTruthy()
    expect(destination()).not.toBe('/admin/import')
  })

  it('l enseignant n ouvre pas la route du personnel', () => {
    session('enseignant', true)

    expect(destination()).toBeTruthy()
  })
})

describe('#655 — le menu du personnel', () => {
  const mene = (role, capacites) => filterSectionsByRole(NAV_SECTIONS, role, capacites).some((i) => i.to === '/admin/import')

  it.each(['coordinateur', 'admin'])('%s : l entrée apparaît avec la capacité, disparaît sans elle', (role) => {
    expect(mene(role, { peutInscrireLocalement: true })).toBe(true)
    expect(mene(role, {})).toBe(false)
  })

  it.each(['enseignant', 'etudiant'])('%s : jamais l entrée du personnel', (role) => {
    expect(mene(role, { peutInscrireLocalement: true })).toBe(false)
  })
})

describe('#655 — l étape de dépôt explique code_classe', () => {
  it('le code de la CLASSE, pas le code d inscription ; vide ; inconnu', () => {
    const texte = mount(ImportDeposit, { props: { fileName: '' } }).text()

    expect(texte).toContain('code de la classe')
    expect(texte).toContain('pas le code d’inscription')
    expect(texte).toContain('sans classe')
    expect(texte).toContain('refuser la ligne')
  })

  it('le modèle CSV se télécharge toujours', () => {
    const wrapper = mount(ImportDeposit, { props: { fileName: '' } })

    expect(wrapper.text()).toContain('Télécharger le modèle CSV')
  })
})
