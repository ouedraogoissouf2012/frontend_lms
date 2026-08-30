/**
 * useToast — file d'attente de toasts (source unique, testable).
 *
 * Vérifie le remplacement du hack `window.$toast` : état dans le module (singleton),
 * raccourcis typés, unicité des ids, retrait ciblé et partage entre appelants.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import { useToast } from '@/composables/useToast'

beforeEach(() => {
  // La file est un singleton module : on la vide entre chaque test.
  const { toasts, remove } = useToast()
  ;[...toasts.value].forEach((t) => remove(t.id))
})

describe('useToast', () => {
  it('success/error/warning/info empilent un toast du bon type', () => {
    const t = useToast()
    t.success('ok')
    t.error('boom')
    t.warning('attention')
    t.info('fyi')
    expect(t.toasts.value.map((x) => x.type)).toEqual(['success', 'error', 'warning', 'info'])
    expect(t.toasts.value.map((x) => x.message)).toEqual(['ok', 'boom', 'attention', 'fyi'])
  })

  it('show retourne un id unique et remove le retire', () => {
    const t = useToast()
    const id1 = t.show({ message: 'a' })
    const id2 = t.show({ message: 'b' })
    expect(id1).not.toBe(id2)
    t.remove(id1)
    expect(t.toasts.value.map((x) => x.id)).toEqual([id2])
  })

  it('deux appels useToast() partagent la MÊME file (singleton)', () => {
    const a = useToast()
    const b = useToast()
    a.success('partagé')
    expect(b.toasts.value.at(-1).message).toBe('partagé')
  })

  it('applique les valeurs par défaut (type info, duration 5000)', () => {
    const t = useToast()
    t.show({ message: 'x' })
    const last = t.toasts.value.at(-1)
    expect(last.type).toBe('info')
    expect(last.duration).toBe(5000)
  })

  it('transmet un titre et une durée personnalisés', () => {
    const t = useToast()
    t.success('Enregistré', { title: 'Succès', duration: 2000 })
    const last = t.toasts.value.at(-1)
    expect(last.title).toBe('Succès')
    expect(last.duration).toBe(2000)
  })
})
