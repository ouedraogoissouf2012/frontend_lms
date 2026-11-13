/**
 * Échéance d'une copie (C28, contrat back #1037) : `ends_at` est écrite au démarrage de la tentative et
 * figée ; la remise est acceptée jusqu'à `ends_at` + 60 s. Fonctions pures du minuteur :
 * - le temps restant se RECALCULE à chaque tic depuis `ends_at` (un décompte dériverait quand l'onglet
 *   dort, et un rechargement redonnerait la durée entière) ;
 * - l'horloge du poste est corrigée UNE fois du décalage avec `server_time` (GET /time-status). Sans
 *   heure serveur lisible, décalage nul : l'écart restant est couvert par la marge serveur de 60 s.
 */

/**
 * @param {string|null|undefined} serverTime heure du serveur (ISO 8601)
 * @param {number} [maintenant] heure du poste, en ms
 * @returns {number} serveur - poste, en ms (0 si l'heure serveur est illisible)
 */
export function decalageHorloge(serverTime, maintenant = Date.now()) {
  const serveur = Date.parse(serverTime ?? '')
  return Number.isNaN(serveur) ? 0 : serveur - maintenant
}

/**
 * @param {string|null|undefined} endsAt échéance de la copie (ISO 8601)
 * @param {number} [decalage] décalage serveur - poste, en ms
 * @param {number} [maintenant] heure du poste, en ms
 * @returns {number|null} secondes restantes (jamais négatives), ou null sans échéance lisible
 */
export function secondesAvantEcheance(endsAt, decalage = 0, maintenant = Date.now()) {
  const fin = Date.parse(endsAt ?? '')
  if (Number.isNaN(fin)) return null
  return Math.max(0, Math.ceil((fin - (maintenant + decalage)) / 1000))
}
