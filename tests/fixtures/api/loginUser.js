/**
 * `data.user` de `POST /auth/login` — la forme RÉELLE, pas une forme plausible.
 *
 * ## Pourquoi cette fixture existe
 *
 * Treize sites du front lisaient `user.nom`, `user.prenom` ou `user.created_at`.
 * **Aucune de ces trois clés n'est envoyée.** Conséquence mesurée le 2026-09-11
 * dans le navigateur, compte `prof.bede.test` :
 *
 * ```
 * .user-name de la barre laterale  ->  ""      (chaine vide)
 * avatar                           ->  "U"     (repli generique)
 * ```
 *
 * Sur **toutes** les pages, pour **tous** les roles — alors que l'application
 * connaît le nom et l'affiche ailleurs (« Bienvenue, BEDE ABEL TEST »).
 *
 * Les tests ne pouvaient pas l'attraper : ils fournissaient
 * `{ nom: 'Doe', prenom: 'Jane' }`, une charge inventée. Un test qui écrit
 * lui-même sa donnée d'entrée ne peut pas découvrir qu'elle est fausse.
 *
 * ## Source de vérité
 *
 * `lms-backend/app/Http/Presenters/AuthResponsePresenter.php` — la whitelist est
 * FERMÉE depuis #504 : ce qui n'est pas listé ici n'est pas envoyé, et ne le
 * sera pas par accident.
 *
 * Ne PAS ajouter de champ ici « pour faire passer un test » : ce fichier décrit
 * ce que le backend émet, pas ce qu'un écran voudrait recevoir.
 */

/** Connexion via KLASSCI — la charge la plus riche (`successfulKlassci`). */
export const LOGIN_USER_KLASSCI = Object.freeze({
  id: 9,
  klassci_id: 9,
  name: 'BEDE ABEL TEST',
  email: 'bede@gmail.com',
  role: 'enseignant',
  role_display_name: 'Enseignant',
  avatar: null,
  enseignant_data: null,
  etudiant_data: null,
})

/** Connexion locale — strictement plus pauvre (`successfulLocal`). */
export const LOGIN_USER_LOCAL = Object.freeze({
  id: 9,
  klassci_id: 9,
  name: 'BEDE ABEL TEST',
  email: 'bede@gmail.com',
  role: 'enseignant',
})

/**
 * Les clés que des écrans lisaient et que le backend n'envoie pas. Exportées
 * pour que les tests puissent verrouiller leur absence : si l'une réapparaît
 * dans une fixture, c'est qu'on réinvente la charge.
 *
 * @type {ReadonlyArray<string>}
 */
export const CLES_INEXISTANTES = Object.freeze(['nom', 'prenom', 'created_at'])
