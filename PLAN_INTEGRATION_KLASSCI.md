# Plan d'Action - Intégration Frontend LMS ↔ KLASSCI

> ## ⚠️ DOCUMENT HISTORIQUE — NE PAS SUIVRE COMME RÉFÉRENCE
>
> **Statut au 7 août 2026 : archive.** Ce document est le plan d'intégration
> *initial*. L'intégration a été réalisée, puis refondue depuis. Ses chemins de
> fichiers et ses extraits de code **ne décrivent plus le code réel** et
> induiraient en erreur quiconque les recopierait.
>
> **Écarts connus entre ce plan et l'implémentation actuelle :**
>
> | Ce plan prescrit | Réalité du code (fait foi) |
> |---|---|
> | `src/utils/roles.js` (à créer) | **`src/constants/roles.js`** — enum gelé, table d'alias miroir de `App\Enums\Role`, helpers fail-secure. `src/utils/roles.js` a été supprimé (cf. `.claude/specs/roles-normalization/`) |
> | `localStorage.setItem('token', …)` dans `src/services/api.js` | **`src/stores/auth.js`** (store Pinia) — persistance en **`sessionStorage`**, source de vérité unique de l'état d'auth |
> | Routes ajoutées dans `src/router/index.js` | **`src/router/routes/*.js`** — routes découpées par domaine (`core`/`admin`/`teacher`/`student`/`shared`), gardes dans `src/router/guards.js` |
>
> **Les fichiers qui font foi aujourd'hui :** `src/constants/roles.js`,
> `src/stores/auth.js`, `src/router/routes/`, `src/router/guards.js`.
> Pour la table des rôles émis par KLASSCI, la source est le dépôt
> `lms-backend`, `docs/INTEGRATION_KLASSCI.md`.
>
> Ce fichier est conservé pour la **traçabilité des décisions**, pas comme guide
> d'implémentation.

## Vue d'ensemble

Le frontend LMS doit s'authentifier via KLASSCI et rediriger les utilisateurs vers des dashboards spécifiques selon leur rôle.

---

## Phase 1 : Correction de l'Authentification ✅

### 1.1 Modifier le formulaire de connexion

**Fichier : `src/views/Login.vue`**

**Changements :**
- ✅ Remplacer `email` par `username`
- ✅ Accepter username OU email
- ✅ Afficher les informations de test avec identifiants KLASSCI
- ✅ Gérer la redirection par rôle après login

**Actions :**
```vue
<!-- Changer le champ email en username -->
<input
  id="username"
  v-model="username"
  type="text"
  placeholder="superadmin ou votre email"
/>
```

### 1.2 Mettre à jour le service API

**Fichier : `src/services/api.js`**

**Changements :**
```javascript
async login(username, password) {
  const response = await api.post('/auth/login', { username, password })
  if (response.data.token) {
    localStorage.setItem('token', response.data.token)
    localStorage.setItem('user', JSON.stringify(response.data.user))
  }
  return response.data
}
```

---

## Phase 2 : Gestion des Rôles et Redirections 📍

### 2.1 Créer un helper pour les rôles

**Fichier : `src/utils/roles.js`** (à créer)

```javascript
/**
 * Mapper les rôles KLASSCI vers les dashboards
 */
export const ROLES = {
  SUPER_ADMIN: 'superAdmin',
  COORDINATEUR: 'coordinateur',
  SECRETAIRE: 'secretaire',
  ENSEIGNANT: 'enseignant',
  TEACHER: 'teacher',
  ETUDIANT: 'etudiant'
}

/**
 * Obtenir la route du dashboard selon le rôle
 */
export function getDashboardRoute(role) {
  // Admins (superAdmin, coordinateur, secretaire)
  if ([ROLES.SUPER_ADMIN, ROLES.COORDINATEUR, ROLES.SECRETAIRE].includes(role)) {
    return '/admin/dashboard'
  }

  // Enseignants
  if ([ROLES.ENSEIGNANT, ROLES.TEACHER].includes(role)) {
    return '/teacher/dashboard'
  }

  // Étudiants
  if (role === ROLES.ETUDIANT) {
    return '/student/dashboard'
  }

  // Par défaut
  return '/dashboard'
}

/**
 * Vérifier si l'utilisateur a un rôle spécifique
 */
export function hasRole(user, roles) {
  if (!user || !user.role) return false
  const userRoles = Array.isArray(roles) ? roles : [roles]
  return userRoles.includes(user.role)
}

/**
 * Vérifier si l'utilisateur est admin
 */
export function isAdmin(user) {
  return hasRole(user, [ROLES.SUPER_ADMIN, ROLES.COORDINATEUR, ROLES.SECRETAIRE])
}

/**
 * Vérifier si l'utilisateur est enseignant
 */
export function isTeacher(user) {
  return hasRole(user, [ROLES.ENSEIGNANT, ROLES.TEACHER])
}

/**
 * Vérifier si l'utilisateur est étudiant
 */
export function isStudent(user) {
  return hasRole(user, [ROLES.ETUDIANT])
}
```

### 2.2 Modifier le router pour gérer les rôles

**Fichier : `src/router/index.js`**

**Ajouter les routes par rôle :**

```javascript
import { getDashboardRoute } from '@/utils/roles'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: { guest: true }
  },

  // Dashboard Admin
  {
    path: '/admin/dashboard',
    name: 'AdminDashboard',
    component: () => import('@/views/dashboards/AdminDashboard.vue'),
    meta: {
      requiresAuth: true,
      roles: ['superAdmin', 'coordinateur', 'secretaire']
    }
  },

  // Dashboard Enseignant
  {
    path: '/teacher/dashboard',
    name: 'TeacherDashboard',
    component: () => import('@/views/dashboards/TeacherDashboard.vue'),
    meta: {
      requiresAuth: true,
      roles: ['enseignant', 'teacher']
    }
  },

  // Dashboard Étudiant
  {
    path: '/student/dashboard',
    name: 'StudentDashboard',
    component: () => import('@/views/dashboards/StudentDashboard.vue'),
    meta: {
      requiresAuth: true,
      roles: ['etudiant']
    }
  },

  // Redirection / vers dashboard approprié
  {
    path: '/',
    redirect: to => {
      const user = auth.getUser()
      if (!user) return '/login'
      return getDashboardRoute(user.role)
    }
  }
]

// Guard de navigation amélioré
router.beforeEach((to, from, next) => {
  const isAuthenticated = auth.isAuthenticated()
  const user = auth.getUser()

  // Route nécessite l'authentification
  if (to.meta.requiresAuth && !isAuthenticated) {
    next('/login')
    return
  }

  // Utilisateur connecté va sur login
  if (to.meta.guest && isAuthenticated) {
    next(getDashboardRoute(user.role))
    return
  }

  // Vérifier les rôles requis
  if (to.meta.roles && user) {
    const hasRequiredRole = to.meta.roles.includes(user.role)
    if (!hasRequiredRole) {
      next(getDashboardRoute(user.role))
      return
    }
  }

  next()
})
```

---

## Phase 3 : Créer les 3 Dashboards Spécifiques 📊

### 3.1 Dashboard Admin

**Fichier : `src/views/dashboards/AdminDashboard.vue`**

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- En-tête Admin -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">
          Tableau de bord Administrateur
        </h1>
        <p class="text-gray-600 mt-2">
          Bienvenue, {{ user?.name }} ({{ user?.role_display_name }})
        </p>
      </div>

      <!-- Statistiques Admin depuis KLASSCI -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-500 text-sm">Enseignants</p>
          <p class="text-3xl font-bold text-blue-600">
            {{ stats?.nb_enseignants || 0 }}
          </p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-500 text-sm">Étudiants</p>
          <p class="text-3xl font-bold text-green-600">
            {{ stats?.nb_etudiants || 0 }}
          </p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-500 text-sm">Classes actives</p>
          <p class="text-3xl font-bold text-purple-600">
            {{ stats?.nb_classes_actives || 0 }}
          </p>
        </div>

        <div class="bg-white rounded-lg shadow p-6">
          <p class="text-gray-500 text-sm">Matières</p>
          <p class="text-3xl font-bold text-orange-600">
            {{ stats?.nb_matieres_actives || 0 }}
          </p>
        </div>
      </div>

      <!-- Menu d'actions admin -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <router-link
          to="/admin/users"
          class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <h3 class="font-bold text-lg mb-2">👥 Gestion Utilisateurs</h3>
          <p class="text-gray-600 text-sm">Gérer les enseignants et étudiants</p>
        </router-link>

        <router-link
          to="/admin/lessons"
          class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <h3 class="font-bold text-lg mb-2">📚 Gestion Cours</h3>
          <p class="text-gray-600 text-sm">Créer et gérer les cours LMS</p>
        </router-link>

        <router-link
          to="/admin/reports"
          class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <h3 class="font-bold text-lg mb-2">📊 Rapports</h3>
          <p class="text-gray-600 text-sm">Statistiques et analyses</p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'
import { auth } from '@/services/api'

export default {
  name: 'AdminDashboard',
  components: { Navbar },
  data() {
    return {
      user: null,
      stats: {}
    }
  },
  mounted() {
    this.user = auth.getUser()
    this.stats = this.user?.admin_data?.statistics || {}
  }
}
</script>
```

### 3.2 Dashboard Enseignant

**Fichier : `src/views/dashboards/TeacherDashboard.vue`**

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">
          Tableau de bord Enseignant
        </h1>
        <p class="text-gray-600 mt-2">Bienvenue, {{ user?.name }}</p>
      </div>

      <!-- Menu enseignant -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <router-link
          to="/teacher/lessons"
          class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <h3 class="font-bold text-lg mb-2">📚 Mes Cours</h3>
          <p class="text-gray-600 text-sm">Créer et gérer mes leçons</p>
        </router-link>

        <router-link
          to="/teacher/quizzes"
          class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <h3 class="font-bold text-lg mb-2">📝 Mes Quiz</h3>
          <p class="text-gray-600 text-sm">Créer des évaluations</p>
        </router-link>

        <router-link
          to="/teacher/students"
          class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <h3 class="font-bold text-lg mb-2">👨‍🎓 Mes Étudiants</h3>
          <p class="text-gray-600 text-sm">Voir mes classes</p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'
import { auth } from '@/services/api'

export default {
  name: 'TeacherDashboard',
  components: { Navbar },
  data() {
    return {
      user: null
    }
  },
  mounted() {
    this.user = auth.getUser()
  }
}
</script>
```

### 3.3 Dashboard Étudiant

**Fichier : `src/views/dashboards/StudentDashboard.vue`**

```vue
<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">
          Tableau de bord Étudiant
        </h1>
        <p class="text-gray-600 mt-2">Bienvenue, {{ user?.name }}</p>
      </div>

      <!-- Menu étudiant -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <router-link
          to="/lessons"
          class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <h3 class="font-bold text-lg mb-2">📚 Mes Cours</h3>
          <p class="text-gray-600 text-sm">Accéder aux leçons</p>
        </router-link>

        <router-link
          to="/quizzes"
          class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <h3 class="font-bold text-lg mb-2">📝 Mes Quiz</h3>
          <p class="text-gray-600 text-sm">Passer les évaluations</p>
        </router-link>

        <router-link
          to="/forum"
          class="bg-white p-6 rounded-lg shadow hover:shadow-lg transition"
        >
          <h3 class="font-bold text-lg mb-2">💬 Forum</h3>
          <p class="text-gray-600 text-sm">Poser des questions</p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'
import { auth } from '@/services/api'

export default {
  name: 'StudentDashboard',
  components: { Navbar },
  data() {
    return {
      user: null
    }
  },
  mounted() {
    this.user = auth.getUser()
  }
}
</script>
```

---

## Phase 4 : Améliorer le Service API 🔧

### 4.1 Améliorer la gestion des réponses

**Fichier : `src/services/api.js`**

```javascript
// Modifier l'intercepteur de réponse
api.interceptors.response.use(
  (response) => {
    // Retourner la structure complète pour avoir accès à 'meta'
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Améliorer la fonction login
export const auth = {
  async login(username, password) {
    const response = await api.post('/auth/login', { username, password })

    if (response.success && response.data.token) {
      // Stocker le token KLASSCI
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))

      // Stocker les méta-données
      if (response.meta) {
        localStorage.setItem('meta', JSON.stringify(response.meta))
      }
    }

    return response
  },

  getMeta() {
    const meta = localStorage.getItem('meta')
    return meta ? JSON.parse(meta) : null
  }
}
```

---

## Phase 5 : Tests et Validation ✅

### Checklist de Tests

- [ ] **Login avec superadmin** → Redirection `/admin/dashboard`
- [ ] **Login avec enseignant** → Redirection `/teacher/dashboard`
- [ ] **Login avec étudiant** → Redirection `/student/dashboard`
- [ ] **Token KLASSCI stocké** correctement
- [ ] **Données utilisateur** complètes dans localStorage
- [ ] **Guards de navigation** bloquent accès non autorisé
- [ ] **Déconnexion** fonctionne correctement

---

## Calendrier d'Implémentation

| Phase | Tâches | Durée |
|-------|--------|-------|
| **Phase 1** | Correction authentification | 30 min |
| **Phase 2** | Gestion rôles + redirections | 1h |
| **Phase 3** | Création 3 dashboards | 2h |
| **Phase 4** | Amélioration service API | 30 min |
| **Phase 5** | Tests et validation | 1h |
| **TOTAL** | | ~5h |

---

## Résumé des Fichiers à Créer/Modifier

### À Créer ✨
- `src/utils/roles.js`
- `src/views/dashboards/AdminDashboard.vue`
- `src/views/dashboards/TeacherDashboard.vue`
- `src/views/dashboards/StudentDashboard.vue`

### À Modifier 📝
- `src/views/Login.vue` (changer email → username)
- `src/services/api.js` (améliorer login et intercepteurs)
- `src/router/index.js` (ajouter routes par rôle + guards)

---

## Prochaines Étapes

Après l'intégration de base :

1. **Récupérer les données KLASSCI** :
   - Classes depuis `/api/proxy/classes`
   - Matières depuis `/api/proxy/matieres`
   - Emploi du temps depuis `/api/proxy/emploi-temps`

2. **Implémenter les fonctionnalités LMS** :
   - Création de cours (enseignants)
   - Quiz interactifs
   - Forum de discussion

3. **Synchronisation en temps réel** :
   - Polling ou WebSockets pour notifications
   - Mise à jour des données KLASSCI

---

**Date de création :** 19 Octobre 2025
**Version :** 1.0.0
