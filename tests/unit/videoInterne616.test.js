/**
 * #616 : pour une vidéo INTERNE (`video_provider` jibri ou upload), le `video_url` servi à la lecture est une URL
 * signée, valable quelques heures, pas le chemin du fichier. Le front la renvoyait à chaque enregistrement
 * (`buildChapterPayload`) ; depuis lms_backend#1287 (#1335) l'API l'ignore pour une vidéo interne, en silence. Le
 * champ « URL vidéo » restait éditable, prérempli de cette URL : ce que l'enseignant y saisissait était perdu.
 * Désormais : pas de `video_url` dans le payload d'une vidéo interne, et une mention en lecture seule à la place du
 * champ, tirée du catalogue du front (D0), sans aucune promesse de remplacement (aucun type vidéo n'est téléversable).
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { flushPromises, mount } from '@vue/test-utils'
import { defineComponent, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const apiGet = vi.fn()
const apiPut = vi.fn()
vi.mock('@/services/api', () => ({
  default: { get: (...a) => apiGet(...a), post: vi.fn(), put: (...a) => apiPut(...a), delete: vi.fn() },
}))
vi.mock('@/composables/useToast', () => ({ toast: { error: vi.fn(), success: vi.fn(), warning: vi.fn() } }))
vi.mock('@/composables/useConfirm', () => ({ useConfirm: () => ({ confirm: vi.fn() }) }))
vi.mock('@/services/knowledgeCheck', () => ({
  default: { getByChapter: vi.fn().mockResolvedValue({ success: true, data: [] }), delete: vi.fn() },
}))

import { buildChapterPayload, estVideoInterne } from '@/utils/chapterManager'
import { MENTIONS_VIDEO_INTERNE, VIDEO_INTERNE_CONSERVEE, VIDEOS_INTERNES } from '@/constants/chapterVideo'
import { useChapterManager } from '@/composables/useChapterManager'
import ChapterContentField from '@/components/lessons/ChapterContentField.vue'

const URL_SIGNEE = 'https://api.e2e.test/api/chapters/7/video?expires=1&signature=fictive'
const chapitre = (video_provider) => ({
  id: 7, title: 'Fractions', content_type: 'video', content: '', video_url: URL_SIGNEE, video_provider,
  external_link: '', autoplay_video: true, order: 2, isEditing: true,
})

beforeEach(() => {
  apiGet.mockReset()
  apiPut.mockReset()
})

describe('#616 — une vidéo interne, c’est jibri ou upload (miroir de RecordingVideoService::NOS_FICHIERS)', () => {
  it('le catalogue nomme les deux, et rien d’autre', () => {
    expect([...VIDEOS_INTERNES].sort()).toEqual(['jibri', 'upload'])
    expect(MENTIONS_VIDEO_INTERNE).toEqual({ jibri: 'Vidéo enregistrée lors d\'une séance', upload: 'Vidéo téléversée' })
    expect(VIDEO_INTERNE_CONSERVEE).toBe('Cette vidéo est conservée par la plateforme : son adresse ne se modifie pas ici.')
  })

  it('aucun texte ne promet un remplacement (aucun type vidéo n’est téléversable)', () => {
    for (const texte of [...Object.values(MENTIONS_VIDEO_INTERNE), VIDEO_INTERNE_CONSERVEE]) {
      expect(texte).not.toMatch(/rempla|téléversez|changez/i)
    }
  })

  it.each([['jibri', true], ['upload', true], [null, false], ['', false], [undefined, false], ['youtube', false]])(
    'estVideoInterne(%s) → %s', (provider, attendu) => {
      expect(estVideoInterne(chapitre(provider))).toBe(attendu)
    })
})

describe('#616 — buildChapterPayload n’envoie plus l’URL signée d’une vidéo interne', () => {
  it.each(['jibri', 'upload'])('%s : pas de clé video_url ; les autres champs, intacts et dans leur ordre', (provider) => {
    const payload = buildChapterPayload(chapitre(provider))
    expect('video_url' in payload).toBe(false)
    expect(Object.keys(payload)).toEqual(['title', 'content_type', 'content', 'external_link', 'autoplay_video', 'order'])
    expect(payload.autoplay_video).toBe(true)
  })

  it.each([null, '', undefined, 'youtube'])('provider %s (lien externe) : video_url part, comme avant', (provider) => {
    expect(buildChapterPayload(chapitre(provider)).video_url).toBe(URL_SIGNEE)
  })
})

describe('#616 — le champ « URL vidéo » d’une vidéo interne est une mention en lecture seule', () => {
  const monter = (chapter) => mount(ChapterContentField, { props: { chapter }, global: { stubs: { TipTapEditor: true } } })

  it.each(['jibri', 'upload'])('%s : la mention du catalogue, aucun champ URL ; la lecture automatique reste éditable', (provider) => {
    const champ = monter(chapitre(provider))
    expect(champ.find('input[type="url"]').exists()).toBe(false)
    const mention = champ.find('[role="status"]')
    expect(mention.text()).toContain(MENTIONS_VIDEO_INTERNE[provider])
    expect(mention.text()).toContain(VIDEO_INTERNE_CONSERVEE)
    expect(champ.text()).not.toContain(URL_SIGNEE)
    expect(champ.find('.checkbox-label input[type="checkbox"]').exists()).toBe(true)
  })

  it('lien externe (provider vide) : le champ URL reste éditable', async () => {
    const chapter = chapitre(null)
    const champ = monter(chapter)
    expect(champ.find('[role="status"]').exists()).toBe(false)
    await champ.find('input[type="url"]').setValue('https://youtu.be/fictif')
    expect(chapter.video_url).toBe('https://youtu.be/fictif')
  })

  it('le composant ne nomme aucun provider en dur : il passe par le catalogue', () => {
    const source = readFileSync(resolve(process.cwd(), 'src/components/lessons/ChapterContentField.vue'), 'utf8')
    expect(source).not.toMatch(/Vidéo téléversée|Vidéo enregistrée/)
  })
})

describe('#616 — l’enregistrement d’un chapitre à vidéo interne (PUT /chapters/{id})', () => {
  async function chapitresCharges(chapitres) {
    apiGet.mockResolvedValue({ success: true, data: chapitres })
    let api
    mount(defineComponent({ setup() { api = useChapterManager(ref(42)); return () => null } }))
    await flushPromises()
    return api
  }

  it('le corps du PUT d’une vidéo interne n’a pas de video_url', async () => {
    const m = await chapitresCharges([chapitre('upload')])
    apiPut.mockResolvedValue({ success: true, data: { id: 7 } })
    const lu = m.chapters.value[0]
    m.editChapter(lu)
    lu.title = 'Fractions, renommé'
    await m.saveChapter(lu)
    expect(apiPut).toHaveBeenCalledTimes(1)
    const [url, corps] = apiPut.mock.calls[0]
    expect(url).toBe('/chapters/7')
    expect(corps).toMatchObject({ title: 'Fractions, renommé' })
    expect('video_url' in corps).toBe(false)
  })

  it('le corps du PUT d’un lien externe garde video_url', async () => {
    const m = await chapitresCharges([chapitre(null)])
    apiPut.mockResolvedValue({ success: true, data: { id: 7 } })
    await m.saveChapter(m.chapters.value[0])
    expect(apiPut.mock.calls[0][1].video_url).toBe(URL_SIGNEE)
  })
})
