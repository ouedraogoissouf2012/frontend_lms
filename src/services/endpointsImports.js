/**
 * Les chemins des IMPORTS d'apprenants (sous /lms/imports/*), sortis de `endpoints.js` pour la garde de
 * taille (≤300 lignes, #741). `endpoints.js` les étale à leur place : les appelants écrivent toujours
 * `endpoints.lms.imports.*`, et la garde de contrat (scripts/lint-api-contract.mjs) les lit par l'import
 * de la carte.
 *
 * Le préfixe `lms` est passé par la carte : la frontière /lms/ garde une source unique (#26).
 */
export const cheminsImports = (lms) => ({
  imports: {
    preview: `${lms}/imports/preview`,
    confirm: (id) => `${lms}/imports/${id}/confirm`,
    show: (id) => `${lms}/imports/${id}`,
  },
})
