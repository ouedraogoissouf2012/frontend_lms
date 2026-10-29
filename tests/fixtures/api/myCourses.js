/**
 * Réponses RÉELLES de `GET /api/lessons/my-courses` — capturées, jamais écrites de mémoire.
 *
 * ## Pourquoi cette fixture existe (#436, #434, #437)
 *
 * Les tests de l'écran « Mes cours » décrivaient la réponse de mémoire : ni `success`,
 * ni `meta`, des ids en chaînes (`'c1'`, `'m1'`). Rien ne pouvait donc y voir que
 * l'élève ne recevait que 15 cours, qu'un succès incomplet devenait une liste vide, ni
 * que les filtres recevaient des nombres. Un test qui écrit lui-même sa donnée
 * d'entrée ne peut pas découvrir qu'elle est fausse (CONTRIBUTING §9).
 *
 * ## Provenance
 *
 * Copie INTÉGRALE, sans abréviation, de la capture `my-courses.json` produite par
 * Fille 1 (pilote my-courses) :
 * - commit backend : 6a62abc0cd1e8fa90c3127b13a3d2a2ecd0ac802 (`lms`)
 * - capturée le : 2026-10-29T05:25:33+00:00
 * - noyau : noyau HTTP Laravel du dépôt, base de test SQLite, jeton Bearer réel
 *   (EnsureKlassciSync désactivé)
 * - école A, mode klassci : élève inscrite par le seul cache `user_classes`,
 *   18 leçons publiées (12 Mathématiques, 6 Algorithmique), 15 par page
 * - école B, mode standalone : pivot `classe_etudiant`, comptes sans identité KLASSCI
 *
 * Pièges mesurés (ne pas « corriger » la fixture) : `filters` est calculé sur la
 * sélection FILTRÉE ; une page au-delà de `last_page` rend 200 et `data: []` ;
 * `classe.name` vaut toujours « Classe » (lms_backend#939) ; l'ordre n'est pas encore
 * départagé par `id` (lms_backend#937).
 *
 * Chaque cas : `{ request, status, body }`. Ne retirer AUCUNE clé ; réduire au besoin
 * le nombre d'éléments d'une liste dans le test, jamais ici.
 */
export const MY_COURSES_CAPTURES = Object.freeze({
  "klassci_page_1_defaut": {
    "request": "GET /api/lessons/my-courses",
    "status": 200,
    "body": {
      "success": true,
      "data": [
        {
          "id": 1,
          "title": "Mathématiques — chapitre 01",
          "description": "Description de « Mathématiques — chapitre 01 »",
          "type": "cours",
          "duree_estimee": null,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 1,
            "klassci_id": 910000001,
            "name": "Moussa Traoré"
          },
          "matiere": {
            "id": 1,
            "name": "Mathématiques"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": {
            "percentage": 40,
            "status": "in_progress",
            "completed_at": null
          },
          "published_at": "2026-09-30T08:00:00.000000Z",
          "created_at": "2026-10-01T08:00:00.000000Z"
        },
        {
          "id": 2,
          "title": "Mathématiques — chapitre 02",
          "description": "Description de « Mathématiques — chapitre 02 »",
          "type": "cours",
          "duree_estimee": 45,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 1,
            "klassci_id": 910000001,
            "name": "Moussa Traoré"
          },
          "matiere": {
            "id": 1,
            "name": "Mathématiques"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": {
            "percentage": 100,
            "status": "completed",
            "completed_at": "2026-10-26T09:00:00.000000Z"
          },
          "published_at": "2026-09-30T08:01:00.000000Z",
          "created_at": "2026-10-01T08:01:00.000000Z"
        },
        {
          "id": 3,
          "title": "Algorithmique — séance 03",
          "description": "Description de « Algorithmique — séance 03 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:02:00.000000Z",
          "created_at": "2026-10-01T08:02:00.000000Z"
        },
        {
          "id": 4,
          "title": "Mathématiques — chapitre 04",
          "description": "Description de « Mathématiques — chapitre 04 »",
          "type": "cours",
          "duree_estimee": 45,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 1,
            "klassci_id": 910000001,
            "name": "Moussa Traoré"
          },
          "matiere": {
            "id": 1,
            "name": "Mathématiques"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:03:00.000000Z",
          "created_at": "2026-10-01T08:03:00.000000Z"
        },
        {
          "id": 5,
          "title": "Mathématiques — chapitre 05",
          "description": "Description de « Mathématiques — chapitre 05 »",
          "type": "cours",
          "duree_estimee": null,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 1,
            "klassci_id": 910000001,
            "name": "Moussa Traoré"
          },
          "matiere": {
            "id": 1,
            "name": "Mathématiques"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:04:00.000000Z",
          "created_at": "2026-10-01T08:04:00.000000Z"
        },
        {
          "id": 6,
          "title": "Algorithmique — séance 06",
          "description": "Description de « Algorithmique — séance 06 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:05:00.000000Z",
          "created_at": "2026-10-01T08:05:00.000000Z"
        },
        {
          "id": 7,
          "title": "Mathématiques — chapitre 07",
          "description": "Description de « Mathématiques — chapitre 07 »",
          "type": "cours",
          "duree_estimee": null,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 1,
            "klassci_id": 910000001,
            "name": "Moussa Traoré"
          },
          "matiere": {
            "id": 1,
            "name": "Mathématiques"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:06:00.000000Z",
          "created_at": "2026-10-01T08:06:00.000000Z"
        },
        {
          "id": 8,
          "title": "Mathématiques — chapitre 08",
          "description": "Description de « Mathématiques — chapitre 08 »",
          "type": "cours",
          "duree_estimee": 45,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 1,
            "klassci_id": 910000001,
            "name": "Moussa Traoré"
          },
          "matiere": {
            "id": 1,
            "name": "Mathématiques"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:07:00.000000Z",
          "created_at": "2026-10-01T08:07:00.000000Z"
        },
        {
          "id": 9,
          "title": "Algorithmique — séance 09",
          "description": "Description de « Algorithmique — séance 09 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:08:00.000000Z",
          "created_at": "2026-10-01T08:08:00.000000Z"
        },
        {
          "id": 10,
          "title": "Mathématiques — chapitre 10",
          "description": "Description de « Mathématiques — chapitre 10 »",
          "type": "cours",
          "duree_estimee": 45,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 1,
            "klassci_id": 910000001,
            "name": "Moussa Traoré"
          },
          "matiere": {
            "id": 1,
            "name": "Mathématiques"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:09:00.000000Z",
          "created_at": "2026-10-01T08:09:00.000000Z"
        },
        {
          "id": 11,
          "title": "Mathématiques — chapitre 11",
          "description": "Description de « Mathématiques — chapitre 11 »",
          "type": "cours",
          "duree_estimee": null,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 1,
            "klassci_id": 910000001,
            "name": "Moussa Traoré"
          },
          "matiere": {
            "id": 1,
            "name": "Mathématiques"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:10:00.000000Z",
          "created_at": "2026-10-01T08:10:00.000000Z"
        },
        {
          "id": 12,
          "title": "Algorithmique — séance 12",
          "description": "Description de « Algorithmique — séance 12 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:11:00.000000Z",
          "created_at": "2026-10-01T08:11:00.000000Z"
        },
        {
          "id": 13,
          "title": "Mathématiques — chapitre 13",
          "description": "Description de « Mathématiques — chapitre 13 »",
          "type": "cours",
          "duree_estimee": null,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 1,
            "klassci_id": 910000001,
            "name": "Moussa Traoré"
          },
          "matiere": {
            "id": 1,
            "name": "Mathématiques"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:12:00.000000Z",
          "created_at": "2026-10-01T08:12:00.000000Z"
        },
        {
          "id": 14,
          "title": "Mathématiques — chapitre 14",
          "description": "Description de « Mathématiques — chapitre 14 »",
          "type": "cours",
          "duree_estimee": 45,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 1,
            "klassci_id": 910000001,
            "name": "Moussa Traoré"
          },
          "matiere": {
            "id": 1,
            "name": "Mathématiques"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:13:00.000000Z",
          "created_at": "2026-10-01T08:13:00.000000Z"
        },
        {
          "id": 15,
          "title": "Algorithmique — séance 15",
          "description": "Description de « Algorithmique — séance 15 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:14:00.000000Z",
          "created_at": "2026-10-01T08:14:00.000000Z"
        }
      ],
      "filters": {
        "matieres": [
          {
            "id": 1,
            "name": "Mathématiques"
          },
          {
            "id": 2,
            "name": "Algorithmique"
          }
        ],
        "enseignants": [
          {
            "id": 1,
            "name": "Moussa Traoré"
          },
          {
            "id": 2,
            "name": "Fatou Diallo"
          }
        ]
      },
      "total": 18,
      "meta": {
        "current_page": 1,
        "last_page": 2,
        "per_page": 15,
        "total": 18
      }
    }
  },
  "klassci_page_2_defaut": {
    "request": "GET /api/lessons/my-courses?page=2",
    "status": 200,
    "body": {
      "success": true,
      "data": [
        {
          "id": 16,
          "title": "Mathématiques — chapitre 16",
          "description": "Description de « Mathématiques — chapitre 16 »",
          "type": "cours",
          "duree_estimee": 45,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 1,
            "klassci_id": 910000001,
            "name": "Moussa Traoré"
          },
          "matiere": {
            "id": 1,
            "name": "Mathématiques"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:15:00.000000Z",
          "created_at": "2026-10-01T08:15:00.000000Z"
        },
        {
          "id": 17,
          "title": "Mathématiques — chapitre 17",
          "description": "Description de « Mathématiques — chapitre 17 »",
          "type": "cours",
          "duree_estimee": null,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 1,
            "klassci_id": 910000001,
            "name": "Moussa Traoré"
          },
          "matiere": {
            "id": 1,
            "name": "Mathématiques"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:16:00.000000Z",
          "created_at": "2026-10-01T08:16:00.000000Z"
        },
        {
          "id": 18,
          "title": "Algorithmique — séance 18",
          "description": "Description de « Algorithmique — séance 18 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:17:00.000000Z",
          "created_at": "2026-10-01T08:17:00.000000Z"
        }
      ],
      "filters": {
        "matieres": [
          {
            "id": 1,
            "name": "Mathématiques"
          },
          {
            "id": 2,
            "name": "Algorithmique"
          }
        ],
        "enseignants": [
          {
            "id": 1,
            "name": "Moussa Traoré"
          },
          {
            "id": 2,
            "name": "Fatou Diallo"
          }
        ]
      },
      "total": 18,
      "meta": {
        "current_page": 2,
        "last_page": 2,
        "per_page": 15,
        "total": 18
      }
    }
  },
  "klassci_page_3_au_dela": {
    "request": "GET /api/lessons/my-courses?page=3",
    "status": 200,
    "body": {
      "success": true,
      "data": [],
      "filters": {
        "matieres": [
          {
            "id": 1,
            "name": "Mathématiques"
          },
          {
            "id": 2,
            "name": "Algorithmique"
          }
        ],
        "enseignants": [
          {
            "id": 1,
            "name": "Moussa Traoré"
          },
          {
            "id": 2,
            "name": "Fatou Diallo"
          }
        ]
      },
      "total": 18,
      "meta": {
        "current_page": 3,
        "last_page": 2,
        "per_page": 15,
        "total": 18
      }
    }
  },
  "klassci_filtre_matiere": {
    "request": "GET /api/lessons/my-courses?matiere_id=2",
    "status": 200,
    "body": {
      "success": true,
      "data": [
        {
          "id": 3,
          "title": "Algorithmique — séance 03",
          "description": "Description de « Algorithmique — séance 03 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:02:00.000000Z",
          "created_at": "2026-10-01T08:02:00.000000Z"
        },
        {
          "id": 6,
          "title": "Algorithmique — séance 06",
          "description": "Description de « Algorithmique — séance 06 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:05:00.000000Z",
          "created_at": "2026-10-01T08:05:00.000000Z"
        },
        {
          "id": 9,
          "title": "Algorithmique — séance 09",
          "description": "Description de « Algorithmique — séance 09 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:08:00.000000Z",
          "created_at": "2026-10-01T08:08:00.000000Z"
        },
        {
          "id": 12,
          "title": "Algorithmique — séance 12",
          "description": "Description de « Algorithmique — séance 12 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:11:00.000000Z",
          "created_at": "2026-10-01T08:11:00.000000Z"
        },
        {
          "id": 15,
          "title": "Algorithmique — séance 15",
          "description": "Description de « Algorithmique — séance 15 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:14:00.000000Z",
          "created_at": "2026-10-01T08:14:00.000000Z"
        },
        {
          "id": 18,
          "title": "Algorithmique — séance 18",
          "description": "Description de « Algorithmique — séance 18 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:17:00.000000Z",
          "created_at": "2026-10-01T08:17:00.000000Z"
        }
      ],
      "filters": {
        "matieres": [
          {
            "id": 2,
            "name": "Algorithmique"
          }
        ],
        "enseignants": [
          {
            "id": 2,
            "name": "Fatou Diallo"
          }
        ]
      },
      "total": 6,
      "meta": {
        "current_page": 1,
        "last_page": 1,
        "per_page": 15,
        "total": 6
      }
    }
  },
  "klassci_filtre_enseignant": {
    "request": "GET /api/lessons/my-courses?enseignant_id=2",
    "status": 200,
    "body": {
      "success": true,
      "data": [
        {
          "id": 3,
          "title": "Algorithmique — séance 03",
          "description": "Description de « Algorithmique — séance 03 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:02:00.000000Z",
          "created_at": "2026-10-01T08:02:00.000000Z"
        },
        {
          "id": 6,
          "title": "Algorithmique — séance 06",
          "description": "Description de « Algorithmique — séance 06 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:05:00.000000Z",
          "created_at": "2026-10-01T08:05:00.000000Z"
        },
        {
          "id": 9,
          "title": "Algorithmique — séance 09",
          "description": "Description de « Algorithmique — séance 09 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:08:00.000000Z",
          "created_at": "2026-10-01T08:08:00.000000Z"
        },
        {
          "id": 12,
          "title": "Algorithmique — séance 12",
          "description": "Description de « Algorithmique — séance 12 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:11:00.000000Z",
          "created_at": "2026-10-01T08:11:00.000000Z"
        },
        {
          "id": 15,
          "title": "Algorithmique — séance 15",
          "description": "Description de « Algorithmique — séance 15 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:14:00.000000Z",
          "created_at": "2026-10-01T08:14:00.000000Z"
        },
        {
          "id": 18,
          "title": "Algorithmique — séance 18",
          "description": "Description de « Algorithmique — séance 18 »",
          "type": "cours",
          "duree_estimee": 60,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 2,
            "klassci_id": 910000002,
            "name": "Fatou Diallo"
          },
          "matiere": {
            "id": 2,
            "name": "Algorithmique"
          },
          "classe": {
            "id": 1,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-09-30T08:17:00.000000Z",
          "created_at": "2026-10-01T08:17:00.000000Z"
        }
      ],
      "filters": {
        "matieres": [
          {
            "id": 2,
            "name": "Algorithmique"
          }
        ],
        "enseignants": [
          {
            "id": 2,
            "name": "Fatou Diallo"
          }
        ]
      },
      "total": 6,
      "meta": {
        "current_page": 1,
        "last_page": 1,
        "per_page": 15,
        "total": 6
      }
    }
  },
  "standalone_page_1": {
    "request": "GET /api/lessons/my-courses",
    "status": 200,
    "body": {
      "success": true,
      "data": [
        {
          "id": 20,
          "title": "Variables et types",
          "description": "Description de « Variables et types »",
          "type": "cours",
          "duree_estimee": 30,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 23,
            "klassci_id": null,
            "name": "Ibrahim Sawadogo"
          },
          "matiere": {
            "id": 3,
            "name": "Python"
          },
          "classe": {
            "id": 3,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-10-04T08:00:00.000000Z",
          "created_at": "2026-10-05T08:00:00.000000Z"
        },
        {
          "id": 21,
          "title": "Boucles",
          "description": "Description de « Boucles »",
          "type": "cours",
          "duree_estimee": 40,
          "niveau_difficulte": "debutant",
          "enseignant": {
            "id": 23,
            "klassci_id": null,
            "name": "Ibrahim Sawadogo"
          },
          "matiere": {
            "id": 3,
            "name": "Python"
          },
          "classe": {
            "id": 3,
            "name": "Classe"
          },
          "progress": null,
          "published_at": "2026-10-04T08:01:00.000000Z",
          "created_at": "2026-10-05T08:01:00.000000Z"
        }
      ],
      "filters": {
        "matieres": [
          {
            "id": 3,
            "name": "Python"
          }
        ],
        "enseignants": [
          {
            "id": 23,
            "name": "Ibrahim Sawadogo"
          }
        ]
      },
      "total": 2,
      "meta": {
        "current_page": 1,
        "last_page": 1,
        "per_page": 15,
        "total": 2
      }
    }
  },
  "etudiant_sans_classe_vide": {
    "request": "GET /api/lessons/my-courses",
    "status": 200,
    "body": {
      "success": true,
      "data": [],
      "filters": {
        "matieres": [],
        "enseignants": []
      },
      "total": 0,
      "meta": {
        "current_page": 1,
        "last_page": 1,
        "per_page": 15,
        "total": 0
      }
    }
  },
  "per_page_hors_bornes_422": {
    "request": "GET /api/lessons/my-courses?per_page=1000",
    "status": 422,
    "body": {
      "success": false,
      "message": "Validation failed",
      "errors": {
        "per_page": [
          "The per page field must not be greater than 100."
        ]
      }
    }
  },
  "page_zero_422": {
    "request": "GET /api/lessons/my-courses?page=0",
    "status": 422,
    "body": {
      "success": false,
      "message": "Validation failed",
      "errors": {
        "page": [
          "The page field must be at least 1."
        ]
      }
    }
  },
  "sans_jeton_401": {
    "request": "GET /api/lessons/my-courses (sans Authorization)",
    "status": 401,
    "body": {
      "success": false,
      "message": "Unauthenticated."
    }
  }
})
