/**
 * #743 : le corps d'une réponse d'ERREUR, rendu lisible quel que soit le `responseType` de la requête.
 *
 * Une requête `responseType: 'blob'` reçoit son refus en `Blob`, une requête `'text'` ou `'arraybuffer'`
 * en chaîne ou en octets : le motif serveur (`reason`), écrit en JSON, n'y est pas lisible tel quel. Sans
 * ce décodage, `normalizeError` ne voyait aucun motif (message du STATUT à la place de celui du motif),
 * et `shouldForceLogout` jugeait un 401 sans son motif.
 *
 * Appelé UNE fois, par l'intercepteur de réponse d'`api.js`, avant toute lecture : tout appel, présent ou
 * futur, reçoit son motif sans relais propre. Un corps déjà objet (JSON parsé par axios) n'est pas touché ;
 * un corps illisible ou non JSON reste tel quel, et le message du statut s'applique.
 */
export async function rendreLisibleLeCorpsDErreur(error) {
  const reponse = error?.response
  if (!reponse) return

  const texte = await enTexte(reponse.data)
  if (texte === null) return

  try {
    const corps = JSON.parse(texte)
    if (corps !== null && typeof corps === 'object' && !Array.isArray(corps)) reponse.data = corps
  } catch {
    // Pas du JSON (page d'erreur HTML, fichier) : le corps reste tel quel.
  }
}

async function enTexte(corps) {
  try {
    if (typeof Blob !== 'undefined' && corps instanceof Blob) return await lireLeBlob(corps)
    if (corps instanceof ArrayBuffer) return new TextDecoder().decode(corps)
    if (typeof corps === 'string') return corps
  } catch {
    // Lecture impossible : traité comme illisible.
  }

  return null
}

function lireLeBlob(blob) {
  if (typeof blob.text === 'function') return blob.text()

  return new Promise((resolve, reject) => {
    const lecteur = new FileReader()
    lecteur.onload = () => resolve(String(lecteur.result ?? ''))
    lecteur.onerror = () => reject(lecteur.error)
    lecteur.readAsText(blob)
  })
}
