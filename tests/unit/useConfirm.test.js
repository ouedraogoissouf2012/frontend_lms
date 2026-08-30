/**
 * useConfirm — confirmation asynchrone (remplace `confirm()` natif).
 *
 * Vérifie le contrat de promesse : ouverture, résolution true/false, ergonomie
 * chaîne, annulation d'une demande concurrente, transmission du variant.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useConfirm } from '@/composables/useConfirm'

beforeEach(() => {
  // Repartir d'un état fermé (résout toute demande pendante à false).
  useConfirm().cancel()
})

describe('useConfirm', () => {
  it('confirm() ouvre la boîte et retourne une promesse', () => {
    const { confirm, state } = useConfirm()
    const p = confirm({ message: 'Sûr ?' })
    expect(state.open).toBe(true)
    expect(state.message).toBe('Sûr ?')
    expect(p).toBeInstanceOf(Promise)
    useConfirm().cancel()
    return p // consomme la promesse (pas de pendante)
  })

  it('accept() résout true et ferme', async () => {
    const c = useConfirm()
    const p = c.confirm('X')
    c.accept()
    await expect(p).resolves.toBe(true)
    expect(c.state.open).toBe(false)
  })

  it('cancel() résout false et ferme', async () => {
    const c = useConfirm()
    const p = c.confirm('X')
    c.cancel()
    await expect(p).resolves.toBe(false)
    expect(c.state.open).toBe(false)
  })

  it('accepte une chaîne comme message (ergonomie migration confirm())', () => {
    const c = useConfirm()
    const p = c.confirm('Juste un message')
    expect(c.state.message).toBe('Juste un message')
    c.cancel()
    return p
  })

  it('une nouvelle demande résout la précédente à false', async () => {
    const c = useConfirm()
    const p1 = c.confirm('premier')
    const p2 = c.confirm('second')
    await expect(p1).resolves.toBe(false)
    expect(c.state.message).toBe('second')
    c.accept()
    await expect(p2).resolves.toBe(true)
  })

  it('transmet variant danger et libellés personnalisés à l’état', () => {
    const c = useConfirm()
    const p = c.confirm({ message: 'Supprimer ?', variant: 'danger', confirmLabel: 'Supprimer', cancelLabel: 'Garder' })
    expect(c.state.variant).toBe('danger')
    expect(c.state.confirmLabel).toBe('Supprimer')
    expect(c.state.cancelLabel).toBe('Garder')
    c.cancel()
    return p
  })
})
