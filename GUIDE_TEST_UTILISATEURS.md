# Guide de Test Utilisateurs - LMS KLASSCI

> **Version**: 1.0
> **Date**: Janvier 2025
> **Objectif**: Valider les fonctionnalités de l'application avant déploiement

---

## Instructions Générales

### Comment tester
1. Ouvrir l'application sur **Desktop** (navigateur) ET **Mobile** (téléphone ou mode responsive)
2. Suivre chaque scénario étape par étape
3. Noter les problèmes rencontrés dans la section "Feedback"
4. Capturer des screenshots si un bug est trouvé

### URL de test
- **Production**: https://presentation.klassci.com
- **Local**: http://localhost:5173

---

# 📚 PARTIE 1 : ÉTUDIANT

## Informations de connexion test
```
Email: [email étudiant test]
Mot de passe: [mot de passe test]
```

---

## Scénario E1 : Connexion et découverte du Dashboard

### 🎯 Objectif
Se connecter à l'application et découvrir l'interface étudiant

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Ouvrir l'application dans le navigateur | Page de connexion affichée |
| 2 | Entrer l'email étudiant | Champ rempli |
| 3 | Entrer le mot de passe | Champ rempli (masqué) |
| 4 | Cliquer sur "Se connecter" | Redirection vers le Dashboard étudiant |
| 5 | Observer le Dashboard | Voir: statistiques, cours récents, prochaines séances |

### ✅ Critères de validation
- [ ] La connexion fonctionne sans erreur
- [ ] Le Dashboard s'affiche correctement
- [ ] Les statistiques sont visibles
- [ ] Le menu de navigation est complet

### 📱 Test Mobile
- [ ] La barre de navigation du bas affiche 5 icônes (Accueil, Cours, Évaluations, Emploi, Paramètres)
- [ ] Les icônes sont cliquables et fonctionnelles

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario E2 : Consulter mes cours

### 🎯 Objectif
Accéder à la liste des cours et consulter le contenu d'un cours

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Mes Cours" dans le menu | Page liste des cours affichée |
| 2 | Observer la liste | Voir les cours avec: nom, matière, enseignant, progression |
| 3 | Cliquer sur un cours | Page détail du cours affichée |
| 4 | Observer les chapitres | Liste des chapitres avec état (verrouillé/déverrouillé) |
| 5 | Cliquer sur un chapitre déverrouillé | Contenu du chapitre affiché |
| 6 | Lire le contenu (texte, vidéo, documents) | Contenu lisible et média fonctionnel |
| 7 | Cliquer sur "Testez vos connaissances" (si disponible) | Quiz de connaissance affiché |
| 8 | Répondre aux questions du quiz | Questions navigables |
| 9 | Soumettre le quiz | Résultat affiché avec score |

### ✅ Critères de validation
- [ ] Liste des cours visible
- [ ] Navigation dans les chapitres fonctionnelle
- [ ] Contenu (texte/vidéo/PDF) s'affiche correctement
- [ ] Quiz "Testez vos connaissances" fonctionne
- [ ] Progression mise à jour après complétion

### 📱 Test Mobile
- [ ] Les cartes de cours s'affichent correctement
- [ ] Le contenu est lisible sur petit écran
- [ ] Les vidéos sont responsives

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario E3 : Consulter mon emploi du temps

### 🎯 Objectif
Voir le calendrier des séances programmées

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Emploi du Temps" dans le menu | Calendrier affiché |
| 2 | Observer la vue actuelle | Séances du jour/semaine visibles |
| 3 | Naviguer vers une autre semaine | Calendrier mis à jour |
| 4 | Cliquer sur une séance | Détails de la séance affichés |
| 5 | Observer les informations | Voir: matière, enseignant, horaire, salle/lien visio |

### ✅ Critères de validation
- [ ] Calendrier affiché correctement
- [ ] Navigation entre semaines fonctionnelle
- [ ] Détails des séances accessibles
- [ ] Distinction visuelle entre types de séances (présentiel/visio)

### 📱 Test Mobile
- [ ] Calendrier adapté au format mobile
- [ ] Séances lisibles
- [ ] Navigation tactile fonctionnelle

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario E4 : Participer à une séance visio

### 🎯 Objectif
Rejoindre une visioconférence programmée

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Aller dans "Emploi du Temps" | Calendrier affiché |
| 2 | Trouver une séance visio (icône caméra) | Séance identifiable |
| 3 | Cliquer sur la séance | Détails affichés avec bouton "Rejoindre" |
| 4 | Vérifier le statut | Statut: "En cours" ou "À venir" |
| 5 | Cliquer sur "Rejoindre la visio" (si en cours) | Redirection vers la salle de visio |
| 6 | Observer l'interface visio | Voir: vidéo, chat, liste participants |
| 7 | Activer/désactiver le micro | Micro toggle fonctionnel |
| 8 | Activer/désactiver la caméra | Caméra toggle fonctionnel |
| 9 | Envoyer un message dans le chat | Message affiché |
| 10 | Quitter la visio | Retour à l'application |

### ✅ Critères de validation
- [ ] Bouton "Rejoindre" visible pour séances en cours
- [ ] Redirection vers visio fonctionnelle
- [ ] Contrôles audio/vidéo fonctionnels
- [ ] Chat fonctionnel
- [ ] Sortie de visio propre

### 📱 Test Mobile
- [ ] Interface visio adaptée mobile
- [ ] Contrôles accessibles
- [ ] Qualité vidéo acceptable

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario E5 : Passer une évaluation

### 🎯 Objectif
Accéder à une évaluation et la compléter

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Évaluations" dans le menu | Liste des évaluations affichée |
| 2 | Observer les filtres | Filtres: Toutes, En cours, Terminées |
| 3 | Identifier une évaluation disponible | Badge "Disponible" ou "En cours" |
| 4 | Cliquer sur l'évaluation | Page de détails affichée |
| 5 | Lire les instructions | Durée, nombre de questions, consignes visibles |
| 6 | Cliquer sur "Commencer l'évaluation" | Interface de quiz lancée |
| 7 | Répondre à la première question | Réponse sélectionnable |
| 8 | Naviguer vers la question suivante | Navigation fonctionnelle |
| 9 | Observer le timer (si présent) | Temps restant affiché |
| 10 | Compléter toutes les questions | Progression visible |
| 11 | Cliquer sur "Soumettre" | Confirmation demandée |
| 12 | Confirmer la soumission | Évaluation soumise, résultat affiché |

### ✅ Critères de validation
- [ ] Liste des évaluations visible avec statuts
- [ ] Instructions claires avant de commencer
- [ ] Questions affichées correctement (QCM, texte, etc.)
- [ ] Navigation entre questions fonctionnelle
- [ ] Timer fonctionnel (si applicable)
- [ ] Soumission confirmée
- [ ] Résultat/score affiché après soumission

### 📱 Test Mobile
- [ ] Questions lisibles sur mobile
- [ ] Boutons de réponse assez grands pour le tactile
- [ ] Navigation fluide

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario E6 : Consulter mes notes

### 🎯 Objectif
Voir les résultats de mes évaluations passées

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Mes Notes" dans le menu | Page des notes affichée |
| 2 | Observer la vue d'ensemble | Moyenne générale, statistiques |
| 3 | Voir la liste des évaluations notées | Notes par matière/évaluation |
| 4 | Cliquer sur une évaluation | Détails: score, corrections, commentaires |
| 5 | Observer les réponses | Réponses correctes/incorrectes identifiées |

### ✅ Critères de validation
- [ ] Moyenne générale calculée
- [ ] Liste des notes par évaluation
- [ ] Détails accessibles
- [ ] Corrections visibles (si activé par l'enseignant)

### 📱 Test Mobile
- [ ] Tableau de notes lisible
- [ ] Statistiques visibles

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario E7 : Utiliser le Forum

### 🎯 Objectif
Participer aux discussions du forum

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Forum" dans le menu | Liste des discussions affichée |
| 2 | Observer les catégories/sujets | Sujets listés avec auteur, date, réponses |
| 3 | Cliquer sur un sujet | Discussion complète affichée |
| 4 | Lire les messages | Messages avec auteur et date |
| 5 | Rédiger une réponse | Zone de texte disponible |
| 6 | Cliquer sur "Publier" | Réponse ajoutée à la discussion |
| 7 | Créer un nouveau sujet (si autorisé) | Formulaire de création |
| 8 | Remplir titre et contenu | Champs éditables |
| 9 | Publier le sujet | Nouveau sujet créé |

### ✅ Critères de validation
- [ ] Liste des discussions visible
- [ ] Lecture des messages fonctionnelle
- [ ] Réponse publiée correctement
- [ ] Nouveau sujet créé (si autorisé)

### 📱 Test Mobile
- [ ] Forum navigable sur mobile
- [ ] Zone de texte fonctionnelle

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario E8 : Modifier mon profil

### 🎯 Objectif
Accéder et modifier les paramètres du compte

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Paramètres" dans le menu | Page paramètres affichée |
| 2 | Observer les informations du profil | Nom, email, photo affichés |
| 3 | Modifier une information (si autorisé) | Champ éditable |
| 4 | Changer le thème (clair/sombre) | Thème appliqué immédiatement |
| 5 | Sauvegarder les modifications | Confirmation affichée |
| 6 | Se déconnecter | Bouton "Déconnexion" |
| 7 | Cliquer sur "Déconnexion" | Retour à la page de connexion |

### ✅ Critères de validation
- [ ] Informations du profil visibles
- [ ] Thème changeable
- [ ] Déconnexion fonctionnelle

### 📱 Test Mobile
- [ ] Paramètres accessibles via menu hamburger
- [ ] Déconnexion fonctionnelle

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

# 👨‍🏫 PARTIE 2 : ENSEIGNANT

## Informations de connexion test
```
Email: [email enseignant test]
Mot de passe: [mot de passe test]
```

---

## Scénario P1 : Connexion et découverte du Dashboard

### 🎯 Objectif
Se connecter et découvrir l'interface enseignant

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Ouvrir l'application | Page de connexion |
| 2 | Entrer les identifiants enseignant | Champs remplis |
| 3 | Cliquer sur "Se connecter" | Redirection vers Dashboard enseignant |
| 4 | Observer le Dashboard | Stats: classes, séances, évaluations |
| 5 | Observer le menu latéral | Items: Dashboard, Emploi, Mon Espace, Évaluations, Forum, Historique, Paramètres |

### ✅ Critères de validation
- [ ] Connexion réussie
- [ ] Dashboard enseignant affiché
- [ ] Statistiques visibles
- [ ] Menu complet

### 📱 Test Mobile
- [ ] Barre du bas: Accueil, Espace, Évaluations, Emploi, Profil
- [ ] Menu hamburger: Séances Visio, Forum, Historique, Paramètres

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario P2 : Accéder à Mon Espace (Hub)

### 🎯 Objectif
Utiliser le hub central pour accéder aux classes, matières et leçons

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Mon Espace" dans le menu | Page Hub affichée |
| 2 | Observer les 3 cartes | Cartes: Mes Classes, Mes Matières, Mes Leçons |
| 3 | Voir les statistiques sur chaque carte | Nombre de classes, matières, leçons |
| 4 | Cliquer sur "Mes Classes" | Redirection vers liste des classes |
| 5 | Retourner au Hub | Navigation fonctionnelle |
| 6 | Cliquer sur "Mes Matières" | Redirection vers liste des matières |
| 7 | Retourner au Hub | Navigation fonctionnelle |
| 8 | Cliquer sur "Mes Leçons" | Redirection vers liste des leçons |

### ✅ Critères de validation
- [ ] Hub affiché avec 3 cartes
- [ ] Statistiques correctes
- [ ] Navigation vers chaque section fonctionnelle

### 📱 Test Mobile
- [ ] Cartes empilées verticalement
- [ ] Touch sur les cartes fonctionnel

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario P3 : Consulter mes classes et étudiants

### 🎯 Objectif
Voir la liste des classes et les étudiants de chaque classe

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Depuis Mon Espace, cliquer sur "Mes Classes" | Liste des classes affichée |
| 2 | Observer les informations | Nom classe, niveau, nombre d'étudiants |
| 3 | Cliquer sur une classe | Page détail classe |
| 4 | Voir la liste des étudiants | Étudiants avec nom, email |
| 5 | Observer les matières enseignées dans cette classe | Liste des matières |

### ✅ Critères de validation
- [ ] Liste des classes visible
- [ ] Détails de classe accessibles
- [ ] Liste des étudiants affichée
- [ ] Matières associées visibles

### 📱 Test Mobile
- [ ] Liste scrollable
- [ ] Détails accessibles

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario P4 : Consulter mes matières et créer une leçon

### 🎯 Objectif
Accéder à une matière et créer/modifier une leçon

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Depuis Mon Espace, cliquer sur "Mes Matières" | Liste des matières affichée |
| 2 | Cliquer sur une matière | Page détail matière |
| 3 | Voir les chapitres/leçons | Liste des leçons existantes |
| 4 | Cliquer sur "Ajouter une leçon" | Formulaire de création |
| 5 | Remplir le titre de la leçon | Champ éditable |
| 6 | Ajouter du contenu (texte) | Éditeur de texte fonctionnel |
| 7 | Ajouter une vidéo (si disponible) | Upload ou lien YouTube |
| 8 | Ajouter un document PDF (si disponible) | Upload fonctionnel |
| 9 | Ajouter un quiz "Testez vos connaissances" | Création de questions |
| 10 | Sauvegarder la leçon | Confirmation, leçon créée |
| 11 | Vérifier dans la liste | Nouvelle leçon visible |

### ✅ Critères de validation
- [ ] Liste des matières visible
- [ ] Création de leçon fonctionnelle
- [ ] Éditeur de contenu fonctionnel
- [ ] Upload de médias fonctionnel
- [ ] Quiz intégrable
- [ ] Sauvegarde confirmée

### 📱 Test Mobile
- [ ] Formulaire utilisable sur mobile
- [ ] Upload depuis mobile

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario P5 : Créer une évaluation

### 🎯 Objectif
Créer une nouvelle évaluation avec des questions

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Évaluations" dans le menu | Liste des évaluations |
| 2 | Cliquer sur "Créer une évaluation" | Formulaire de création |
| 3 | Remplir le titre | Champ éditable |
| 4 | Sélectionner la classe cible | Dropdown avec classes |
| 5 | Sélectionner la matière | Dropdown avec matières |
| 6 | Définir la durée (minutes) | Champ numérique |
| 7 | Définir les dates de disponibilité | Date début et fin |
| 8 | Sauvegarder les paramètres | Redirection vers ajout de questions |
| 9 | Cliquer sur "Ajouter une question" | Modal/formulaire de question |
| 10 | Sélectionner le type (QCM, Vrai/Faux, Texte) | Options disponibles |
| 11 | Rédiger la question | Champ texte |
| 12 | Ajouter les réponses possibles (QCM) | Champs pour options |
| 13 | Marquer la bonne réponse | Checkbox/radio |
| 14 | Définir les points | Champ numérique |
| 15 | Sauvegarder la question | Question ajoutée |
| 16 | Répéter pour d'autres questions | Questions multiples |
| 17 | Prévisualiser l'évaluation | Vue étudiant |
| 18 | Publier l'évaluation | Statut changé en "Publiée" |

### ✅ Critères de validation
- [ ] Formulaire de création complet
- [ ] Questions ajoutables
- [ ] Différents types de questions
- [ ] Prévisualisation fonctionnelle
- [ ] Publication réussie

### 📱 Test Mobile
- [ ] Création possible sur mobile (peut être difficile)
- [ ] Formulaires fonctionnels

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario P6 : Voir mon emploi du temps

### 🎯 Objectif
Consulter le calendrier des séances à enseigner

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Emploi du Temps" dans le menu | Calendrier affiché |
| 2 | Observer les séances | Séances avec matière, classe, horaire |
| 3 | Identifier les séances visio | Icône caméra distincte |
| 4 | Cliquer sur une séance | Détails affichés |
| 5 | Voir les informations | Classe, matière, heure, type (présentiel/visio) |

### ✅ Critères de validation
- [ ] Calendrier affiché
- [ ] Séances visibles avec détails
- [ ] Distinction visio/présentiel

### 📱 Test Mobile
- [ ] Calendrier adapté mobile
- [ ] Navigation tactile

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario P7 : Lancer et gérer une séance visio

### 🎯 Objectif
Démarrer une visioconférence et gérer les participants

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Aller dans "Emploi du Temps" ou "Mes Séances Visio" | Séances listées |
| 2 | Trouver une séance visio programmée | Séance identifiée |
| 3 | Cliquer sur la séance | Détails affichés |
| 4 | Cliquer sur "Démarrer la visio" | Salle de visio ouverte |
| 5 | Observer l'interface enseignant | Contrôles: micro, caméra, partage écran |
| 6 | Activer/désactiver le micro | Toggle fonctionnel |
| 7 | Activer/désactiver la caméra | Toggle fonctionnel |
| 8 | Partager son écran (si disponible) | Partage lancé |
| 9 | Observer la liste des participants | Étudiants connectés visibles |
| 10 | Utiliser le chat | Messages envoyés/reçus |
| 11 | Terminer la séance | Bouton "Terminer" |
| 12 | Confirmer la fin | Visio fermée |

### ✅ Critères de validation
- [ ] Démarrage de visio fonctionnel
- [ ] Contrôles audio/vidéo fonctionnels
- [ ] Liste des participants visible
- [ ] Chat fonctionnel
- [ ] Partage d'écran (si disponible)
- [ ] Fin de séance propre

### 📱 Test Mobile
- [ ] Lancement possible sur mobile
- [ ] Contrôles accessibles

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario P8 : Consulter l'historique et les présences

### 🎯 Objectif
Voir l'historique des séances passées et les présences

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Historique" dans le menu | Liste des séances passées |
| 2 | Observer les séances | Date, matière, classe, durée |
| 3 | Cliquer sur une séance | Détails de la séance |
| 4 | Voir les présences | Liste des étudiants présents/absents |
| 5 | Exporter (si disponible) | Téléchargement du rapport |

### ✅ Critères de validation
- [ ] Historique visible
- [ ] Détails des séances accessibles
- [ ] Présences affichées

### 📱 Test Mobile
- [ ] Historique consultable
- [ ] Navigation fonctionnelle

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario P9 : Corriger des évaluations

### 🎯 Objectif
Consulter et corriger les soumissions des étudiants

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Aller dans "Évaluations" | Liste des évaluations |
| 2 | Cliquer sur une évaluation avec soumissions | Détails de l'évaluation |
| 3 | Voir les soumissions | Liste des étudiants ayant soumis |
| 4 | Cliquer sur une soumission | Copie de l'étudiant affichée |
| 5 | Voir les réponses | Réponses avec correction auto (QCM) |
| 6 | Corriger les questions ouvertes (si présentes) | Attribution de points |
| 7 | Ajouter un commentaire | Zone de texte |
| 8 | Sauvegarder la correction | Note finale calculée |
| 9 | Publier les résultats | Résultats visibles pour les étudiants |

### ✅ Critères de validation
- [ ] Soumissions visibles
- [ ] Correction auto des QCM
- [ ] Correction manuelle possible
- [ ] Commentaires ajoutables
- [ ] Publication des résultats

### 📱 Test Mobile
- [ ] Correction difficile sur mobile mais consultable

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

# 🎯 PARTIE 3 : COORDINATEUR

## Informations de connexion test
```
Email: [email coordinateur test]
Mot de passe: [mot de passe test]
```

---

## Scénario C1 : Connexion et découverte du Dashboard

### 🎯 Objectif
Se connecter et découvrir l'interface coordinateur

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Ouvrir l'application | Page de connexion |
| 2 | Entrer les identifiants coordinateur | Champs remplis |
| 3 | Cliquer sur "Se connecter" | Redirection vers Dashboard admin |
| 4 | Observer le Dashboard | Stats globales: étudiants, enseignants, classes |
| 5 | Observer le menu latéral | Items: Dashboard, Évaluations, Espace Admin, Résultats, Séances & Visio, Forum, Historique, Paramètres |

### ✅ Critères de validation
- [ ] Connexion réussie
- [ ] Dashboard admin affiché
- [ ] Statistiques globales visibles
- [ ] Menu complet (8 items)

### 📱 Test Mobile
- [ ] Barre du bas: Accueil, Admin, Évaluations, Séances, Résultats
- [ ] Menu hamburger: Forum, Historique, Paramètres

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario C2 : Accéder à l'Espace Admin (Hub)

### 🎯 Objectif
Utiliser le hub central pour gérer classes, matières et enseignants

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Espace Admin" dans le menu | Page Hub affichée |
| 2 | Observer les 3 cartes | Cartes: Classes, Matières, Enseignants |
| 3 | Voir les statistiques | Nombres affichés sur chaque carte |
| 4 | Cliquer sur "Classes" | Redirection vers gestion des classes |
| 5 | Retourner au Hub | Navigation fonctionnelle |
| 6 | Cliquer sur "Matières" | Redirection vers gestion des matières |
| 7 | Retourner au Hub | Navigation fonctionnelle |
| 8 | Cliquer sur "Enseignants" | Redirection vers liste des enseignants |

### ✅ Critères de validation
- [ ] Hub affiché avec 3 cartes
- [ ] Statistiques correctes
- [ ] Navigation fonctionnelle

### 📱 Test Mobile
- [ ] Cartes empilées verticalement
- [ ] Touch fonctionnel

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario C3 : Gérer les classes

### 🎯 Objectif
Consulter, créer et modifier des classes

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Depuis Espace Admin, cliquer sur "Classes" | Liste des classes |
| 2 | Observer la liste | Nom, niveau, filière, effectif |
| 3 | Utiliser les filtres (si disponibles) | Filtrage fonctionnel |
| 4 | Cliquer sur une classe | Détails de la classe |
| 5 | Voir les étudiants | Liste des étudiants |
| 6 | Voir les matières assignées | Liste des matières |
| 7 | Voir les enseignants assignés | Liste des enseignants |

### ✅ Critères de validation
- [ ] Liste des classes visible
- [ ] Détails accessibles
- [ ] Étudiants, matières, enseignants visibles

### 📱 Test Mobile
- [ ] Liste scrollable
- [ ] Détails accessibles

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario C4 : Gérer les matières

### 🎯 Objectif
Consulter et gérer les matières

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Depuis Espace Admin, cliquer sur "Matières" | Liste des matières |
| 2 | Observer la liste | Nom, code, coefficient |
| 3 | Utiliser la recherche | Filtrage par nom |
| 4 | Cliquer sur une matière | Détails de la matière |
| 5 | Voir les classes qui ont cette matière | Liste des classes |
| 6 | Voir les enseignants assignés | Liste des enseignants |

### ✅ Critères de validation
- [ ] Liste des matières visible
- [ ] Recherche fonctionnelle
- [ ] Détails accessibles

### 📱 Test Mobile
- [ ] Liste consultable
- [ ] Recherche fonctionnelle

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario C5 : Consulter les enseignants

### 🎯 Objectif
Voir la liste des enseignants et leurs affectations

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Depuis Espace Admin, cliquer sur "Enseignants" | Liste des enseignants |
| 2 | Observer la liste | Nom, email, matières enseignées |
| 3 | Utiliser la recherche | Filtrage par nom |
| 4 | Cliquer sur un enseignant | Détails/profil |
| 5 | Voir ses matières | Liste des matières |
| 6 | Voir ses classes | Liste des classes |

### ✅ Critères de validation
- [ ] Liste des enseignants visible
- [ ] Recherche fonctionnelle
- [ ] Détails accessibles

### 📱 Test Mobile
- [ ] Liste consultable
- [ ] Détails accessibles

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario C6 : Superviser les évaluations

### 🎯 Objectif
Voir toutes les évaluations créées par les enseignants

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Évaluations" dans le menu | Liste globale des évaluations |
| 2 | Observer les filtres | Filtres: classe, matière, enseignant, statut |
| 3 | Utiliser un filtre | Liste filtrée |
| 4 | Observer les informations | Titre, enseignant, classe, statut |
| 5 | Cliquer sur une évaluation | Détails affichés |
| 6 | Voir les statistiques | Nombre de soumissions, moyenne |

### ✅ Critères de validation
- [ ] Liste globale visible
- [ ] Filtres fonctionnels
- [ ] Détails accessibles

### 📱 Test Mobile
- [ ] Liste consultable
- [ ] Filtres utilisables

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario C7 : Consulter les résultats des évaluations

### 🎯 Objectif
Analyser les résultats globaux des évaluations

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Résultats" dans le menu | Page des résultats |
| 2 | Observer les statistiques globales | Total évaluations, en cours, terminées |
| 3 | Utiliser les filtres | Classe, matière, enseignant |
| 4 | Observer les résultats filtrés | Liste avec moyennes |
| 5 | Cliquer sur une évaluation | Détails des résultats |
| 6 | Voir les résultats par étudiant | Notes individuelles |

### ✅ Critères de validation
- [ ] Statistiques globales visibles
- [ ] Filtres fonctionnels
- [ ] Résultats détaillés accessibles

### 📱 Test Mobile
- [ ] Page consultable
- [ ] Filtres fonctionnels

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario C8 : Gérer les séances et visioconférences

### 🎯 Objectif
Programmer et superviser les séances

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Séances & Visio" dans le menu | Interface de gestion |
| 2 | Observer le calendrier/liste | Séances programmées visibles |
| 3 | Voir les séances en cours | Indicateur "En cours" |
| 4 | Voir les séances à venir | Liste chronologique |
| 5 | Cliquer sur une séance | Détails: classe, matière, enseignant, heure |
| 6 | Voir le statut de la visio | En attente, En cours, Terminée |
| 7 | Programmer une nouvelle séance (si disponible) | Formulaire de création |

### ✅ Critères de validation
- [ ] Calendrier/liste visible
- [ ] Statuts des séances clairs
- [ ] Détails accessibles
- [ ] Programmation fonctionnelle (si disponible)

### 📱 Test Mobile
- [ ] Interface adaptée
- [ ] Navigation fonctionnelle

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

## Scénario C9 : Consulter l'historique global

### 🎯 Objectif
Voir l'historique de toutes les séances passées

### 📝 Étapes détaillées

| Étape | Action | Résultat attendu |
|-------|--------|------------------|
| 1 | Cliquer sur "Historique" dans le menu | Liste des séances passées |
| 2 | Utiliser les filtres | Classe, matière, enseignant, période |
| 3 | Observer les données | Date, durée, enseignant, classe, présences |
| 4 | Cliquer sur une séance | Détails et présences |
| 5 | Voir le taux de présence | Statistiques affichées |

### ✅ Critères de validation
- [ ] Historique complet visible
- [ ] Filtres fonctionnels
- [ ] Présences accessibles
- [ ] Statistiques affichées

### 📱 Test Mobile
- [ ] Historique consultable
- [ ] Filtres utilisables

### ❌ Problèmes rencontrés
```
[Noter ici les problèmes]
```

---

# 📝 FORMULAIRE DE FEEDBACK GLOBAL

## Informations testeur
- **Nom**: ________________
- **Rôle testé**: [ ] Étudiant [ ] Enseignant [ ] Coordinateur
- **Appareil**: [ ] Desktop [ ] Mobile [ ] Les deux
- **Navigateur**: ________________
- **Date du test**: ________________

## Évaluation générale

### Navigation
| Critère | 1 (Mauvais) | 2 | 3 | 4 | 5 (Excellent) |
|---------|-------------|---|---|---|---------------|
| Facilité de navigation | | | | | |
| Clarté des menus | | | | | |
| Cohérence de l'interface | | | | | |

### Performance
| Critère | 1 (Mauvais) | 2 | 3 | 4 | 5 (Excellent) |
|---------|-------------|---|---|---|---------------|
| Vitesse de chargement | | | | | |
| Réactivité des boutons | | | | | |
| Stabilité (pas de bugs) | | | | | |

### Mobile (si testé)
| Critère | 1 (Mauvais) | 2 | 3 | 4 | 5 (Excellent) |
|---------|-------------|---|---|---|---------------|
| Affichage responsive | | | | | |
| Navigation tactile | | | | | |
| Lisibilité | | | | | |

## Bugs critiques rencontrés
```
1.
2.
3.
```

## Suggestions d'amélioration
```
1.
2.
3.
```

## Commentaires libres
```


```

---

**Merci pour votre participation aux tests !**
