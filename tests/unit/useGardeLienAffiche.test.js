/**
 * Revue de #449, C1 puis bloquant 1 du delta : quitter l'écran (menu, lien) ou recharger la
 * page détruisait en silence un lien d'activation, un secret que rien ne permet de réémettre.
 * Le garde retient sur un MOTIF : « lien » (affiché, non transmis) ou « validation » (en vol :
 * le serveur a pu émettre le jeton, et le lien n'est pas encore arrivé). Sans motif, on part.
 */
import { mount, flushPromises } from '@vue/test-utils'
import { defineComponent, h, ref } from 'vue'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, it, expect, vi } from 'vitest'
import { useGardeLienAffiche } from '@/composables/useGardeLienAffiche'

async function monter(motifInitial, reponse) {
  const motif = ref(motifInitial)
  const confirmer = vi.fn(async () => reponse)
  const Ecran = defineComponent({ setup() { useGardeLienAffiche(motif, confirmer); return () => h('p', 'écran') } })
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/demandes', component: Ecran }, { path: '/ailleurs', component: { render: () => h('p', 'ailleurs') } }],
  })
  await router.push('/demandes')
  const w = mount({ template: '<router-view />' }, { global: { plugins: [router] }, attachTo: document.body })
  await flushPromises()
  return { w, router, motif, confirmer }
}

function dechargement() {
  const e = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(e)
  return e
}

describe('useGardeLienAffiche (#449)', () => {
  it.each(['lien', 'validation'])('motif « %s » : quitter demande confirmation (avec CE motif), et un refus reste', async (motif) => {
    const { w, router, confirmer } = await monter(motif, false)
    await router.push('/ailleurs')
    await flushPromises()
    expect(confirmer).toHaveBeenCalledWith(motif)
    expect(router.currentRoute.value.path).toBe('/demandes')
    w.unmount()
  })

  it('une confirmation laisse partir', async () => {
    const { w, router } = await monter('validation', true)
    await router.push('/ailleurs')
    await flushPromises()
    expect(router.currentRoute.value.path).toBe('/ailleurs')
    w.unmount()
  })

  it('sans motif : on part sans rien demander', async () => {
    const { w, router, confirmer } = await monter(null, false)
    await router.push('/ailleurs')
    await flushPromises()
    expect(confirmer).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/ailleurs')
    w.unmount()
  })

  it.each(['lien', 'validation'])('motif « %s » : recharger ou fermer l’onglet est retenu (beforeunload)', async (motif) => {
    const { w } = await monter(motif, false)
    expect(dechargement().defaultPrevented).toBe(true)
    w.unmount()
  })

  it('sans motif, ou une fois l’écran quitté : beforeunload n’est plus retenu', async () => {
    const { w, motif } = await monter('lien', false)
    motif.value = null
    expect(dechargement().defaultPrevented).toBe(false)
    motif.value = 'lien'
    w.unmount()
    expect(dechargement().defaultPrevented).toBe(false)
  })
})
