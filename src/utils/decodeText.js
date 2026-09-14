/**
 * Décodage d'un CSV pour AFFICHAGE (#334, ADR-718-01).
 *
 * Excel francophone exporte massivement en Windows-1252. L'ancien écran lisait
 * le fichier avec `File.text()` — qui décode toujours en UTF-8 — puis le
 * ré-encodait avant l'envoi : `Ouédraogo` partait en `4f 75 ef bf bd …`, soit
 * le caractère de remplacement U+FFFD, et le fichier reçu étant alors de
 * l'UTF-8 valide, la récupération Windows-1252 du serveur ne se déclenchait
 * plus jamais.
 *
 * Depuis, le fichier part octet pour octet et le serveur fait autorité. Ce
 * décodage ne sert plus qu'à montrer les noms de colonnes : une erreur ici
 * rendrait l'écran illisible, elle ne peut plus abîmer la donnée importée.
 */

/**
 * Texte lisible à partir d'octets CSV.
 *
 * UTF-8 d'abord, en mode strict pour que l'échec soit détectable ; repli sur
 * Windows-1252, qui ne peut pas échouer (tout octet y a un caractère).
 *
 * `partial` sert quand on ne lit qu'un DÉBUT de fichier : une tranche à taille
 * fixe coupe tôt ou tard un caractère multi-octets en deux, et sans cette
 * option l'échec du décodage strict ferait relire tout l'échantillon en
 * Windows-1252 — y compris une ligne d'en-tête valide située très en amont de
 * la coupure, qui s'afficherait alors en mojibake. Le mode flux met de côté
 * une séquence finale incomplète au lieu d'échouer, tandis qu'un octet
 * réellement invalide au milieu déclenche toujours le repli.
 *
 * @param {ArrayBuffer|Uint8Array} bytes - Octets bruts du fichier.
 * @param {{partial?: boolean}} [options] - `partial` si `bytes` est un début de fichier.
 * @returns {string} Texte décodé, ou chaîne vide si rien à décoder.
 */
export function decodeCsvBytes(bytes, { partial = false } = {}) {
  if (!bytes) return ''
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (view.byteLength === 0) return ''

  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(view, { stream: partial })
  } catch {
    return new TextDecoder('windows-1252').decode(view)
  }
}
