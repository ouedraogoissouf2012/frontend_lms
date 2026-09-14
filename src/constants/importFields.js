export const IMPORT_FIELDS = [
  { key: 'nom', label: 'Nom', required: true },
  { key: 'prenom', label: 'Prénom', required: true },
  // Ni le courriel ni le téléphone ne sont requis séparément, mais le serveur
  // refuse toute ligne qui n'a AUCUN des deux. Un booléen par champ ne sait pas
  // dire « l'un ou l'autre » : la règle vit dans utils/importMapping.js.
  { key: 'email', label: 'Courriel', required: false },
  { key: 'telephone', label: 'Téléphone / WhatsApp', required: false },
  { key: 'role', label: 'Rôle', required: false },
  { key: 'code_classe', label: 'Code classe', required: false },
  { key: 'date_inscription', label: 'Date d\'inscription', required: false },
  { key: 'statut', label: 'Statut', required: false },
]

/**
 * Plafond de taille accepté, aligné sur la règle `max:5120` du serveur.
 * Le vérifier ici évite de faire monter un fichier pour découvrir un 422.
 */
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024

export const IMPORT_TEMPLATE =
  'nom;prenom;email;telephone;role;code_classe;date_inscription;statut\n'
