/**
 * ConfirmDialog — rendu de la boîte globale et résolution de la promesse.
 *
 * La boîte est téléportée dans <body> ; on interroge donc document.body.
 * On mappe un clic « Confirmer » → true et « Annuler » → false.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import { useConfirm } from '@/composables/useConfirm'

beforeEach(() => useConfirm().cancel())
afterEach(() => {
  document.body.innerHTML = ''
})

function findButtonByText(label) {
  return [...document.querySelectorAll('.base-btn')].find((b) => b.textContent.trim() === label)
}

describe('ConfirmDialog', () => {
  it('affiche le message quand une demande est ouverte', async () => {
    const w = mount(ConfirmDialog, { attachTo: document.body })
    const c = useConfirm()
    const p = c.confirm({ message: 'Supprimer le chapitre ?' })
    await w.vm.$nextTick()
    expect(document.body.textContent).toContain('Supprimer le chapitre ?')
    c.cancel()
    await p
    w.unmount()
  })

  it('cliquer Confirmer résout la promesse à true', async () => {
    const w = mount(ConfirmDialog, { attachTo: document.body })
    const c = useConfirm()
    const p = c.confirm({ message: 'ok ?', confirmLabel: 'Oui' })
    await w.vm.$nextTick()
    findButtonByText('Oui').click()
    await expect(p).resolves.toBe(true)
    w.unmount()
  })

  it('cliquer Annuler résout la promesse à false', async () => {
    const w = mount(ConfirmDialog, { attachTo: document.body })
    const c = useConfirm()
    const p = c.confirm({ message: 'ok ?', cancelLabel: 'Non' })
    await w.vm.$nextTick()
    findButtonByText('Non').click()
    await expect(p).resolves.toBe(false)
    w.unmount()
  })
})
