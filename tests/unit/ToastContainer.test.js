/**
 * ToastContainer — les toasts sont ANNONCÉS par un lecteur d'écran.
 *
 * Un lecteur d'écran n'annonce que ce qui change dans une région vivante qui
 * existait déjà : les deux régions sont donc présentes dès le montage du
 * conteneur (monté une seule fois avec l'App), vides, jamais masquées. Chaque
 * toast est rendu dans la région de sa gravité : les erreurs dans `alert`
 * (assertive), le reste dans `status` (polie). Les erreurs sont en tête.
 */
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { describe, it, expect, afterEach } from 'vitest'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import { toast, useToast } from '@/composables/useToast'

const ERREURS = '[data-test="toasts-erreurs"]'
const INFOS = '[data-test="toasts-infos"]'

async function rendu() {
  await nextTick()
  await nextTick()
}

afterEach(() => {
  const { toasts, remove } = useToast()
  ;[...toasts.value].forEach((t) => remove(t.id))
})

describe('ToastContainer — régions vivantes', () => {
  it('les deux régions existent dès le montage, vides, non masquées', () => {
    const w = mount(ToastContainer)
    const erreurs = w.find(ERREURS)
    const infos = w.find(INFOS)
    expect(erreurs.exists()).toBe(true)
    expect(infos.exists()).toBe(true)
    expect(erreurs.attributes('role')).toBe('alert')
    expect(infos.attributes('role')).toBe('status')
    expect(erreurs.text()).toBe('')
    expect(infos.text()).toBe('')
    expect(erreurs.attributes('style')).toBeUndefined()
    expect(infos.attributes('style')).toBeUndefined()
  })

  it('le rôle suffit : ni aria-live redondant, ni aria-atomic qui ferait relire toute la pile', () => {
    const w = mount(ToastContainer)
    for (const region of [w.find(ERREURS), w.find(INFOS)]) {
      expect(region.attributes('aria-live')).toBeUndefined()
      expect(region.attributes('aria-atomic')).toBeUndefined()
    }
  })

  it('les erreurs sont en tête', () => {
    const w = mount(ToastContainer)
    const regions = w.findAll('[data-test^="toasts-"]').map((r) => r.attributes('data-test'))
    expect(regions).toEqual(['toasts-erreurs', 'toasts-infos'])
  })

  it('une erreur est rendue dans la région alert, le reste dans la région status', async () => {
    const w = mount(ToastContainer)
    toast.error('Échec de l enregistrement')
    toast.info('Ce lien n est pas disponible.')
    toast.success('Enregistré')
    toast.warning('Attention')
    await rendu()
    expect(w.find(ERREURS).text()).toContain('Échec de l enregistrement')
    expect(w.find(ERREURS).findAll('.toast')).toHaveLength(1)
    const infos = w.find(INFOS)
    expect(infos.findAll('.toast')).toHaveLength(3)
    expect(infos.text()).not.toContain('Échec')
  })

  it('dans une région, l ordre reste chronologique', async () => {
    const w = mount(ToastContainer)
    toast.info('premier')
    toast.info('second')
    await rendu()
    const messages = w.find(INFOS).findAll('.toast-message').map((m) => m.text())
    expect(messages).toEqual(['premier', 'second'])
  })
})
