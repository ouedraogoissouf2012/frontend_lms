/**
 * front#664 (contrat back #1797) : les règles pures du dossier d'un élève à l'écran.
 */

export const GENRES = Object.freeze([{ valeur: 'F', libelle: 'Féminin' }, { valeur: 'M', libelle: 'Masculin' }])

export const STATUTS = Object.freeze([
  { valeur: 'actif', libelle: 'Actif' },
  { valeur: 'suspendu', libelle: 'Suspendu' },
  { valeur: 'diplome', libelle: 'Diplômé' },
  { valeur: 'parti', libelle: 'Parti' },
])

export const RELATIONS = Object.freeze([
  { valeur: 'mere', libelle: 'Mère' },
  { valeur: 'pere', libelle: 'Père' },
  { valeur: 'tuteur', libelle: 'Tuteur' },
  { valeur: 'autre', libelle: 'Autre' },
])

/** Les champs de l'identité, dans l'ordre de l'écran. */
export const CHAMPS_IDENTITE = Object.freeze([
  { nom: 'nom', libelle: 'Nom', requis: true },
  { nom: 'prenoms', libelle: 'Prénoms', requis: true },
  { nom: 'matricule', libelle: 'Matricule', aide: 'Laissé vide, l’établissement le génère.' },
  { nom: 'genre', libelle: 'Genre', options: GENRES },
  { nom: 'date_naissance', libelle: 'Date de naissance', type: 'date' },
  { nom: 'lieu_naissance', libelle: 'Lieu de naissance' },
  { nom: 'nationalite', libelle: 'Nationalité', aide: 'Code pays ISO à deux lettres : CI, BF, ML…' },
  { nom: 'adresse', libelle: 'Adresse' },
  { nom: 'ville', libelle: 'Ville' },
  { nom: 'commune', libelle: 'Commune' },
  { nom: 'statut', libelle: 'Statut', options: STATUTS },
])

/** Les coordonnées d'un tuteur, toutes facultatives. */
export const COORDONNEES_TUTEUR = Object.freeze([
  { nom: 'telephone', libelle: 'Téléphone', type: 'tel' },
  { nom: 'courriel', libelle: 'Courriel', type: 'email' },
  { nom: 'profession', libelle: 'Profession' },
  { nom: 'adresse', libelle: 'Adresse' },
])

/** Le message d'une nationalité mal écrite. Le serveur juge si le code existe (liste ISO) ; l'écran, sa forme. */
export const MESSAGE_NATIONALITE = 'La nationalité s’écrit en code pays à deux lettres : CI, BF, ML…'

/** Vide (non renseignée) ou deux lettres, quelle que soit leur casse : elles partent en majuscules. */
export function nationaliteValide(valeur) {
  const texte = typeof valeur === 'string' ? valeur.trim() : ''
  return texte === '' || /^[A-Za-z]{2}$/.test(texte)
}

/** Le libellé d'une valeur codée (genre, statut, relation) ; la valeur elle-même si elle est inconnue. */
export function libelleDe(liste, valeur) {
  return liste.find((o) => o.valeur === valeur)?.libelle ?? valeur ?? '—'
}

/** Le dossier lu, en valeurs de formulaire (chaînes). */
export function versSaisie(dossier) {
  return Object.fromEntries(CHAMPS_IDENTITE.map(({ nom }) => [nom, dossier?.[nom] ?? '']))
}

/**
 * La saisie, en corps de `PUT /eleves/{eleve}/dossier`. Un champ facultatif vide part `null` (effacé), sauf ceux que le
 * serveur ne rend pas nullables : un matricule vide est omis (l'école le génère), un statut vide aussi.
 */
export function versCorps(saisie) {
  const corps = {}
  for (const { nom } of CHAMPS_IDENTITE) {
    const valeur = typeof saisie[nom] === 'string' ? saisie[nom].trim() : saisie[nom]
    if (valeur === '' || valeur === null || valeur === undefined) {
      if (!['matricule', 'statut', 'nom', 'prenoms'].includes(nom)) corps[nom] = null
      continue
    }
    corps[nom] = nom === 'nationalite' ? valeur.toUpperCase() : valeur
  }
  return corps
}

/** Les coordonnées saisies d'un tuteur : une chaîne vide part `null`. */
export function coordonneesDe(saisie) {
  return Object.fromEntries(COORDONNEES_TUTEUR.map(({ nom }) => {
    const valeur = typeof saisie[nom] === 'string' ? saisie[nom].trim() : ''
    return [nom, valeur === '' ? null : valeur]
  }))
}

/** Nom affiché d'un élève : « Nom Prénoms ». */
export function nomComplet(dossier) {
  return [dossier?.nom, dossier?.prenoms].filter((p) => typeof p === 'string' && p.trim() !== '').join(' ')
}
