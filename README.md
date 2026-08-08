# 🚀 LMS Frontend - Vue.js 3

Application frontend pour le système LMS (Learning Management System).

---

## ✨ DÉMARRAGE RAPIDE (3 COMMANDES)

```bash
# 1. Installer les dépendances
npm install

# 2. Lancer l'application
npm run dev

# 3. Ouvrir dans le navigateur
# → http://localhost:5173
```

**C'est tout ! 🎉**

---

## 📚 DOCUMENTATION

- **[CONTRIBUTING.md](./CONTRIBUTING.md)** - **Règles du dépôt : à lire avant toute PR**
  (`<script setup>` obligatoire, lazy loading des routes, tokens de couleur, limite
  de 300 lignes par fichier, vérifications avant PR)
- **[GUIDE_DEBUTANT_VUE.md](./GUIDE_DEBUTANT_VUE.md)** - Pour débutants Vue.js
- **[DEPLOIEMENT_CPANEL.md](./DEPLOIEMENT_CPANEL.md)** - Mettre en ligne sur cPanel

---

## 🛠️ TECHNOLOGIES

- **Vue 3** - Framework JavaScript réactif
- **Vue Router** - Navigation entre pages
- **Axios** - Requêtes HTTP vers l'API
- **Tailwind CSS** - Styles modernes et responsive
- **Vite** - Build tool ultra-rapide

---

## 📁 STRUCTURE

```
src/
├── views/           # Pages, regroupées par domaine
│   ├── Login.vue           # Page de connexion
│   ├── Dashboard.vue       # Tableau de bord générique
│   ├── admin/              # Pages admin & coordinateur
│   ├── teacher/            # Pages enseignant
│   ├── student/            # Pages étudiant
│   ├── lessons/            # Leçons et chapitres
│   ├── evaluations/        # Évaluations
│   ├── seances/, attendance/, classes/, matieres/, ...
│
├── components/      # Composants réutilisables, par domaine
│   ├── ui/, common/, layout/, widgets/, modals/
│   └── admin/, teacher/, student/, calendar/, visio/, forum/, ...
│
├── composables/     # Logique réutilisable (`use*`), extraite des vues
├── utils/           # Fonctions pures (formatage, calculs)
├── constants/       # Valeurs figées — dont `roles.js` (autorisations)
│
├── stores/          # Stores Pinia
│   └── auth.js             # Source de vérité unique de l'état d'auth
│
├── services/        # Accès API (axios) — un module par domaine backend
│   ├── api.js              # Instance axios + intercepteurs
│   └── lms*.js, klassci*.js, evaluation.js, cache.js, ...
│
├── router/          # Routes, découpées par domaine
│   ├── index.js            # Assemblage + guard global
│   ├── guards.js           # Logique de garde de navigation
│   └── routes/             # core / admin / teacher / student / shared
│
├── assets/styles/   # Thème clair/sombre et tokens de couleur
│   └── themes.css          # Barrel → theme/_tokens-*.css, _theme-{light,dark}.css
│
└── main.js          # Point d'entrée
```

> Conventions structurantes (détail dans **CONTRIBUTING.md**) : un composant par
> responsabilité, logique partagée en composable, **300 lignes maximum par fichier**
> (garde CI `npm run lint:size`).

---

## 🔌 CONNEXION AU BACKEND

**Tout est déjà configuré !**

`src/services/api.js` expose l'instance axios (baseURL, token, gestion des erreurs)
et des groupes de fonctions pour appeler l'API Laravel :

```javascript
import { auth, lessons, quizzes, dashboard, forum } from '@/services/api'

// Exemples d'utilisation :
await auth.login(username, password)   // username OU email (auth KLASSCI)
await lessons.getAll()
await quizzes.startAttempt(quizId)
await dashboard.getStudentDashboard()
await forum.createTopic(data)
```

Les domaines plus récents ont leur propre module (`services/lmsSeances.js`,
`services/evaluation.js`, `services/klassci*.js`…) plutôt que d'alourdir `api.js`.

> Le bloc `auth` de `api.js` n'est qu'une **façade** : l'état d'authentification
> réel vit dans le store Pinia `src/stores/auth.js`. Dans un composant neuf,
> préférez `useAuthStore()` directement.

---

## ⚙️ CONFIGURATION

### Fichier `.env`

```env
VITE_API_URL=http://localhost:8000/api
```

**En production** :
```env
VITE_API_URL=https://api.votre-domaine.com/api
```

---

## 🎨 PERSONNALISATION

### Changer les couleurs

Les couleurs sont des **tokens CSS**, définis dans `src/assets/styles/themes.css`
et ses partials `src/assets/styles/theme/*.css` (une valeur par thème clair/sombre).
On modifie le token, jamais la couleur au point d'usage :

```css
.btn { color: var(--color-primary); }            /* ✅ token */
.btn { color: var(--color-primary, #1e6fd9); }   /* ✅ fallback toléré */
.btn { color: #1e6fd9; }                          /* ❌ refusé par lint:css */
```

⚠️ **Une couleur hex en dur fait échouer la CI** (`npm run lint:css`) : elle casse
le mode sombre. Voir CONTRIBUTING.md §4.

### Modifier les pages

Les pages sont dans `src/views/`. Chaque fichier `.vue` contient :
- `<template>` - Le HTML
- `<script setup>` - La logique JavaScript (Composition API, **obligatoire** pour
  tout nouveau composant — cf. CONTRIBUTING.md §1)
- `<style scoped>` - Les styles CSS

---

## 🚀 COMMANDES DISPONIBLES

```bash
# Développement (avec hot-reload)
npm run dev

# Compilation pour production
npm run build

# Prévisualiser la version compilée
npm run preview
```

### Qualité — à lancer avant toute PR

```bash
npm run test          # tests unitaires (Vitest)
npm run test:watch    # idem, en mode watch
npm run test:coverage # couverture (services / composables / utils)
npm run test:contract # contrat API (chemins backend figés)
npm run lint:css      # garde anti-régression : aucune couleur hex en dur (#161)
npm run lint:size     # garde anti-régression : aucun fichier source > 300 lignes (#195)
```

`test`, `lint:css` et `lint:size` (plus `npm audit`) tournent **en CI sur chaque PR**
vers `dev`/`main` (cf. `.github/workflows/lint.yml`) : une PR qui les casse est
bloquée. `test:contract` n'est pas dans la CI — à lancer à la main quand vous
touchez à un chemin d'API. Détail des règles et des baselines dans **CONTRIBUTING.md**.

---

## ✅ PRINCIPALES PAGES

L'application compte une soixantaine de routes, définies par domaine dans
`src/router/routes/`. Points d'entrée :

| Route | Fichier de routes | Description |
|-------|-------------------|-------------|
| `/login` | `core.routes.js` | Connexion avec KLASSCI (username **ou** email) |
| `/` | `core.routes.js` | **Redirection** vers le dashboard du rôle |
| `/student/dashboard` | `student.routes.js` | Espace étudiant (cours, notes, agenda, évaluations) |
| `/teacher/dashboard` | `teacher.routes.js` | Espace enseignant (séances, leçons, évaluations, stats) |
| `/admin/dashboard` | `admin.routes.js` | Espace admin / coordinateur (classes, matières, enseignants) |
| `/admin/institutions` | `admin.routes.js` | Gestion des institutions (supradmin) |
| `/lessons/:id`, `/matieres/:id`, `/seances`, `/forum` | `shared.routes.js` | Pages partagées entre rôles |

La destination de `/` est calculée par `getDashboardRoute()` dans
`src/constants/roles.js` — **source unique** de la correspondance rôle → dashboard.

---

## 🔐 AUTHENTIFICATION

L'état d'authentification est centralisé dans le store Pinia `src/stores/auth.js`
(source de vérité unique) :

- Le token et le profil sont persistés dans **`sessionStorage`** — la session est
  donc effacée à la fermeture de l'onglet et n'est pas partagée entre onglets.
- Chaque requête l'envoie automatiquement (intercepteur axios de `src/services/api.js`).
- Si le token expire → redirection vers `/login`.
- Les décisions d'accès (`isAdmin`, `isTeacher`, `isStudent`…) dérivent **toutes**
  de `src/constants/roles.js`, qui normalise le rôle brut renvoyé par le backend.
  Ne réimplémentez jamais un test de rôle ailleurs.

> ⚠️ **Dette de sécurité tracée.** `sessionStorage` est lisible par JavaScript :
> ce n'est **pas** une protection contre le XSS (un XSS y lit le token comme dans
> `localStorage`). La vraie protection est un cookie `HttpOnly` + `Secure` +
> `SameSite` émis par le backend — migration front + back à faire.

---

## 📱 RESPONSIVE

Le responsive s'appuie sur les utilitaires Tailwind **et** sur la feuille dédiée
`src/assets/styles/mobile-responsive.css` (partials `mobile/_*.css` : grilles,
tableaux, navigation, formulaires et modales), qui adapte les écrans étroits.

---

## 🐛 DÉPANNAGE

### "npm: command not found"
Installez Node.js : https://nodejs.org

### "Port 5173 already in use"
```bash
# Windows
netstat -ano | findstr :5173
taskkill /PID [le_numero] /F

# Ou changez le port dans vite.config.js
```

### "Network Error"
- Vérifiez que le backend tourne (`php artisan serve`)
- Vérifiez `.env` : `VITE_API_URL=http://localhost:8000/api`

### Page blanche
- Ouvrez la console (F12)
- Regardez les erreurs en rouge
- Vérifiez que tous les fichiers sont bien présents

---

## 📞 BESOIN D'AIDE ?

1. **Lisez le [GUIDE_DEBUTANT_VUE.md](./GUIDE_DEBUTANT_VUE.md)**
2. **Vérifiez la console** (F12 dans le navigateur)
3. **Testez le backend** avec Postman d'abord

---

## 📈 FONCTIONNALITÉS

- Authentification KLASSCI (login/logout) et redirection par rôle
- Dashboards distincts étudiant / enseignant / admin-coordinateur, avec statistiques
- Leçons et chapitres, avec éditeur de contenu riche (TipTap)
- Évaluations : création, passage, correction, résultats
- Séances, agenda/calendrier et émargement (présences)
- Visioconférence intégrée (Jitsi) et suivi de participation
- Forum (sujets et réponses)
- Recherche, notifications, profil et réglages utilisateur
- Thème clair / sombre (`src/composables/useTheme.js`) et design responsive

---

## 🤝 CONTRIBUER

Avant d'ouvrir une PR, lisez **[CONTRIBUTING.md](./CONTRIBUTING.md)** : il fixe les
conventions non négociables du dépôt (Composition API, lazy loading des routes,
tokens de couleur, 300 lignes maximum par fichier) et la liste des vérifications
exécutées en CI.
