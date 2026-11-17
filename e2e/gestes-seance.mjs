// Les gestes du parcours de la SÉANCE et de la VISIO (PR 4), par l'interface. L'enseignant crée sa séance (école LMS)
// ou trouve celle de KLASSCI (9701), active la visio, la démarre, la termine ; l'élève la rejoint.
//
// Sélecteurs : textes visibles et libellés. Structurels, déclarés : la carte d'une séance (`.seance-card`, sans
// rôle) et une fenêtre modale (`.modal-container`, sans `role="dialog"`, #563). La carte d'une séance ne montre pas
// son titre : celle de l'école LMS se trouve par son HEURE de début ; dans l'école KLASSCI, la séance 9701 est la
// seule carte de l'enseignant (déclaré).
import { lireApi } from './fonctionnels.mjs'
import { ATTENTE, bouton, appel, refusServeur } from './gestes.mjs'
import { confirmer } from './gestes-evaluation.mjs'

const attendreRendu = (page) => page.waitForLoadState('networkidle', { timeout: ATTENTE }).catch(() => {})

/** « YYYY-MM-DDTHH:mm » maintenant, dans le fuseau du NAVIGATEUR : la fenêtre de la visio est ouverte. */
const maintenantLocal = (page) => page.evaluate(() => {
  const d = new Date()
  const z = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}`
})

/** L'heure de début telle que la carte l'affiche (utils/formatters.formatTime, dans le navigateur). */
export const heureAffichee = (page, heure) => page.evaluate((h) => {
  const d = new Date(h)
  return Number.isNaN(d.getTime()) ? null : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}, heure)

/** École LMS : « Nouvelle séance » (libellés associés), début maintenant. Rend l'id créé. */
export async function creerSeance(ctx, s) {
  const page = ctx.pages.enseignant
  await page.goto(`${ctx.base}/teacher/seances`, { waitUntil: 'domcontentloaded' })
  await attendreRendu(page)
  await bouton(page, 'Nouvelle séance').click()
  const m = page.locator('.modal-container').filter({ hasText: 'Nouvelle séance' })
  await m.getByLabel('Matière', { exact: true }).selectOption(String(ctx.jeu.matieres[0]))
  await m.getByLabel('Classe', { exact: true }).selectOption(String(ctx.jeu.classes[0]))
  await m.getByLabel('Titre', { exact: true }).fill(s.titre)
  await m.getByLabel('Début', { exact: true }).fill(await maintenantLocal(page))
  const reponse = appel(page, 'POST', '/lms/seances')
  await m.getByRole('button', { name: 'Créer la séance' }).click()
  const refus = await refusServeur(page, reponse, 'la création de la séance')
  if (refus) return refus
  const id = (await (await reponse).json().catch(() => null))?.data?.id
  return id != null ? { id } : { rouge: 'la création ne rend pas l’id de la séance' }
}

/** Le détail de la séance, relu avec le jeton de l'enseignant. */
export const detailSeance = (ctx, id) => lireApi(ctx.pages.enseignant, `/lms/seances/${id}/details`)

/** La carte de la séance sur /teacher/seances. Une carte absente est un défaut du produit. */
export async function carteSeance(ctx) {
  const page = ctx.pages.enseignant
  await page.goto(`${ctx.base}/teacher/seances`, { waitUntil: 'domcontentloaded' })
  await attendreRendu(page)
  const cartes = page.locator('.seance-card')
  await cartes.first().waitFor({ timeout: ATTENTE }).catch(() => {})
  if (ctx.jeu.ecole === 'klassci') {
    return (await cartes.count()) === 1 ? { carte: cartes.first() } : { rouge: `${await cartes.count()} carte(s) de séance, 1 attendue (la séance 9701)` }
  }
  const carte = cartes.filter({ hasText: ctx.etat.heure })
  return (await carte.count()) ? { carte: carte.first() } : { rouge: `aucune carte de séance à ${ctx.etat.heure} sur /teacher/seances` }
}

/** « Modifier » sur la carte (lms_backend#1121) : un nouveau titre, « Enregistrer », et l'appel PUT attendu. */
export async function modifierSeance(ctx, boutonModifier, titre) {
  const page = ctx.pages.enseignant
  await boutonModifier.click()
  const fenetre = page.getByRole('dialog', { name: 'Modifier la séance' })
  await fenetre.getByLabel('Titre', { exact: true }).fill(titre)
  const reponse = appel(page, 'PUT', `/lms/seances/${ctx.etat.id}`)
  await fenetre.getByRole('button', { name: 'Enregistrer', exact: true }).click()
  return (await refusServeur(page, reponse, 'la modification de la séance')) ?? {}
}

/** Un geste sur la carte : son bouton, l'appel attendu, une confirmation éventuelle. */
export async function surLaCarte(ctx, texte, methode, chemin, quoi, confirmation = null) {
  const { carte, rouge } = await carteSeance(ctx)
  if (rouge) return { rouge }
  const page = ctx.pages.enseignant
  const reponse = appel(page, methode, chemin)
  await carte.getByRole('button', { name: texte }).first().click()
  if (confirmation) await confirmer(page, confirmation.message, confirmation.bouton)
  return (await refusServeur(page, reponse, quoi)) ?? {}
}

/**
 * L'élève rejoint : la fiche de la séance (le lien « Voir détails complets » du calendrier), « Rejoindre le cours »,
 * puis le choix du mode. Rend la réponse de `join` (le jeton) et les requêtes vers le domaine Jitsi.
 */
export async function rejoindre(ctx, id) {
  const page = ctx.pages.etudiant
  const versJitsi = []
  const surRequete = (r) => { if (/^https?:\/\/visio\.example\.test\//.test(r.url())) versJitsi.push(r.url()) }
  page.on('request', surRequete)
  try {
    await page.goto(`${ctx.base}/seances/${id}`, { waitUntil: 'domcontentloaded' })
    await attendreRendu(page)
    const reponse = appel(page, 'POST', `/lms/seances/${id}/join`)
    await bouton(page, 'Rejoindre le cours').first().click()
    const r = await reponse
    const corps = await r.json().catch(() => null)
    if (r.status() >= 400) return { rouge: `l’entrée de l’élève est refusée (HTTP ${r.status()}, reason ${corps?.reason ?? '—'})` }
    // Le choix du mode (VisioJoinChoice, role=dialog) ; la salle ne se monte pas en CI (aucun serveur Jitsi).
    const choix = page.getByRole('dialog', { name: 'Comment souhaitez-vous suivre ?' })
    if (await choix.waitFor({ timeout: ATTENTE }).then(() => true, () => false)) {
      await choix.getByRole('button', { name: 'Rejoindre le cours' }).click()
      await page.waitForTimeout(3000)
    }
    return { join: corps?.data ?? null, versJitsi }
  } finally {
    page.off('request', surRequete)
  }
}
