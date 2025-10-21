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

- **[GUIDE_DEBUTANT_VUE.md](./GUIDE_DEBUTANT_VUE.md)** - Pour débutants Vue.js (COMMENCEZ ICI !)
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
├── views/           # Pages de l'application
│   ├── Login.vue           # Page de connexion
│   ├── Dashboard.vue       # Tableau de bord
│   ├── Lessons.vue         # Liste des leçons
│   ├── LessonView.vue      # Détails d'une leçon
│   ├── Quizzes.vue         # Liste des quiz
│   ├── QuizTake.vue        # Passer un quiz
│   ├── Forum.vue           # Forum
│   └── ForumTopic.vue      # Discussion forum
│
├── components/      # Composants réutilisables
│   └── Navbar.vue          # Barre de navigation
│
├── services/        # Logique backend
│   └── api.js              # Connexion API (TOUT configuré !)
│
├── router/          # Configuration des routes
│   └── index.js
│
└── main.js          # Point d'entrée
```

---

## 🔌 CONNEXION AU BACKEND

**Tout est déjà configuré !**

Le fichier `src/services/api.js` contient toutes les fonctions pour appeler votre API Laravel :

```javascript
import { auth, lessons, quizzes, dashboard, forum } from '@/services/api'

// Exemples d'utilisation :
await auth.login(email, password)
await lessons.getAll()
await quizzes.startAttempt(quizId)
await dashboard.getStudentDashboard()
await forum.createTopic(data)
```

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

Éditez `tailwind.config.js` :

```javascript
colors: {
  primary: {
    500: '#3b82f6',  // Couleur principale
    600: '#2563eb',
    700: '#1d4ed8',
  },
}
```

### Modifier les pages

Les pages sont dans `src/views/`. Chaque fichier `.vue` contient :
- `<template>` - Le HTML
- `<script>` - La logique JavaScript
- `<style>` - Les styles CSS

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

---

## ✅ PAGES INCLUSES

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Connexion avec KLASSCI |
| Dashboard | `/` | Tableau de bord avec stats |
| Leçons | `/lessons` | Liste des cours |
| Détails leçon | `/lessons/:id` | Contenu d'un cours |
| Quiz | `/quizzes` | Liste des quiz |
| Passer quiz | `/quizzes/:id/take` | Interface de quiz avec timer |
| Forum | `/forum` | Liste des discussions |
| Topic forum | `/forum/topics/:id` | Discussion avec réponses |

---

## 🔐 AUTHENTIFICATION

L'authentification est automatique :
- Le token est stocké dans `localStorage`
- Chaque requête l'envoie automatiquement
- Si le token expire → redirection vers `/login`

---

## 📱 RESPONSIVE

Toutes les pages sont **automatiquement responsive** grâce à Tailwind CSS :
- Mobile : 1 colonne
- Tablette : 2 colonnes
- Desktop : 3 colonnes

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

## 🎯 POUR LA PRÉSENTATION

### Points forts à montrer :
- ✅ Interface moderne et professionnelle
- ✅ Authentification sécurisée
- ✅ Données en temps réel depuis l'API
- ✅ Design responsive (mobile + desktop)
- ✅ Timer de quiz fonctionnel
- ✅ Forum interactif

### Démo suggérée :
1. Login
2. Dashboard avec stats
3. Parcourir les leçons
4. Démarrer un quiz
5. Créer une discussion sur le forum

---

## 📈 FONCTIONNALITÉS

### ✅ Implémentées
- Authentification (Login/Logout)
- Dashboard avec statistiques
- Liste et détails des leçons
- Système de quiz avec timer
- Forum avec topics et réponses
- Navigation responsive
- Gestion automatique des tokens

### 🔜 À ajouter (après présentation)
- Upload de fichiers
- Notifications en temps réel
- Profil utilisateur
- Recherche globale
- Mode sombre

---

**🎉 Développé avec ❤️ pour votre succès !**

**Deadline : Dimanche → Vous avez tout ce qu'il faut ! 💪**
