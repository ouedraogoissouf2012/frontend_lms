/**
 * Toast.vue — bouton d'action optionnel (#322 undo).
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'
import Toast from '@/components/ui/Toast.vue'

describe('Toast.vue — action (#322)', () => {
  it('sans action : aucun bouton d\'action', async () => {
    const w = mount(Toast, { props: { message: 'x', duration: 0 } })
    await w.vm.$nextTick()
    expect(w.find('.toast-action').exists()).toBe(false)
  })

  it('avec action : rend un bouton portant le libellé', async () => {
    const w = mount(Toast, {
      props: { message: 'Supprimé', duration: 0, action: { label: 'Annuler', onClick: vi.fn() } },
    })
    await w.vm.$nextTick()
    const btn = w.find('.toast-action')
    expect(btn.exists()).toBe(true)
    expect(btn.text()).toBe('Annuler')
  })

  it('clic sur l\'action : exécute onClick puis masque le toast', async () => {
    const onClick = vi.fn()
    const w = mount(Toast, {
      props: { message: 'Supprimé', duration: 0, action: { label: 'Annuler', onClick } },
    })
    await w.vm.$nextTick()
    await w.find('.toast-action').trigger('click')
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(w.vm.visible).toBe(false) // close() a été déclenché
  })
})
