/**
 * #623, étape B de lms_backend#1154 (ADR-1154-01, une porte par espace) : une séance de l'HISTORIQUE se supprime par
 * la porte LOCALE, `DELETE /lms/seances/local/{id}` (lms_backend#1241), avec son id local. Dans une école KLASSCI,
 * la porte historique reçoit l'id KLASSCI du calendrier ET l'id local de l'historique : deux espaces, une porte.
 * Le calendrier (id KLASSCI) garde la porte historique. Le choix de porte se lit sur la SOURCE de la liste (l'historique
 * ne liste que des lignes locales), jamais sur un id deviné : un identifiant illisible est refusé sans appel réseau.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const del = vi.fn()
vi.mock('@/services/api', () => ({
  default: { delete: (...a) => del(...a), get: vi.fn(), post: vi.fn(), put: vi.fn() },
}))

import { endpoints } from '@/services/endpoints'
import { lmsSeancesService } from '@/services/lmsSeances'
import { lmsService } from '@/services/lms'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

beforeEach(() => {
  del.mockReset()
})

describe('#623 — la porte locale existe dans le catalogue des chemins', () => {
  it('deleteLocal(id) → /lms/seances/local/{id} ; la porte historique reste', () => {
    expect(endpoints.lms.seances.deleteLocal(42)).toBe('/lms/seances/local/42')
    expect(endpoints.lms.seances.delete(42)).toBe('/lms/seances/42')
  })
})

describe('#623 — lmsSeancesService.deleteLocalSeance', () => {
  it('appelle DELETE /lms/seances/local/{id} et rend la réponse', async () => {
    del.mockResolvedValue({ success: true, message: 'Séance supprimée' })
    await expect(lmsSeancesService.deleteLocalSeance(42)).resolves.toEqual({ success: true, message: 'Séance supprimée' })
    expect(del).toHaveBeenCalledTimes(1)
    expect(del).toHaveBeenCalledWith('/lms/seances/local/42')
  })

  it('la façade lmsService l’expose aussi (appelants historiques)', () => {
    expect(lmsService.deleteLocalSeance).toBe(lmsSeancesService.deleteLocalSeance)
  })

  it('un faux succès (réponse sans success: true) lève : rien de connu n’a été supprimé', async () => {
    del.mockResolvedValue({ message: 'ok' })
    await expect(lmsSeancesService.deleteLocalSeance(42)).rejects.toThrow()
  })

  it.each([0, -3, 1.5, '42', 'S3', null, undefined, Number.NaN])(
    'un id illisible (%s) est refusé, avec le texte du catalogue, SANS appel réseau', async (id) => {
      await expect(lmsSeancesService.deleteLocalSeance(id)).rejects.toMatchObject({ userMessage: ERROR_MESSAGES.seanceIdentifiantIllisible })
      expect(del).not.toHaveBeenCalled()
    })

  it('le texte du refus est du front, sans promesse ni jargon', () => {
    expect(ERROR_MESSAGES.seanceIdentifiantIllisible).toMatch(/^[A-ZÀ-Ý]/)
    expect(ERROR_MESSAGES.seanceIdentifiantIllisible).not.toMatch(/klassci|undefined|null|id local/i)
  })
})

describe('#623 — chaque appelant garde la porte de SON espace', () => {
  const source = (f) => readFileSync(resolve(process.cwd(), f), 'utf8')

  it('l’historique (ids locaux) passe par la porte locale, jamais par la porte historique', () => {
    const historique = source('src/composables/useSeanceAttendanceHistory.js')
    expect(historique).toMatch(/lmsService\.deleteLocalSeance\(seance\.id\)/)
    expect(historique).not.toMatch(/lmsService\.deleteSeance\(/)
  })

  it('le calendrier (ids KLASSCI) garde la porte historique (étape C côté back)', () => {
    const calendrier = source('src/composables/useSeanceManagement.js')
    expect(calendrier).toMatch(/lmsService\.deleteSeance\(data\.id\)/)
    expect(calendrier).not.toMatch(/deleteLocalSeance/)
  })
})
