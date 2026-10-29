/**
 * Corps de POST /lessons/{id}/progress (#435, décision D2).
 *
 * Le temps passé a une seule source de vérité : `chapter_progress.time_spent_seconds`,
 * que le serveur enregistre déjà chapitre par chapitre. Au niveau de la leçon, le
 * client envoyait `time_spent_minutes` = `lesson.duration_minutes || 0`, une colonne
 * morte (hors `$fillable`), donc toujours 0 ; et même remplie, une durée ESTIMÉE
 * n'est pas un temps passé. Le serveur cumule ce champ (`+=`) : il ne doit plus
 * recevoir de valeur fabriquée. Champ absent ⇒ `!== null` ⇒ aucun cumul.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'

const post = vi.fn()
vi.mock('@/services/api', () => ({ default: { post: (...a) => post(...a) } }))

import lessonService from '@/services/lesson'

beforeEach(() => {
  post.mockReset()
  post.mockResolvedValue({ success: true, data: {} })
})

describe('lessonService.updateProgress (#435)', () => {
  it("n'envoie que le pourcentage : aucun temps passé fabriqué", async () => {
    await lessonService.updateProgress(5, 50)

    expect(post).toHaveBeenCalledTimes(1)
    const [url, body] = post.mock.calls[0]
    expect(url).toBe('/lessons/5/progress')
    expect(body).toStrictEqual({ progress_percentage: 50 })
  })

  it("ignore un troisième argument hérité au lieu de l'envoyer", async () => {
    await lessonService.updateProgress(5, 50, 30)

    expect(Object.keys(post.mock.calls[0][1])).toEqual(['progress_percentage'])
  })
})
