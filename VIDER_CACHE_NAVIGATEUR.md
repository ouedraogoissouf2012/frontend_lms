# 🔧 COMMENT VIDER LE CACHE POUR VOIR LE BOUTON "DÉMARRER LA VISIO"

## ❓ Pourquoi le bouton n'est pas visible ?

Le frontend utilise un **cache local** de 5 minutes pour améliorer les performances.
Si vous avez activé la visio **après** le dernier chargement de la page, le cache contient encore les anciennes données.

---

## ✅ SOLUTION : Vider le cache localStorage

### 🌐 **Google Chrome / Edge / Brave**

1. Sur la page Enseignant > Visioconférences, appuyer sur **F12**
2. Aller dans l'onglet **Application**
3. Dans la barre latérale gauche :
   - Cliquer sur **Local Storage**
   - Cliquer sur votre domaine (ex: `http://localhost:5173`)
4. Chercher la clé **`teacher_visio_cache`**
5. Clic droit > **Delete** (ou sélectionner et appuyer sur Delete)
6. **Rafraîchir la page** (F5 ou Ctrl+R)

---

### 🦊 **Firefox**

1. Sur la page Enseignant > Visioconférences, appuyer sur **F12**
2. Aller dans l'onglet **Storage**
3. Dans la barre latérale gauche :
   - Cliquer sur **Local Storage**
   - Cliquer sur votre domaine
4. Chercher la clé **`teacher_visio_cache`**
5. Clic droit > **Delete "teacher_visio_cache"**
6. **Rafraîchir la page** (F5 ou Ctrl+R)

---

### 🧪 **Safari**

1. Activer le menu développeur :
   - Safari > Préférences > Avancées
   - Cocher "Afficher le menu Développement"
2. Sur la page, aller dans **Développement > Afficher l'Inspecteur Web**
3. Aller dans l'onglet **Storage**
4. Cliquer sur **Local Storage** > votre domaine
5. Sélectionner la clé `teacher_visio_cache` et la supprimer
6. **Rafraîchir la page** (Cmd+R)

---

## 🔄 ALTERNATIVE : Forcer le rechargement complet

Si vous ne trouvez pas le cache localStorage, vous pouvez forcer un rechargement complet :

- **Windows** : `Ctrl + Shift + R` ou `Ctrl + F5`
- **Mac** : `Cmd + Shift + R`

⚠️ **Note** : Cela vide TOUS les caches (images, CSS, JS, localStorage)

---

## 📊 VÉRIFIER QUE CELA FONCTIONNE

Après avoir vidé le cache :

1. Ouvrir la **Console** (F12 > Console)
2. Vous devriez voir ces logs :
   ```
   [API] Chargement des visioconférences...
   [SUCCESS] X séance(s) chargée(s)
   [INFO] Y avec visio activée
   ```

3. Dans l'onglet **Network** :
   - Chercher la requête `my-teaching-seances`
   - Cliquer dessus
   - Aller dans **Response**
   - Vérifier que chaque séance contient :
     ```json
     {
       "id": 60,
       "visio_enabled": true,
       "visio_active": false,
       ...
     }
     ```

4. Le bouton **"Démarrer la visio"** devrait maintenant être visible ✅

---

## ⏰ SI VOUS NE VOULEZ PAS VIDER LE CACHE

Le cache expire automatiquement après **5 minutes**.
Attendez simplement 5 minutes et rafraîchissez la page.

---

## 🐛 SI LE PROBLÈME PERSISTE

Si le bouton n'est toujours pas visible après avoir vidé le cache :

1. Vérifier dans la **Console** (F12) s'il y a des erreurs
2. Vérifier dans **Network > my-teaching-seances** la réponse JSON
3. Copier la réponse JSON et la partager pour investigation
4. Vérifier que vous êtes bien connecté en tant qu'**enseignant**
5. Vérifier que le coordinateur a bien **activé** la visio (pas démarré)

---

## 📝 RÉSUMÉ

**Problème** : Cache frontend avec anciennes données
**Solution** : Vider `teacher_visio_cache` dans localStorage
**Temps d'expiration** : 5 minutes
**Vérification** : Console logs + Network response

