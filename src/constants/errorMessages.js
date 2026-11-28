/**
 * Catalogue centralisé des messages d'erreur utilisateur (#20).
 *
 * Source unique, gelée (cohérent avec src/constants/roles.js), orientée utilisateur
 * (français, actionnable, sans jargon technique). Supprime la duplication des
 * « Erreur lors du chargement » et prépare l'i18n (structure plate catégorie → message,
 * transformable en catégorie → clé i18n sans toucher les appelants).
 *
 * Aucun de ces messages ne contient de détail technique d'infrastructure (§1.2).
 */
export const ERROR_MESSAGES = Object.freeze({
  auth: 'Votre session a expiré. Veuillez vous reconnecter.',
  forbidden: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
  notFound: 'La ressource demandée est introuvable.',
  // 409 (#391) : l'état a changé entre l'affichage et l'action. Message NEUTRE : il
  // sert TOUS les 409 (ex. demande d'ouverture déjà tranchée), dont certains appelants
  // ne rechargent rien. Le message serveur n'est pas repris (fail-secure).
  conflict: "Cette action n'est plus possible dans l'état actuel.",
  // Complément que seul un appelant qui A RECHARGÉ avec succès peut ajouter.
  listeActualisee: 'La liste a été actualisée.',
  // 410 : seul ActivationController le rend (jeton inconnu, consommé ou périmé). `/activation/{jeton}` sert le lien
  // de l'administrateur ET celui de « Mot de passe oublié » (#614) : le texte offre les deux sorties. Il sert aussi
  // au lien incomplet (ActivateAccount.vue).
  gone: 'Ce lien n\'est pas valide ou a expiré. Demandez-en un nouveau à votre administrateur, ou depuis « Mot de passe oublié ».',
  validation: 'Certaines informations sont invalides. Veuillez vérifier votre saisie.',
  rateLimit: 'Trop de requêtes en peu de temps. Veuillez patienter quelques instants.',
  server: 'Une erreur est survenue côté serveur. Veuillez réessayer plus tard.',
  network: 'Connexion impossible. Vérifiez votre connexion internet et réessayez.',
  // Distinct de `network` : la connexion fonctionne, c'est le serveur qui n'a pas
  // répondu dans le délai imparti. L'action utile n'est pas la même (réessayer
  // plus tard, vs vérifier sa connexion).
  timeout: 'Le serveur met trop de temps à répondre. Veuillez réessayer.',
  // #240 : erreurs spécifiques du proxy KLASSCI, distinguées par le back
  // (RendersKlassciProxyErrors) — messages actionnables (sans quoi les dashboards
  // KLASSCI restaient muets après expiration du token ou indisponibilité).
  klassciExpired: 'Votre session KLASSCI a expiré. Reconnectez-vous à KLASSCI pour actualiser ces données.',
  // Fin « Réessayez dans un instant. » : errorHandler la remplace par le délai de Retry-After.
  klassciUnavailable: 'Service KLASSCI temporairement indisponible. Réessayez dans un instant.',
  // #420 : constat, sans consigne de reconnexion — se reconnecter ne pose aucun accès.
  klassciTokenMissing: "Aucun accès KLASSCI n'est enregistré pour ce compte : les données qui en proviennent ne peuvent pas être affichées.",
  // lms_backend #1011 : refus de démarrage d'une évaluation. `offline_only` ne suppose pas le mode :
  // le serveur dit seulement « is_online=false, pas de passage LMS » (EvaluationAttemptStateService).
  evaluationWindowClosed: 'Cette évaluation n’est pas ouverte en ce moment.',
  evaluationMaxAttempts: 'Vous avez utilisé toutes vos tentatives pour cette évaluation.',
  evaluationRetakeForbidden: 'Cette évaluation ne peut pas être reprise.',
  evaluationOfflineOnly: 'Cette évaluation ne se passe pas en ligne.',
  // lms_backend #1037 (C28) : 409 à la remise, échéance dépassée ; la copie est gardée, jamais notée.
  // Lot CORR : 409 de POST /evaluations/{id}/sync-klassci, une copie à dissertation n'est pas notée.
  // D540 : aucune copie remise à synchroniser (compteur du serveur, ou 422 `no_submission_to_sync`).
  syncAucuneCopieRemise: "Aucune copie remise n'est à synchroniser. Les notes partiront une fois des copies remises par les élèves.",
  syncDissertationNonNotee: 'Une copie à dissertation n’est pas encore notée : notez-la depuis « Notes et résultats » avant d’envoyer les notes à KLASSCI.',
  evaluationAttemptLocked: 'Le temps imparti est dépassé : votre copie est verrouillée. Vos réponses sont conservées, mais elle ne sera pas notée.',
  // Motif `student_without_active_class` : un état vide, affiché en information (jamais en alerte).
  eleveSansClasseActive: 'Vous n’êtes inscrit dans aucune classe active.',
  // lms_backend #1060 : 403 de GET /evaluations/{id}/preview, coordinateur sur une évaluation non terminée.
  previewRequiresFinishedEvaluation: 'Cette évaluation ne peut être prévisualisée qu’une fois terminée.',
  // lms_backend #1019 : 503 + Retry-After, KLASSCI ne rend pas la fenêtre de l'évaluation.
  evaluationWindowUnverifiable: 'La disponibilité de cette évaluation ne peut pas être vérifiée pour le moment. Réessayez dans un instant.',
  // #391, ADR-906-01 : motifs de refus des portes d'inscription par code.
  // 409 : l'adhésion existe mais n'est pas active (élève suspendu) : une décision de
  // l'établissement (StudentEnrolmentService), pas un code périmé. Régénérer le code
  // ne la lèverait pas et casserait celui de tous les autres élèves.
  enrolmentNotActive: "Votre inscription dans cette classe n'est pas active. Adressez-vous à votre établissement.",
  // lms_backend#1115 (#620) : 409 `class_full`, le code est valide mais la classe est pleine.
  classeComplete: 'Cette classe est complète. Adressez-vous à votre établissement.',
  // lms_backend#1668 (#675) : les refus du créneau d'une séance.
  seanceConflitHoraire: 'Ce créneau chevauche une autre séance du même enseignant ou de la même classe.',
  seanceForcageInterdit: 'Seule la gestion de l’établissement peut créer une séance malgré un conflit d’horaire.',
  seanceFinAvantDebut: 'La fin de la séance doit suivre son début.',
  // lms_backend#1709 : GET /lms/classes/etablissement a échoué ; le rapport reste possible sur toute l'école.
  classesIndisponibles: 'Les classes n’ont pas pu être chargées : le rapport portera sur toutes les classes.',
  noInstitution: "Votre compte n'est rattaché à aucun établissement. Contactez votre administrateur.",
  accountQuotaExceeded: "Trop d'essais en peu de temps. Réessayez dans une minute.",
  accountDailyCapReached: "Vous avez atteint la limite d'essais pour aujourd'hui. Réessayez demain.",
  // 429 : plafond quotidien de codes ERRONÉS pour tout l'établissement (anti-devinette,
  // RejoindreParCodeService), pas un plafond d'inscriptions.
  institutionCapReached: "Trop de codes erronés ont été saisis aujourd'hui dans votre établissement. Réessayez demain.",
  // #429 : refus d'entrée en visio (POST /lms/seances/{id}/join, ParticipantValidationService).
  // Chaque message suit la CONDITION serveur, et son recours change vraiment quelque chose.
  // not_enrolled : l'élève n'est pas parmi les élèves ACTIFS de la classe de la séance.
  visioNotEnrolled: "Vous ne figurez pas parmi les élèves actifs de la classe de cette séance. Adressez-vous à votre établissement.",
  // no_classe_id : la séance n'a pas de classe (toute séance locale aujourd'hui) ; le
  // formateur ne peut pas la rattacher depuis l'écran : seul l'établissement le peut.
  visioNoClasse: "Cette séance n'est rattachée à aucune classe : la visioconférence n'est pas accessible. Adressez-vous à votre établissement.",
  visioNotEnabled: "La visioconférence n'est pas activée pour cette séance.",
  visioNotStarted: "La visioconférence n'a pas encore commencé. Attendez que l'enseignant la démarre.",
  visioEnded: 'La visioconférence est terminée.',
  // `seance_past` : la séance passée est VERROUILLÉE (#1107, lms_backend#1121). Un texte juste dans tous les
  // contextes du motif : démarrer ou rejoindre la visio, modifier la séance.
  seancePassee: 'Cette séance est passée : elle est verrouillée (ni modification, ni visio).',
  lessonClasseHorsMatiere: 'Cette classe n’est pas une classe de la matière.',
  lessonContentTeacherOnly: "Le contenu d'une leçon est réservé à son enseignant : vous pouvez la consulter.",
  evaluationLocked: 'Cette évaluation est verrouillée : des copies ont déjà été remises. Elle ne peut plus être modifiée ni supprimée.',
  visioTeacherNotOwner: "Vous n'êtes pas l'enseignant de cette séance : vous ne pouvez pas en rejoindre la visioconférence.",
  visioRoleRefused: 'Votre rôle ne permet pas de rejoindre cette visioconférence.',
  // tenant_not_resolved : le COMPTE n'a pas d'établissement ; se reconnecter n'y change rien.
  visioNoInstitution: "Votre compte n'est rattaché à aucun établissement : la visioconférence n'est pas accessible. Adressez-vous à votre administration.",
  // 404 de la porte « rejoindre » : le message générique (ressource introuvable)
  // n'aide pas l'élève ; c'est le CODE qui ne correspond à rien.
  codeInconnu: 'Ce code ne correspond à aucune classe. Vérifiez-le auprès de votre formateur.',
  codeVide: 'Saisissez le code que votre formateur vous a donné.',
  // D72-a : refus d'écriture d'une évaluation (POST, PUT, /publish). Chaque message dit le recours.
  evaluationTeacherIdentityMissing: "Votre compte n'est pas encore relié à votre fiche d'enseignant dans KLASSCI. Adressez-vous à votre établissement.",
  evaluationTeacherNotAssigned: "Vous n'êtes pas désigné pour enseigner cette matière dans cette classe.",
  evaluationSchedulingRequired: 'Cette évaluation doit d’abord être programmée dans KLASSCI.',
  evaluationIdentifierOutOfScope: 'Cette classe ou cette matière ne relève pas de votre établissement. Rechargez la page.',
  evaluationPublishViaDedicatedRoute: 'Une évaluation se publie par l’action « Publier », pas par sa modification.',
  evaluationWithoutQuestions: 'Une évaluation publiée doit compter au moins une question.',
  // S-matière : refus de création d'une séance locale (POST /lms/seances). Le couple vient du
  // catalogue de l'établissement : un refus dit qu'il a changé depuis le chargement de l'écran.
  seanceClasseHorsEtablissement: "Cette classe n'est plus disponible dans votre établissement. Choisissez-en une autre.",
  seanceMatiereHorsEtablissement: "Cette matière n'est plus disponible dans votre établissement. Choisissez-en une autre.",
  seanceMatiereHorsProgramme: "Cette matière n'est pas au programme de la classe choisie.",
  // lms_backend#1121 : refus de PUT /lms/seances/{id}, la modification d'une séance locale.
  seanceGereeParKlassci: 'Cette séance vient de KLASSCI : elle se modifie dans KLASSCI.',
  seanceVisioEnCours: 'La visioconférence de cette séance est en cours : elle ne peut pas être modifiée maintenant.',
  // #623 : une ligne d'historique sans identifiant entier ; rien n'est envoyé, aucun id n'est deviné.
  seanceIdentifiantIllisible: "Cette séance n'a pas pu être désignée. Rechargez l'historique, puis réessayez.",
  // B7 (D442) : des options d'avant lms_backend #1059 sans texte fidèle (objet, liste) ; texte du front.
  optionsIllisibles: "Les options de cette question n'ont pas pu être relues. Saisissez-les de nouveau avant d'enregistrer.",
  // B5 (D461) : les bornes des options d'une question (lms_backend #1069) ; textes du front.
  optionsMaxAtteint: 'Une question compte au plus 26 options.',
  optionsHorsBornes: "Cette question dépasse les bornes : 26 options au plus, de 1 000 caractères chacune. Retirez ou raccourcissez des options avant d'enregistrer.",
  // D466 (D467) : une bonne réponse absente des options, chargée telle, ou refusée par le back (422
  // `correct_answer_not_among_options`). Texte du front.
  bonneReponseOrpheline: "La bonne réponse d'une question ne correspond à aucune de ses options. Choisissez-la de nouveau.",
  // D528 : une question à plusieurs coches passée à un type à réponse unique ; ses coches sont retirées.
  bonneReponseAChoisir: "Cette question n'accepte qu'une bonne réponse : ses coches ont été retirées. Choisissez-la.",
  // D528 : deux options d'une question au même texte (après trim) sont ambiguës ; cochées, un doublon.
  optionsEnDouble: "Deux options de cette question ont le même texte. Modifiez-en une avant d'enregistrer.",
  // D528 : les bornes des réponses d'une réponse courte, celles des options (lms_backend #1071).
  reponsesCourtesHorsBornes: "Cette question accepte au plus 26 réponses, de 1 000 caractères chacune. Retirez ou raccourcissez des réponses avant d'enregistrer.",
  // D477 : la connexion (Login.vue, utils/messageConnexion). Textes du front ; le back n'a pas de `reason`.
  identifiantsIncorrects: 'Identifiants incorrects.',
  connexionEchouee: 'Échec de la connexion.',
  // lms_backend#1739 (#711) : KLASSCI refuse le COMPTE (non réinscrit, inactif) sans dire pourquoi.
  compteRefuseParKlassci: 'Votre établissement refuse cette connexion. Contactez son secrétariat.',
  compteEnConflit: "Votre adresse e-mail est déjà utilisée par un autre compte de votre établissement. Contactez l'administrateur de votre école.",
  // lms_backend#922 (ADR-906-01) : les sens d'un même statut, chacun son motif (refusalReasons.js).
  demandeEcoleQuotaAdresse: 'Trop de demandes envoyées depuis cette connexion. Réessayez dans un instant.',
  demandeEcolePlafondDuJour: "Le nombre maximal de demandes d'inscription d'école est atteint pour aujourd'hui. Réessayez demain.",
  periodeTransitionInterdite: "Cette action n'est pas possible dans l'état actuel de la période.",
  // #658 (lms_backend#1651).
  periodeNonModifiable: 'Une période close, annulée ou archivée ne se modifie plus.',
  periodePublieeSansDebut: 'Une période publiée garde sa date de début.',
  periodeNonSupprimable: 'Seul un brouillon sans classe rattachée se supprime ; une période publiée s’annule.',
  periodeNonPubliee: 'Seule une période publiée peut devenir la période en cours.',
  evaluationTentativeNonDemarree: "Aucune tentative n'est en cours pour cette évaluation : démarrez-la avant de la rendre.",
  evaluationCopieNonNotable: "Cette copie ne peut pas encore être notée : elle n'a pas été rendue.",
  quizIndisponible: "Ce quiz n'est pas disponible actuellement.",
  quizTentativesEpuisees: 'Vous avez utilisé toutes vos tentatives pour ce quiz.',
  quizTentativeConcurrente: "Une autre tentative vient d'être enregistrée pour ce quiz. Rechargez la page.",
  quizTentativeDejaRendue: 'Cette tentative a déjà été rendue.',
  quizTempsEcoule: 'Le temps est écoulé : votre tentative a été rendue automatiquement.',
  // #599 : six motifs reçus par un écran, chacun sa catégorie (refusalReasons.js).
  quizTentativeFermee: "Cette tentative n'est plus ouverte : recommencez le quiz.",
  quizModifieDepuisLeDebut: "Ce quiz a été modifié depuis que vous l'avez commencé : recommencez-le.",
  quizReponseHorsOptions: 'Une réponse ne correspond à aucune des options proposées : recommencez le quiz.',
  evaluationCopieDejaRemise: "Votre copie vient d'être remise depuis une autre fenêtre ou un autre appareil. Rechargez l'évaluation.",
  syncEvaluationNonLiee: "Cette évaluation n'est liée à aucune évaluation KLASSCI : ses notes restent dans le LMS.",
  classeSansFicheKlassci: "Cette classe a été créée dans le LMS : elle n'a pas de fiche KLASSCI à afficher.",
  // #605 (lms_backend#1184) : le catalogue de cette école est tenu par KLASSCI.
  catalogueGereParKlassci: 'Ce catalogue est géré par KLASSCI : il se modifie dans KLASSCI, pas ici.',
  // #613 (lms_backend#808) : les réponses de « Mot de passe oublié ». Aucune ne promet un courriel déjà parti.
  motDePasseKlassci: 'Votre mot de passe est celui de KLASSCI : réinitialisez-le depuis KLASSCI.',
  reinitialisationIndisponible: 'La réinitialisation du mot de passe en ligne n’est pas encore disponible. Adressez-vous à votre établissement.',
  lienDeReinitialisationEnvoye: 'Si un compte correspond à cette adresse, un lien pour choisir un nouveau mot de passe va lui être envoyé.',
  // Réponse sans motif connu : la demande est reçue, rien de plus n'est su.
  demandeDeReinitialisationRecue: 'Votre demande a été reçue.',
  // #611 : les périodes archivées sont masquées par défaut (lms_backend#1290) ; la case de l'écran les montre.
  periodeArchiveeMasquee: 'Période archivée. Cochez « Voir les périodes archivées » pour la revoir.',
  periodesArchiveesMasquees: 'Aucune période à afficher. Les périodes archivées sont masquées : cochez « Voir les périodes archivées » pour les revoir.',
  // #631 : la capacité d'une classe locale, réglée à l'écran (contrôle local, puis relecture du serveur).
  capaciteIllisible: "Indiquez un nombre entier d'élèves, de 0 à 10 000, ou laissez vide pour ne pas limiter.",
  capaciteIncertaine: 'Capacité incertaine : actualisez la liste avant de la modifier.',
  // #657 : rattacher une classe à sa période.
  periodeIncertaine: 'Période incertaine : actualisez la liste avant de la modifier.',
  periodesIndisponibles: 'Les périodes n’ont pas pu être chargées : actualisez la page pour en choisir une.',
  // #632 : la création d'une classe locale à l'écran.
  classeLibelleRequis: 'Indiquez le libellé de la classe.',
  classeCodeDejaEmploye: 'Ce code est déjà employé par une autre classe de votre établissement : choisissez-en un autre, ou laissez-le vide.',
  classeCreationIncertaine: 'La création n’a pas pu être confirmée. La classe existe peut-être déjà : vérifiez la liste avant de recommencer.',
  // #648 : la création d'un compte par l'admin d'une école autonome (contrôle local, avant POST /users).
  compteNomRequis: 'Indiquez le nom complet de la personne.',
  compteCourrielRequis: 'Indiquez une adresse de courriel valide.',
  compteRoleRequis: 'Choisissez le rôle du compte.',
  compteMotDePasseCourt: 'Le mot de passe initial doit compter au moins 8 caractères.',
  compteConfirmationDifferente: 'La confirmation ne reprend pas le mot de passe initial.',
  // #656 (b) : modifier, désactiver, définir le mot de passe d'un compte.
  compteRienAModifier: 'Aucun changement à enregistrer.',
  compteActeIncertain: 'L’opération n’a pas pu être confirmée : la liste est relue, vérifiez-la avant de recommencer.',
  motDePasseTropCourt: 'Le mot de passe doit compter au moins 8 caractères.',
  motDePasseConfirmationDifferente: 'La confirmation ne reprend pas le mot de passe.',
  motDePasseGereParKlassci: 'Le mot de passe de ce compte se gère dans KLASSCI, pas ici.',
  compteCreationIncertaine: 'La création n’a pas pu être confirmée. Le compte existe peut-être déjà : vérifiez la liste avant de recommencer.',
  // #683 : le classement d'une classe (lms_backend#1676).
  resultatsClasseNonEnseignee: 'Vous n’enseignez pas dans cette classe : son classement ne vous est pas ouvert.',
  resultatsHorsDeLaClasse: 'Vous n’êtes pas inscrit dans cette classe : son classement ne vous est pas ouvert.',
  // #654 : le catalogue d'une école autonome (matière, programme d'une classe).
  matiereLibelleRequis: 'Indiquez le libellé de la matière.',
  matiereCoefficientIllisible: 'Indiquez un coefficient entier, de 1 à 20.',
  matiereCreditIllisible: 'Indiquez un crédit entier, de 1 à 60.',
  matiereCreationIncertaine: 'La création n’a pas pu être confirmée. La matière existe peut-être déjà : vérifiez la liste avant de recommencer.',
  programmeMatiereRequise: 'Choisissez la matière à rattacher.',
  programmeIntrouvable: 'Classe, matière ou enseignant introuvable : actualisez la page avant de recommencer.',
  programmeRattachementIncertain: 'Le rattachement n’a pas pu être confirmé : actualisez la fiche pour voir le programme.',
  // #660 : modifier une matière, modifier ou retirer une matière du programme d'une classe.
  matiereCodeDejaPris: 'Ce code est déjà employé par une autre matière de l’école.',
  matiereModificationIncertaine: 'La modification n’a pas pu être confirmée : la liste est relue, vérifiez la matière.',
  programmeLigneRequise: 'Choisissez la matière du programme à modifier.',
  programmeCoefficientIllisible: 'Indiquez un coefficient entier, de 1 à 20, ou laissez vide pour celui de la matière.',
  programmeMatiereEmployee: 'Des leçons, séances, évaluations, quiz ou discussions de cette classe emploient cette matière : elle ne peut pas en être retirée.',
  programmeModificationIncertaine: 'La modification n’a pas pu être confirmée : la fiche est relue, vérifiez le programme.',
  // #678 : le calendrier de l'année (lms_backend#1671).
  calendrierAucunEvenement: 'Aucun événement ce mois-ci.',
  calendrierTitreRequis: 'Indiquez le titre de l’événement.',
  calendrierDatesRequises: 'Indiquez le jour de début et le jour de fin.',
  calendrierFinAvantDebut: 'Le jour de fin ne peut pas précéder le jour de début.',
  calendrierClassesRequises: 'Choisissez au moins une classe, ou publiez pour toute l’école.',
  calendrierClasseHorsEcole: 'Une classe choisie n’appartient pas à l’établissement : actualisez la page, puis choisissez de nouveau.',
  calendrierJoursFermesIndisponibles: 'Les jours de vacances et de fermeture n’ont pas pu être lus : l’agenda les omet pour l’instant.',
  // #659 (lms_backend#1652) : modifier, archiver une classe.
  classeArchivee: 'Cette classe est archivée : elle ne reçoit plus d’inscription. Désarchivez-la d’abord.',
  enseignantHorsEtablissement: "Cet enseignant n'est plus disponible dans votre établissement. Choisissez-en un autre.",
  classeModificationIncertaine: 'La modification n’a pas pu être confirmée : la liste est relue.',
  classeArchiveIncertaine: 'L’archivage n’a pas pu être confirmé : la liste est relue.',
  unknown: 'Une erreur inattendue est survenue. Veuillez réessayer.',
})
