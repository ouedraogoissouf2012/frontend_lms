/**
 * Tests des helpers purs de construction de salle/lien Jitsi (utils/jitsiRoom.js, G8).
 * Le backend fournit l'identifiant de salle ; le front ne le devine pas.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/services/api', () => ({
  auth: { getUser: vi.fn(() => ({ name: 'Alice', role: 'etudiant' })) }
}))
vi.mock('@/constants/visio', () => ({
  getJitsiDomain: () => 'meet.test',
  requireVisioRoomId: (source) => {
    const roomId = source?.visio_room_id || source?.room_id || source?.visio?.room_id
    if (!roomId) throw new Error('Identifiant de salle visio introuvable dans la réponse API.')
    return roomId
  }
}))

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
  it('retourne uniquement le visio_room_id fourni par API', () => {
    expect(generateRoomId({ id: 7, visio_room_id: 'lms_seance_7_123456' })).toBe('lms_seance_7_123456')
  })

  it('refuse de fabriquer une salle locale sans visio_room_id', () => {
    expect(() => generateRoomId({ id: 7 })).toThrow('Identifiant de salle visio')
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
    expect(url.startsWith('https://meet.test/room-xyz12345#')).toBe(true)
    expect(url).toContain('#')
  })

  it('échoue si la réponse ne contient pas visio_room_id', () => {
    expect(() => generateRoomLink({ id: 1 })).toThrow('Identifiant de salle visio')
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
