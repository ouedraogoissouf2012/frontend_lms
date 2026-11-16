// Jeu FICTIF de l'école KLASSCI de l'E2E (K1, D481) : aucun nom réel, aucune identité réelle.
//
// Les FORMES servies viennent :
// - de la charge CAPTURÉE `tests/fixtures/klassci/teacherDashboard.js` (ses CLÉS seules, jamais ses
//   valeurs) pour `GET me/teacher-dashboard` ;
// - sinon, du code LECTEUR du back (lms_backend, branche `lms`), cité en commentaire de chaque route.
//   Ces formes sont RECONSTITUÉES, pas capturées : un risque de faux vert déclaré (ARRÊT 1, D481).
// Toute route absente d'ici rend 404 et est journalisée par le faux : c'est la liste de ce qui manque.

export const ETABLISSEMENT = 'Ecole fictive E2E KLASSCI'
export const SLUG = 'e2e-klassci'
// D584 : la forme MESURÉE de la filière et du niveau dépend de la route (tests/fixtures/klassci/formes-mesurees.json) :
// `nom` dans la fiche de classe et le tableau de bord, `name` et `libelle` dans la liste des classes.
const FILIERE = { id: 701, nom: 'Filiere E2E', code: 'FE2E' }
const NIVEAU = { id: 801, nom: 'Niveau E2E', code: 'NE2E' }
const FILIERE_LISTE = { id: FILIERE.id, code: FILIERE.code, name: FILIERE.nom, libelle: null } // `libelle` est toujours null dans le réel
const NIVEAU_LISTE = { id: NIVEAU.id, code: NIVEAU.code, name: NIVEAU.nom, libelle: NIVEAU.nom }
// Routes NON VÉRIFIÉES (structure, filieres) : la forme reconstituée d'avant, depuis le code lecteur du back.
const FILIERE_RECONSTITUEE = { id: FILIERE.id, name: FILIERE.nom }
// Les heures d'une matière : un OBJET dans le réel (`classes/{id}`, `matieres`), jamais un nombre.
const HEURES = { cm: 10, td: 10, tp: 10, total: 30 }

export const CLASSES = [
  { id: 9101, name: 'Classe K1 E2E', libelle: null, filiere: FILIERE, niveau: NIVEAU },
  { id: 9102, name: 'Classe K2 E2E', libelle: null, filiere: FILIERE, niveau: NIVEAU },
]
export const MATIERES = [
  { id: 9201, nom: 'Mathematiques K E2E', code: 'MKE' },
  { id: 9202, nom: 'Francais K E2E', code: 'FKE' },
  { id: 9203, nom: 'Histoire K E2E', code: 'HKE' },
]

// K2 : les élèves de chaque classe. L'enveloppe de `classes/{id}` n'expose QUE `nom_complet`, jamais
// `nom` ni `prenom` (ClasseEnvelope:36), et aucun `statut` (ClasseDetailsQueryService, « 210 = 210 ») ;
// le front lit aussi `matricule` et `email` (ClasseEtudiantsTab.vue:14-22).
const eleve = (id, nom, classe) => ({ id, nom_complet: nom, matricule: `MK${id}`, email: `eleve${id}@ecole-klassci.test`, classe })
export const ELEVES = [
  eleve(9304, 'Eleve K E2E', 9101), eleve(9501, 'Eleve K1 Deux E2E', 9101), eleve(9502, 'Eleve K1 Trois E2E', 9101),
  eleve(9503, 'Eleve K2 Un E2E', 9102), eleve(9504, 'Eleve K2 Deux E2E', 9102), eleve(9505, 'Eleve K2 Trois E2E', 9102),
]

// Les comptes : l'identifiant de connexion est l'e-mail (domaine réservé `.test`).
export const COMPTES = {
  // L'admin d'ÉTABLISSEMENT : `superAdmin`, le rôle KLASSCI légitime (KlassciRoleSanitizer:28,
  // KlassciUserSynchronizerTest:141). D499 : un 5e compte garde le rôle brut `admin`, que le front
  // range sous ADMIN (roles.js:35-49) et que `GET /admin/users` refuse (role:coordinateur,superAdmin) :
  // son /admin/users est un ROUGE DÉCLARÉ, qui mesure l'incohérence au lieu de la cacher.
  admin: { id: 9301, role: 'superAdmin', nom: 'Admin K E2E', email: 'admin.k@ecole-klassci.test' },
  admin_brut: { id: 9305, role: 'admin', nom: 'Admin Brut K E2E', email: 'admin.brut.k@ecole-klassci.test' },
  coordinateur: { id: 9302, role: 'coordinateur', nom: 'Coordinateur K E2E', email: 'coord.k@ecole-klassci.test' },
  enseignant: { id: 9303, role: 'enseignant', nom: 'Enseignant K E2E', email: 'ens.k@ecole-klassci.test', enseignant_id: 9401, matieres: [9201, 9202], classes: [9101, 9102] },
  etudiant: { id: 9304, role: 'etudiant', nom: 'Eleve K E2E', email: 'eleve.k@ecole-klassci.test', classe: 9101 },
}

// K3 : UNE évaluation programmée, aux valeurs fictives. Sa fenêtre est OUVERTE à l'heure de la requête : l'élève
// peut démarrer (EvaluationWindowGate:68-127 lit `programmation.window.is_open`).
// D584 : KLASSCI la décrit sous DEUX formes mesurées. Le tableau de bord porte `correction` et
// `lms_integration{can_create_online, can_submit_notes}` ; la LISTE (`GET evaluations`) porte `publication` et
// `lms_integration{can_execute_online, has_online_version, notes_count}`, SANS `can_submit_notes`.
export const EVALUATION = { id: 9601, titre: 'Devoir K E2E', classe: 9101, matiere: 9201 }
// PR 3 (le devoir) : deux programmations de plus, de la MÊME forme mesurée. 9601 est prise par le montage K3 (sa
// version en ligne existe : une seconde rendrait 409). 9602 : le devoir corrigé puis synchronisé ; 9603 :
// l'évaluation B, modifiée puis supprimée.
export const DEVOIRS = Object.freeze({
  principal: Object.freeze({ id: 9602, titre: 'Devoir dissertation K E2E', classe: 9101, matiere: 9201 }),
  b: Object.freeze({ id: 9603, titre: 'Devoir B K E2E', classe: 9101, matiere: 9201 }),
})
const PROGRAMMEES = [EVALUATION, DEVOIRS.principal, DEVOIRS.b]
function evaluationCommune(ev) {
  const debut = new Date(Date.now() - 3600e3)
  const fin = new Date(Date.now() + 3 * 3600e3)
  const m = MATIERES.find((x) => x.id === ev.matiere)
  return {
    id: ev.id, titre: ev.titre, description: ev.titre, type: 'devoir', status: 'draft',
    matiere: { id: m.id, nom: m.nom, code: m.code },
    classe: { id: ev.classe, nom: CLASSES.find((c) => c.id === ev.classe).name },
    programmation: {
      date_evaluation: debut.toISOString(), duree_minutes: 240, coefficient: '1.0', bareme: '20.00',
      window: { start_at: debut.toISOString(), end_at: fin.toISOString(), has_started: true, has_ended: false, is_open: true, time_left_minutes: 180 },
    },
  }
}
const FORMES_EVALUATION = {
  tableau: (ev) => ({
    ...evaluationCommune(ev),
    correction: { notes_saisies: 0, notes_attendues: ELEVES.filter((e) => e.classe === ev.classe).length, progression: 0, is_complete: false },
    lms_integration: { can_create_online: true, can_submit_notes: true },
  }),
  liste: (ev) => ({
    ...evaluationCommune(ev),
    publication: { is_published: 1, notes_published: 0 },
    lms_integration: { can_execute_online: true, has_online_version: false, notes_count: 0 },
  }),
}
/** Les évaluations programmées que voit un compte (l'enseignant de la classe, l'élève de la classe), sous la forme de la route. */
function evaluationsDe(c, forme) {
  const voit = (ev) => (c.role === 'enseignant' && c.classes.includes(ev.classe)) || (c.role === 'etudiant' && c.classe === ev.classe)
  return PROGRAMMEES.filter(voit).map((ev) => FORMES_EVALUATION[forme](ev))
}

// K4 (D609) : UNE séance KLASSCI, servie par `emploi-temps` (EmploiTempsSeanceLocator:68-132 : l'enseignant la
// retrouve par l'`id` de l'entrée, filtrée sur `matiere.id`). Seules des clés MESURÉES (formes-mesurees.json), aux
// valeurs fictives ; datée du jour, dans la fenêtre glissante du back. Un id hors des espaces des autres objets.
export const SEANCE = { id: 9701, titre: 'Seance K E2E', classe: 9101, matiere: 9201 }
/**
 * PR 4 (D2) : les heures de la séance, RELATIVES au run (UTC) : début il y a 10 min, fin dans 1 h 50, au format
 * « HH:mm » mesuré. La fenêtre de la visio (début − 15 min → fin + 30 min) est donc ouverte à toute heure du run.
 * Bornées au jour même (00:00 à 23:59), pour que `date_seance` reste aujourd'hui. Seules les VALEURS changent.
 */
export function heuresDuRun(maintenant = new Date()) {
  const hhmm = (d) => d.toISOString().slice(11, 16)
  const jour = maintenant.toISOString().slice(0, 10)
  const debut = new Date(maintenant.getTime() - 10 * 60e3)
  const fin = new Date(maintenant.getTime() + 110 * 60e3)
  return {
    heure_debut: debut.toISOString().slice(0, 10) === jour ? hhmm(debut) : '00:00',
    heure_fin: fin.toISOString().slice(0, 10) === jour ? hhmm(fin) : '23:59',
  }
}
function seanceDuJour() {
  const jour = new Date().toISOString().slice(0, 10)
  const m = MATIERES.find((x) => x.id === SEANCE.matiere)
  const ens = COMPTES.enseignant
  return {
    id: SEANCE.id, titre: SEANCE.titre, type_cours: 'cours', statut: 'planifie',
    matiere: { id: m.id, nom: m.nom },
    classe: { id: SEANCE.classe, nom: CLASSES.find((c) => c.id === SEANCE.classe).name },
    enseignant: { id: ens.enseignant_id, nom: ens.nom },
    programmation: { date_seance: jour, date_cours: jour, ...heuresDuRun() },
    salle: { id: null, nom: 'Salle E2E' },
  }
}

const ok = (data, extra = {}) => ({ success: true, data, ...extra })
const classe = (id) => CLASSES.find((c) => c.id === id)
const matiere = (id) => MATIERES.find((m) => m.id === id)

/** `data.user` d'un compte (lus : KlassciUserSynchronizer, AuthResponsePresenter:80-125, KlassciDataWhitelist:38). */
export function utilisateur(c) {
  return {
    id: c.id, email: c.email, nom: c.nom, name: c.nom, prenom: null, photo: null, role: c.role,
    role_display_name: c.role, avatar: null, enseignant_id: c.enseignant_id ?? null,
    admin_data: { etablissement: ETABLISSEMENT },
  }
}

/** D584 : `GET auth/me` met l'utilisateur DIRECTEMENT dans `data` (forme mesurée), et non dans `data.user`. */
function profil(c) {
  return {
    id: c.id, nom: c.nom, email: c.email, role: c.role, roles: [c.role], avatar: null,
    derniere_connexion: new Date().toISOString(), preferences: { langue: 'fr', timezone: 'Africa/Abidjan' },
    ...(c.role === 'enseignant' ? { contexte_enseignant: { nb_matieres: c.matieres.length, nb_classes: c.classes.length, matieres_principales: [], classes_enseignees: [] } } : {}),
  }
}

/** Les réponses, par route. `c` : le compte du jeton (null sans jeton valide). */
export const REPONSES = {
  // KlassciTenantDiscovery:76, :173 : un 2xx avec `data.found`.
  'POST /auth/check-user': (_c, corps) => ok({ found: Object.values(COMPTES).some((x) => x.email === corps?.identifier) }),
  // KlassciAuthClient:84-129, LoginOrchestrator:113-137 : `data.token`, `data.user`, `meta.annee_universitaire_courante`.
  // (la vérification du mot de passe est faite par le serveur, qui seul connaît le secret du run)
  'POST /auth/login': null,
  'POST /auth/logout': () => ({ success: true }),
  // Forme MESURÉE (D584) : l'utilisateur est `data`. Le back lit `data.user` (AuthController:127-129,
  // EnsureKlassciSync:88-112) : l'E2E mesure ce qu'il en fait, il ne le masque pas.
  'GET /auth/me': (c) => ok(profil(c)),
  // StudentClassSynchronizer:62-66, StudentClassesSeancesFetcher:70-99 : `data.classe`, `data.cours[].matiere_id`.
  'GET /me/dashboard': (c) => (c.role !== 'etudiant' ? null : ok({
    classe: { id: c.classe, name: classe(c.classe).name, libelle: classe(c.classe).name },
    cours: COMPTES.enseignant.matieres.map((id) => ({ matiere_id: id, matiere: { id, nom: matiere(id).nom } })),
  })),
  // Les CLÉS de la charge capturée tests/fixtures/klassci/teacherDashboard.js, des valeurs fictives.
  'GET /me/teacher-dashboard': (c) => (c.role !== 'enseignant' ? null : ok({
    enseignant: { id: c.enseignant_id, nom_complet: c.nom, email: c.email, photo_url: null },
    matieres: c.matieres.map((id) => ({ ...matiere(id), description: null, coefficient: 1, couleur: '#336699', heures_total: 30, combinaisons: [], nb_seances_programmees: 0 })),
    classes: c.classes.map(classe),
    prochaines_seances: [],
    evaluations: evaluationsDe(c, 'tableau'),
    statistiques: { heures: { total_seances: 0, seances_effectuees: 0 }, evaluations: { total_programmees: evaluationsDe(c, 'tableau').length, a_corriger: 0 } },
  })),
  // Forme MESURÉE (D584) : ni `libelle`, ni `name`, ni `filiere`, ni `niveau` (MatiereSyncService:60-121 les lit
  // pourtant ; l'E2E mesure ce qu'il en fait).
  'GET /matieres': () => ok(MATIERES.map((m) => ({ ...m, description: null, coefficient: 1, couleur: '#336699', heures: HEURES }))),
  // NON VÉRIFIÉE. KlassciInstitutionStructureReader:28 : `data.filieres`, `data.niveaux_etudes`.
  'GET /structure': () => ok({ filieres: [FILIERE_RECONSTITUEE], niveaux_etudes: [NIVEAU] }),
  // KlassciInstitutionClassesReader:30 : `data[]`. `places_occupees` (l'effectif actif) : lu sur la classe
  // KLASSCI par KlassciPayload:136-151, égal à la taille du roster (ClasseDetailsQueryService:229) ; le
  // front le lit en premier (classMeasures.js:36). `places_totales` n'est pas servi : rien ne l'atteste.
  'GET /classes': () => ok(CLASSES.map((c) => ({ ...c, filiere: FILIERE_LISTE, niveau: NIVEAU_LISTE, places_occupees: ELEVES.filter((e) => e.classe === c.id).length }))),
  // NON VÉRIFIÉES : filieres, niveaux-etudes, enseignants (aucune réponse en cache).
  'GET /filieres': () => ok([FILIERE_RECONSTITUEE]),
  'GET /niveaux-etudes': () => ok([NIVEAU]),
  // KlassciInstitutionTeachersReader:39 : `data[]`.
  'GET /enseignants': () => ok([{ id: COMPTES.enseignant.enseignant_id, nom: COMPTES.enseignant.nom, prenom: null, nom_complet: COMPTES.enseignant.nom, email: COMPTES.enseignant.email }]),
  // K2 : l'enveloppe de `classes/{id}` (ClasseDetailsQueryService:121-160, ClasseEnvelope) :
  // `data.classe`, `data.etudiants` (nom_complet, matricule, email ; aucun statut), `data.matieres` (forme
  // mesurée {id, nom, code, coefficient, couleur, heures, source}, ClasseMatieresTab.vue:62),
  // `data.emploi_temps_semaine`. Une classe inconnue rend 404, comme KLASSCI.
  'GET /classes/{id}': (_c, _corps, [id]) => {
    const cl = classe(Number(id))
    if (!cl) return undefined
    return ok({
      classe: cl,
      etudiants: ELEVES.filter((e) => e.classe === cl.id).map(({ classe: _cl, ...e }) => e),
      matieres: COMPTES.enseignant.matieres.map((mid) => ({ ...matiere(mid), coefficient: 1, couleur: '#336699', heures: HEURES, source: 'klassci' })),
      emploi_temps_semaine: [],
    })
  },
  // K2 : `matieres/{id}` (MatiereInfoFetcher:19-55) : `data.matiere`, `data.combinaisons`, `data.enseignants`.
  // D584 : `enseignants` est VIDE dans les 13 réponses mesurées ; la forme d'un élément n'est pas connue.
  'GET /matieres/{id}': (_c, _corps, [id]) => {
    const m = matiere(Number(id))
    if (!m) return undefined
    return ok({ matiere: { ...m, coefficient: 1, description: null }, combinaisons: [], enseignants: [] })
  },
  // K4 : l'emploi du temps porte la séance (forme mesurée). `matieres/{id}` ne sert PAS `seances_programmees` :
  // vide dans toutes les réponses mesurées, sa forme d'élément n'est pas capturée (le back le lit vide, comme en réel).
  'GET /emploi-temps': () => ok([seanceDuJour()]),
  // K3 : les évaluations programmées (KlassciEvaluationWindowSource:36-80 côté élève ; relayé tel quel
  // par /proxy/evaluations côté enseignant).
  'GET /evaluations': (c) => ok(evaluationsDe(c, 'liste')),
  // K3 : la SEULE écriture KLASSCI qui a un écran : les notes (EvaluationKlassciSyncController, avec le
  // jeton de l'ENSEIGNANT, HasKlassciEndpointShortcuts:188-193). Le back n'inspecte pas la réponse : un
  // 2xx suffit ; on ne sert donc que `success`. Le journal en garde les CLÉS, jamais les valeurs.
  'POST /evaluations/{id}/notes': (c, _corps, [id]) => {
    if (c.role !== 'enseignant') return null
    return PROGRAMMEES.some((ev) => ev.id === Number(id)) ? { success: true } : undefined
  },
}

/**
 * Ce que le journal du faux retient des notes envoyées à KLASSCI : leur nombre, les clés de leurs éléments, et
 * leurs VALEURS (données fictives : la note synchronisée doit valoir celle corrigée, PR 3).
 */
export function entreeDuJournal(corps) {
  if (!Array.isArray(corps?.notes)) return {}
  return {
    nb_notes: corps.notes.length,
    cles_notes: [...new Set(corps.notes.flatMap((n) => Object.keys(n ?? {})))],
    valeurs_notes: corps.notes.map((n) => n?.note ?? null),
  }
}

/** Le jeu lu par e2e/parcours.mjs pour cette école. */
export function jeuDuParcours() {
  return {
    ecole: 'klassci',
    comptes: Object.fromEntries(Object.entries(COMPTES).map(([k, c]) => [k, c.email])),
    classes: CLASSES.map((c) => c.id),
    matieres: MATIERES.map((m) => m.id),
    // D607 : les capacités de l'école, telles que le produit les décide. Une école KLASSCI n'inscrit pas
    // localement : KlassciRosterAuthority::allowsLocalEnrolment() rend false (KlassciRosterAuthority.php:18-20).
    capacites: { peutInscrireLocalement: false },
    // PR 3 : les programmations que le parcours du devoir met en ligne par l'interface.
    devoirs: { principal: DEVOIRS.principal, b: DEVOIRS.b },
  }
}
