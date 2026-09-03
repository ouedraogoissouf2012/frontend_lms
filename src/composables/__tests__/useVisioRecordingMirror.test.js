/**
 * Tests du miroir d'enregistrement — src/composables/useVisioRecordingMirror.js (#673)
 *
 * ## La cause racine que ce miroir corrige
 *
 * Le LMS et Jitsi tenaient deux vérités séparées sur le même enregistrement.
 * Deux défauts symétriques en découlaient, tous deux constatés en production :
 *
 *  · bouton du LMS   → ligne créée, Jibri jamais prévenu → enregistrement fantôme
 *                      (`seance_recordings#1`, 2026-09-02) ;
 *  · bouton de Jitsi → Jibri enregistre, aucune ligne → webhook refusé en 404,
 *                      vidéo abandonnée (`finalize.log`, 2026-08-31).
 *
 * Le miroir ne persiste que ce qu'il OBSERVE, quel que soit le déclencheur.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockStart, mockStop } = vi.hoisted(() => ({ mockStart: vi.fn(), mockStop: vi.fn() }))

vi.mock('@/services/lms', () => ({
  default: { startVisioRecording: mockStart, stopVisioRecording: mockStop },
}))

import { useVisioRecordingMirror } from '@/composables/useVisioRecordingMirror'

const SEANCE_ID = 349

function mirror(seanceId = SEANCE_ID) {
  return useVisioRecordingMirror({ getSeanceId: () => seanceId })
}

beforeEach(() => {
  mockStart.mockReset().mockResolvedValue({ success: true })
  mockStop.mockReset().mockResolvedValue({ success: true })
})

describe('miroir d\'enregistrement — la correction de fond', () => {
  /**
   * LE test qui sépare la correction de fond de la correction de surface.
   *
   * Aucun clic n'a eu lieu dans le LMS : l'enseignant a utilisé le bouton
   * d'enregistrement natif de Jitsi, visible dans son interface puisque son
   * jeton porte `moderator: 'true'`. Toute solution qui se contente de câbler
   * le bouton du LMS échoue ici — et laisse la vidéo être refusée en 404.
   */
  it('M1 — un enregistrement lancé HORS du LMS est quand même persisté', async () => {
    const { onProviderStatus } = mirror()

    await onProviderStatus({ on: true, mode: 'file' })

    expect(mockStart).toHaveBeenCalledTimes(1)
    expect(mockStart).toHaveBeenCalledWith(SEANCE_ID)
  })

  it('M2 — l\'arrêt observé ferme la ligne', async () => {
    const { onProviderStatus } = mirror()
    await onProviderStatus({ on: true, mode: 'file' })

    await onProviderStatus({ on: false, mode: 'file' })

    expect(mockStop).toHaveBeenCalledTimes(1)
    expect(mockStop).toHaveBeenCalledWith(SEANCE_ID)
  })

  /**
   * Jitsi émet un statut à l'entrée en salle, y compris quand rien n'enregistre.
   * Fermer une ligne qui n'a jamais été ouverte enverrait un `stop` parasite à
   * chaque participant qui rejoint.
   */
  it('M3 — un arrêt sans démarrage observé n\'émet rien', async () => {
    const { onProviderStatus } = mirror()

    await onProviderStatus({ on: false, mode: 'file' })

    expect(mockStop).not.toHaveBeenCalled()
    expect(mockStart).not.toHaveBeenCalled()
  })

  /**
   * Jitsi republie l'état à chaque arrivée de participant. Sans mémoire de
   * l'état déjà reflété, une salle de 30 étudiants martèlerait le backend.
   */
  it('M4 — un état répété n\'est reflété qu\'une fois', async () => {
    const { onProviderStatus } = mirror()

    await onProviderStatus({ on: true, mode: 'file' })
    await onProviderStatus({ on: true, mode: 'file' })
    await onProviderStatus({ on: true, mode: 'file' })

    expect(mockStart).toHaveBeenCalledTimes(1)
  })

  it('M5 — un cycle complet démarrage/arrêt/redémarrage est reflété entièrement', async () => {
    const { onProviderStatus } = mirror()

    await onProviderStatus({ on: true })
    await onProviderStatus({ on: false })
    await onProviderStatus({ on: true })

    expect(mockStart).toHaveBeenCalledTimes(2)
    expect(mockStop).toHaveBeenCalledTimes(1)
  })
})

describe('miroir d\'enregistrement — robustesse', () => {
  it('M6 — sans séance active, rien n\'est émis', async () => {
    const { onProviderStatus } = mirror(null)

    await onProviderStatus({ on: true })

    expect(mockStart).not.toHaveBeenCalled()
  })

  /**
   * Le miroir s'exécute DANS un gestionnaire d'événement Jitsi. Une exception
   * qui remonte casserait la salle en plein cours — pour un défaut de
   * journalisation. L'échec est tracé, jamais propagé.
   */
  it('M7 — un backend en échec ne casse pas la salle', async () => {
    mockStart.mockRejectedValue(new Error('503'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { onProviderStatus } = mirror()

    await expect(onProviderStatus({ on: true })).resolves.toBeUndefined()
  })

  /**
   * Un échec de persistance ne doit PAS être mémorisé comme un succès : sinon
   * l'état réel ne serait jamais rattrapé, et la vidéo finirait en 404 — le
   * défaut même que ce miroir corrige.
   */
  it('M8 — un échec n\'est pas mémorisé : la tentative suivante réessaie', async () => {
    mockStart.mockRejectedValueOnce(new Error('503'))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const { onProviderStatus } = mirror()

    await onProviderStatus({ on: true })
    await onProviderStatus({ on: true })

    expect(mockStart).toHaveBeenCalledTimes(2)
  })

  it('M9 — un événement sans champ `on` exploitable est ignoré', async () => {
    const { onProviderStatus } = mirror()

    await onProviderStatus({ mode: 'file' })
    await onProviderStatus(null)
    await onProviderStatus(undefined)

    expect(mockStart).not.toHaveBeenCalled()
    expect(mockStop).not.toHaveBeenCalled()
  })
})
