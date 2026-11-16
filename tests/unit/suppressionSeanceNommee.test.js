/**
 * #581 : la confirmation de suppression d'une séance (historique des séances) disait « la séance null » : elle
 * lisait `klassci_seance_id`, absent d'une séance créée dans le LMS. Un id, même juste, ne nomme pas une séance pour
 * un humain. Elle est nommée par ce que l'écran affiche : son titre (sinon sa matière) et sa date.
 */
import { describe, it, expect } from 'vitest'
import { messageSuppressionSeance } from '@/utils/attendance'

describe('#581 — la confirmation de suppression nomme la séance', () => {
  it('une séance locale (sans id KLASSCI) : son titre et sa date, jamais « null »', () => {
    const message = messageSuppressionSeance({ id: 7, klassci_seance_id: null, titre: 'Seance de revision', date: '2026-11-16', matiere: { nom: 'Maths' } })
    expect(message).toMatch(/^Êtes-vous sûr de vouloir supprimer la séance « Seance de revision » du \d{2}\/\d{2}\/\d{4} \?$/)
    expect(message).not.toMatch(/null|undefined/)
  })

  it('sans titre : sa matière', () => {
    expect(messageSuppressionSeance({ klassci_seance_id: 9701, titre: null, date: '2026-11-16', matiere: { nom: 'Maths' } })).toContain('« Maths »')
  })

  it('sans titre ni matière ni date lisible : une phrase entière, sans id ni « null »', () => {
    expect(messageSuppressionSeance({ id: 7 })).toBe('Êtes-vous sûr de vouloir supprimer cette séance ?')
  })
})
