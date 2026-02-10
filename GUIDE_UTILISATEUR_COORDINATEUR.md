# Guide Utilisateur - Coordinateur KLASSCI LMS

## Table des Matieres

1. [Introduction](#1-introduction)
2. [Connexion](#2-connexion)
3. [Dashboard Coordinateur](#3-dashboard-coordinateur)
4. [Espace Administration](#4-espace-administration)
5. [Gestion des Evaluations](#5-gestion-des-evaluations)
6. [Gestion des Seances et Visioconferences](#6-gestion-des-seances-et-visioconferences)
7. [Historique des Presences](#7-historique-des-presences)
8. [Forum](#8-forum)
9. [Parametres](#9-parametres)

---

## 1. Introduction

En tant que **Coordinateur**, vous avez acces a des fonctionnalites de supervision et de gestion avancees sur la plateforme KLASSCI LMS. Votre role consiste a :

- **Superviser** les evaluations de tous les enseignants
- **Gerer** les visioconferences pour les seances KLASSCI
- **Consulter** l'historique des presences et exporter les rapports
- **Suivre** les statistiques globales de l'etablissement

---

## 2. Connexion

### Acces a la plateforme

1. Ouvrez votre navigateur et accedez a l'URL de la plateforme
2. Saisissez vos identifiants (email et mot de passe)
3. Cliquez sur **"Se connecter"**

Une fois connecte, vous etes automatiquement redirige vers votre **Dashboard Coordinateur**.

---

## 3. Dashboard Coordinateur

### Acces
Menu lateral : **Dashboard**

### Description
Le Dashboard Coordinateur affiche une vue d'ensemble de l'etablissement avec des statistiques en temps reel.

### Cartes de statistiques principales

4 cartes de statistiques sont affichees en haut :

| Carte | Description |
|-------|-------------|
| **Enseignants** | Nombre total d'enseignants |
| **Etudiants** | Nombre total d'etudiants |
| **Classes actives** | Nombre de classes actives |
| **Matieres** | Nombre de matieres enseignees |

### Graphique d'activite

- **Titre** : "Activite des 30 derniers jours"
- Affiche l'evolution de l'activite sur la plateforme

### Widget Taches en Attente

Cette section affiche les taches qui necessitent votre attention :

| Tache | Description |
|-------|-------------|
| **Evaluations non notees** | Evaluations en attente de correction (affiche en rouge si urgentes >3j) |
| **Utilisateurs inactifs** | Utilisateurs sans activite depuis 30 jours |
| **Evaluations non publiees** | Evaluations encore en brouillon |
| **Lecons en brouillon** | Cours non publies |

### Activite Systeme

Deux indicateurs :
- **Seances Actives** : Nombre de seances visio en cours
- **Evaluations Totales** : Nombre total d'evaluations

### Vue d'Ensemble

- **Filieres** : Nombre de filieres
- **Niveaux** : Nombre de niveaux d'etudes

### Actions Rapides

Boutons d'acces rapide :

| Bouton | Action |
|--------|--------|
| **Gerer Seances & Visio** | Acces a la gestion des visioconferences |
| **Voir Classes** | Acces a la liste des classes |
| **Voir Matieres** | Acces a la liste des matieres |
| **Voir Statistiques** | Acces aux statistiques detaillees |
| **Generer Rapport** | Ouvre la fenetre de generation de rapport PDF |

### Carte Gestion Seances & Visio

Une carte mise en evidence (bordure orange) permet d'acceder directement a la gestion des visioconferences pour les seances KLASSCI.

### Liste des Classes KLASSCI

Affiche les classes synchronisees depuis KLASSCI avec :
- Nom de la classe
- Niveau
- Filiere et code
- Capacite (places occupees / places totales)
- Badge "Active" si la classe est active

### Widget Utilisateurs Recents

Liste des derniers utilisateurs inscrits avec :
- Avatar (initiales)
- Nom et email
- Badge de role (couleur selon le role)
- Date d'inscription

Lien **"Voir tout"** pour acceder a la liste complete.

### Calendrier des Evenements

Calendrier interactif affichant les seances programmees avec un code couleur :
- **Gris** : Seance sans visio
- **Bleu** : Visio programmee
- **Violet** : Visio activee (pas encore demarree)
- **Vert** : Visio en cours

### Liste des Matieres KLASSCI

Affiche les matieres synchronisees depuis KLASSCI avec :
- Icone livre
- Nom de la matiere
- Code de la matiere

### Annee Universitaire

Bandeau d'information affichant l'annee universitaire courante.

---

## 4. Espace Administration

### Acces
Menu lateral : **Espace Admin**

### Description
Page centrale d'administration permettant d'acceder rapidement aux differentes sections de gestion.

### Cartes de navigation

3 cartes principales :

| Carte | Description | Lien |
|-------|-------------|------|
| **Classes** | "Gerer les classes et leurs etudiants" | /admin/classes |
| **Matieres** | "Gerer les matieres enseignees" | /admin/matieres |
| **Enseignants** | "Gerer les enseignants et leurs affectations" | /admin/enseignants |

Chaque carte affiche :
- Icone coloree (bleu, orange, vert)
- Titre et description
- Compteur (ex: "12 classe(s)")
- Bouton "Voir les [elements]" qui devient bleu au survol

### Apercu Rapide

Section avec 3 statistiques complementaires :

| Statistique | Icone |
|-------------|-------|
| **Etudiants total** | Bleu |
| **Seances programmees** | Orange |
| **Evaluations** | Vert |

---

## 5. Gestion des Evaluations

### Acces
Menu lateral : **Evaluations**

### Description
Vue globale de toutes les evaluations de tous les enseignants. Cette page permet de superviser l'ensemble des evaluations de l'etablissement.

### En-tete
- **Titre** : "Toutes les Evaluations"
- **Sous-titre** : "Vue globale de toutes les evaluations (tous enseignants)"

### Cartes de statistiques

4 cartes de statistiques :

| Carte | Couleur | Description |
|-------|---------|-------------|
| **Total** | Bleu | Nombre total d'evaluations |
| **En cours** | Vert | Evaluations planifiees ou en cours |
| **Terminees** | Violet | Evaluations terminees |
| **En ligne** | Indigo | Evaluations avec version en ligne |

### Filtres disponibles

| Filtre | Options |
|--------|---------|
| **Enseignant** | "Tous les enseignants" + liste des enseignants |
| **Classe** | "Toutes les classes" + liste des classes |
| **Matiere** | "Toutes les matieres" + liste des matieres |
| **Statut** | Brouillon / Planifiee / En cours / Terminee |

Bouton **"Reinitialiser"** (rouge) pour effacer tous les filtres.

### Liste des evaluations

Chaque carte d'evaluation affiche :

**En-tete**
- Titre de l'evaluation
- Badge de statut (couleur selon l'etat)

**Informations (badges colores)**
- Enseignant (bleu)
- Matiere (vert)
- Classe (orange)

**Statistiques**
- Date de l'evaluation
- Duree en minutes
- Nombre de questions
- Nombre de soumissions

**Actions**

| Bouton | Action |
|--------|--------|
| **Voir resultats** | Acces aux resultats de l'evaluation |
| **Details** | Previsualisation de l'evaluation (disponible uniquement si terminee) |

> **Note** : Le bouton "Details" est grise et verrouille si l'evaluation n'est pas terminee.

---

## 6. Gestion des Seances et Visioconferences

### Acces
Menu lateral : **Seances & Visio**

### Description
Gestion centralisee des seances KLASSCI avec activation/desactivation des visioconferences.

### En-tete
- **Titre** : "Gestion des Seances & Visioconference"

### Vues disponibles

Boutons de basculement :
- **Liste** : Affichage en liste des seances
- **Calendrier** : Affichage calendrier des seances

### Filtres

| Filtre | Options |
|--------|---------|
| **Periode** | 7 jours / 14 jours / 30 jours / 60 jours |
| **Enseignant** | "Tous les enseignants" + liste |
| **Classe** | "Toutes les classes" + liste |

### Liste des seances

Chaque carte de seance affiche :
- **Matiere** : Nom de la matiere
- **Date** : Date de la seance
- **Horaire** : Heure de debut et fin
- **Classe** : Classe concernee
- **Salle** : Salle de cours

### Activation de la visioconference

Pour chaque seance, un bouton permet d'activer ou desactiver la visio :

| Etat | Bouton | Description |
|------|--------|-------------|
| **Visio desactivee** | "Activer visio" | Cliquez pour activer la visioconference |
| **Visio activee** | "Visio activee" (vert) | La visio est prete |

### Informations visio

Quand la visio est activee, la carte affiche :
- **room_id** : Identifiant de la salle Jitsi
- **Message** : "Acces possible 15 minutes avant le cours"

### Processus d'activation

1. Selectionnez la periode pour afficher les seances souhaitees
2. Identifiez la seance pour laquelle activer la visio
3. Cliquez sur **"Activer visio"**
4. Le systeme genere automatiquement une salle Jitsi Meet
5. L'enseignant et les etudiants pourront rejoindre 15 minutes avant l'heure

---

## 7. Historique des Presences

### Acces
Menu lateral : **Historique**

### Description
Consultation de l'historique des seances avec les listes de presence et possibilite d'export.

### En-tete
- **Titre** : "Historique des Seances"
- **Sous-titre** : "Consultez les seances et leurs listes de presences"

### Filtres par periode

Onglets de selection :
- **Aujourd'hui** : Seances du jour
- **Cette semaine** : Seances de la semaine courante
- **Ce mois** : Seances du mois courant
- **Personnalise** : Selection de dates personnalisees

### Selection de dates personnalisees

Si "Personnalise" est selectionne :
- Champ **Date debut**
- Champ **Date fin**
- Bouton **"Appliquer"**

### Barre de recherche

Champ de recherche : "Rechercher une matiere, enseignant, seance..."
- Bouton X pour effacer la recherche

### Tableau des seances

| Colonne | Description |
|---------|-------------|
| **Matiere** | Nom de la matiere |
| **Seance** | Titre + reference KLASSCI |
| **Classe** | Nom de la classe |
| **Date & Heure** | Date et heure de debut |
| **Duree** | Duree de la seance |
| **Participants** | Nombre de participants |
| **Duree Moy.** | Duree moyenne de participation |
| **Taux** | Taux de presence (%) |
| **Actions** | Boutons d'action |

### Code couleur du taux de presence

- **Vert** (>=80%) : Excellent
- **Orange** (60-79%) : Moyen
- **Rouge** (<60%) : Faible

### Actions disponibles

| Bouton | Action |
|--------|--------|
| **Voir** | Ouvre le detail des presences |
| **Supprimer** | Supprime la seance (avec confirmation) |

### Modal "Liste de Presence"

Quand vous cliquez sur "Voir", une fenetre modale s'ouvre avec :

**En-tete**
- **Enseignant** : Nom de l'enseignant
- **Horaire seance** : Heure debut - Heure fin (duree)
- **Coordinateur** : Nom du coordinateur (si present)
- Identifiant de la seance, matiere et date

**Tableau des participants**

| Colonne | Description |
|---------|-------------|
| **Nom** | Nom du participant |
| **Email** | Email du participant |
| **Arrivee** | Heure d'arrivee |
| **Depart** | Heure de depart |
| **Duree** | Duree de presence |
| **Statut** | Badge de presence |

**Statuts de presence**

| Badge | Couleur | Signification |
|-------|---------|---------------|
| **Present** | Vert | Participation >= 80% |
| **Partiel** | Orange | Participation 50-79% |
| **Faible** | Rouge clair | Participation 20-49% |
| **Absent** | Rouge | Participation < 20% |
| **En cours** | Bleu | Seance en cours |

**Statistiques recapitulatives**
- **Total participants** : Nombre total
- **Duree moyenne** : Temps moyen de presence
- **Taux de presence** : Pourcentage global

**Message special**
Si la seance est en cours, un bandeau bleu s'affiche :
> "Seance en cours - La liste definitive sera disponible apres la fermeture de la seance"

### Export des presences

**Boutons d'export (en bas de la modale)**

| Bouton | Format | Couleur |
|--------|--------|---------|
| **Exporter PDF** | .pdf | Rouge |
| **Exporter Excel** | .xlsx | Vert |

**Fichiers generes**
- `presences_seance_[ID]_[DATE].pdf`
- `presences_seance_[ID]_[DATE].xlsx`

### Pagination

Si plus de 50 seances :
- Bouton **"Precedent"**
- Indicateur : "Page X / Y"
- Bouton **"Suivant"**

---

## 8. Forum

### Acces
Menu lateral : **Forum**

### Description
Espace de discussion communautaire accessible a tous les utilisateurs.

### En-tete
- **Titre** : "Forum"
- **Sous-titre** : "Discutez avec la communaute"

### Liste des discussions

Chaque topic affiche :
- **Titre** : Titre de la discussion
- **Badges** (si applicable) :
  - "Epingle" (jaune) : Discussion mise en avant
  - "Verrouille" (rouge) : Discussion fermee
- **Apercu** : 150 premiers caracteres du contenu
- **Auteur** : Nom de l'auteur
- **Reponses** : Nombre de reponses
- **Date** : Date de creation

### Creer une nouvelle discussion

1. Cliquez sur le bouton flottant **"+ Nouvelle discussion"** (en bas a droite)
2. Dans la fenetre modale :
   - **Titre** : Saisissez le titre de votre discussion
   - **Message** : Redigez votre message
3. Cliquez sur **"Publier"**

### Consulter une discussion

- Cliquez sur une discussion pour voir tous les messages
- Vous pouvez repondre aux discussions existantes

---

## 9. Parametres

### Acces
Menu lateral : **Parametres**

### Description
Gestion de votre profil et de vos preferences.

### Sections disponibles

#### Informations Personnelles

Affichage de vos informations :
- **Nom complet** : Prenom et nom
- **Email** : Adresse email
- **Telephone** : Numero de telephone
- **Role** : "Coordinateur"

> Ces informations sont synchronisees depuis KLASSCI et ne peuvent pas etre modifiees directement.

#### Preferences d'affichage

**Theme**
- Basculer entre le mode clair et le mode sombre via le bouton toggle

#### Notifications

| Option | Description |
|--------|-------------|
| **Notifications par email** | Recevoir des notifications importantes du systeme |
| **Alertes systeme** | Recevoir des alertes pour les evenements critiques |

Chaque option dispose d'un toggle ON/OFF.

#### Securite

**Changer le mot de passe**
1. Cliquez sur **"Changer le mot de passe"**
2. Dans la fenetre modale :
   - **Mot de passe actuel** : Saisissez votre mot de passe actuel
   - **Nouveau mot de passe** : Saisissez le nouveau mot de passe (min. 6 caracteres)
   - **Confirmer le mot de passe** : Repetez le nouveau mot de passe
3. Cliquez sur **"Confirmer"**

#### Vos Permissions

Liste de vos permissions sur la plateforme (badges bleus avec icone check).

#### Session

**Se deconnecter**
- Cliquez sur le bouton rouge **"Se deconnecter"**
- Confirmez votre choix dans la fenetre de confirmation

---

## Resume des fonctionnalites Coordinateur

| Fonctionnalite | Description |
|----------------|-------------|
| **Dashboard** | Vue d'ensemble avec statistiques, taches en attente, calendrier |
| **Espace Admin** | Acces rapide aux classes, matieres, enseignants |
| **Evaluations** | Supervision de toutes les evaluations (tous enseignants) |
| **Seances & Visio** | Activation/gestion des visioconferences |
| **Historique** | Consultation des presences avec export PDF/Excel |
| **Forum** | Discussion communautaire |
| **Parametres** | Profil, theme, notifications, mot de passe |

---

## Raccourcis utiles

| Action | Acces |
|--------|-------|
| Activer une visio | Seances & Visio > Cliquer "Activer visio" |
| Voir les presences | Historique > Cliquer "Voir" |
| Exporter presences PDF | Historique > Voir > "Exporter PDF" |
| Exporter presences Excel | Historique > Voir > "Exporter Excel" |
| Voir resultats evaluation | Evaluations > "Voir resultats" |
| Generer rapport | Dashboard > "Generer Rapport" |

---

## Contact Support

En cas de probleme technique, contactez l'administrateur systeme ou le support technique.

---

*Guide mis a jour - Version 1.0*
