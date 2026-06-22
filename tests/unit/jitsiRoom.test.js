/**
 * Tests des helpers purs de construction de salle/lien Jitsi (utils/jitsiRoom.js, G8).
 * Parité avec l'ancien services/jitsi.js : sanitation, format d'ID et de nom de salle,
 * et assemblage du lien avec les paramètres Jitsi.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api', () => ({
  auth: { getUser: vi.fn(() => ({ name: 'Alice', role: 'etudiant' })) }
}))
vi.mock('@/constants/visio', () => ({ getJitsiDomain: () => 'meet.test' }))

import { sanitizeForUrl, generateRoomId, buildRoomName, generateRoomLink } from '@/utils/jitsiRoom'
import { auth } from '@/services/api'

describe('utils/jitsiRoom — sanitizeForUrl', () => {
  it('supprime accents, espaces et caractères spéciaux', () => {
    // tronqué à 20 caractères ('Mathematiquesgenerales' → 22 → 20)
    expect(sanitizeForUrl('Mathématiques générales !')).toBe('Mathematiquesgeneral')
  })
  it('limite à 20 caractères', () => {
    expect(sanitizeForUrl('abcdefghijklmnopqrstuvwxyz').length).toBe(20)
  })
})

describe('utils/jitsiRoom — generateRoomId', () => {
  it('format lms_seance_{id}_{timestamp}', () => {
    expect(generateRoomId({ id: 7 })).toMatch(/^lms_seance_7_\d+$/)
  })
})

describe('utils/jitsiRoom — buildRoomName', () => {
  it('assemble LMS-Matiere-Classe-Date-roomId8', () => {
    const seance = {
      matiere: { nom: 'Maths' },
      classe: { nom: 'L1 InfoA' },
      programmation: { date: '2025-10-20T00:00:00.000Z' }
    }
    expect(buildRoomName(seance, 'abcdef1234567890')).toBe('LMS-Maths-L1InfoA-2025-10-20-34567890')
  })
  it('omet les parties absentes mais garde le suffixe roomId', () => {
    expect(buildRoomName({}, '0000000087654321')).toBe('LMS-87654321')
  })
})

describe('utils/jitsiRoom — generateRoomLink', () => {
  beforeEach(() => {
    auth.getUser.mockReturnValue({ name: 'Alice', role: 'etudiant' })
  })

  it('utilise visio_room_id existant et le domaine configuré', () => {
    const url = generateRoomLink({ id: 1, visio_room_id: 'room-xyz12345', matiere: { nom: 'Maths' } })
    expect(url.startsWith('https://meet.test/LMS-Maths-')).toBe(true)
    expect(url).toContain('#')
  })

  it('mute les étudiants par défaut (startWithAudioMuted=true)', () => {
    const url = generateRoomLink({ id: 1, visio_room_id: 'room-xyz12345' })
    expect(decodeURIComponent(url)).toContain('config.startWithAudioMuted=true')
  })

  it('ne mute pas les enseignants (startWithAudioMuted=false)', () => {
    auth.getUser.mockReturnValue({ name: 'Bob', role: 'enseignant' })
    const url = generateRoomLink({ id: 1, visio_room_id: 'room-xyz12345' })
    expect(decodeURIComponent(url)).toContain('config.startWithAudioMuted=false')
  })
})
