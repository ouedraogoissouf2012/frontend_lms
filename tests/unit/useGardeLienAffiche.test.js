/**
 * Revue de #449, C1 : quitter l'écran (menu, lien) ou recharger la page détruisait en silence
 * un lien d'activation affiché, un secret que rien ne permet de réémettre. Tant qu'un lien
 * est affiché : `beforeunload` demande confirmation au navigateur, et la navigation interne
 * passe par une confirmation qui peut la refuser.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, it, expect, vi } from 'vitest'
import { useGardeLienAffiche } from '@/composables/useGardeLienAffiche'

async function monter(lienInitial, reponse) {
  const lien = ref(lienInitial)
  const confirmer = vi.fn(async () => reponse)
  const Ecran = defineComponent({ setup() { useGardeLienAffiche(lien, confirmer); return () => h('p', 'écran') } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/demandes', component: Ecran }, { path: '/ailleurs', component: { render: () => h('p', 'ailleurs') } }],
  })
  await router.push('/demandes')
  const w = mount({ template: '<router-view />' }, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return { w, router, lien, confirmer }
}

function dechargement() {
  const e = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(e)
  return e
}

describe('useGardeLienAffiche (#449, C1)', () => {
  it('lien affiché : quitter vers une autre route demande confirmation, et un refus RESTE sur l’écran', async () => {
    const { w, router, confirmer } = await monter('https://lms.test/activation/x', false)
    await router.push('/ailleurs')
    await flushPromises()
    expect(confirmer).toHaveBeenCalledTimes(1)
    expect(router.currentRoute.value.path).toBe('/demandes')
    w.unmount()
  })

  it('lien affiché : une confirmation laisse partir', async () => {
    const { w, router } = await monter('https://lms.test/activation/x', true)
    await router.push('/ailleurs')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/ailleurs')
    w.unmount()
  })

  it('sans lien : on part sans rien demander', async () => {
    const { w, router, confirmer } = await monter('', false)
    await router.push('/ailleurs')
    await flushPromises()
    expect(confirmer).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/ailleurs')
    w.unmount()
  })

  it('lien affiché : recharger ou fermer l’onglet est retenu (beforeunload empêché)', async () => {
    const { w } = await monter('https://lms.test/activation/x', false)
    expect(dechargement().defaultPrevented).toBe(true)
    w.unmount()
  })

  it('sans lien, ou une fois l’écran quitté : beforeunload n’est plus retenu', async () => {
    const { w, lien } = await monter('https://lms.test/activation/x', false)
    lien.value = ''
    expect(dechargement().defaultPrevented).toBe(false)
    lien.value = 'https://lms.test/activation/y'
    w.unmount()
    expect(dechargement().defaultPrevented).toBe(false)
  })
})
