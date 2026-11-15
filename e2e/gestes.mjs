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

/** L'attente d'un appel, posée AVANT le geste. Marquée gérée : un geste qui échoue ne laisse pas de rejet orphelin. */
export function appel(page, methode, chemin) {
  const attente = page.waitForResponse((r) => r.request().method() === methode && new URL(r.url()).pathname === `/api${chemin}`, { timeout: ATTENTE })
  attente.catch(() => {})
  return attente
}

/** Un refus du serveur sur l'appel attendu : ROUGE, avec le statut et ce que l'écran affiche. */
export async function refusServeur(page, reponse, quoi) {
  const r = await reponse
  return r.status() >= 400 ? { rouge: `${quoi} refusé par le serveur (HTTP ${r.status()}) : ${await ditLEcran(page)}` } : null
}

/** Une lecture d'API qui n'a pas rendu 200, nommée ; null sinon. */
export const lu = ({ statut }, chemin) => (statut === 200 ? null : `GET ${chemin} rend HTTP ${statut}`)
