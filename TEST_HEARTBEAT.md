# 🧪 Guide de test - Web Worker Heartbeat

## ✅ Résultat du diagnostic backend

Le système de heartbeat et timeout fonctionne correctement :
- ✅ Heartbeats arrivent au serveur
- ✅ `last_seen_at` est mis à jour
- ✅ Timeout après 3 minutes d'inactivité fonctionne
- ✅ MARCEL OUEDRAOGO a été correctement déconnecté après 3 minutes

## 🎯 Objectif des tests

Vérifier que le nouveau système avec **Web Worker** :
1. Continue d'envoyer des heartbeats même si l'onglet est inactif
2. Envoie un heartbeat immédiat au retour sur l'onglet
3. Envoie `leaveVisio` avec Beacon API en fermeture brutale

---

## Test 1 : Vérifier que le Web Worker démarre

### Étapes :
1. Ouvrir la console navigateur (F12)
2. Se connecter en tant qu'**enseignant** ou **étudiant**
3. Aller sur une séance avec visio active
4. Cliquer sur **"Démarrer"** (enseignant) ou **"Rejoindre"** (étudiant)

### Résultat attendu dans la console :
```
[useVisioParticipation] Rejoindre séance 62
[useVisioParticipation] 💓 Worker démarré (Web Worker, 30s)
[useVisioParticipation] 💓 Heartbeat envoyé (séance 62)
```

### Si vous voyez ces messages → ✅ Test réussi

---

## Test 2 : Heartbeat continue en arrière-plan (30 secondes)

### Étapes :
1. Après avoir démarré/rejoint la visio (Test 1)
2. **Garder la console ouverte**
3. **Attendre 30 secondes**

### Résultat attendu :
```
[useVisioParticipation] 💓 Heartbeat envoyé (séance 62)  ← Toutes les 30s
[useVisioParticipation] 💓 Heartbeat envoyé (séance 62)
[useVisioParticipation] 💓 Heartbeat envoyé (séance 62)
```

### Si vous voyez ces messages toutes les 30s → ✅ Test réussi

---

## Test 3 : Heartbeat continue même si on change d'onglet

### Étapes :
1. Après avoir démarré/rejoint la visio
2. **Ouvrir un nouvel onglet** (ex: Google, YouTube)
3. **Rester 2 minutes sur le nouvel onglet** (ne PAS revenir sur le LMS)
4. Revenir sur l'onglet LMS avec la console ouverte

### Résultat attendu :
Vous devriez voir que les heartbeats ont continué pendant votre absence :
```
[useVisioParticipation] 💓 Heartbeat envoyé (séance 62)  ← Avant de changer d'onglet
[useVisioParticipation] 💓 Heartbeat envoyé (séance 62)  ← 30s après (vous étiez ailleurs)
[useVisioParticipation] 💓 Heartbeat envoyé (séance 62)  ← 60s après (vous étiez ailleurs)
[useVisioParticipation] 💓 Heartbeat envoyé (séance 62)  ← 90s après (vous étiez ailleurs)
[useVisioParticipation] 👁️ Retour sur onglet, heartbeat immédiat  ← Quand vous revenez
[useVisioParticipation] 💓 Heartbeat envoyé (séance 62)
```

### Si vous voyez que les heartbeats ont continué → ✅ Test réussi

---

## Test 4 : Page Visibility API (heartbeat immédiat au retour)

### Étapes :
1. Après avoir démarré/rejoint la visio
2. Changer d'onglet pendant 10 secondes
3. **Revenir sur l'onglet LMS**

### Résultat attendu :
Dès que vous revenez, vous devriez voir :
```
[useVisioParticipation] 👁️ Retour sur onglet, heartbeat immédiat
[useVisioParticipation] 💓 Heartbeat envoyé (séance 62)
```

### Si vous voyez le message "👁️ Retour sur onglet" → ✅ Test réussi

---

## Test 5 : Beacon API (leaveVisio en fermeture brutale)

### Étapes :
1. Après avoir démarré/rejoint la visio
2. **Fermer brutalement l'onglet** (clic sur X, sans cliquer sur "Quitter")
3. Attendre 5 secondes
4. Exécuter le diagnostic backend :
   ```bash
   cd lms-backend
   php diagnostic_heartbeat.php
   ```

### Résultat attendu :
Vous devriez voir que votre participation a `left_at` rempli :
```
User #X (Votre Nom) - Status: disconnected - Joined: HH:MM:SS - Left: HH:MM:SS
```

### Si `left_at` est rempli malgré la fermeture brutale → ✅ Test réussi

---

## Test 6 : Vérifier dans la base de données

### Commande SQL :
```sql
SELECT
    u.name,
    ea.status,
    ea.joined_at,
    ea.last_seen_at,
    ea.left_at,
    TIMESTAMPDIFF(MINUTE, ea.last_seen_at, NOW()) as minutes_since_last_heartbeat
FROM esbtp_attendance ea
JOIN users u ON ea.user_id = u.id
WHERE ea.status = 'connected'
ORDER BY ea.joined_at DESC;
```

### Résultat attendu :
- `last_seen_at` doit être mis à jour **toutes les 30 secondes**
- `minutes_since_last_heartbeat` doit être **0** ou **1** si l'utilisateur est actif

---

## Test 7 : Timeout automatique (3 minutes)

### Étapes :
1. Démarrer/rejoindre la visio
2. **Fermer la fenêtre Jitsi** (mais garder l'onglet LMS ouvert)
3. **Ne rien faire pendant 3 minutes**
4. Exécuter le diagnostic :
   ```bash
   php diagnostic_heartbeat.php
   ```

### Résultat attendu :
- Si la fenêtre Jitsi est fermée, le composable doit appeler `leaveVisio()` automatiquement
- Vous devriez être marqué comme `disconnected` immédiatement
- **PAS besoin d'attendre 3 minutes** si vous fermez Jitsi proprement

---

## 📊 Checklist finale

Cochez ce qui fonctionne :

- [ ] Test 1 : Web Worker démarre (💓 Worker démarré)
- [ ] Test 2 : Heartbeat toutes les 30s
- [ ] Test 3 : Heartbeat continue en arrière-plan
- [ ] Test 4 : Heartbeat immédiat au retour (👁️)
- [ ] Test 5 : Beacon API fonctionne (left_at rempli)
- [ ] Test 6 : last_seen_at mis à jour en BDD
- [ ] Test 7 : Timeout après 3 min d'inactivité

---

## 🔧 Si un test échoue

### Heartbeat ne démarre pas :
- Vérifier la console : Y a-t-il une erreur ?
- Vérifier que `heartbeat-worker.js` existe dans `public/`
- Rafraîchir la page avec Ctrl+Shift+R (vider le cache)

### Heartbeat s'arrête en arrière-plan :
- Vérifier que le Worker n'a pas crashé
- Vérifier les erreurs dans la console
- Tester avec un autre navigateur (Chrome, Firefox, Edge)

### Beacon API ne fonctionne pas :
- Vérifier que le token est dans localStorage
- Vérifier que l'URL API est correcte dans `.env`
- Vérifier les logs backend : `tail -f storage/logs/laravel.log`

---

## 📝 Rapport de test

Une fois tous les tests effectués, notez :
- ✅ Tests réussis : _____ / 7
- ❌ Tests échoués : _____
- 🔧 Problèmes identifiés : _____
