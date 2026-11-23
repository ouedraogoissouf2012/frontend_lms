/**
 * Parcours fonctionnel de la VIDÉO INTERNE d'un chapitre (#616) : ce que la relecture exige pour dire VERT. L'éditeur
 * montre la mention du catalogue sans champ d'URL ; le PUT ne porte pas `video_url` ; l'API relue garde le provider.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  DONNEES_VIDEO_INTERNE, ETAPES_VIDEO_INTERNE, MENTION_TELEVERSEE, VIDEO_CONSERVEE, jugerEditeur, jugerRenommage,
} from '../../e2e/parcours-video-interne.mjs'
import { MENTIONS_VIDEO_INTERNE, VIDEO_INTERNE_CONSERVEE } from '../../src/constants/chapterVideo.js'

const CHAPITRE = { lecon: 3, id: 9, titre: 'Chapitre 2, video interne' }
const TITRE = `${CHAPITRE.titre}${DONNEES_VIDEO_INTERNE.suffixe}`
const relu = (champs = {}) => ({
  statut: 200,
  corps: { success: true, data: [{ id: 9, title: TITRE, video_provider: 'upload', video_url: 'https://api.e2e.test/signee', ...champs }] },
})
const renommage = (champs = {}) => ({ statut: 200, corps: { title: TITRE, content_type: 'video', order: 1 }, relu: relu(), ...champs })

describe('parcours-video-interne — les étapes', () => {
  it('l’enseignant ouvre l’éditeur, puis renomme ; le renommage ne dépend pas de l’éditeur', () => {
    expect(ETAPES_VIDEO_INTERNE.map((e) => [e.cle, e.compte, e.requiert])).toEqual([
      ['editer', 'enseignant', []],
      ['renommer', 'enseignant', []],
    ])
  })

  it('les textes attendus SONT ceux du catalogue du front', () => {
    expect(MENTION_TELEVERSEE).toBe(MENTIONS_VIDEO_INTERNE.upload)
    expect(VIDEO_CONSERVEE).toBe(VIDEO_INTERNE_CONSERVEE)
  })

  it('le montage de l’école LMS range la vidéo par le service du produit et l’écrit dans le jeu', () => {
    const ps1 = readFileSync(resolve(process.cwd(), 'e2e/ecole-lms.ps1'), 'utf8')
    expect(ps1).toMatch(/app\(ChapterConversionDispatcher::class\)->dispatch\(/)
    expect(ps1).toMatch(/chapitre_video = \$chapitreVideo/)
  })

  it.each(ETAPES_VIDEO_INTERNE.map((e) => [e.cle, e]))('%s : sans chapitre dans le jeu (école KLASSCI), NON TESTÉ ; un manque du montage, ROUGE', async (_, etape) => {
    expect((await etape.action({ jeu: {}, etat: {}, donnees: DONNEES_VIDEO_INTERNE })).nonTeste).toMatch(/aucun chapitre à vidéo interne/)
    const manque = 'video interne non rangee par le service'
    expect(await etape.action({ jeu: { chapitre_video: null, manques: { chapitre_video: manque } }, etat: {} })).toEqual({ rouge: manque })
  })
})

describe('parcours-video-interne — la relecture', () => {
  it('éditeur VERT : la mention et la phrase du catalogue, aucun champ d’URL', () => {
    expect(jugerEditeur({ ecran: `Chapitre 2\n${MENTION_TELEVERSEE}\n${VIDEO_CONSERVEE}`, champsUrl: 0 }).confirme).toBe(true)
  })

  it('éditeur ROUGE : l’ancien champ d’URL, ou la mention absente', () => {
    expect(jugerEditeur({ ecran: '', champsUrl: 1 }).ecart).toBe('le champ « URL vidéo » reste éditable pour une vidéo interne')
    expect(jugerEditeur({ ecran: VIDEO_CONSERVEE, champsUrl: 0 }).ecart).toBe('l’éditeur n’affiche pas « Vidéo téléversée »')
  })

  it('renommage VERT : PUT 200 sans video_url, chapitre relu renommé, provider upload, vidéo servie', () => {
    expect(jugerRenommage(renommage(), CHAPITRE, TITRE)).toEqual({
      confirme: true, preuve: 'PUT sans video_url ; chapitre 9 relu renommé, provider upload, vidéo servie',
    })
  })

  it('renommage ROUGE : l’URL signée renvoyée, un statut, un titre, un provider ou une vidéo perdus', () => {
    const avecUrl = renommage({ corps: { title: TITRE, video_url: 'https://api.e2e.test/signee' } })
    expect(jugerRenommage(avecUrl, CHAPITRE, TITRE).ecart).toBe('le corps du PUT renvoie video_url pour une vidéo interne')
    expect(jugerRenommage(renommage({ statut: 422 }), CHAPITRE, TITRE).ecart).toBe('PUT /chapters/9 rend HTTP 422, 200 attendu')
    expect(jugerRenommage(renommage({ relu: relu({ title: 'autre' }) }), CHAPITRE, TITRE).ecart).toBe(`titre relu « autre », « ${TITRE} » attendu`)
    expect(jugerRenommage(renommage({ relu: relu({ video_provider: null }) }), CHAPITRE, TITRE).ecart).toBe('video_provider relu « null », « upload » attendu')
    expect(jugerRenommage(renommage({ relu: relu({ video_url: '' }) }), CHAPITRE, TITRE).ecart).toBe('la vidéo relue n’est plus servie (video_url vide)')
  })
})
