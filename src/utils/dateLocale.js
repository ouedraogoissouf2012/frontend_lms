/**
 * Date et heure SAISIES (champ `datetime-local`, « AAAA-MM-JJTHH:mm », heure locale) → ISO 8601
 * AVEC décalage, « AAAA-MM-JJTHH:mm:00+HH:MM ».
 *
 * Contrat de POST /lms/seances (D4, S-matière) : `date_seance` porte un décalage, sinon 422 ; le
 * serveur la range dans le fuseau de l'application. L'heure murale saisie est gardée telle quelle,
 * avec le décalage du navigateur à CETTE date (heure d'été comprise) : le même instant, sans
 * conversion en UTC qui changerait l'heure lue dans la requête.
 *
 * @param {string|null|undefined} saisie
 * @returns {string|null} null si la saisie est vide ou invalide (rien n'est inventé)
 */
export function isoAvecDecalage(saisie) {
  if (typeof saisie !== 'string' || saisie === '') return null
  const date = new Date(saisie)
  if (Number.isNaN(date.getTime())) return null
  const deux = (n) => String(Math.floor(Math.abs(n))).padStart(2, '0')
  const decalage = -date.getTimezoneOffset()
  const signe = decalage >= 0 ? '+' : '-'
  const jour = `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}`
  const heure = `${deux(date.getHours())}:${deux(date.getMinutes())}:00`
  return `${jour}T${heure}${signe}${deux(decalage / 60)}:${deux(decalage % 60)}`
}

/**
 * L'inverse de `isoAvecDecalage` : un instant ISO 8601 → la saisie d'un champ `datetime-local`,
 * « AAAA-MM-JJTHH:mm », à l'heure locale du navigateur (le préremplissage d'une modification,
 * lms_backend#1121).
 *
 * @param {string|null|undefined} iso
 * @returns {string|null} null si l'instant est absent ou invalide (rien n'est inventé)
 */
export function saisieLocale(iso) {
  if (typeof iso !== 'string' || iso === '') return null
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return null
  const deux = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}T${deux(date.getHours())}:${deux(date.getMinutes())}`
}
