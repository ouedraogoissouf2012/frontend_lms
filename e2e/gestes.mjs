// Les gestes par l'interface, communs aux parcours fonctionnels (leçon, quiz, devoir, séance).

export const ATTENTE = 20000

// Une icône dans le nom accessible d'un bouton : le caractère d'une police d'icônes (Font Awesome, zone privée
// Unicode, «  ») ou la ligature d'une icône Material (« save », « arrow_forward »).
const ICONE = '(?:[a-z_]+|[\\uE000-\\uF8FF])'
const echappe = (texte) => texte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * Le nom d'un bouton par son texte visible : le texte ENTIER, avec au plus une icône avant et une après
 * (« save Enregistrer », « Suivant arrow_forward »). « Publier » ne prend ni « Dépublier » ni « Publier la leçon ».
 */
export const nomDeBouton = (texte) => new RegExp(`^(?:${ICONE}\\s+)?${echappe(texte)}(?:\\s+${ICONE})?$`)
export const bouton = (lieu, texte) => lieu.getByRole('button', { name: nomDeBouton(texte) })

/** Ce que l'écran dit (régions alert/status, notifications de la matière), pour nommer un refus. */
export async function ditLEcran(page) {
  const textes = [
    ...(await page.locator('[role="alert"], [role="status"]').allInnerTexts().catch(() => [])),
    ...(await page.getByText(/^Erreur lors de/).allInnerTexts().catch(() => [])),
  ].map((t) => t.trim()).filter(Boolean)
  return textes.length ? `« ${textes.join(' | ').slice(0, 200)} »` : 'aucun message affiché'
}

/**
 * L'attente d'un appel, posée AVANT le geste. Marquée gérée : un geste qui échoue ne laisse pas de rejet orphelin.
 * `chemin` : le chemin sous /api, ou un motif du chemin complet quand il porte un id inconnu d'avance.
 */
export function appel(page, methode, chemin) {
  const vise = (p) => (chemin instanceof RegExp ? chemin.test(p) : p === `/api${chemin}`)
  const attente = page.waitForResponse((r) => r.request().method() === methode && vise(new URL(r.url()).pathname), { timeout: ATTENTE })
  attente.catch(() => {})
  return attente
}

/** Un refus du serveur sur l'appel attendu : ROUGE, avec le statut et ce que l'écran affiche. */
export async function refusServeur(page, reponse, quoi) {
  const r = await reponse
  return r.status() >= 400 ? { rouge: `${quoi} refusé par le serveur (HTTP ${r.status()}) : ${await ditLEcran(page)}` } : null
}

/**
 * Le formulaire d'un NOUVEAU chapitre, sur la page des chapitres. On attend que la liste soit RENDUE (le
 * champ du titre ou « + Ajouter un chapitre ») avant de décider : sans chapitre, le produit ouvre seul le
 * formulaire du premier ; décider avant le rendu en ouvrait un SECOND (E2E 43769695409 : deux « Créer »).
 * @returns {Promise<import('playwright').Locator>} le champ du titre du nouveau chapitre
 */
export async function formulaireDeChapitre(page) {
  const titre = page.getByLabel('Titre du chapitre') // le nom accessible du champ (#563)
  await titre.or(bouton(page, '+ Ajouter un chapitre')).first().waitFor({ timeout: ATTENTE })
  if (!(await titre.count())) await bouton(page, '+ Ajouter un chapitre').click()
  return titre.last()
}

/** Une lecture d'API qui n'a pas rendu 200, nommée ; null sinon. */
export const lu = ({ statut }, chemin) => (statut === 200 ? null : `GET ${chemin} rend HTTP ${statut}`)
