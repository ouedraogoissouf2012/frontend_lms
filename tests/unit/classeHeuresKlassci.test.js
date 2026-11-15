/**
 * D619 : l'heure d'une séance sur la fiche de classe passe par l'analyseur UNIQUE (seanceStatut.dateHeureSeance).
 *
 * KLASSCI rend l'heure en « HH:mm[:ss] » ; l'école créée depuis le LMS, un datetime ISO. `formatTime` et
 * `calculateDuration` (utils/classeDetails) faisaient `new Date(heure)` : sur une séance KLASSCI, la fiche de classe
 * affichait « Invalid Date - Invalid Date (NaN min) » (E2E K4, run 43710154628, enseignant `/classes/:id`).
 * Une heure illisible ne s'affiche jamais en « Invalid Date » ni en « NaN » : rien n'est inventé.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import { formatTime, calculateDuration } from '@/utils/classeDetails'
import ClasseUpcomingSeances from '@/components/classes/ClasseUpcomingSeances.vue'

const KLASSCI = { id: 9701, matiere: { nom: 'Mathematiques' }, enseignant: { nom: 'Enseignant' }, programmation: { date: '2026-11-20', heure_debut: '10:00', heure_fin: '12:00' } }

describe('D619 — les heures KLASSCI sur la fiche de classe', () => {
  it('formatTime lit « HH:mm » et « HH:mm:ss » (KLASSCI)', () => {
    expect(formatTime('10:00')).toBe('10:00')
    expect(formatTime('08:05:00')).toBe('08:05')
  })

  it('formatTime lit toujours un datetime ISO (école créée depuis le LMS)', () => {
    expect(formatTime('2026-03-15T08:30:00')).toBe('08:30')
  })

  it('une heure illisible ne s’affiche jamais en « Invalid Date »', () => {
    expect(formatTime('pas une heure')).toBe('N/A')
  })

  it('calculateDuration compte les minutes entre deux heures KLASSCI', () => {
    expect(calculateDuration(KLASSCI)).toBe(120)
  })

  it('calculateDuration rend null (et jamais NaN) quand une heure est illisible', () => {
    expect(calculateDuration({ programmation: { heure_debut: 'x', heure_fin: '12:00' } })).toBeNull()
  })

  it('la fiche de classe affiche une séance KLASSCI sans « Invalid Date » ni « NaN »', () => {
    const texte = mount(ClasseUpcomingSeances, { props: { seances: [KLASSCI] }, global: { stubs: { VisioManager: true } } }).text()
    expect(texte).toContain('10:00 - 12:00')
    expect(texte).toContain('(120 min)')
    expect(texte).not.toMatch(/Invalid Date|NaN/)
  })

  it('une durée illisible ne s’affiche pas en « NaN min »', () => {
    const illisible = { ...KLASSCI, programmation: { ...KLASSCI.programmation, heure_fin: 'x' } }
    const texte = mount(ClasseUpcomingSeances, { props: { seances: [illisible] }, global: { stubs: { VisioManager: true } } }).text()
    expect(texte).not.toMatch(/Invalid Date|NaN|null min/)
  })
})
