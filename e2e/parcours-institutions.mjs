// Parcours fonctionnel du TABLEAU DES INSTITUTIONS (#652) : sur écran large, le tableau du supradmin était coupé à
// droite (`overflow: hidden`, défilement réservé aux écrans de moins de 1024 px) ; la colonne Actions était masquée.
// À 1366 px et à 1920 px, en clair puis en sombre, chaque bouton d'action de la première école est MESURÉ : entier
// dans la fenêtre et dans le cadre du tableau, et c'est bien lui qui reçoit un clic en son centre (`elementFromPoint`).
// Captures de la fenêtre : `captures/institutions-652/<largeur>_<thème>.png` (paires avant / après).
//
// Piège évité : `scrollIntoView` ferait aussi défiler HORIZONTALEMENT un cadre en `overflow: hidden`, ce qui masquerait
// le défaut. Seule la zone de contenu défile, et seulement à la verticale.
// Le supradmin n'est monté qu'avec l'école LMS (parcours.mjs) : dans l'école KLASSCI, NON TESTÉ, déclaré.
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { ATTENTE } from './gestes.mjs'
import { connecter } from './connexion.mjs'

export const DONNEES_INSTITUTIONS = Object.freeze({ dossier: 'captures/institutions-652', largeurs: Object.freeze([1366, 1920]), hauteur: 900 })

/**
 * Chaque bouton est-il visible ET cliquable ? `mesures` : par thème, la fenêtre, le cadre du tableau et les boutons
 * (`{ titre, gauche, droite, recoitLeClic }`).
 */
export function jugerActions(mesures) {
  for (const [theme, m] of Object.entries(mesures)) {
    if (!m.boutons.length) return { confirme: false, ecart: `${theme} : aucun bouton d'action dans la première ligne` }
    for (const b of m.boutons) {
      if (b.droite > m.fenetre + 0.5) return { confirme: false, ecart: `${theme} : « ${b.titre} » déborde de la fenêtre (droite ${Math.round(b.droite)} > ${m.fenetre})` }
      if (b.droite > m.cadre.droite + 0.5 || b.gauche < m.cadre.gauche - 0.5) return { confirme: false, ecart: `${theme} : « ${b.titre} » est coupé par le cadre du tableau (bouton ${Math.round(b.gauche)}–${Math.round(b.droite)}, cadre ${Math.round(m.cadre.gauche)}–${Math.round(m.cadre.droite)})` }
      if (!b.recoitLeClic) return { confirme: false, ecart: `${theme} : « ${b.titre} » ne reçoit pas le clic en son centre (masqué)` }
    }
  }
  const n = Object.values(mesures)[0].boutons.length
  return { confirme: true, preuve: `${n} boutons d'action entiers et cliquables, en ${Object.keys(mesures).join(' et ')}` }
}

const basculer = (page, sombre) => page.evaluate((s) => {
  document.documentElement.classList.toggle('dark', s)
  document.documentElement.setAttribute('data-theme', s ? 'dark' : 'light')
}, sombre)

/** Mesure la première ligne : la zone de contenu défile à la VERTICALE seulement pour l'amener dans la fenêtre. */
const mesurer = (page) => page.evaluate(() => {
  const ligne = document.querySelector('.institutions-table tbody tr')
  const zone = document.querySelector('.content-area')
  const r0 = ligne.getBoundingClientRect()
  if (zone && (r0.bottom > window.innerHeight || r0.top < 0)) zone.scrollTop += r0.top - 160
  const cadre = document.querySelector('.table-container').getBoundingClientRect()
  const boutons = [...ligne.querySelectorAll('.actions-cell .action-btn')].map((b) => {
    const r = b.getBoundingClientRect()
    const cible = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2)
    return { titre: b.getAttribute('title'), gauche: r.left, droite: r.right, recoitLeClic: Boolean(cible && b.contains(cible)) }
  })
  return { fenetre: window.innerWidth, cadre: { gauche: cadre.left, droite: cadre.right }, boutons }
})

function etape(largeur) {
  const cle = `largeur-${largeur}`
  return {
    cle, compte: 'anonyme', libelle: `à ${largeur} px, en clair et en sombre : la colonne Actions est entière et cliquable (supradmin)`, requiert: [],
    action: async (ctx) => {
      const email = process.env.E2E_SUPRADMIN_EMAIL
      if (ctx.jeu.ecole === 'klassci' || !email) return { nonTeste: 'le supradmin n’est monté qu’avec l’école LMS (parcours.mjs) : écran joué dans cette école' }
      const contexte = await ctx.pages.anonyme.context().browser().newContext({ viewport: { width: largeur, height: ctx.donnees.hauteur } })
      const page = await contexte.newPage()
      try {
        const { connecte, alerte } = await connecter(page, ctx.base, email, process.env.E2E_MOT_DE_PASSE)
        if (!connecte) return { nonTeste: `connexion du supradmin impossible : « ${alerte} »` }
        await page.goto(`${ctx.base}/admin/institutions`, { waitUntil: 'domcontentloaded' })
        await page.locator('.institutions-table tbody tr .action-btn').first().waitFor({ state: 'visible', timeout: ATTENTE })
        const dossier = join(ctx.sortie, ctx.donnees.dossier)
        mkdirSync(dossier, { recursive: true })
        const mesures = {}
        for (const [theme, sombre] of [['clair', false], ['sombre', true]]) {
          await basculer(page, sombre)
          await page.waitForTimeout(300)
          mesures[theme] = await mesurer(page)
          await page.screenshot({ path: join(dossier, `${largeur}_${theme}.png`) }).catch(() => {})
        }
        ctx.etat[cle] = mesures
        return {}
      } finally {
        await contexte.close()
      }
    },
    relecture: async (ctx) => jugerActions(ctx.etat[cle]),
  }
}

export const ETAPES_INSTITUTIONS = Object.freeze(DONNEES_INSTITUTIONS.largeurs.map(etape))
