import api from './api'
import { endpoints } from './endpoints'
import { DELIMITER_NAMES } from '../utils/csv'

/**
 * Analyse à blanc d'un CSV d'apprenants (#334).
 *
 * Le fichier part TEL QUEL, octet pour octet (ADR-718-01) : c'est le serveur
 * qui analyse, avec un vrai parseur CSV et sa récupération d'encodage. Le
 * client se contente de déclarer quelle colonne porte quel champ, et avec quel
 * séparateur il a présenté ces colonnes à l'utilisateur.
 *
 * @param {File} file - Fichier choisi par l'utilisateur, non modifié.
 * @param {Record<string, string>} [mapping={}] - Champ canonique => en-tête du fichier.
 * @param {string} [delimiter] - Séparateur utilisé pour l'affichage des colonnes.
 * @returns {Promise<object>} Corps de la réponse (l'intercepteur d'api.js le dépouille déjà).
 */
export function previewImport(file, mapping = {}, delimiter = undefined) {
  const form = new FormData()
  form.append('file', file)

  for (const [field, header] of Object.entries(mapping)) {
    if (header) form.append(`mapping[${field}]`, header)
  }
  // Un NOM, pas le caractère : voir DELIMITER_NAMES (une tabulation brute était
  // élaguée par le serveur et faisait refuser la requête).
  if (DELIMITER_NAMES[delimiter]) form.append('delimiter', DELIMITER_NAMES[delimiter])

  return api.post(endpoints.lms.imports.preview, form, {
    // Le multipart doit porter sa « boundary », que seul le navigateur calcule :
    // le Content-Type doit donc rester NON défini. Or `api` en pose un par
    // défaut (application/json), et axios, voyant ce type, sérialise carrément
    // le FormData en JSON. Mettre l'en-tête à `null` est la façon documentée de
    // le retirer ; mesuré : en-tête absent et corps resté un FormData.
    headers: { 'Content-Type': null },
  })
}
