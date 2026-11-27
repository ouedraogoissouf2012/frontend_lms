// Parcours fonctionnel des BOUTONS PRIMAIRES (#650) : les boutons peints sur `var(--color-primary)`, propriété
// définie nulle part, avaient un fond TRANSPARENT sous un texte blanc : invisibles en thème clair (répétition #647).
// Chaque bouton est atteint par l'écran, son style CALCULÉ est mesuré (fond opaque, contraste du texte), puis il est
// capturé en clair et en sombre (`sortie/boutons-650/<clé>_clair.png`, `_sombre.png`) : paires avant / après.
//
// Trois façons d'atteindre un bouton, déclarées :
//   - par le jeu : le widget (« Mois », la modale d'un événement), les cours de l'enseignant, l'action d'une séance ;
//   - par une réponse FICTIVE : « Rejoindre » n'existe que pendant une visio EN COURS (état fugace du parcours de la
//     séance), « Détails » que pour une séance À VISIO (aucune dans le jeu) ; `GET /lms/seances/upcoming`, leur source
//     commune, est servi avec une séance fictive, à visio et en cours ;
//   - par une PANNE simulée : les boutons « Réessayer » n'existent qu'après un échec. Un contexte NEUF où tout `GET`
//     de l'API rend 500 (sauf l'authentification), posé AVANT la connexion : aucun cache ne masque l'échec.
// Un bouton absent du jeu (aucune donnée pour le montrer) est NON TESTÉ, jamais ROUGE.
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { ATTENTE } from './gestes.mjs'
import { connecter } from './connexion.mjs'

// Sous `captures/` : seul ce dossier de la sortie est publié dans l'artefact (e2e.yml), pour les deux écoles.
export const DONNEES_BOUTONS = Object.freeze({ dossier: 'captures/boutons-650' })

const PANNE = { panne: true }
const VISIO_FICTIVE = { visio: true }

/**
 * Les DIX boutons visibles, dans l'ordre : les pannes d'abord (contextes neufs), puis ceux du jeu. Le onzième composant
 * de l'issue, TeacherDashboard, n'a AUCUN bouton « Réessayer » (choix écrit dans son gabarit) : sa règle
 * `.error-retry-btn` est morte, sans bouton à mesurer.
 */
export const BOUTONS = Object.freeze([
  { cle: 'reessayer-seances', compte: 'admin', chemin: '/admin/seances', selecteur: '.retry-btn', ...PANNE, libelle: '« Réessayer » des séances (admin)' },
  { cle: 'reessayer-stats', compte: 'admin', chemin: '/admin/stats', selecteur: '.retry-btn', ...PANNE, libelle: '« Réessayer » des statistiques (admin)' },
  { cle: 'reessayer-visio', compte: 'admin', chemin: '/admin/visioconferences', selecteur: '.retry-btn', ...PANNE, libelle: '« Réessayer » des visioconférences (admin)' },
  { cle: 'reessayer-matieres', compte: 'enseignant', chemin: '/teacher/matieres', selecteur: '.error-retry-btn', ...PANNE, libelle: '« Réessayer » des matières de l’enseignant' },
  { cle: 'widget-mois', compte: 'admin', chemin: '/admin/dashboard', selecteur: '.view-btn.active', widget: true, libelle: 'le bouton de vue actif du widget (« Mois »)' },
  { cle: 'modale-evenement', compte: 'admin', chemin: '/admin/dashboard', selecteur: '.action-btn.primary', widget: true, evenement: true, libelle: 'l’action de la modale d’un événement du widget' },
  { cle: 'cours-matiere', compte: 'enseignant', chemin: '/teacher/matieres', selecteur: '.course-btn', libelle: 'le bouton de leçons d’une matière (Mes Matières)' },
  { cle: 'cours-tableau', compte: 'enseignant', chemin: '/teacher/dashboard', selecteur: '.course-btn', libelle: 'le bouton de leçons du tableau de bord enseignant' },
  { cle: 'seance-action', compte: 'admin', chemin: '/admin/seances', selecteur: '.action-btn.primary', ...VISIO_FICTIVE, libelle: '« Détails » d’une séance à visio (admin, séance fictive)' },
  { cle: 'visio-action', compte: 'admin', chemin: '/admin/visioconferences', selecteur: '.action-btn.primary', ...VISIO_FICTIVE, libelle: '« Rejoindre » d’une visio en cours (admin, séance fictive)' },
])

/** `rgb(r, g, b)` ou `rgba(r, g, b, a)` → `{ r, g, b, a }`, ou null. */
export function lireCouleur(texte) {
  const m = /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+))?\s*\)$/.exec(String(texte).trim())
  return m ? { r: +m[1], g: +m[2], b: +m[3], a: m[4] === undefined ? 1 : +m[4] } : null
}

const lineaire = (c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4 }
const luminance = ({ r, g, b }) => 0.2126 * lineaire(r) + 0.7152 * lineaire(g) + 0.0722 * lineaire(b)

/** Le rapport de contraste WCAG entre deux couleurs opaques. */
export function contraste(a, b) {
  const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

/** Seuil WCAG d'un composant d'interface ou d'un texte gras (3:1). */
export const CONTRASTE_MIN = 3

/** Le bouton est-il VISIBLE ? Un fond opaque, et un texte qui s'en détache (3:1 au moins). */
export function jugerBouton({ fond, texte }) {
  const f = lireCouleur(fond)
  const t = lireCouleur(texte)
  if (!f || !t) return { confirme: false, ecart: `couleurs illisibles : fond « ${fond} », texte « ${texte} »` }
  if (f.a < 1) return { confirme: false, ecart: `fond ${f.a === 0 ? 'TRANSPARENT' : 'translucide'} (${fond}) sous un texte ${texte} : le bouton se perd dans la page` }
  const ratio = contraste(f, t)
  if (ratio < CONTRASTE_MIN) return { confirme: false, ecart: `contraste ${ratio.toFixed(2)}:1 entre le texte ${texte} et le fond ${fond}, ${CONTRASTE_MIN}:1 attendu` }
  return { confirme: true, preuve: `fond opaque ${fond}, texte ${texte}, contraste ${ratio.toFixed(2)}:1` }
}

const basculer = (page, sombre) => page.evaluate((s) => {
  document.documentElement.classList.toggle('dark', s)
  document.documentElement.setAttribute('data-theme', s ? 'dark' : 'light')
}, sombre)

/** Une séance fictive EN COURS, au format lu par useAdminVisio (aucune donnée réelle). */
function seanceFictive() {
  const maintenant = Date.now()
  return {
    success: true,
    data: [{
      id: 650, visio_enabled: true, visio_active: true, room_name: 'salle-fictive-650',
      matiere: { nom: 'Matiere fictive 650' }, classe: { name: 'Classe fictive 650' }, enseignant: { nom: 'Fictif', prenom: 'Enseignant' },
      date_debut: new Date(maintenant - 10 * 60000).toISOString(), date_fin: new Date(maintenant + 50 * 60000).toISOString(),
    }],
  }
}

/** Ouvre l'écran du bouton et rend sa page (neuve pour une panne) ; `fermer` libère un contexte neuf. */
async function ouvrir(ctx, b) {
  if (b.panne) {
    const contexte = await ctx.pages[b.compte].context().browser().newContext()
    const page = await contexte.newPage()
    // Posée AVANT la connexion : tout GET de l'API échoue, sauf l'authentification et la liste des écoles.
    await page.route('**/api/**', (route) => {
      const req = route.request()
      return req.method() === 'GET' && !/\/api\/(auth\/|institutions\/active)/.test(req.url())
        ? route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'panne simulée (#650)' }) })
        : route.continue()
    })
    const { connecte, alerte } = await connecter(page, ctx.base, ctx.jeu.comptes[b.compte], process.env.E2E_MOT_DE_PASSE)
    if (!connecte) { await contexte.close(); return { nonTeste: `connexion impossible dans le contexte neuf : « ${alerte} »` } }
    await page.goto(`${ctx.base}${b.chemin}`, { waitUntil: 'domcontentloaded' })
    return { page, fermer: () => contexte.close() }
  }
  const page = ctx.pages[b.compte]
  if (b.visio) await page.route('**/api/lms/seances/upcoming**', (route) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(seanceFictive()) }))
  await page.goto(`${ctx.base}${b.chemin}`, { waitUntil: 'domcontentloaded' })
  if (b.widget) {
    const afficher = page.getByRole('button', { name: 'Afficher le calendrier' })
    await afficher.waitFor({ state: 'visible', timeout: ATTENTE }).then(() => afficher.click(), () => {})
  }
  if (b.evenement) {
    await page.locator('.view-btn', { hasText: 'Semaine' }).click({ timeout: ATTENTE }).catch(() => {})
    await page.locator('.fc-event').first().click({ timeout: ATTENTE }).catch(() => {})
  }
  return { page, fermer: async () => { if (b.visio) await page.unroute('**/api/lms/seances/upcoming**') } }
}

function etape(b) {
  return {
    cle: b.cle, compte: b.compte, libelle: `${b.libelle} : visible, fond opaque et contraste 3:1`, requiert: [],
    action: async (ctx) => {
      const ouvert = await ouvrir(ctx, b)
      if (ouvert.nonTeste) return ouvert
      const { page, fermer } = ouvert
      try {
        const bouton = page.locator(b.selecteur).first()
        const vu = await bouton.waitFor({ state: 'attached', timeout: ATTENTE }).then(() => true, () => false)
        if (!vu) return { nonTeste: `aucun bouton « ${b.selecteur} » sur ${b.chemin} : rien dans le jeu pour le montrer` }
        const mesurer = () => bouton.evaluate((el) => { const s = getComputedStyle(el); return { fond: s.backgroundColor, texte: s.color } })
        const dossier = join(ctx.sortie, ctx.donnees.dossier)
        mkdirSync(dossier, { recursive: true })
        const cadre = bouton.locator('xpath=..').locator('xpath=..')
        await basculer(page, false)
        await bouton.scrollIntoViewIfNeeded().catch(() => {})
        ctx.etat[b.cle] = { clair: await mesurer() }
        await cadre.screenshot({ path: join(dossier, `${b.cle}_clair.png`) }).catch(() => {})
        await basculer(page, true)
        await page.waitForTimeout(300)
        ctx.etat[b.cle].sombre = await mesurer()
        await cadre.screenshot({ path: join(dossier, `${b.cle}_sombre.png`) }).catch(() => {})
        return {}
      } finally {
        await basculer(page, false).catch(() => {})
        await fermer().catch(() => {})
      }
    },
    relecture: async (ctx) => {
      const { clair, sombre } = ctx.etat[b.cle]
      const verdict = jugerBouton(clair)
      if (!verdict.confirme) return { confirme: false, ecart: `en clair : ${verdict.ecart}` }
      const enSombre = jugerBouton(sombre)
      if (!enSombre.confirme) return { confirme: false, ecart: `en sombre : ${enSombre.ecart}` }
      return { confirme: true, preuve: `clair : ${verdict.preuve} ; sombre : ${enSombre.preuve}` }
    },
  }
}

export const ETAPES_BOUTONS = Object.freeze(BOUTONS.map(etape))
