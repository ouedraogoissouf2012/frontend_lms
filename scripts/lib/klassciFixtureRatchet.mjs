/**
 * Cœur pur de la garde des fixtures KLASSCI (`scripts/lint-klassci-fixtures.mjs`).
 *
 * Isolé ici pour être testable sans système de fichiers : une garde sans test
 * de rougissement n'est pas une garde. Même découpage que
 * `scripts/lib/ocpRatchet.mjs`.
 */

export const FIXTURES_IMPORT = 'fixtures/klassci'

/**
 * Ce qui identifie un test CONSOMMATEUR de KLASSCI. Sans l'un de ces motifs le
 * fichier n'est pas concerné — on ne signale pas un test qui manipule par
 * hasard une clé au nom voisin.
 */
export const CONSOMME_KLASSCI = [
  /services\/klassci/,
  /getTeacherDashboard/,
  /getStudentDashboard/,
  /['"`]\/proxy\//,
]

/**
 * Clés qui n'apparaissent QUE dans une charge KLASSCI. Les écrire en dur, c'est
 * décrire l'API amont de mémoire.
 *
 * `statistiques` n'y figure pas seule — le mot est trop courant. C'est son
 * imbrication KLASSCI (`statistiques: { heures`) qu'on reconnaît.
 */
export const MARQUEURS = [
  { motif: /\bprochaines_seances\s*:/, nom: 'prochaines_seances' },
  { motif: /\bseances_programmees\s*:/, nom: 'seances_programmees' },
  { motif: /\bnb_seances_programmees\s*:/, nom: 'nb_seances_programmees' },
  { motif: /\bcombinaisons\s*:/, nom: 'combinaisons' },
  { motif: /\bplaces_occupees\s*:/, nom: 'places_occupees' },
  { motif: /\bplaces_totales\s*:/, nom: 'places_totales' },
  { motif: /\bnom_complet\s*:/, nom: 'nom_complet' },
  { motif: /\blms_integration\s*:/, nom: 'lms_integration' },
  { motif: /\bdate_evaluation\s*:/, nom: 'date_evaluation' },
  { motif: /\bniveau_etude_id\s*:/, nom: 'niveau_etude_id' },
  { motif: /statistiques\s*:\s*\{\s*heures\b/, nom: 'statistiques.heures' },
]

/**
 * @param {string} relatif Chemin POSIX relatif au dépôt.
 * @param {string} contenu Source du fichier.
 * @returns {Array<{file: string, line: number, marqueur: string, extrait: string}>}
 */
export function inspecter(relatif, contenu) {
  if (!CONSOMME_KLASSCI.some((m) => m.test(contenu))) return []
  if (contenu.includes(FIXTURES_IMPORT)) return []

  const violations = []

  contenu.split(/\r?\n/).forEach((ligne, index) => {
    // Un commentaire décrit une charge, il n'en fabrique pas.
    if (/^\s*(\/\/|\*|\/\*)/.test(ligne)) return

    for (const { motif, nom } of MARQUEURS) {
      if (motif.test(ligne)) {
        violations.push({
          file: relatif,
          line: index + 1,
          marqueur: nom,
          extrait: ligne.trim().slice(0, 90),
        })
      }
    }
  })

  return violations
}

/** @param {Array<{file: string}>} violations */
export function construireBaseline(violations) {
  const baseline = {}
  for (const v of violations) baseline[v.file] = (baseline[v.file] ?? 0) + 1
  return Object.fromEntries(Object.entries(baseline).sort(([a], [b]) => a.localeCompare(b)))
}

/** @param {Record<string, number>} baseline */
export function total(baseline) {
  return Object.values(baseline).reduce((somme, n) => somme + n, 0)
}

/**
 * Le cliquet gèle un COMPTE par fichier, pas des numéros de ligne : déplacer
 * une fixture existante ne doit pas rougir, en ajouter une doit rougir.
 *
 * @param {Array<{file: string}>} violations
 * @param {Record<string, number>} baseline
 */
export function nouvelles(violations, baseline) {
  const parFichier = {}
  for (const v of violations) (parFichier[v.file] ??= []).push(v)

  const neuves = []
  for (const [fichier, liste] of Object.entries(parFichier)) {
    const gelees = baseline[fichier] ?? 0
    if (liste.length > gelees) neuves.push(...liste.slice(gelees))
  }
  return neuves
}
