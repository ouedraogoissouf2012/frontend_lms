/**
 * EnrolmentCodeCard (#391) : une classe locale et son code. Code affiché EN CLAIR
 * seulement s'il est actif ; « Retirer » seulement pour un code actif (le serveur
 * répondrait 409 sinon) ; « Régénérer » au lieu d'« Émettre » quand un code existe.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import EnrolmentCodeCard from '@/components/admin/EnrolmentCodeCard.vue'

const classe = (etat, valeur = null) => ({ id: 3, libelle: 'Session Data 2026', code: 'SD26', training_session_id: null, code_inscription: { etat, valeur } })
const boutons = (w) => w.findAll('button').map((b) => b.text())

describe('EnrolmentCodeCard (#391)', () => {
  it('code actif : affiché en clair, Régénérer et Retirer', () => {
    const w = mount(EnrolmentCodeCard, { props: { classe: classe('actif', 'Q7RT4K') } })
    expect(w.find('.code-valeur').text()).toBe('Q7RT4K')
    expect(boutons(w)).toEqual(['Régénérer', 'Retirer'])
  })

  it.each(['retire', 'absent'])('code %s : aucun code affiché, seul « Émettre un code »', (etat) => {
    const w = mount(EnrolmentCodeCard, { props: { classe: classe(etat) } })
    expect(w.find('.code-valeur').exists()).toBe(false)
    expect(boutons(w)).toEqual(['Émettre un code'])
  })

  it('code actif : le libellé « Code d’inscription » est VISIBLE (dt), pas un aria-label ignoré', () => {
    const w = mount(EnrolmentCodeCard, { props: { classe: classe('actif', 'Q7RT4K') } })
    expect(w.find('dt').text()).toBe("Code d'inscription")
    expect(w.find('dd.code-valeur').text()).toBe('Q7RT4K')
    expect(w.find('[aria-label]').exists()).toBe(false)
  })

  it('état INCONNU (échec sans relecture) : aucun code montré, « Régénérer » seul, invitation à actualiser', () => {
    const w = mount(EnrolmentCodeCard, { props: { classe: classe('inconnu', 'PEUTETRE') } })
    expect(w.text()).not.toContain('PEUTETRE')
    expect(w.find('.code-etat').text()).toContain('actualisez')
    expect(boutons(w)).toEqual(['Régénérer'])
  })

  it('une valeur présente avec un état non actif n’est JAMAIS affichée', () => {
    const w = mount(EnrolmentCodeCard, { props: { classe: classe('retire', 'ANCIEN') } })
    expect(w.text()).not.toContain('ANCIEN')
  })

  it('émet emettre et retirer', async () => {
    const w = mount(EnrolmentCodeCard, { props: { classe: classe('actif', 'Q7RT4K') } })
    await w.findAll('button')[0].trigger('click')
    await w.findAll('button')[1].trigger('click')
    expect(w.emitted('emettre')).toHaveLength(1)
    expect(w.emitted('retirer')).toHaveLength(1)
  })

  it('D17 : busy rend les boutons aria-disabled (focalisables), et un clic n’émet rien', async () => {
    const w = mount(EnrolmentCodeCard, { props: { classe: classe('actif', 'Q7RT4K'), busy: true } })
    const btns = w.findAll('button')
    expect(btns.every((b) => b.attributes('aria-disabled') === 'true')).toBe(true)
    expect(btns.every((b) => b.attributes('disabled') === undefined)).toBe(true)
    for (const b of btns) await b.trigger('click')
    expect(w.emitted('emettre')).toBeUndefined()
    expect(w.emitted('retirer')).toBeUndefined()
  })
})
