/**
 * Tests des formatters centralisés (#23) — vérifient la PARITÉ des cas convergés
 * (AttendanceDetailModal date/heure, SeanceCard heure) : format fr-FR + repli.
 */
import { describe, it, expect } from 'vitest'
import { formatDate, formatTime, formatDuration, formatCount, getFullName } from '@/utils/formatters'

describe('utils/formatters — formatDate (parité AttendanceDetailModal)', () => {
  it('date valide → JJ/MM/AAAA (toLocaleDateString fr-FR)', () => {
    // Référence : new Date(x).toLocaleDateString('fr-FR')
    const ref = new Date('2026-06-19T10:00:00').toLocaleDateString('fr-FR')
    expect(formatDate('2026-06-19T10:00:00')).toBe(ref)
  })
  it('repli personnalisé pour null/vide (parité repli local "-")', () => {
    expect(formatDate(null, { fallback: '-' })).toBe('-')
    expect(formatDate('', { fallback: '-' })).toBe('-')
  })
})

describe('utils/formatters — formatTime (parité Attendance + SeanceCard)', () => {
  it('heure valide → HH:mm (toLocaleTimeString fr-FR)', () => {
    const ref = new Date('2026-06-19T14:05:00').toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    expect(formatTime('2026-06-19T14:05:00')).toBe(ref)
  })
  it('replis personnalisés "-" et "N/A" préservés', () => {
    expect(formatTime(null, { fallback: '-' })).toBe('-')
    expect(formatTime(null, { fallback: 'N/A' })).toBe('N/A')
  })
})

describe('utils/formatters — formatDuration (NON convergé : doc de la divergence)', () => {
  it('utilise Math.floor et « Ymin » sans espace (≠ formatters locaux conservés)', () => {
    // Le canonique : "1h 30min" / "45min". Les locaux gardés diffèrent
    // volontairement (Math.round + « 45 min »), d'où leur non-convergence.
    expect(formatDuration(90)).toBe('1h 30min')
    expect(formatDuration(45)).toBe('45min')
    expect(formatDuration(0, { fallback: '-' })).toBe('-')
  })
})

/**
 * `formatCount` — rendu d'un compteur MESURÉ vs NON MESURÉ.
 *
 * Motif : plusieurs écrans rendaient leurs compteurs via `{{ stats.x || 0 }}`,
 * ce qui affiche `0` aussi bien pour un comptage réellement nul que pour une
 * donnée jamais chargée. Une panne s'y lisait comme un fait (« 0 étudiant »).
 * Seule une valeur numérique effective doit produire un nombre.
 */
describe('formatCount', () => {
  it('rend les nombres mesurés, zéro compris', () => {
    expect(formatCount(42)).toBe('42')
    expect(formatCount(0)).toBe('0')
  })

  it('rend le repli « — » pour une valeur NON mesurée', () => {
    expect(formatCount(null)).toBe('—')
    expect(formatCount(undefined)).toBe('—')
    expect(formatCount('')).toBe('—')
    expect(formatCount(NaN)).toBe('—')
    expect(formatCount(Infinity)).toBe('—')
  })

  it('n’interprète pas une chaîne non numérique comme un compte', () => {
    expect(formatCount('abc')).toBe('—')
    expect(formatCount({})).toBe('—')
  })

  it('accepte une chaîne numérique (payloads d’API)', () => {
    expect(formatCount('17')).toBe('17')
    expect(formatCount('0')).toBe('0')
  })

  it('accepte un repli personnalisé', () => {
    expect(formatCount(null, { fallback: 'n/d' })).toBe('n/d')
    expect(formatCount(5, { fallback: 'n/d' })).toBe('5')
  })

  it('accepte un suffixe, appliqué à la seule valeur mesurée', () => {
    expect(formatCount(85, { suffix: '%' })).toBe('85%')
    expect(formatCount(null, { suffix: '%' })).toBe('—')
  })
})

/**
 * `getFullName` — nom affichable, tolérant aux DEUX formes de payload.
 *
 * Défaut constaté sur /admin/settings : le champ « Nom complet » était vide.
 * Le gabarit composait `{{ user.nom }} {{ user.prenom }}`, alors que la réponse
 * de login expose un seul champ `name` — les deux étaient donc `undefined` et
 * la ligne ne rendait qu'un espace.
 */
describe('getFullName', () => {
  it('utilise `name` (forme réelle du payload de login)', () => {
    expect(getFullName({ name: 'N’GUESSAN Marcel' })).toBe('N’GUESSAN Marcel')
  })

  it('compose « prenom nom » quand les champs séparés existent', () => {
    expect(getFullName({ prenom: 'Marie', nom: 'Dupont' })).toBe('Marie Dupont')
  })

  it('privilégie `name` s’il est présent avec les champs séparés', () => {
    expect(getFullName({ name: 'Marie Dupont', prenom: 'X', nom: 'Y' })).toBe('Marie Dupont')
  })

  it('tolère un seul des deux champs séparés, sans espace parasite', () => {
    expect(getFullName({ nom: 'Dupont' })).toBe('Dupont')
    expect(getFullName({ prenom: 'Marie' })).toBe('Marie')
  })

  it('renvoie le repli quand aucun nom n’est disponible', () => {
    expect(getFullName(null)).toBe('')
    expect(getFullName({})).toBe('')
    expect(getFullName({ name: '   ' })).toBe('')
    expect(getFullName({}, { fallback: 'Non renseigné' })).toBe('Non renseigné')
  })
})
