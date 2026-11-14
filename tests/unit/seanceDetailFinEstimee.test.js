/**
 * Détail d'une séance (`/seances/:id`), lu sur le contrat de la séance LOCALE (lms_backend #1053,
 * SeanceCalendarProjection) : la fin est ESTIMÉE (début + 2 h, `heure_fin_estimee: true`) et la séance ne
 * porte pas `duree_minutes`. L'en-tête affichait « 10:00 - 12:00 » comme une fin exacte et « ( min) ».
 * Il dit désormais « (fin estimée) » (règle partagée `finEstimee`, comme les cartes) et ne montre une
 * durée que si elle existe.
 */
import { mount } from '@vue/test-utils'
import { describe, it, expect } from 'vitest'
import SeanceDetailsHeader from '@/components/seances/SeanceDetailsHeader.vue'

const LOCALE = {
  matiere: { nom: 'Maths' }, classe: { nom: '6e A' }, enseignant: { nom: 'Awa', prenom: '' },
  programmation: { date: '2026-11-15', heure_debut: '2026-11-15T10:00:00Z', heure_fin: '2026-11-15T12:00:00Z', heure_fin_estimee: true, salle: null },
  heure_fin_estimee: true,
}
const KLASSCI = {
  matiere: { nom: 'Maths' }, classe: { nom: '6e A' }, enseignant: { nom: 'Awa' }, duree_minutes: 90,
  programmation: { date: '2026-11-15', heure_debut: '2026-11-15T10:00:00Z', heure_fin: '2026-11-15T11:30:00Z', salle: 'B12' },
}
const horaire = (seance) => mount(SeanceDetailsHeader, { props: { seance } }).text()

describe('SeanceDetailsHeader — une fin estimée le dit, une durée absente ne s’invente pas', () => {
  it('1. séance locale : « (fin estimée) », aucune durée « ( min) », rien d’« undefined »', () => {
    const texte = horaire(LOCALE)
    expect(texte).toContain('(fin estimée)')
    expect(texte).not.toMatch(/\(\s*min\)/)
    expect(texte).not.toContain('undefined')
  })

  it('2. séance KLASSCI : la durée réelle, sans mention d’estimation', () => {
    const texte = horaire(KLASSCI)
    expect(texte).toContain('(90 min)')
    expect(texte).not.toContain('(fin estimée)')
  })

  it('3. ni durée ni estimation : rien entre parenthèses', () => {
    const { duree_minutes: _omise, ...sansDuree } = KLASSCI
    expect(horaire(sansDuree)).not.toMatch(/\(\s*min\)/)
  })
})
