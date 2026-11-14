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
const FILIERE = { id: 701, name: 'Filiere E2E' }
const NIVEAU = { id: 801, nom: 'Niveau E2E', code: 'NE2E' }

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

/** Les réponses, par route. `c` : le compte du jeton (null sans jeton valide). */
export const REPONSES = {
  // KlassciTenantDiscovery:76, :173 : un 2xx avec `data.found`.
  'POST /auth/check-user': (_c, corps) => ok({ found: Object.values(COMPTES).some((x) => x.email === corps?.identifier) }),
  // KlassciAuthClient:84-129, LoginOrchestrator:113-137 : `data.token`, `data.user`, `meta.annee_universitaire_courante`.
  // (la vérification du mot de passe est faite par le serveur, qui seul connaît le secret du run)
  'POST /auth/login': null,
  'POST /auth/logout': () => ({ success: true }),
  // AuthController:127, EnsureKlassciSync:84-112 : `data.user`.
  'GET /auth/me': (c) => ok({ user: utilisateur(c) }),
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
    evaluations: [],
    statistiques: { heures: { total_seances: 0, seances_effectuees: 0 }, evaluations: { total_programmees: 0, a_corriger: 0 } },
  })),
  // MatiereSyncService:60-121 : `data[]` (id, code, libelle/nom/name, coefficient, filiere, niveau).
  'GET /matieres': () => ok(MATIERES.map((m) => ({ ...m, libelle: m.nom, name: m.nom, description: null, coefficient: 1, credit: null, filiere: { id: FILIERE.id }, niveau: { id: NIVEAU.id }, semestre: null }))),
  // KlassciInstitutionStructureReader:28 : `data.filieres`, `data.niveaux_etudes`.
  'GET /structure': () => ok({ filieres: [FILIERE], niveaux_etudes: [NIVEAU] }),
  // KlassciInstitutionClassesReader:30 : `data[]`.
  'GET /classes': () => ok(CLASSES),
  'GET /filieres': () => ok([FILIERE]),
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
      matieres: COMPTES.enseignant.matieres.map((mid) => ({ ...matiere(mid), coefficient: 1, couleur: '#336699', heures: 30, source: 'klassci' })),
      emploi_temps_semaine: [],
    })
  },
  // K2 : `matieres/{id}` (MatiereInfoFetcher:19-55) : `data.matiere`, `data.combinaisons`, `data.enseignants`.
  'GET /matieres/{id}': (_c, _corps, [id]) => {
    const m = matiere(Number(id))
    if (!m) return undefined
    const ens = COMPTES.enseignant
    return ok({
      matiere: { ...m, coefficient: 1, description: null },
      combinaisons: [],
      enseignants: ens.matieres.includes(m.id) ? [{ id: ens.enseignant_id, nom_complet: ens.nom, email: ens.email }] : [],
    })
  },
  // K2 : l'emploi du temps et les évaluations programmées (vides en K1).
  'GET /emploi-temps': () => ok([]),
  'GET /evaluations': () => ok([]),
}

/** Le jeu lu par e2e/parcours.mjs pour cette école. */
export function jeuDuParcours() {
  return {
    ecole: 'klassci',
    comptes: Object.fromEntries(Object.entries(COMPTES).map(([k, c]) => [k, c.email])),
    classes: CLASSES.map((c) => c.id),
    matieres: MATIERES.map((m) => m.id),
  }
}
