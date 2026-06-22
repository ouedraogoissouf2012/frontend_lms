/**
 * Test du composable useAdminInstitutions (#G1 ≤300) : chargement (overview +
 * liste), totalContent, ouverture create/edit, sauvegarde (create/update +
 * token vide), bascule de statut et test de connexion. Service API mocké.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, it, expect, vi, beforeEach } from 'vitest'

const api = vi.hoisted(() => ({
  getAll: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  toggle: vi.fn(),
  testConnection: vi.fn(),
}))
vi.mock('@/services/api', () => ({ institutions: api }))

import { useAdminInstitutions } from '@/composables/useAdminInstitutions'

const overview = { total_institutions: 3, active_institutions: 2, total_users: 50, total_lessons: 7, total_evaluations: 4 }
const inst = { id: 9, slug: 'esbtp', name: 'ESBTP', klassci_api_url: 'https://x', logo_url: 'l', primary_color: '#000', is_active: true }

function defaultGetAll() {
  return Promise.resolve({ success: true, data: { institutions: [inst], overview } })
}

async function setup() {
  let composable
  const Comp = defineComponent({ setup() { composable = useAdminInstitutions(); return () => null } })
  mount(Comp)
  await flushPromises()
  return composable
}

beforeEach(() => {
  vi.clearAllMocks()
  api.getAll.mockImplementation(defaultGetAll)
  api.create.mockResolvedValue({})
  api.update.mockResolvedValue({})
  api.toggle.mockResolvedValue({})
  api.testConnection.mockResolvedValue({ success: true, message: 'ok' })
})

describe('useAdminInstitutions (#G1)', () => {
  it('charge la liste et l\'overview au montage', async () => {
    const c = await setup()
    expect(c.institutionsList.value).toHaveLength(1)
    expect(c.overview.value.total_institutions).toBe(3)
    expect(c.loading.value).toBe(false)
  })

  it('totalContent = leçons + évaluations', async () => {
    const c = await setup()
    expect(c.totalContent.value).toBe(11)
  })

  it('openCreateModal réinitialise le formulaire et ouvre la modale', async () => {
    const c = await setup()
    c.openEditModal(inst)
    c.openCreateModal()
    expect(c.editingInstitution.value).toBe(null)
    expect(c.form.value.slug).toBe('')
    expect(c.form.value.primary_color).toBe('#3b82f6')
    expect(c.showModal.value).toBe(true)
  })

  it('openEditModal préremplit le formulaire sans le token', async () => {
    const c = await setup()
    c.openEditModal(inst)
    expect(c.editingInstitution.value).toMatchObject({ id: 9 })
    expect(c.form.value.slug).toBe('esbtp')
    expect(c.form.value.klassci_api_token).toBe('')
  })

  it('saveInstitution crée puis recharge', async () => {
    const c = await setup()
    c.openCreateModal()
    c.form.value.name = 'New'
    await c.saveInstitution()
    expect(api.create).toHaveBeenCalledTimes(1)
    expect(c.showModal.value).toBe(false)
    expect(api.getAll).toHaveBeenCalledTimes(2) // montage + après save
  })

  it('saveInstitution en update retire un token vide du payload', async () => {
    const c = await setup()
    c.openEditModal(inst) // token = ''
    await c.saveInstitution()
    expect(api.update).toHaveBeenCalledTimes(1)
    const [, payload] = api.update.mock.calls[0]
    expect(payload).not.toHaveProperty('klassci_api_token')
  })

  it('saveInstitution mappe les erreurs 422', async () => {
    const c = await setup()
    api.create.mockRejectedValueOnce({ response: { status: 422, data: { errors: { name: ['requis'] } } } })
    c.openCreateModal()
    await c.saveInstitution()
    expect(c.formErrors.value).toEqual({ name: ['requis'] })
    expect(c.showModal.value).toBe(true)
  })

  it('toggleStatus bascule et recharge', async () => {
    const c = await setup()
    await c.toggleStatus(inst)
    expect(api.toggle).toHaveBeenCalledWith(9)
    expect(api.getAll).toHaveBeenCalledTimes(2)
  })

  it('testConnection stocke le résultat et réinitialise testingId', async () => {
    const c = await setup()
    await c.testConnection(inst)
    expect(c.connectionResult.value).toEqual({ success: true, message: 'ok' })
    expect(c.testingId.value).toBe(null)
  })

  it('testConnection capture l\'échec', async () => {
    const c = await setup()
    api.testConnection.mockRejectedValueOnce({ response: { data: { message: 'KO', data: null } } })
    await c.testConnection(inst)
    expect(c.connectionResult.value).toEqual({ success: false, message: 'KO', data: null })
  })

  it('error renseignée si le chargement échoue', async () => {
    api.getAll.mockRejectedValueOnce({ message: 'boom' })
    const c = await setup()
    expect(c.error.value).toBe('boom')
    expect(c.loading.value).toBe(false)
  })
})
