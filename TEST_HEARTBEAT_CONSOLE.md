# 🔍 Test Heartbeat - Console Navigateur

## ❌ Problème identifié

**Les heartbeats n'arrivent JAMAIS au serveur !**

Preuve :
```
Marcel : Joined at: 11:16:59
         Last seen at: 11:16:59  ← IDENTIQUE = Aucun heartbeat reçu !
         Left at: 11:29:50 (après 13 min sans heartbeat)
```

## 🧪 Test à effectuer MAINTENANT

### 1. Ouvrir la console (F12)

### 2. Rejoindre une visio

### 3. Vérifier ces messages dans la console :

**✅ Ce que vous DEVRIEZ voir** :
```javascript
[useVisioParticipation] Rejoindre séance 62
[useVisioParticipation] 💓 Worker démarré (Web Worker, 30s)
[useVisioParticipation] 💓 Heartbeat envoyé (séance 62)
```

**❌ Si vous NE VOYEZ PAS ces messages** :
- Le composable n'est pas appelé
- Le Worker ne démarre pas
- Une erreur bloque le heartbeat

### 4. Attendre 30 secondes

**✅ Ce que vous DEVRIEZ voir** (toutes les 30s) :
```javascript
[useVisioParticipation] 💓 Heartbeat envoyé (séance 62)
[useVisioParticipation] 💓 Heartbeat envoyé (séance 62)
[useVisioParticipation] 💓 Heartbeat envoyé (séance 62)
```

### 5. Vérifier les erreurs

**Chercher dans la console** :
- ❌ Erreurs en rouge
- ⚠️ Warnings en jaune
- 🔴 Failed requests dans l'onglet Network

### 6. Tester manuellement le heartbeat

**Dans la console, tapez** :
```javascript
// Importer le service
import lmsService from '@/services/lms'

// Envoyer un heartbeat manuel
lmsService.heartbeatVisio(62).then(r => console.log('✅ Heartbeat OK:', r))
```

## 🔧 Problèmes possibles

### A. Le composable n'est pas appelé
**Symptôme** : Aucun message dans la console

**Cause** : `joinVisio()` du composable n'est pas appelé

**Solution** : Vérifier que VisioManager/TeacherSeances utilise bien `this.joinVisio()` ou `visioParticipations[id].joinVisio()`

### B. Le Worker ne démarre pas
**Symptôme** : Pas de message "💓 Worker démarré"

**Cause possible** :
- `heartbeat-worker.js` n'existe pas dans `public/`
- Erreur de chargement du Worker
- Navigateur ne supporte pas les Workers

**Test** : Aller sur `http://localhost:5173/heartbeat-worker.js` - doit afficher le code du Worker

### C. L'URL du heartbeat est incorrecte
**Symptôme** : Erreur 404 dans Network

**Vérifier dans .env** :
```
VITE_API_URL=http://localhost:8000
```

### D. Le token est manquant
**Symptôme** : Erreur 401 Unauthorized

**Test dans la console** :
```javascript
localStorage.getItem('token')  // Doit retourner un token JWT
```

### E. CORS bloque la requête
**Symptôme** : Erreur CORS dans la console

**Solution** : Vérifier la config CORS du backend

## 📝 Rapport

Une fois le test effectué, noter :

**Messages visibles dans la console** :
- [ ] `Rejoindre séance X`
- [ ] `💓 Worker démarré`
- [ ] `💓 Heartbeat envoyé` (initial)
- [ ] `💓 Heartbeat envoyé` (répété toutes les 30s)

**Erreurs rencontrées** :
- [ ] Aucune erreur
- [ ] Erreur réseau (Network)
- [ ] Erreur Worker
- [ ] Erreur 401/403/404
- [ ] Autre : _____

**Requêtes visibles dans Network (F12 > Network)** :
- [ ] POST `/api/lms/seances/62/join-visio` → 200
- [ ] POST `/api/lms/seances/62/heartbeat` → 200 (répété)
- [ ] POST `/api/lms/seances/62/leave-visio` → 200
