export const IMPORT_FIELDS = [
  { key: 'nom', label: 'Nom', required: true },
  { key: 'prenom', label: 'Prénom', required: true },
  { key: 'email', label: 'Courriel (facultatif)', required: false },
  { key: 'telephone', label: 'Téléphone / WhatsApp', required: false },
  { key: 'role', label: 'Rôle', required: false },
  { key: 'code_classe', label: 'Code classe', required: false },
  { key: 'date_inscription', label: 'Date d\'inscription', required: false },
  { key: 'statut', label: 'Statut', required: false },
]

export const IMPORT_TEMPLATE =
  'nom;prenom;email;telephone;role;code_classe;date_inscription;statut\n'
