# 🌐 DÉPLOIEMENT SUR cPANEL - Guide Complet

**Mettre votre application en ligne**

---

## 📋 CE DONT VOUS AVEZ BESOIN

- ✅ Accès cPanel (hébergement web)
- ✅ Votre backend Laravel
- ✅ Votre frontend Vue.js compilé
- ✅ 30-45 minutes

---

## 🎯 ARCHITECTURE FINALE

```
https://votre-domaine.com           → Frontend Vue.js
https://api.votre-domaine.com/api   → Backend Laravel
```

Ou :

```
https://votre-domaine.com           → Frontend Vue.js
https://votre-domaine.com/backend/api → Backend Laravel (sous-dossier)
```

---

## 📦 PARTIE 1 : PRÉPARER LE FRONTEND (Sur votre PC)

### 1. Modifier le fichier `.env`

Dans `lms-frontend/.env`, changez :

```env
# AVANT (développement)
VITE_API_URL=http://localhost:8000/api

# APRÈS (production)
VITE_API_URL=https://api.votre-domaine.com/api
```

**⚠️ Remplacez par votre VRAI domaine !**

### 2. Compiler le frontend

```bash
cd "c:\Users\USER PC\Documents\propre à moi\lms-frontend"
npm run build
```

⏳ Attendez 30-60 secondes...

✅ **Un dossier `dist/` est créé** avec vos fichiers compilés !

### 3. Compresser le dossier `dist/`

- Clic droit sur le dossier `dist/`
- **Envoyer vers** → **Dossier compressé**
- Vous obtenez `dist.zip`

---

## 🔧 PARTIE 2 : PRÉPARER LE BACKEND (Sur votre PC)

### 1. Modifier `.env` pour la production

Dans `lms-backend/.env` :

```env
APP_ENV=production
APP_DEBUG=false
APP_URL=https://api.votre-domaine.com

DB_CONNECTION=mysql
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=votre_base_de_donnees
DB_USERNAME=votre_utilisateur
DB_PASSWORD=votre_mot_de_passe

# KLASSCI (gardez vos vraies clés)
KLASSCI_CLIENT_ID=votre_client_id
KLASSCI_CLIENT_SECRET=votre_client_secret
```

### 2. Optimiser Laravel

```bash
cd "c:\Users\USER PC\Documents\propre à moi\lms-backend"

# Nettoyer les caches
php artisan config:clear
php artisan cache:clear
php artisan route:clear
php artisan view:clear

# Optimiser pour la production
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### 3. Compresser tout le projet backend

- Sélectionnez TOUS les fichiers du dossier `lms-backend/`
- Clic droit → **Envoyer vers** → **Dossier compressé**
- Vous obtenez `lms-backend.zip`

---

## 🌐 PARTIE 3 : DÉPLOYER SUR cPANEL

### ÉTAPE A : UPLOADER LE BACKEND

**1. Se connecter à cPanel**

- Allez sur `https://votre-hebergeur.com/cpanel`
- Connectez-vous

**2. Ouvrir le Gestionnaire de fichiers**

- Trouvez **"File Manager"** ou **"Gestionnaire de fichiers"**
- Cliquez dessus

**3. Créer un dossier pour le backend**

Option 1 (sous-domaine) :
- Allez dans `/home/votre_user/`
- Créez un dossier `api` ou `backend`

Option 2 (sous-dossier) :
- Allez dans `/public_html/`
- Créez un dossier `backend`

**4. Uploader `lms-backend.zip`**

- Entrez dans le dossier créé
- Cliquez sur **"Upload"** en haut
- Sélectionnez `lms-backend.zip`
- Attendez la fin de l'upload

**5. Décompresser**

- Clic droit sur `lms-backend.zip`
- **"Extract"** ou **"Extraire"**
- Supprimer le `.zip` après

**6. Configurer les permissions**

- Sélectionnez le dossier `storage/`
- Clic droit → **"Permissions"** ou **"Chmod"**
- Mettez **755** ou **775**
- Cochez **"Récursif"**
- Appliquez

Faites pareil pour `bootstrap/cache/`

**7. Créer la base de données**

- Retournez au tableau de bord cPanel
- Trouvez **"MySQL Databases"** ou **"Bases de données MySQL"**
- Créez une nouvelle base (ex: `lms_db`)
- Créez un utilisateur (ex: `lms_user`)
- Donnez TOUS les privilèges à cet utilisateur
- **NOTEZ** : nom de la base, nom d'utilisateur, mot de passe

**8. Modifier le `.env` sur le serveur**

- Retournez au Gestionnaire de fichiers
- Allez dans votre dossier backend
- Trouvez le fichier `.env`
- Clic droit → **"Edit"** ou **"Modifier"**
- Mettez les infos de la base de données que vous venez de créer :

```env
DB_DATABASE=lms_db
DB_USERNAME=lms_user
DB_PASSWORD=le_mot_de_passe_choisi
```

- Sauvegardez

**9. Lancer les migrations**

Option 1 (si vous avez SSH) :
```bash
cd /home/votre_user/api
php artisan migrate --force
```

Option 2 (sans SSH) :
- Importez votre base de données via **phpMyAdmin**
- Exportez d'abord votre base locale depuis votre PC
- Importez-la dans la base créée sur cPanel

**10. Configurer le sous-domaine (si option 1)**

- Retournez au tableau de bord cPanel
- Trouvez **"Subdomains"** ou **"Sous-domaines"**
- Créez `api.votre-domaine.com`
- Document Root : `/home/votre_user/api/public`
- Sauvegardez

---

### ÉTAPE B : UPLOADER LE FRONTEND

**1. Dans le Gestionnaire de fichiers**

- Allez dans `/public_html/`
- **SUPPRIMEZ** les fichiers par défaut (index.html, etc.)

**2. Uploader `dist.zip`**

- Uploadez le fichier `dist.zip`
- Décompressez-le
- **IMPORTANT** : Les fichiers doivent être à la RACINE de `public_html/`

Vous devriez avoir :
```
public_html/
├── index.html       ← De votre dist/
├── assets/
│   ├── index-xxx.js
│   └── index-xxx.css
└── backend/         ← Si vous avez mis le backend ici
```

**3. Créer/Modifier `.htaccess`**

Dans `public_html/`, créez un fichier `.htaccess` :

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /

  # Si le fichier existe, le servir
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d

  # Sinon, rediriger vers index.html (pour Vue Router)
  RewriteRule . /index.html [L]
</IfModule>
```

---

## 🔧 PARTIE 4 : CONFIGURER CORS (Backend)

Dans `lms-backend/config/cors.php` :

```php
return [
    'paths' => ['api/*'],
    'allowed_methods' => ['*'],
    'allowed_origins' => [
        'https://votre-domaine.com',  // Votre frontend
        'http://localhost:5173',       // Pour le dev local
    ],
    'allowed_headers' => ['*'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true,
];
```

---

## ✅ PARTIE 5 : TESTER

### 1. Tester le backend seul

Allez sur : `https://api.votre-domaine.com/api/ping`

✅ Devrait retourner :
```json
{
  "success": true,
  "message": "LMS API is running",
  "version": "1.0.0"
}
```

### 2. Tester le frontend

Allez sur : `https://votre-domaine.com`

✅ Devrait afficher la page de login

### 3. Tester la connexion complète

1. Essayez de vous connecter
2. Si ça marche → **PARFAIT ! ✅**
3. Si erreur → Voir section Dépannage

---

## 🐛 DÉPANNAGE

### Erreur 500 (Backend)

**Vérifiez** :
- Le fichier `.env` est bien configuré
- La base de données existe
- Les permissions sur `storage/` et `bootstrap/cache/` sont à 755

**Solution** :
- Activez temporairement le debug : `APP_DEBUG=true` dans `.env`
- Rechargez la page
- Regardez l'erreur détaillée
- **N'OUBLIEZ PAS** de remettre `APP_DEBUG=false` après !

### Erreur 404 sur les routes Vue

**Problème** : Le `.htaccess` ne fonctionne pas

**Solution** :
- Vérifiez que `mod_rewrite` est activé (demandez à votre hébergeur)
- Vérifiez que le `.htaccess` est bien dans `public_html/`

### CORS Error (Frontend ne peut pas appeler Backend)

**Erreur** : `Access to XMLHttpRequest blocked by CORS policy`

**Solution** :
1. Vérifiez `config/cors.php` dans le backend
2. Ajoutez votre domaine frontend dans `allowed_origins`
3. Videz le cache : `php artisan config:cache`

### "API URL not found"

**Problème** : Le frontend ne trouve pas le backend

**Solution** :
- Vérifiez le fichier `.env` du frontend
- Recompilez : `npm run build`
- Ré-uploadez le `dist/`

---

## 🎯 CHECKLIST FINALE

### Backend ✅
- [ ] Fichiers uploadés et décompressés
- [ ] `.env` configuré (base de données, APP_URL)
- [ ] Base de données créée et migrée
- [ ] Permissions `storage/` et `bootstrap/cache/` à 755
- [ ] `/api/ping` fonctionne

### Frontend ✅
- [ ] `.env` configuré avec la bonne URL d'API
- [ ] **`VITE_JITSI_DOMAIN` renseigné** — obligatoire depuis #327, sans défaut.
      Omis, le build réussit mais **toute ouverture de salle échoue** : le repli
      silencieux vers `meet.jit.si` a été supprimé, parce qu'il envoyait la
      classe chez un opérateur public sans contrat.
- [ ] `npm run build` exécuté
- [ ] Fichiers du `dist/` uploadés dans `public_html/`
- [ ] `.htaccess` créé
- [ ] Page d'accueil s'affiche

### Connexion ✅
- [ ] Login fonctionne
- [ ] Dashboard s'affiche
- [ ] Les données du backend s'affichent
- [ ] Pas d'erreurs dans la console (F12)

---

## 📱 BONUS : SSL (HTTPS)

La plupart des hébergeurs offrent **SSL gratuit** (Let's Encrypt) :

1. Dans cPanel, cherchez **"SSL/TLS"** ou **"Let's Encrypt"**
2. Sélectionnez votre domaine
3. Cliquez sur **"Installer SSL"**
4. Attendez 5-10 minutes
5. Votre site est maintenant en **HTTPS** ! 🔒

---

## 🚀 APRÈS LA PRÉSENTATION

Si vous devez mettre à jour :

### Mettre à jour le frontend :
```bash
npm run build
# Re-uploadez le dossier dist/
```

### Mettre à jour le backend :
- Uploadez seulement les fichiers modifiés
- Ne touchez PAS au `.env` de production
- Si modif de routes : `php artisan route:cache`
- Si modif de config : `php artisan config:cache`

---

**🎉 FÉLICITATIONS ! Votre application est en ligne ! 🌐**
