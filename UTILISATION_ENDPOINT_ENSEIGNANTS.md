# 📚 Utilisation de l'Endpoint Enseignants LMS

## Vue d'ensemble

L'endpoint `/api/lms/enseignants` permet de récupérer la liste des enseignants avec leurs classes, matières enseignées et statistiques de volume horaire.

## Deux endpoints disponibles

### 1. `/api/proxy/enseignants` - Format simple et rapide
**Utilisation:** Liste basique des enseignants
- Retourne uniquement les informations de base (nom, email, rôle)
- Très rapide (~10ms)
- Utilise la table `users` locale en fallback si KLASSCI ne répond pas

**Quand l'utiliser:**
- Dropdown de sélection d'enseignant
- Liste simple sans détails
- Recherche rapide

### 2. `/api/lms/enseignants` - Format enrichi complet
**Utilisation:** Données complètes avec classes, matières et statistiques
- Retourne classes enseignées, matières, heures, séances
- Plus lent (~30-50ms selon le nombre d'enseignants)
- Nécessite MySQL + tables KLASSCI (esbtp_*)

**Quand l'utiliser:**
- Dashboard enseignant avec statistiques
- Planification académique
- Suivi du volume horaire
- Rapports de charge de travail

## 🔧 Utilisation dans le Frontend

### Import du service

```javascript
import klassciService from '@/services/klassci'
```

### Format simple (rapide)

```javascript
// Sans détails - juste la liste de base
const response = await klassciService.getLmsEnseignants()

// Résultat:
// {
//   success: true,
//   data: [
//     {
//       id: 1634,
//       teacher_id: 1,
//       nom: "KOUASSI Jean",
//       email: "kouassi.jean@esbtp.ci",
//       role: "enseignant",
//       matricule: "ENS1634",
//       specialization: "Mathématiques et Physique",
//       status: "permanent"
//     }
//   ]
// }
```

### Format enrichi (avec détails)

```javascript
// Avec tous les détails
const response = await klassciService.getLmsEnseignants({
  with_details: true
})

// Résultat:
// {
//   success: true,
//   data: [
//     {
//       id: 1634,
//       teacher_id: 1,
//       nom: "KOUASSI Jean",
//       email: "kouassi.jean@esbtp.ci",
//       role: "enseignant",
//       matricule: "ENS1634",
//       specialization: "Mathématiques et Physique",
//       status: "permanent",
//
//       classes: [
//         {
//           id: 15,
//           nom: "L3 GC - 2024/2025",
//           filiere: { id: 1, nom: "Génie Civil" },
//           niveau: { id: 3, nom: "Licence 3" }
//         }
//       ],
//
//       matieres: [
//         {
//           id: 42,
//           nom: "Mathématiques Appliquées",
//           code: "MATH301",
//           heures_prevues: 40,
//           heures_effectuees: 28,
//           heures_restantes: 12,
//           taux_realisation: 70,
//           nb_seances_total: 20,
//           nb_seances_effectuees: 14,
//           classes: [...],
//           seances: [...]
//         }
//       ],
//
//       statistiques: {
//         total_classes: 3,
//         total_matieres: 5,
//         total_heures_prevues: 120,
//         total_heures_effectuees: 85,
//         total_heures_restantes: 35,
//         taux_realisation_global: 70.83,
//         nb_seances_total: 60,
//         nb_seances_effectuees: 42
//       }
//     }
//   ]
// }
```

### Avec filtres

```javascript
// Enseignants qui enseignent en Génie Civil Licence 3
const response = await klassciService.getLmsEnseignants({
  with_details: true,
  filiere_id: 1,
  niveau_id: 3
})

// Enseignants d'une classe spécifique
const response = await klassciService.getLmsEnseignants({
  with_details: true,
  classe_id: 15
})

// Enseignants qui enseignent une matière spécifique
const response = await klassciService.getLmsEnseignants({
  with_details: true,
  matiere_id: 42
})
```

## 🎨 Exemple de composant Vue

Voir le fichier: `src/components/enseignants/EnseignantsListExample.vue`

### Utilisation simple

```vue
<template>
  <div>
    <EnseignantsListExample />
  </div>
</template>

<script>
import EnseignantsListExample from '@/components/enseignants/EnseignantsListExample.vue'

export default {
  components: {
    EnseignantsListExample
  }
}
</script>
```

### Exemple inline

```vue
<template>
  <div class="enseignants-dashboard">
    <h2>Enseignants</h2>

    <div v-if="loading">Chargement...</div>
    <div v-else-if="error">{{ error }}</div>

    <div v-else>
      <div v-for="enseignant in enseignants" :key="enseignant.id">
        <h3>{{ enseignant.nom }}</h3>

        <!-- Statistiques si disponibles -->
        <div v-if="enseignant.statistiques">
          <p>Classes: {{ enseignant.statistiques.total_classes }}</p>
          <p>Matières: {{ enseignant.statistiques.total_matieres }}</p>
          <p>Heures: {{ enseignant.statistiques.total_heures_effectuees }} / {{ enseignant.statistiques.total_heures_prevues }}</p>
          <p>Taux réalisation: {{ enseignant.statistiques.taux_realisation_global.toFixed(1) }}%</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import klassciService from '@/services/klassci'

export default {
  data() {
    return {
      loading: false,
      error: null,
      enseignants: []
    }
  },

  async mounted() {
    try {
      this.loading = true
      const response = await klassciService.getLmsEnseignants({
        with_details: true
      })

      if (response.success) {
        this.enseignants = response.data
      }
    } catch (err) {
      this.error = err.message
    } finally {
      this.loading = false
    }
  }
}
</script>
```

## ⚙️ Configuration requise

### Backend (Laravel)

**Mode développement (SQLite):**
L'endpoint retournera une erreur 503 avec le message:
```json
{
  "success": false,
  "message": "Cet endpoint nécessite une base de données avec les tables KLASSCI (esbtp_*). Actuellement en mode SQLite de développement."
}
```

**Mode production (MySQL):**
Modifier `.env`:
```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=lms_klassci
DB_USERNAME=root
DB_PASSWORD=your_password
```

### Tables requises

- `esbtp_teachers` - Enseignants
- `esbtp_seance_cours` - Séances de cours
- `esbtp_emploi_temps` - Emplois du temps
- `esbtp_classes` - Classes
- `esbtp_combinaisons` - Combinaisons filière/niveau
- `esbtp_filieres` - Filières
- `esbtp_niveaux` - Niveaux d'études
- `esbtp_matieres` - Matières
- `esbtp_teacher_attendances` - Présences enseignants
- `esbtp_enseignant_matiere` (optionnel) - Pivot enseignant-matière
- `esbtp_planifications_academiques` (optionnel) - Planifications
- `esbtp_annee_universitaires` (optionnel) - Années universitaires

## 📊 Cas d'usage

### 1. Dashboard enseignant

```javascript
// Afficher les stats de l'enseignant connecté
const response = await klassciService.getLmsEnseignants({
  with_details: true,
  teacher_id: currentUser.teacher_id // Filtrer par teacher_id si disponible
})

const enseignant = response.data[0]
// Afficher: classes, matières, heures, taux réalisation
```

### 2. Planning - Enseignants d'une classe

```javascript
// Liste des enseignants qui enseignent dans la classe L3 GC
const response = await klassciService.getLmsEnseignants({
  with_details: true,
  classe_id: 15
})

// Afficher chaque enseignant avec sa matière et son horaire
```

### 3. Statistiques - Charge de travail par filière

```javascript
// Enseignants de Génie Civil
const response = await klassciService.getLmsEnseignants({
  with_details: true,
  filiere_id: 1
})

// Calculer charge totale, moyenne heures/enseignant, etc.
```

### 4. Coordination matière

```javascript
// Tous les enseignants qui enseignent Mathématiques
const response = await klassciService.getLmsEnseignants({
  with_details: true,
  matiere_id: 42
})

// Coordination entre enseignants, harmonisation contenu
```

## 🔍 Gestion des erreurs

```javascript
try {
  const response = await klassciService.getLmsEnseignants({
    with_details: true
  })

  if (!response.success) {
    // Endpoint en mode développement SQLite
    if (response.message.includes('SQLite')) {
      console.warn('Mode développement: utiliser /proxy/enseignants à la place')
      // Fallback vers endpoint simple
      const fallback = await klassciService.getEnseignants()
      this.enseignants = fallback
    } else {
      this.error = response.message
    }
  } else {
    this.enseignants = response.data
  }
} catch (err) {
  console.error('Erreur chargement enseignants:', err)
  this.error = err.message
}
```

## 📝 Notes importantes

1. **Performance:**
   - Format simple: ~14ms
   - Format enrichi: ~30-50ms (selon nombre d'enseignants)

2. **Cache:**
   - Pas de cache côté backend actuellement
   - Implémenter cache côté frontend si besoin (Vuex/Pinia)

3. **Année universitaire:**
   - L'endpoint filtre automatiquement par année courante si disponible
   - Sinon retourne toutes les données historiques

4. **Fallback:**
   - En développement SQLite: utiliser `/proxy/enseignants` à la place
   - En production MySQL: utiliser `/lms/enseignants` pour données complètes

## 🚀 Migration progressive

Ancienne méthode (toujours disponible):
```javascript
const enseignants = await klassciService.getEnseignants()
// Retourne liste simple via /proxy/enseignants
```

Nouvelle méthode (recommandée pour données enrichies):
```javascript
const response = await klassciService.getLmsEnseignants({ with_details: true })
const enseignants = response.data
// Retourne liste enrichie via /lms/enseignants
```

Pas besoin de période de transition, les deux endpoints coexistent.
