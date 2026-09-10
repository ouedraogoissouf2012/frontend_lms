import { enrichTeacherClasses } from './classStats'
import { classeLabel } from './classes'

/**
 * Compteurs de l'écran « Mes Statistiques », dérivés des sources qui les
 * DÉTIENNENT réellement.
 *
 * ## Le défaut que ce module supprime
 *
 * `mapDashboardToStats` lisait huit clés sur le seul dashboard KLASSCI, dont
 * **six qui n'existent pas dans sa réponse**. Mesuré le 2026-09-09 avec un
 * jeton enseignant réel, `me/teacher-dashboard` rend :
 *
 * ```
 * matieres[6]  classes[4]  evaluations[27]  prochaines_seances[0]
 * statistiques: { heures:      { total_seances: 105, seances_effectuees: 0 },
 *                 evaluations: { total_programmees: 27, a_corriger: 0 } }
 * ```
 *
 * Ni `total_etudiants`, ni `total_lecons`, ni `corrections_effectuees`, ni
 * `visio_effectuees`, ni `messages_forum`, ni `seances` (la clé s'appelle
 * `prochaines_seances`). Le `|| 0` de l'ancien mapping transformait donc chaque
 * clé absente en zéro : **six tuiles sur huit affichaient 0 pour toujours**,
 * dont « Séances Données » alors que KLASSCI en déclarait 105, et « Leçons
 * Créées » alors que le LMS répondait `lessons.total = 1` **dans le même
 * chargement de page**.
 *
 * Le test unitaire ne pouvait pas l'attraper : sa fixture inventait les clés
 * manquantes. Un test vert sur une charge qui n'existe pas ne mesure rien.
 *
 * ## La règle appliquée, déjà écrite dans ce dépôt
 *
 * > « une source absente vaut `null` (« non mesuré ») ; seule une liste
 * > réellement vide produit `0` » — {@link ./classStats.js}
 *
 * > « `{{ x || 0 }}` affichait `0` aussi bien pour un vrai zéro que pour une
 * > donnée jamais chargée (une panne se lisait "0 étudiant") »
 * > — {@link ./formatters.js} `formatCount`
 *
 * Un compteur sans source rend donc `null`, que l'affichage rend « — ». Trois
 * tuiles restent dans ce cas : aucune source ne les porte aujourd'hui, et
 * afficher `0` serait affirmer une mesure qu'on n'a pas.
 *
 * ## Qui détient quoi
 *
 * | Compteur | Source | Pourquoi elle |
 * |---|---|---|
 * | matières, classes, évaluations, séances | KLASSCI | le référentiel académique est chez lui |
 * | leçons | **LMS local** | `lessons` est une table du LMS ; KLASSCI ne l'a jamais eue |
 * | corrections à faire | KLASSCI | `statistiques.evaluations.a_corriger` |
 * | étudiants, visio, messages forum | *aucune* → `null` | voir ci-dessous |
 *
 * `nb_etudiants` : la charge `me/teacher-dashboard` ne porte AUCUN effectif —
 * ses classes sont `{id, name, libelle, filiere, niveau}`. L'écran « Mes
 * Classes » les obtient en fusionnant `/proxy/classes`, un autre appel. Tant
 * que cet écran-ci ne le fait pas, la valeur est inconnue, pas nulle.
 */

/** Nombre fini, ou `null` — jamais `0` par défaut. */
function mesure(valeur) {
  const n = typeof valeur === 'string' ? Number(valeur) : valeur
  return typeof n === 'number' && Number.isFinite(n) ? n : null
}

/** Longueur d'une liste réellement reçue ; `null` si la clé est absente. */
function taille(valeur) {
  return Array.isArray(valeur) ? valeur.length : null
}

/**
 * Aplatit ce qu'un composant doit AFFICHER.
 *
 * KLASSCI porte `niveau` comme un OBJET `{id, nom, code}`. Le composant en
 * faisait `{{ classe.niveau }}` : Vue sérialisait l'objet, et l'utilisateur
 * lisait `{ "id": 1, "nom": "BTS 1ere ANNEE", "code": "1A" }` à l'écran. Il
 * lisait aussi `classe.nom`, quand la clé s'appelle `name`.
 *
 * Aplatir ICI, et pas dans le composant, tient la règle du dépôt : « aucun
 * composant n'apprend la forme KLASSCI ; il reçoit des données déjà
 * normalisées » (CONTRIBUTING.md §7).
 */
function pourAffichage(classe) {
  const niveau = classe?.niveau

  return {
    ...classe,
    nom: classeLabel(classe),
    niveau: typeof niveau === 'string' ? niveau : (niveau?.nom ?? niveau?.libelle ?? null),
  }
}

/**
 * @param {object|null} klassci Charge `data` de `me/teacher-dashboard`.
 * @param {object|null} local   Charge `data` de `/dashboard/teacher` (LMS).
 * @returns {{nb_matieres:number|null, nb_classes:number|null, nb_etudiants:number|null,
 *   nb_evaluations:number|null, nb_seances:number|null, nb_lecons:number|null,
 *   nb_corrections:number|null, nb_visio:number|null, nb_messages_forum:number|null,
 *   par_matiere:Array, par_classe:Array}}
 */
export function mapTeacherStats(klassci, local) {
  const k = klassci && typeof klassci === 'object' ? klassci : {}
  const l = local && typeof local === 'object' ? local : {}
  const statistiques = k.statistiques && typeof k.statistiques === 'object' ? k.statistiques : {}

  const matieres = Array.isArray(k.matieres) ? k.matieres : []
  const classes = Array.isArray(k.classes) ? k.classes : []

  return {
    nb_matieres: taille(k.matieres),
    nb_classes: taille(k.classes),
    nb_evaluations: taille(k.evaluations),

    // KLASSCI compte les séances PROGRAMMÉES dans `heures`, jamais dans une
    // liste : `prochaines_seances` est vide alors que `total_seances` vaut 105.
    // L'ancien mapping lisait `seances.length` — une clé qui n'existe pas.
    nb_seances: mesure(statistiques?.heures?.total_seances),

    // `lessons` est une table du LMS. La demander à KLASSCI ne pouvait
    // qu'échouer : il ne l'a jamais eue.
    nb_lecons: mesure(l?.lessons?.total),

    nb_corrections: mesure(statistiques?.evaluations?.a_corriger),

    // Aucune source ne porte ces trois mesures aujourd'hui. `null` les rend
    // « — » ; un `0` affirmerait une mesure qu'on n'a pas.
    nb_etudiants: null,
    nb_visio: null,
    nb_messages_forum: null,

    par_matiere: matieres,
    // Normalise les classes AVANT l'affichage : la charge KLASSCI porte `name`
    // (pas `nom`), un `niveau` OBJET, et aucun effectif. Sans cette étape, le
    // composant rendait l'objet `niveau` sérialisé — du JSON brut à l'écran.
    par_classe: enrichTeacherClasses(classes, matieres).map(pourAffichage),
  }
}
