# 🧪 Tests du Store Visio

## Comment accéder aux tests

### Option 1 : Ajouter la route de test (RECOMMANDÉ)

1. **Ajouter la route** dans `src/router/index.js` :

```javascript
{
  path: '/test-visio',
  name: 'TestVisio',
  component: () => import('@/components/test/VisioStoreTest.vue')
}
```

2. **Accéder à la page** :
   - Démarrer le serveur : `npm run dev`
   - Ouvrir : `http://localhost:5173/test-visio`

---

### Option 2 : Utiliser directement dans un composant existant

Importer et utiliser le composant dans n'importe quelle page :

```vue
<template>
  <div>
    <VisioStoreTest />
  </div>
</template>

<script>
import VisioStoreTest from '@/components/test/VisioStoreTest.vue'

export default {
  components: { VisioStoreTest }
}
</script>
```

---

## Tests inclus

### ✅ Test 1 : Initialisation du Store
- Vérifie que le store Pinia est correctement créé
- Vérifie la présence de toutes les propriétés
- Vérifie l'état initial

### ✅ Test 2 : Join Visio (simulation)
- Vérifie que la méthode `joinVisio()` existe
- Vérifie la signature de la fonction
- Note : N'appelle pas réellement la méthode (nécessite une vraie séance)

### ✅ Test 3 : Système de heartbeat
- Vérifie que la méthode `sendHeartbeat()` existe
- Vérifie l'état du Worker
- Affiche l'état actuel du système

### ✅ Test 4 : Persistance navigation
- Vérifie que le store est un singleton
- Simule une navigation
- Vérifie que l'état persiste

### ✅ Test 5 : Leave Visio
- Vérifie que la méthode `leaveVisio()` existe
- Vérifie la structure de la fonction

### ✅ Test 6 : Résilience du Worker
- Vérifie le support des Web Workers
- Vérifie la configuration
- Affiche les détails techniques

---

## Fonctionnalités de test

### 🎮 Actions disponibles

1. **▶️ Lancer tous les tests**
   - Exécute les 6 tests automatiquement
   - Affiche les résultats en temps réel

2. **🗑️ Effacer les résultats**
   - Réinitialise tous les résultats
   - Efface les logs

3. **🧭 Simuler navigation**
   - Simule un changement de page
   - Vérifie que le store persiste
   - Nécessite une visio active

4. **💓 Vérifier heartbeat**
   - Envoie un heartbeat manuellement
   - Compte les heartbeats envoyés
   - Nécessite une visio active

### 📊 Indicateurs affichés

- **Tests totaux** : Nombre de tests exécutés
- **✅ Réussis** : Tests passés avec succès
- **❌ Échoués** : Tests en échec
- **⏳ En attente** : Tests non encore exécutés

### 📋 Informations en temps réel

- **activeSeanceId** : ID de la séance active (null si aucune)
- **isInVisio** : true/false selon l'état
- **Worker actif** : État du Web Worker de heartbeat

---

## Test manuel complet

### Scénario 1 : Test basique

1. Ouvrir la page de test : `http://localhost:5173/test-visio`
2. Cliquer sur "▶️ Lancer tous les tests"
3. Vérifier que tous les tests passent ✅

**Résultat attendu** : 6/6 tests réussis

---

### Scénario 2 : Test avec vraie séance

1. **Démarrer une vraie séance** :
   - Aller sur la page emploi du temps
   - Démarrer ou rejoindre une visio

2. **Ouvrir la page de test** : `http://localhost:5173/test-visio`

3. **Vérifier l'état du store** :
   - `activeSeanceId` : doit afficher l'ID de la séance
   - `isInVisio` : doit être `true`
   - `Worker actif` : doit être `true`

4. **Cliquer sur "💓 Vérifier heartbeat"**
   - Un heartbeat devrait être envoyé
   - Le compteur augmente

5. **Cliquer sur "🧭 Simuler navigation"**
   - L'état du store reste inchangé ✅
   - Les heartbeats continuent ✅

---

### Scénario 3 : Test de navigation réelle

1. **Démarrer une séance** (page emploi du temps)

2. **Ouvrir la console du navigateur** (F12)
   - Vérifier les logs : `[VisioStore] 💓 Heartbeat envoyé`

3. **Naviguer vers Dashboard**
   - Cliquer sur "Dashboard" dans le menu

4. **Vérifier dans la console**
   - Les heartbeats continuent toutes les 30s ✅
   - Pas de log `💔 Worker arrêté` ✅

5. **Ouvrir la page de test** : `http://localhost:5173/test-visio`
   - `isInVisio` : toujours `true` ✅
   - `Worker actif` : toujours `true` ✅

---

## Vérification backend

Pendant les tests, vérifier côté backend :

```bash
# Terminal 1 : Monitoring en temps réel
php watch_heartbeats.php

# Terminal 2 : Vérification ponctuelle
php check_marcel_status.php
```

**Attendu** :
- Status : `connected`
- `last_seen_at` : mis à jour toutes les 30s
- Heartbeats continuent même après navigation

---

## Logs attendus dans la console

### Démarrage de la visio
```
[VisioStore] 💓 Worker démarré
[VisioStore] 💓 Heartbeat envoyé (séance 35)
```

### Pendant la navigation (toutes les 30s)
```
[VisioStore] 💓 Heartbeat envoyé (séance 35)
[VisioStore] 💓 Heartbeat envoyé (séance 35)
[VisioStore] 💓 Heartbeat envoyé (séance 35)
```

### ❌ Log à NE PAS voir lors de la navigation
```
[VisioStore] 💔 Worker terminé    ← ❌ NE DOIT PAS apparaître lors de la navigation
[VisioStore] Quitter séance 35    ← ❌ NE DOIT PAS apparaître lors de la navigation
```

Ces logs ne doivent apparaître que lors d'une vraie déconnexion (fermeture navigateur, clic sur "Quitter").

---

## Troubleshooting

### ❌ Erreur : "Store non trouvé"

**Solution** : Vérifier que Pinia est bien configuré dans `main.js` :

```javascript
import { createPinia } from 'pinia'
app.use(createPinia())
```

### ❌ Erreur : "Worker non supporté"

**Cause** : Les Web Workers ne fonctionnent pas en développement sur certains navigateurs.

**Solution** : Tester en production ou utiliser le fallback `setInterval`.

### ⚠️ Warning : "État initial non vide"

**Cause** : Une session est déjà en cours (normal si vous avez rejoint une visio).

**Action** : Aucune, c'est un comportement normal.

---

## Structure du composant de test

```
VisioStoreTest.vue
├── Template
│   ├── Statistiques (4 cartes)
│   ├── État du Store (3 propriétés)
│   ├── Actions (4 boutons)
│   ├── Résultats des tests (liste)
│   └── Console logs (temps réel)
│
├── Script
│   ├── Tests automatisés (6 tests)
│   ├── Actions manuelles (4 méthodes)
│   └── Interception console
│
└── Style
    └── UI moderne et responsive
```

---

## Prochaines étapes

1. ✅ Tests unitaires créés
2. ⏳ Ajouter la route de test
3. ⏳ Exécuter les tests
4. ⏳ Vérifier avec une vraie séance
5. ⏳ Tester la navigation réelle
6. ⏳ Valider côté backend

---

## Notes importantes

- Les tests sont **non destructifs** (ne modifient pas les données réelles)
- Les tests avec vraie séance nécessitent un **backend actif**
- Le composant de test peut rester en production (accessible uniquement par URL directe)
- Les logs sont automatiquement capturés et affichés dans l'interface
