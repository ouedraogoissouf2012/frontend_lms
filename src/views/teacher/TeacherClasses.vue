<template>
  <DashboardLayout>
    <div class="classes-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mes Classes</h1>
          <p class="page-subtitle">Consultez vos classes et leurs etudiants</p>
        </div>
        <router-link to="/teacher/hub" class="btn-back">
          <i class="fa fa-arrow-left"></i>
          Retour a Mon Espace
        </router-link>
      </div>

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement des classes..." />

      <!-- Error state -->
      <div v-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadClasses" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <!-- Classes Grid -->
      <div v-if="!loading && !error && classes.length > 0" class="classes-grid">
        <div
          v-for="classe in classes"
          :key="classe.id"
          class="class-card"
          :title="`Classe: ${classe.name || classe.libelle}`"
        >
          <div class="class-header">
            <div class="class-info">
              <h3 class="class-name" :title="`Nom de la classe: ${classe.name || classe.libelle}`">
                {{ classe.name || classe.libelle }}
              </h3>
              <span
                v-if="classe.niveau"
                class="class-niveau"
                :title="`Niveau: ${classe.niveau.name || classe.niveau.nom || classe.niveau.libelle}`"
              >
                {{ classe.niveau.name || classe.niveau.nom || classe.niveau.libelle }}
              </span>
            </div>
            <span
              v-if="classe.is_active"
              class="active-badge"
              title="Classe active pour l'année en cours"
            >
              <span class="pulse-dot"></span>
              Active
            </span>
          </div>

          <div
            v-if="classe.filiere"
            class="class-filiere"
            :title="`Filière: ${classe.filiere.name || classe.filiere.nom} (${classe.filiere.code || 'N/A'})`"
          >
            <AcademicCapIcon class="filiere-icon" />
            <div>
              <p class="filiere-name">{{ classe.filiere.name || classe.filiere.nom }}</p>
              <p v-if="classe.filiere.code" class="filiere-code">Code: {{ classe.filiere.code }}</p>
            </div>
          </div>

          <div class="class-stats">
            <div
              class="stat-item"
              :title="`${classe.places_occupees || 0} étudiants inscrits sur ${classe.places_totales || 0} places disponibles`"
            >
              <UserGroupIcon class="stat-icon text-blue-600" />
              <div>
                <p class="stat-label">Étudiants</p>
                <p class="stat-value">{{ classe.places_occupees || 0 }}/{{ classe.places_totales || 0 }}</p>
              </div>
            </div>

            <div
              class="stat-item"
              :title="`${classe.nb_matieres || 0} matière(s) enseignée(s) dans cette classe`"
            >
              <BookOpenIcon class="stat-icon text-orange-600" />
              <div>
                <p class="stat-label">Matières</p>
                <p class="stat-value">{{ classe.nb_matieres || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="class-actions">
            <div class="info-badge" :title="`Afficher les détails de ${classe.name || classe.libelle}`">
              <EyeIcon class="w-5 h-5" />
              <span>{{ classe.name || classe.libelle }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading && !error" class="empty-state">
        <div class="empty-icon-wrapper">
          <BuildingLibraryIcon class="empty-icon" />
        </div>
        <h3 class="empty-title">Aucune classe assignée</h3>
        <p class="empty-description">
          Vous n'avez pas encore de classes assignées.<br>
          Contactez votre coordinateur pour plus d'informations.
        </p>
        <button @click="loadClasses" class="btn-reload">
          Actualiser
        </button>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { klassciService } from '@/services/klassci'
import { readCache, writeCache } from '@/services/cache'
import {
  BuildingLibraryIcon,
  UserGroupIcon,
  BookOpenIcon,
  AcademicCapIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

const classes = ref([])
const loading = ref(false)
const error = ref(null)

async function loadClasses() {
  // Vérifier le cache
  const cachedData = readCache('teacher_classes')
  if (cachedData !== null) {
    console.log('[CACHE] Classes chargées depuis le cache')
    classes.value = cachedData
    loading.value = false
    // Rafraîchir en arrière-plan
    refreshInBackground()
    return
  }

  loading.value = true
  error.value = null

  try {
    console.log('[CLASSES] Chargement des classes enseignant...')
    // Utiliser getClasses() et getMatieres() pour support coordinateur
    const [rawClasses, dashboardMatieres] = await Promise.all([
      klassciService.getClasses(),
      klassciService.getMatieres()
    ])

    console.log('[CLASSES] Classes brutes:', rawClasses.length)
    console.log('[CLASSES] Matières disponibles:', dashboardMatieres.length)

    // Debug: afficher la structure d'une matière pour comprendre le lien avec les classes
    if (dashboardMatieres.length > 0) {
      console.log('[DEBUG] Structure d\'une matière:', dashboardMatieres[0])
    }
    if (rawClasses.length > 0) {
      console.log('[DEBUG] Structure d\'une classe:', rawClasses[0])
    }

    // Enrichir chaque classe avec les compteurs
    const enrichedClasses = await Promise.all(
      rawClasses.map(async (classe) => {
        try {
          // Récupérer les étudiants de la classe
          const etudiants = await klassciService.getClasseEtudiants(classe.id)
          const nbEtudiants = etudiants?.length || 0

          // SOLUTION SIMPLE: teacher-dashboard retourne déjà les matières de l'enseignant
          // Comme les matières KLASSCI n'ont pas de lien direct avec les classes,
          // on affiche toutes les matières pour chaque classe
          const nbMatieres = dashboardMatieres.length

          // Déterminer places_totales
          const placesTotales = classe.effectif_max ||
                                classe.capacite ||
                                classe.places_totales ||
                                classe.effectif ||
                                (nbEtudiants > 0 ? Math.max(nbEtudiants, 30) : 30)

          console.log(`[CLASSE ${classe.id} "${classe.name}"] Étudiants: ${nbEtudiants}/${placesTotales}, Matières: ${nbMatieres}`)

          return {
            ...classe,
            places_occupees: nbEtudiants,
            places_totales: placesTotales,
            nb_matieres: nbMatieres
          }
        } catch (err) {
          console.warn(`[WARN] Impossible d'enrichir classe ${classe.id}:`, err.message)
          return {
            ...classe,
            places_occupees: 0,
            places_totales: 30,
            nb_matieres: dashboardMatieres.length
          }
        }
      })
    )

    classes.value = enrichedClasses

    // Mettre en cache
    writeCache('teacher_classes', classes.value)

    console.log('[OK] Classes enrichies:', classes.value)
  } catch (err) {
    console.error('[ERREUR] Erreur chargement classes:', err)
    error.value = 'Impossible de charger vos classes. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}

async function refreshInBackground() {
  try {
    console.log('[BACKGROUND] Rafraîchissement des classes...')
    // Utiliser getClasses() et getMatieres() pour support coordinateur
    const [rawClasses, dashboardMatieres] = await Promise.all([
      klassciService.getClasses(),
      klassciService.getMatieres()
    ])

    // Enrichir chaque classe avec les compteurs
    const enrichedClasses = await Promise.all(
      rawClasses.map(async (classe) => {
        try {
          const etudiants = await klassciService.getClasseEtudiants(classe.id)
          const nbEtudiants = etudiants?.length || 0

          const nbMatieres = dashboardMatieres.length

          const placesTotales = classe.effectif_max ||
                                classe.capacite ||
                                classe.places_totales ||
                                classe.effectif ||
                                (nbEtudiants > 0 ? Math.max(nbEtudiants, 30) : 30)

          return {
            ...classe,
            places_occupees: nbEtudiants,
            places_totales: placesTotales,
            nb_matieres: nbMatieres
          }
        } catch (err) {
          return {
            ...classe,
            places_occupees: 0,
            places_totales: 30,
            nb_matieres: dashboardMatieres.length
          }
        }
      })
    )

    classes.value = enrichedClasses

    writeCache('teacher_classes', classes.value)

    console.log('[BACKGROUND] Classes rafraîchies')
  } catch (error) {
    console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
  }
}

onMounted(() => {
  loadClasses()
})
</script>

<style scoped>
.classes-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  gap: 1rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.btn-back {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  text-decoration: none;
  transition: all 0.2s;
  border: 1px solid var(--border-primary);
}

.btn-back:hover {
  background: var(--bg-hover);
  border-color: var(--primary-color, #3b82f6);
  color: var(--primary-color, #3b82f6);
}

.classes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.class-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.class-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-2px);
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.class-info {
  flex: 1;
}

.class-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.class-niveau {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e0e7ff;
  color: #5b21b6;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.active-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: #dcfce7;
  color: #15803d;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.class-filiere {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.filiere-icon {
  width: 2rem;
  height: 2rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.filiere-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.filiere-code {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

.class-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.stat-icon {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.class-actions {
  display: flex;
  justify-content: center;
  padding-top: 0.5rem;
}

.info-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}

/* Empty state */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.empty-icon-wrapper {
  display: inline-flex;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: var(--text-tertiary);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.empty-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.btn-reload {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reload:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
}

/* Error State */
.error-state {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #FEF2F2;
  border: 1px solid #FCA5A5;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.error-icon {
  font-size: 2rem;
  color: #DC2626;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #991B1B;
  margin: 0 0 0.5rem 0;
}

.error-message {
  color: #B91C1C;
  margin: 0;
}

.error-retry-btn {
  padding: 0.75rem 1.5rem;
  background: #DC2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.error-retry-btn:hover {
  background: #B91C1C;
  transform: scale(1.02);
}

@media (max-width: 768px) {
  .classes-grid {
    grid-template-columns: 1fr;
  }

  .error-state {
    flex-direction: column;
    text-align: center;
  }

  .error-retry-btn {
    width: 100%;
  }
}
</style>
