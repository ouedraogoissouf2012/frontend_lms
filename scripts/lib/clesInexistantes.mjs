/**
 * Cœur pur de la garde « aucune lecture d'une clé qui n'existe pas »
 * (`scripts/lint-cles-inexistantes.mjs`).
 *
 * ## Le défaut de classe que cette garde ferme
 *
 * Quatre fois en trois jours, du code a lu une clé que l'API n'envoie pas — et
 * le `|| 0` / `|| ''` a transformé l'absence en valeur plausible :
 *
 *  - `statistiques.total_lecons` → « Leçons Créées : 0 » alors que le LMS
 *    répondait `2` dans le même chargement de page (#371) ;
 *  - `user.nom` / `user.prenom` → nom VIDE dans la barre latérale, sur toutes
 *    les pages et pour tous les rôles (#372) ;
 *  - `statistiques.total_etudiants` et cinq autres → six tuiles à zéro (#365).
 *
 * Aucun outil ne pouvait le voir : `payload.cle_qui_nexiste_pas` est du
 * JavaScript parfaitement valide. Seule une comparaison à la charge RÉELLEMENT
 * MESURÉE peut trancher.
 *
 * ## Le principe
 *
 * La vérité n'est pas écrite ici : elle est **dérivée des fixtures**
 * (`tests/fixtures/**`), qui sont des réponses capturées contre les vrais
 * serveurs, avec leur provenance. Ajouter un champ côté backend puis à la
 * fixture suffit à l'autoriser — la garde suit la réalité, elle ne la décrète
 * pas.
 *
 * ## Pourquoi un destinataire nommé, et pas un nom de clé
 *
 * `matiere.nom` est LÉGITIME (`matieres[].nom` existe), `user.nom` ne l'est
 * pas. Le nom de la clé ne suffit donc jamais : c'est le porteur qui décide.
 * D'où une table explicite de destinataires, chacun lié à sa fixture.
 *
 * Le motif exclut les accès en cascade (`post.user.x`, `attendance.user.y`) :
 * seul un `user` en tête d'expression désigne l'utilisateur connecté.
 */

/**
 * Destinataires surveillés. Chaque entrée lie une expression de lecture à la
 * fixture qui fait autorité sur ses clés.
 *
 * Ajouter une entrée = étendre la couverture. C'est volontairement explicite :
 * deviner le porteur produirait des faux positifs, et une garde bruyante est
 * une garde désactivée.
 */
export const RECEVEURS = [
  {
    nom: 'user (POST /auth/login)',
    // `(?<![.\w])` exclut les accès en cascade (`post.user.x`) : seul un `user`
    // en tête d'expression peut être l'utilisateur connecté.
    motif: /(?<![.\w])(?:user|currentUser)(?:\.value)?\??\.([A-Za-z_][A-Za-z0-9_]*)/g,
    fixture: 'tests/fixtures/api/loginUser.js',
    exports: ['LOGIN_USER_KLASSCI', 'LOGIN_USER_LOCAL'],
    chemin: null,
    // PORTÉE — sans elle, la garde crie sur tout objet nommé `user`.
    //
    // Un `user` n'est l'utilisateur CONNECTÉ que si le fichier le tient de la
    // couche d'authentification. Partout ailleurs — une ligne de la table des
    // comptes, l'auteur d'un message, un participant de visio — c'est une AUTRE
    // charge, avec ses propres clés, et la signaler serait un faux positif.
    //
    // Le critère est lexical, donc vérifiable sans analyse de flot : le fichier
    // appelle-t-il `auth.getUser()` ou lit-il `currentUser` du store ?
    portee: /auth\.getUser\(\)|useAuthStore\(\)[\s\S]{0,40}currentUser|\bcurrentUser\b\s*=/,
  },
  {
    nom: 'dashboardData.statistiques (me/teacher-dashboard)',
    // PORTÉE par l'expression elle-même : `statistiques` seul désigne au moins
    // TROIS charges distinctes dans ce dépôt — le tableau de bord enseignant,
    // la correction d'une évaluation (`total_etudiants`, `taux_participation`)
    // et le détail d'une matière (`nombre_lessons`, `nombre_seances_programmees`).
    // Ces deux dernières sont légitimes ; ne surveiller que le porteur nommé
    // `dashboardData` est ce qui rend la garde silencieuse sur elles.
    motif: /dashboardData\??\.statistiques\??\.([A-Za-z_][A-Za-z0-9_]*)/g,
    fixture: 'tests/fixtures/klassci/teacherDashboard.js',
    exports: ['TEACHER_DASHBOARD'],
    chemin: 'statistiques',
    portee: null,
    // `dashboardData` nomme AUSSI la charge du tableau de bord ÉTUDIANT
    // (`me/dashboard`), qui porte ses propres clés — `moyenne_generale`,
    // `taux_presence`. Les signaler serait faux : cette charge-là n'a pas encore
    // été mesurée, donc la garde ne peut rien en dire.
    //
    // La couvrir demande de capturer `me/dashboard` avec un jeton étudiant réel
    // et d'en faire une fixture. Tant que ce n'est pas fait, l'écran étudiant
    // reste hors portée — et la garde le déclare plutôt que de l'inventer.
    horsPortee: /^src\/(components|views)\/student\//,
  },
]

/**
 * Fichiers autorisés à lire les DEUX formes : ce sont les normaliseurs et les
 * helpers polymorphes, dont c'est précisément le rôle. Les exempter n'affaiblit
 * rien — c'est chez eux que la traduction doit vivre.
 */
export const NORMALISEURS = [
  'src/utils/formatters.js',
  'src/utils/teacherDashboard.js',
  'src/utils/teacherStats.js',
  'src/utils/classStats.js',
  'src/utils/classMeasures.js',
  'src/utils/classes.js',
  'src/utils/evaluationDisplay.js',
  'src/utils/enseignants.js',
  'tests/fixtures/api/loginUser.js',
  'tests/fixtures/klassci/teacherDashboard.js',
  // Le test de la garde contient des exemples DÉLIBÉRÉS de mauvaises lectures :
  // c'est sa raison d'être. Sans cette exemption, la garde s'attraperait
  // elle-même et gèlerait onze « violations » qui sont ses propres cas d'essai.
  'tests/unit/clesInexistantes.test.js',
]

/**
 * Clés tolérées quel que soit le destinataire : elles ne viennent pas de la
 * charge mais de l'usage JavaScript courant, et les signaler serait du bruit.
 */
const HORS_CHARGE = new Set([
  'value', 'length', 'map', 'filter', 'find', 'forEach', 'reduce', 'some',
  'every', 'includes', 'join', 'slice', 'split', 'trim', 'toString', 'charAt',
  'toUpperCase', 'toLowerCase', 'then', 'catch', 'finally',
])

/**
 * Les clés autorisées pour un destinataire, dérivées de sa fixture.
 *
 * @param {Record<string, unknown>} moduleFixture Le module importé.
 * @param {{exports: string[], chemin: string|null}} receveur
 * @returns {Set<string>}
 */
export function clesAutorisees(moduleFixture, receveur) {
  const cles = new Set()

  for (const nomExport of receveur.exports) {
    let valeur = moduleFixture[nomExport]
    if (receveur.chemin) {
      for (const segment of receveur.chemin.split('.')) {
        valeur = valeur?.[segment]
      }
    }
    if (valeur && typeof valeur === 'object') {
      for (const k of Object.keys(valeur)) cles.add(k)
    }
  }

  return cles
}

export function estNormaliseur(cheminRelatif) {
  const p = cheminRelatif.split('\\').join('/')
  return NORMALISEURS.some((n) => p.endsWith(n))
}

/**
 * Inspecte un fichier et rend les lectures de clés ABSENTES de la charge.
 *
 * @param {string} relatif Chemin POSIX relatif au dépôt.
 * @param {string} contenu Source.
 * @param {Array<{nom: string, motif: RegExp, autorisees: Set<string>}>} receveurs
 * @returns {Array<{file: string, line: number, receveur: string, cle: string, extrait: string}>}
 */
export function inspecter(relatif, contenu, receveurs) {
  if (estNormaliseur(relatif)) return []

  const violations = []

  contenu.split(/\r?\n/).forEach((ligne, index) => {
    // Un commentaire décrit une lecture, il n'en fait pas.
    if (/^\s*(\/\/|\*|\/\*)/.test(ligne)) return

    for (const r of receveurs) {
      // Hors de sa portée, ce destinataire ne décide de rien : le `user` de ce
      // fichier vient d'ailleurs que de l'authentification.
      if (r.portee && !r.portee.test(contenu)) continue
      // Chemin explicitement exclu : le porteur y désigne une AUTRE charge.
      if (r.horsPortee && r.horsPortee.test(relatif)) continue

      // `lastIndex` est partagé entre appels sur un motif /g : on le remet à
      // zéro, sinon une ligne sur deux serait silencieusement sautée.
      r.motif.lastIndex = 0
      let m
      while ((m = r.motif.exec(ligne)) !== null) {
        const cle = m[1]
        if (HORS_CHARGE.has(cle)) continue
        if (r.autorisees.has(cle)) continue
        violations.push({
          file: relatif,
          line: index + 1,
          receveur: r.nom,
          cle,
          extrait: ligne.trim().slice(0, 90),
        })
      }
    }
  })

  return violations
}

/** @param {Array<{file: string}>} violations */
export function construireBaseline(violations) {
  const b = {}
  for (const v of violations) b[v.file] = (b[v.file] ?? 0) + 1
  return Object.fromEntries(Object.entries(b).sort(([a], [c]) => a.localeCompare(c)))
}

/** @param {Record<string, number>} baseline */
export function total(baseline) {
  return Object.values(baseline).reduce((s, n) => s + n, 0)
}

/**
 * Le cliquet gèle un COMPTE par fichier, pas des numéros de ligne : déplacer
 * une lecture existante ne rougit pas, en ajouter une rougit.
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
