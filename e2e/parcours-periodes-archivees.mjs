// Parcours fonctionnel des PÉRIODES ARCHIVÉES (#611, lms_backend#1208 point 3, PR #1290) : l'admin d'une école autonome
// crée une période par l'écran, l'annule, l'archive, puis la revoit avec « Voir les périodes archivées ». Chaque étape
// est relue des deux côtés : l'écran, et `GET /training-sessions` sans puis avec `archivees=1` (le serveur fait foi).
// En école KLASSCI, l'écran est réservé à `peutGererCatalogueLocal` : NON TESTÉ, déclaré, jamais un vert inventé.
import { ATTENTE, appel, bouton, refusServeur } from './gestes.mjs'
import { confirmer } from './gestes-evaluation.mjs'
import { creerProgrammeEtSession } from './gestes-sessions.mjs'
import { lireApi } from './fonctionnels.mjs'

export const DONNEES_PERIODES = Object.freeze({ programme: 'Formation E2E 611', periode: 'Periode archivee E2E 611' })
export const CASE = 'Voir les périodes archivées'
const ECRAN = '/admin/training-sessions'

/** La ligne de la période dans une page de `GET /training-sessions`, ou null. */
export const ligneDe = (corps, libelle) => (Array.isArray(corps?.data) ? corps.data : []).find((p) => p?.libelle === libelle) ?? null

/**
 * L'archivage relu : la carte a quitté l'écran AUSSITÔT puis après rechargement, la liste par défaut ne la porte plus,
 * et la liste `archivees=1` la porte, archivée.
 */
export function jugerArchivage({ carteAussitot, carteRechargee, defaut, archivees }) {
  if (carteAussitot > 0) return { confirme: false, ecart: 'la carte reste affichée juste après « Archiver » (case décochée)' }
  if (carteRechargee > 0) return { confirme: false, ecart: 'la carte revient après rechargement, case décochée' }
  if (defaut.statut !== 200 || archivees.statut !== 200) return { confirme: false, ecart: `GET /training-sessions rend HTTP ${defaut.statut} / ${archivees.statut}` }
  if (defaut.ligne) return { confirme: false, ecart: 'la liste par défaut porte encore la période archivée' }
  if (archivees.ligne?.status !== 'archivee') return { confirme: false, ecart: `la liste archivees=1 porte ${archivees.ligne ? `le statut ${archivees.ligne.status}` : 'aucune ligne'}, archivee attendu` }
  return { confirme: true, preuve: 'carte retirée aussitôt et après rechargement ; absente de la liste par défaut, archivée dans archivees=1' }
}

/** La période revue : la case cochée, sa carte est là et dit « Archivée ». */
export function jugerRevue({ coche, carte }) {
  if (!coche) return { confirme: false, ecart: `la case « ${CASE} » n’est pas cochée` }
  if (!carte) return { confirme: false, ecart: 'case cochée, la carte de la période archivée n’apparaît pas' }
  if (!carte.includes('Archivée')) return { confirme: false, ecart: `la carte ne dit pas « Archivée » : « ${carte.slice(0, 120)} »` }
  return { confirme: true, preuve: 'case cochée : la carte revient, « Archivée »' }
}

const carte = (page, libelle) => page.locator('article.period-card').filter({ has: page.getByRole('heading', { name: libelle, exact: true }) })
const nonTesteKlassci = { nonTeste: 'sans objet : en école KLASSCI, l’écran des sessions est réservé au catalogue local (peutGererCatalogueLocal)' }

async function ecran(page, base) {
  await page.goto(`${base}${ECRAN}`, { waitUntil: 'domcontentloaded' })
  await page.waitForLoadState('networkidle', { timeout: ATTENTE }).catch(() => {})
}

async function lignes(page, libelle) {
  const defaut = await lireApi(page, '/training-sessions?per_page=100')
  const archivees = await lireApi(page, '/training-sessions?per_page=100&archivees=1')
  return { defaut: { statut: defaut.statut, ligne: ligneDe(defaut.corps, libelle) }, archivees: { statut: archivees.statut, ligne: ligneDe(archivees.corps, libelle) } }
}

/** Une transition par le bouton de la carte, confirmée ; ROUGE si le serveur la refuse. */
async function transition(ctx, action, libelleBouton) {
  const page = ctx.pages.admin
  await ecran(page, ctx.base)
  const c = carte(page, ctx.donnees.periode)
  await c.waitFor({ state: 'visible', timeout: ATTENTE })
  const reponse = appel(page, 'POST', new RegExp(`^/api/training-sessions/\\d+/${action}$`))
  await bouton(c, libelleBouton).click()
  await confirmer(page, `${libelleBouton} « ${ctx.donnees.periode} »`, `${libelleBouton} la période`)
  return refusServeur(page, reponse, `« ${libelleBouton} » la période`)
}

export const ETAPES_PERIODES = Object.freeze([
  {
    cle: 'creer', compte: 'admin', libelle: 'créer un programme et une période par l’écran', requiert: [],
    action: async (ctx) => {
      if (ctx.jeu.ecole === 'klassci') return nonTesteKlassci
      const page = ctx.pages.admin
      await ecran(page, ctx.base)
      // #606 : la formation se choisit dans la liste, par son titre (e2e/gestes-sessions.mjs).
      return creerProgrammeEtSession(page, { programme: ctx.donnees.programme, session: ctx.donnees.periode })
    },
    relecture: async (ctx) => {
      const page = ctx.pages.admin
      await carte(page, ctx.donnees.periode).waitFor({ state: 'visible', timeout: ATTENTE }).catch(() => {})
      const vue = await carte(page, ctx.donnees.periode).count()
      const { defaut } = await lignes(page, ctx.donnees.periode)
      if (!vue) return { confirme: false, ecart: 'la période créée n’apparaît pas à l’écran' }
      if (defaut.ligne?.status !== 'brouillon') return { confirme: false, ecart: `GET /training-sessions : ${defaut.ligne ? `statut ${defaut.ligne.status}` : 'aucune ligne'}, brouillon attendu` }
      return { confirme: true, preuve: 'carte affichée ; GET /training-sessions : brouillon' }
    },
  },
  {
    cle: 'annuler', compte: 'admin', libelle: 'annuler la période (confirmée)', requiert: ['creer'],
    action: async (ctx) => (await transition(ctx, 'annuler', 'Annuler')) ?? {},
    relecture: async (ctx) => {
      const { defaut } = await lignes(ctx.pages.admin, ctx.donnees.periode)
      return defaut.ligne?.status === 'annulee'
        ? { confirme: true, preuve: 'GET /training-sessions : annulee' }
        : { confirme: false, ecart: `GET /training-sessions : ${defaut.ligne ? `statut ${defaut.ligne.status}` : 'aucune ligne'}, annulee attendu` }
    },
  },
  {
    cle: 'archiver', compte: 'admin', libelle: 'archiver la période : elle quitte la liste aussitôt', requiert: ['annuler'],
    action: async (ctx) => {
      const refus = await transition(ctx, 'archiver', 'Archiver')
      if (refus) return refus
      const page = ctx.pages.admin
      await carte(page, ctx.donnees.periode).waitFor({ state: 'detached', timeout: ATTENTE }).catch(() => {})
      ctx.etat.carteAussitot = await carte(page, ctx.donnees.periode).count()
      return {}
    },
    relecture: async (ctx) => {
      const page = ctx.pages.admin
      await ecran(page, ctx.base)
      return jugerArchivage({ carteAussitot: ctx.etat.carteAussitot, carteRechargee: await carte(page, ctx.donnees.periode).count(), ...(await lignes(page, ctx.donnees.periode)) })
    },
  },
  {
    cle: 'revoir', compte: 'admin', libelle: `cocher « ${CASE} » : la période revient`, requiert: ['archiver'],
    action: async (ctx) => {
      const page = ctx.pages.admin
      await ecran(page, ctx.base)
      const liste = appel(page, 'GET', '/training-sessions')
      await page.getByLabel(CASE, { exact: true }).check()
      return (await refusServeur(page, liste, 'la liste des périodes archivées')) ?? {}
    },
    relecture: async (ctx) => {
      const page = ctx.pages.admin
      const c = carte(page, ctx.donnees.periode)
      await c.waitFor({ state: 'visible', timeout: ATTENTE }).catch(() => {})
      return jugerRevue({ coche: await page.getByLabel(CASE, { exact: true }).isChecked(), carte: (await c.count()) ? await c.innerText() : null })
    },
  },
])
