# Guide de Tests - Dashboard Moderne

[DATE] 2025-10-23
[SERVEUR] http://localhost:5177/

## [ETAPE 1] Connexion

1. Ouvrir votre navigateur
2. Aller sur: `http://localhost:5177/`
3. Se connecter avec un compte **étudiant**

## [ETAPE 2] Accéder au Dashboard Moderne

### Option A: URL Directe
Dans la barre d'adresse, aller sur:
```
http://localhost:5177/student/dashboard-modern
```

### Option B: Modifier temporairement le router
Pour tester facilement, on peut rediriger l'ancien dashboard vers le nouveau.

## [ETAPE 3] Tests Visuels

### [TEST 1] Sidebar
- [ ] La sidebar s'affiche avec un gradient bleu
- [ ] Le logo "LMS Platform" est visible
- [ ] Le menu de navigation s'affiche avec:
  - Dashboard
  - Mes Cours
  - Évaluations
  - Visioconférences
  - Mes Notes
  - Paramètres
- [ ] En bas: profil utilisateur avec initiales

**Action:** Cliquer sur la flèche ← (en haut de la sidebar)
- [ ] La sidebar se réduit (mode collapsed)
- [ ] Seules les icônes restent visibles
- [ ] Le texte disparaît avec animation

**Action:** Recliquer pour agrandir
- [ ] La sidebar se ré-ouvre
- [ ] Le texte réapparaît avec animation

### [TEST 2] Navbar
- [ ] Barre de navigation en haut avec fond blanc (mode clair)
- [ ] Titre de page "Dashboard" visible
- [ ] Icône de notification (cloche) avec badge rouge si notifications
- [ ] Icône Soleil (mode clair) ou Lune (mode sombre)
- [ ] Avatar utilisateur (cercle avec initiales)

**Action:** Cliquer sur l'icône Soleil/Lune
- [ ] Le thème change instantanément
- [ ] Sidebar: fond passe en bleu nuit
- [ ] Navbar: fond passe en gris foncé
- [ ] Cartes: fond passe en gris ardoise
- [ ] Texte: devient clair
- [ ] L'icône change (Soleil ↔ Lune) avec rotation

**Action:** Recliquer pour revenir en mode clair
- [ ] Tout revient au thème clair
- [ ] Transition fluide

**Action:** Cliquer sur l'avatar utilisateur
- [ ] Menu dropdown s'ouvre
- [ ] Options visibles: Mon Profil, Paramètres, Déconnexion

**Action:** Cliquer sur la notification
- [ ] Panel de notifications s'ouvre à droite
- [ ] Liste des notifications visible
- [ ] Bouton "Tout marquer comme lu"

### [TEST 3] Cartes de Statistiques
Vérifier l'affichage de 4 cartes:

**Carte 1: Moyenne Générale**
- [ ] Icône: 📊
- [ ] Fond icône: gradient bleu
- [ ] Label: "MOYENNE GÉNÉRALE"
- [ ] Valeur: affichée en grand (depuis KLASSCI)
- [ ] Hover: carte se soulève légèrement

**Carte 2: Taux de Présence**
- [ ] Icône: ✅
- [ ] Fond icône: gradient vert
- [ ] Label: "TAUX DE PRÉSENCE"
- [ ] Valeur: XX% avec trend "↗ +XX%"
- [ ] Trend en vert (up)

**Carte 3: Cours Suivis**
- [ ] Icône: 📚
- [ ] Fond icône: gradient violet
- [ ] Label: "COURS SUIVIS"
- [ ] Valeur: nombre de cours
- [ ] Sous-titre: "matières actives"

**Carte 4: Quiz à Venir**
- [ ] Icône: 📝
- [ ] Fond icône: gradient orange
- [ ] Label: "QUIZ À VENIR"
- [ ] Valeur: nombre de quiz

### [TEST 4] Section "Mes Cours"
- [ ] Titre avec icône 📖
- [ ] Grille de cartes de cours (3 colonnes sur desktop)
- [ ] Chaque carte affiche:
  - Icône 📚 avec gradient bleu
  - Badge "Coef. X"
  - Nom du cours
  - Bouton "Voir détails →"

**Action:** Hover sur une carte de cours
- [ ] Carte se soulève (translateY)
- [ ] Ombre augmente

**Action:** Cliquer sur "Voir détails"
- [ ] Navigation vers la page MatiereDetails
- [ ] Fonctionnalité existante préservée ✅

### [TEST 5] Section "Quiz à Venir"
- [ ] Titre avec icône 📝
- [ ] Liste des quiz si disponibles
- [ ] Chaque quiz affiche:
  - Titre
  - Matière
  - Date (avec icône 📅)
  - Badge de statut (planifié/en_cours/terminé)

### [TEST 6] Section "Actions Rapides"
Grille de 4 cartes d'action:

**1. Accéder aux Leçons**
- [ ] Icône: 📚 (gradient bleu)
- [ ] Titre visible
- [ ] Description visible

**2. Mes Évaluations**
- [ ] Icône: 📝 (gradient orange)
- [ ] Cliquable

**3. Passer les Quiz**
- [ ] Icône: ✅ (gradient vert)
- [ ] Cliquable

**4. Poser une Question**
- [ ] Icône: 💬 (gradient violet)
- [ ] Cliquable

**Action:** Cliquer sur chaque carte
- [ ] Navigation vers la route correspondante
- [ ] Fonctionnalité préservée ✅

## [ETAPE 4] Tests Fonctionnels

### [TEST] Navigation vers Matière
1. Depuis "Mes Cours", cliquer sur un cours
2. Vérifier:
   - [ ] Redirection vers `/matieres/:id`
   - [ ] Page MatiereDetails s'affiche correctement
   - [ ] Toutes les fonctionnalités existantes fonctionnent

### [TEST] Chargement des Données KLASSCI
Ouvrir la console navigateur (F12)
1. Recharger la page
2. Chercher dans la console:
   - [ ] "📊 Chargement dashboard étudiant depuis KLASSCI..."
   - [ ] "✅ Dashboard chargé:" avec données
   - [ ] "📚 Classe:", "📖 Cours:", "📝 Quiz:", "📊 Stats:"
   - [ ] Aucune erreur 401 ou 500

### [TEST] Sidebar Menu Navigation
Cliquer sur chaque élément du menu:
- [ ] Dashboard → Reste sur la page ou va vers `/`
- [ ] Mes Cours → Navigation
- [ ] Évaluations → Navigation vers `/student/evaluations`
- [ ] Visioconférences → Navigation vers `/student/seances`
- [ ] Mes Notes → Navigation vers `/student/notes`
- [ ] Paramètres → Navigation vers `/settings`

### [TEST] Persistence du Thème
1. Basculer en mode sombre
2. Recharger la page (F5)
3. Vérifier:
   - [ ] Le mode sombre est conservé
   - [ ] Le thème persiste après rechargement

### [TEST] Persistence Sidebar
1. Réduire la sidebar (collapsed)
2. Recharger la page (F5)
3. Vérifier:
   - [ ] La sidebar reste réduite
   - [ ] L'état persiste

### [TEST] Responsive Design
**Desktop (>1024px):**
- [ ] Sidebar visible
- [ ] Stats: 4 colonnes
- [ ] Cours: 3 colonnes
- [ ] Actions: 4 colonnes

**Tablette (768px - 1024px):**
1. Réduire la fenêtre
2. Vérifier:
   - [ ] Sidebar toujours visible
   - [ ] Stats: 2 colonnes
   - [ ] Cours: 2 colonnes
   - [ ] Actions: 2 colonnes

**Mobile (<768px):**
1. Réduire encore
2. Vérifier:
   - [ ] Sidebar devient fixed/overlay
   - [ ] Stats: 2 colonnes (petites)
   - [ ] Cours: 1 colonne
   - [ ] Actions: 1 colonne
   - [ ] Titre réduit

## [ETAPE 5] Comparaison Ancien vs Nouveau

### [TEST] Ancien Dashboard
Aller sur: `http://localhost:5177/student/dashboard`
- [ ] S'affiche correctement
- [ ] Toutes les fonctionnalités marchent
- [ ] Ancien design (Tailwind avec Navbar ancien)

### [TEST] Nouveau Dashboard
Revenir sur: `http://localhost:5177/student/dashboard-modern`
- [ ] Nouveau design s'affiche
- [ ] Mêmes données que l'ancien
- [ ] Mêmes fonctionnalités que l'ancien

**Conclusion:**
- [ ] Les deux versions coexistent
- [ ] Aucune fonctionnalité cassée
- [ ] Migration non-breaking ✅

## [ETAPE 6] Tests de Performance

### [TEST] Chargement Initial
1. Ouvrir l'onglet Network (F12)
2. Recharger la page
3. Vérifier:
   - [ ] Temps de chargement < 3 secondes
   - [ ] Pas d'erreurs 404 ou 500
   - [ ] Toutes les ressources chargées

### [TEST] Transitions
1. Naviguer entre pages
2. Vérifier:
   - [ ] Transitions fluides
   - [ ] Pas de lag
   - [ ] Animations smooth

### [TEST] Toggle Thème
1. Basculer plusieurs fois entre clair/sombre
2. Vérifier:
   - [ ] Changement instantané
   - [ ] Pas de flash blanc
   - [ ] Transitions CSS fluides

## [PROBLEMES POTENTIELS]

### Problème: Sidebar ne s'affiche pas
**Solution:** Vérifier dans la console s'il y a une erreur auth
- Le user doit être connecté
- `auth.getUser()` doit retourner un utilisateur

### Problème: Données ne se chargent pas
**Solution:** Vérifier:
1. Backend Laravel est démarré
2. API KLASSCI est accessible
3. Token d'authentification valide
4. Console: voir les logs KLASSCI

### Problème: Thème ne change pas
**Solution:** Vérifier:
1. Le fichier themes.css est bien importé dans main.js
2. L'attribut `data-theme` change sur `<html>`
3. Pas de conflit avec Tailwind

### Problème: Navigation ne fonctionne pas
**Solution:** Vérifier:
1. Les routes sont bien définies dans router/index.js
2. Le composant cible existe
3. Pas d'erreur dans la console

## [RESULTATS ATTENDUS]

### [OK] Design
- Interface moderne et professionnelle
- Gradient bleu dans la sidebar
- Cartes avec ombres douces
- Animations fluides
- Mode sombre élégant

### [OK] Fonctionnalités
- 100% des fonctionnalités préservées
- Navigation fonctionne
- Données KLASSCI chargées
- Création leçon/séance/évaluation OK
- Visioconférence OK

### [OK] UX
- Responsive
- Theme toggle instantané
- Sidebar collapsible
- Notifications
- Transitions smooth

## [NOTES]

- Le dashboard ancien reste accessible sur `/student/dashboard`
- Le dashboard moderne est sur `/student/dashboard-modern`
- Pour utiliser le moderne par défaut, il faut modifier le router
- Aucun code métier n'a été modifié
- Tous les services API sont inchangés

## [PROCHAINES ETAPES SI TESTS OK]

1. [ ] Créer TeacherDashboardModern
2. [ ] Créer AdminDashboardModern
3. [ ] Migrer les pages de gestion (Leçons, Évaluations, Séances)
4. [ ] Remplacer les routes par défaut vers les versions modernes
5. [ ] Nettoyer l'ancien code

---

[STATUS] Prêt pour tests
[URL] http://localhost:5177/student/dashboard-modern
