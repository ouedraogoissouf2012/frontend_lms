/**
 * Les chemins des MATIÈRES enrichies (sous /lms/*), sortis de `endpoints.js` pour la garde de taille
 * (≤300 lignes, #741). `endpoints.js` les étale à leur place : les appelants écrivent toujours
 * `endpoints.lms.matieres.*`, et la garde de contrat (scripts/lint-api-contract.mjs) les lit par l'import
 * de la carte. Le catalogue d'une école locale, lui, est `endpoints.catalogue.*` (endpointsEcoleLocale.js).
 *
 * Le préfixe `lms` est passé par la carte : la frontière /lms/ garde une source unique (#26).
 */
export const cheminsMatieres = (lms) => ({
  matieres: {
    details: (id) => `${lms}/matieres/${id}`,
    myTeacher: `${lms}/teacher/my-matieres`,
    join: (id) => `${lms}/seances/${id}/join`,
  },
})
