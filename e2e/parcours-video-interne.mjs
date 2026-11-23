// Parcours fonctionnel de la VIDÉO INTERNE d'un chapitre (#616, lms_backend#1287) : l'enseignant ouvre en édition
// un chapitre dont la vidéo est un fichier de la plateforme (`video_provider` = upload), lit la mention en lecture
// seule à la place du champ « URL vidéo », puis le renomme. La relecture juge le VRAI contrat de bout en bout :
// le corps du PUT ne porte pas `video_url`, et l'API relue garde le provider et une vidéo servie.
//
// Le chapitre est posé au montage de l'école LMS (e2e/ecole-lms.ps1, étape 9) par le SERVICE du produit qui range
// une vidéo téléversée (ChapterConversionDispatcher, fichier fictif). L'école KLASSCI n'en a pas : NON TESTÉ déclaré.
import { ATTENTE, appel, bouton } from './gestes.mjs'
import { lireApi } from './fonctionnels.mjs'

export const DONNEES_VIDEO_INTERNE = Object.freeze({ suffixe: ', renommé' })

// Les textes du catalogue du front (src/constants/chapterVideo.js), recopiés : l'outil est copié seul en CI.
// Leur égalité avec le catalogue est verrouillée par tests/unit/e2eParcoursVideoInterne.test.js.
export const MENTION_TELEVERSEE = 'Vidéo téléversée'
export const VIDEO_CONSERVEE = 'Cette vidéo est conservée par la plateforme : son adresse ne se modifie pas ici.'

/**
 * L'éditeur ouvert : la mention en lecture seule, sans champ d'URL.
 * @param {{ ecran: string, champsUrl: number }} lecture
 */
export function jugerEditeur({ ecran, champsUrl }) {
  if (champsUrl > 0) return { confirme: false, ecart: 'le champ « URL vidéo » reste éditable pour une vidéo interne' }
  for (const texte of [MENTION_TELEVERSEE, VIDEO_CONSERVEE]) {
    if (!String(ecran).includes(texte)) return { confirme: false, ecart: `l’éditeur n’affiche pas « ${texte} »` }
  }
  return { confirme: true, preuve: 'mention en lecture seule (« Vidéo téléversée »), aucun champ d’URL' }
}

/**
 * Le renommage relu : PUT 200 sans `video_url`, puis le chapitre relu renommé, provider `upload`, vidéo servie.
 * @param {{ statut: number, corps: object|null, relu: { statut: number, corps: any } }} lecture
 */
export function jugerRenommage({ statut, corps, relu }, chapitre, titre) {
  if (statut !== 200) return { confirme: false, ecart: `PUT /chapters/${chapitre.id} rend HTTP ${statut}, 200 attendu` }
  if (!corps || typeof corps !== 'object') return { confirme: false, ecart: 'corps du PUT illisible' }
  if ('video_url' in corps) return { confirme: false, ecart: 'le corps du PUT renvoie video_url pour une vidéo interne' }
  if (relu.statut !== 200) return { confirme: false, ecart: `GET /lessons/${chapitre.lecon}/chapters rend HTTP ${relu.statut}` }
  const c = (Array.isArray(relu.corps?.data) ? relu.corps.data : []).find((x) => x.id === chapitre.id)
  if (!c) return { confirme: false, ecart: `chapitre ${chapitre.id} absent de la relecture` }
  if (c.title !== titre) return { confirme: false, ecart: `titre relu « ${c.title} », « ${titre} » attendu` }
  if (c.video_provider !== 'upload') return { confirme: false, ecart: `video_provider relu « ${c.video_provider} », « upload » attendu` }
  if (!c.video_url) return { confirme: false, ecart: 'la vidéo relue n’est plus servie (video_url vide)' }
  return { confirme: true, preuve: `PUT sans video_url ; chapitre ${chapitre.id} relu renommé, provider upload, vidéo servie` }
}

const absent = () => ({ nonTeste: 'aucun chapitre à vidéo interne dans le jeu de cette école (posé au montage de l’école LMS seulement)' })

/** La page des chapitres de la leçon, le chapitre ouvert en édition ; rend le bloc du chapitre. */
async function editer(ctx) {
  const { lecon, titre } = ctx.jeu.chapitre_video
  const page = ctx.pages.enseignant
  await page.goto(`${ctx.base}/teacher/lessons/${lecon}/chapters`, { waitUntil: 'domcontentloaded' })
  const lu = page.locator('.chapter-block').filter({ has: page.getByRole('heading', { name: titre, exact: true }) })
  await lu.waitFor({ timeout: ATTENTE })
  await bouton(lu, 'Modifier').click()
  // En édition, le titre devient un champ : le bloc se retrouve par son formulaire, le seul ouvert de la page.
  const bloc = page.locator('.chapter-block').filter({ has: page.getByPlaceholder('saisissez le titre') })
  await bloc.waitFor({ timeout: ATTENTE })
  return bloc
}

export const ETAPES_VIDEO_INTERNE = Object.freeze([
  {
    cle: 'editer', compte: 'enseignant', libelle: 'ouvrir en édition un chapitre à vidéo interne', requiert: [],
    action: async (ctx) => {
      if (ctx.jeu.manques?.chapitre_video) return { rouge: ctx.jeu.manques.chapitre_video }
      if (!ctx.jeu.chapitre_video) return absent()
      const bloc = await editer(ctx)
      ctx.etat.editeur = { ecran: await bloc.innerText(), champsUrl: await bloc.locator('input[type="url"]').count() }
      return {}
    },
    relecture: (ctx) => jugerEditeur(ctx.etat.editeur),
  },
  {
    // Indépendante de « editer » : le corps du PUT se juge même si l'éditeur montre encore le champ.
    cle: 'renommer', compte: 'enseignant', libelle: 'renommer ce chapitre (le corps du PUT, puis l’API relue)', requiert: [],
    action: async (ctx) => {
      if (ctx.jeu.manques?.chapitre_video) return { rouge: ctx.jeu.manques.chapitre_video }
      if (!ctx.jeu.chapitre_video) return absent()
      const { id, titre } = ctx.jeu.chapitre_video
      const page = ctx.pages.enseignant
      const bloc = await editer(ctx)
      ctx.etat.titre = `${titre}${ctx.donnees.suffixe}`
      await bloc.getByPlaceholder('saisissez le titre').fill(ctx.etat.titre)
      const requete = page.waitForRequest((r) => r.method() === 'PUT' && new URL(r.url()).pathname === `/api/chapters/${id}`, { timeout: ATTENTE })
      const reponse = appel(page, 'PUT', `/chapters/${id}`)
      await bouton(bloc, 'Enregistrer').click()
      const corps = (await requete).postDataJSON()
      ctx.etat.renommage = { statut: (await reponse).status(), corps }
      return {}
    },
    relecture: async (ctx) => {
      const chapitre = ctx.jeu.chapitre_video
      const relu = await lireApi(ctx.pages.enseignant, `/lessons/${chapitre.lecon}/chapters`)
      return jugerRenommage({ ...ctx.etat.renommage, relu }, chapitre, ctx.etat.titre)
    },
  },
])
