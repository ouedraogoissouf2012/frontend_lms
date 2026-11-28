/**
 * Les chemins de l'ÉCOLE LOCALE (autonome), sortis de `endpoints.js` pour la garde de taille (≤300 lignes).
 * `endpoints.js` les étale tels quels : les appelants écrivent toujours `endpoints.catalogue.*` et
 * `endpoints.enrolment.*`, et la garde de contrat (scripts/lint-api-contract.mjs) les lit par l'import de la carte.
 *
 * Chemins RÉELS de la spec : SANS préfixe /lms.
 */
export const endpointsEcoleLocale = {
  // #654 : le catalogue d'une école autonome (garde `gestion`, capacité serveur PorteDuCatalogueLocal).
  catalogue: {
    matieres: '/matieres',
    programme: (classeId) => `/classes/${classeId}/matieres`,
    // #660 (lms_backend#1653) : modifier une matière ; modifier ou retirer une ligne du programme.
    matiere: (matiereId) => `/matieres/${matiereId}`,
    ligneProgramme: (classeId, matiereId) => `/classes/${classeId}/matieres/${matiereId}`,
  },

  // Code d'inscription d'une classe LOCALE (#391, ADR-803-03). `/classes` est la collection des classes locales (#905).
  enrolment: {
    classes: '/classes',
    code: (classeId) => `/classes/${classeId}/code-inscription`,
    // #631 (lms_backend#1358) : geste NOMMÉ, la capacité que l'inscription par code respecte.
    capacite: (classeId) => `/classes/${classeId}/capacite`,
    // #657 (lms_backend#1208) : rattacher une classe LOCALE à sa période, ou l'en détacher (null).
    periode: (classeId) => `/classes/${classeId}/periode`,
    rejoindre: '/me/inscriptions',
    // #659 (lms_backend#1652) : modifier une classe locale, l'archiver ou la désarchiver.
    classe: (classeId) => `/classes/${classeId}`,
    archiver: (classeId) => `/classes/${classeId}/archiver`,
    desarchiver: (classeId) => `/classes/${classeId}/desarchiver`,
  },
}
