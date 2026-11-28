/**
 * Les petites règles d'affichage des emplois du temps (#676), pures et testables.
 */
import { ERROR_MESSAGES } from '@/constants/errorMessages'

export const JOURS = Object.freeze({ 1: 'Lundi', 2: 'Mardi', 3: 'Mercredi', 4: 'Jeudi', 5: 'Vendredi', 6: 'Samedi', 7: 'Dimanche' })

export const TYPES_DE_SEANCE = Object.freeze({
  cm: 'Cours magistral',
  td: 'Travaux dirigés',
  tp: 'Travaux pratiques',
  projet: 'Projet',
  travail_personnel: 'Travail personnel',
  examen: 'Examen',
})

const MOTIFS_IGNOREE = Object.freeze({
  conflit: ERROR_MESSAGES.emploiDuTempsIgnoreeConflit,
  deja_generee: ERROR_MESSAGES.emploiDuTempsIgnoreeDejaGeneree,
  sans_enseignant: ERROR_MESSAGES.emploiDuTempsIgnoreeSansEnseignant,
})

/** Le motif d'une séance ignorée, dit par le front ; un motif inconnu est rendu tel quel, jamais caché. */
export const motifIgnoree = (motif) => MOTIFS_IGNOREE[motif] ?? String(motif ?? '')

/** `2026-12-07` → `07/12/2026`, sans fuseau : une date d'emploi du temps est un jour, pas un instant. */
export function jourFr(iso) {
  const [a, m, j] = String(iso ?? '').split('-')
  return a && m && j ? `${j}/${m}/${a}` : '—'
}

/** Du lundi au samedi ; le dimanche seulement s'il porte une ligne (ARRÊT 1, Q3). */
export function joursAffiches(lignes) {
  const jours = [1, 2, 3, 4, 5, 6]
  return (lignes ?? []).some((l) => l.jour === 7) ? [...jours, 7] : jours
}

/** Une ligne du serveur, au format de l'écran (camelCase) ; une clé locale stable pour les lignes pas encore enregistrées. */
let suivante = 0
export function ligneDeLEcran(l) {
  suivante += 1
  return {
    cle: l.id ? `l${l.id}` : `n${suivante}`,
    jour: l.jour,
    debut: String(l.debut ?? '').slice(0, 5),
    fin: String(l.fin ?? '').slice(0, 5),
    matiereId: l.matiere_id ?? l.matiereId ?? null,
    enseignantId: l.enseignant_id ?? l.enseignantId ?? null,
    typeSeance: l.type_seance ?? l.typeSeance ?? null,
    libelle: l.libelle ?? null,
  }
}

/** `1 séance créée`, `7 séances créées` : le nombre et son accord. */
export const compte = (n, singulier, pluriel) => `${n} ${n > 1 ? pluriel : singulier}`

/** Les lignes d'un jour, dans l'ordre de l'heure. */
export const lignesDuJour = (lignes, jour) => lignes.filter((l) => l.jour === jour).sort((a, b) => a.debut.localeCompare(b.debut))
