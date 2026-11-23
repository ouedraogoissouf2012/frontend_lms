// Parcours fonctionnel « CRÉER UNE SESSION ET LA PUBLIER » (#606) : l'admin d'une école autonome crée une formation, puis
// une session datée de cette formation en la CHOISISSANT dans la liste (GET /programs), et la publie. Chaque étape est
// relue à l'écran et dans `GET /training-sessions` : le statut, et le titre de la formation (`program.titre`).
// En école KLASSCI, l'écran est réservé au catalogue local : NON TESTÉ, déclaré.
import { ATTENTE, appel, bouton, refusServeur } from './gestes.mjs'
import { creerProgrammeEtSession } from './gestes-sessions.mjs'
import { lireApi } from './fonctionnels.mjs'

const ECRAN = '/admin/training-sessions'

/** La date de début : demain, au format des champs date (AAAA-MM-JJ). « Publier » exige une date de début. */
export const demain = (maintenant = new Date()) => new Date(maintenant.getTime() + 24 * 3600 * 1000).toISOString().slice(0, 10)

export const DONNEES_PUBLICATION = Object.freeze({ programme: 'Formation E2E 606', session: 'Session publiee E2E 606' })

const nonTesteKlassci = { nonTeste: 'sans objet : en école KLASSCI, l’écran des sessions est réservé au catalogue local (peutGererCatalogueLocal)' }
const carte = (page, libelle) => page.locator('article.period-card').filter({ has: page.getByRole('heading', { name: libelle, exact: true }) })
export const ligneDe = (corps, libelle) => (Array.isArray(corps?.data) ? corps.data : []).find((p) => p?.libelle === libelle) ?? null

/**
 * Une session relue : sa carte dit le statut attendu et sa formation ; `GET /training-sessions` porte le même statut et
 * `program.titre`.
 * @param {{ carte: string|null, api: { statut: number, ligne: object|null } }} lecture
 */
export function jugerSession({ carte: texte, api }, { statut, libelleStatut, programme }) {
  if (!texte) return { confirme: false, ecart: 'la carte de la session n’apparaît pas à l’écran' }
  if (!texte.includes(`Formation : ${programme}`)) return { confirme: false, ecart: `la carte ne dit pas « Formation : ${programme} » : « ${texte.slice(0, 120)} »` }
  if (!texte.includes(libelleStatut)) return { confirme: false, ecart: `la carte ne dit pas « ${libelleStatut} »` }
  if (api.statut !== 200) return { confirme: false, ecart: `GET /training-sessions rend HTTP ${api.statut}` }
  if (api.ligne?.status !== statut) return { confirme: false, ecart: `GET /training-sessions : ${api.ligne ? `statut ${api.ligne.status}` : 'aucune ligne'}, ${statut} attendu` }
  if (api.ligne?.program?.titre !== programme) return { confirme: false, ecart: `GET /training-sessions : program.titre ${JSON.stringify(api.ligne?.program?.titre)}, « ${programme} » attendu` }
  return { confirme: true, preuve: `carte « ${libelleStatut} », « Formation : ${programme} » ; GET /training-sessions : ${statut}, program.titre « ${programme} »` }
}

async function ecran(page, base) {
  await page.goto(`${base}${ECRAN}`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: ATTENTE }).catch(() => {})
}

async function relire(ctx, attendu) {
  const page = ctx.pages.admin
  await ecran(page, ctx.base)
  const c = carte(page, ctx.donnees.session)
  await c.waitFor({ state: 'visible', timeout: ATTENTE }).catch(() => {})
  const { statut, corps } = await lireApi(page, '/training-sessions?per_page=100')
  return jugerSession({ carte: (await c.count()) ? await c.innerText() : null, api: { statut, ligne: ligneDe(corps, ctx.donnees.session) } }, { ...attendu, programme: ctx.donnees.programme })
}

export const ETAPES_PUBLICATION = Object.freeze([
  {
    cle: 'creer', compte: 'admin', libelle: 'créer une formation, puis une session datée en la choisissant dans la liste', requiert: [],
    action: async (ctx) => {
      if (ctx.jeu.ecole === 'klassci') return nonTesteKlassci
      const page = ctx.pages.admin
      await ecran(page, ctx.base)
      return creerProgrammeEtSession(page, { programme: ctx.donnees.programme, session: ctx.donnees.session, debut: demain() })
    },
    relecture: (ctx) => relire(ctx, { statut: 'brouillon', libelleStatut: 'Brouillon' }),
  },
  {
    cle: 'publier', compte: 'admin', libelle: 'publier la session', requiert: ['creer'],
    action: async (ctx) => {
      const page = ctx.pages.admin
      await ecran(page, ctx.base)
      const c = carte(page, ctx.donnees.session)
      await c.waitFor({ state: 'visible', timeout: ATTENTE })
      const reponse = appel(page, 'POST', /^\/api\/training-sessions\/\d+\/publier$/)
      await bouton(c, 'Publier').click()
      return (await refusServeur(page, reponse, 'la publication de la session')) ?? {}
    },
    relecture: (ctx) => relire(ctx, { statut: 'publiee', libelleStatut: 'Publiée' }),
  },
])
