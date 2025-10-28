<template>
  <DashboardLayout>
    <div class="dashboard-content">
      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">Mes Matières</h1>
        <p class="page-subtitle">
          Gérez vos matières et créez des leçons
        </p>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="loading-container">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
          <SkeletonLoader type="card" />
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠</div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadMatieres" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <!-- Grille de matières -->
      <div v-else-if="matieres && matieres.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="matiere in matieres"
          :key="matiere.id || matiere.matiere_id"
          class="course-card"
          @click="navigateToMatiere(matiere)"
          @keydown.enter="navigateToMatiere(matiere)"
          @keydown.space.prevent="navigateToMatiere(matiere)"
          role="button"
          tabindex="0"
        >
          <!-- Nom matière -->
          <h3 class="course-title">
            {{ matiere.name || matiere.nom || matiere.libelle || 'Matière sans nom' }}
          </h3>

          <!-- Coefficient -->
          <p v-if="matiere.coefficient" class="course-info">
            Coefficient: {{ matiere.coefficient }}
          </p>

          <!-- Statistiques enrichies -->
          <div class="course-stats">
            <div class="stat-item">
              <span class="stat-icon">◈</span>
              <span class="stat-text">{{ matiere.statistiques?.nombre_lessons_publiees || 0 }} Leçon{{ (matiere.statistiques?.nombre_lessons_publiees || 0) > 1 ? 's' : '' }} publiée{{ (matiere.statistiques?.nombre_lessons_publiees || 0) > 1 ? 's' : '' }}</span>
            </div>
            <div v-if="matiere.statistiques?.nombre_lessons_brouillons > 0" class="stat-item">
              <span class="stat-icon">◇</span>
              <span class="stat-text">{{ matiere.statistiques.nombre_lessons_brouillons }} Brouillon{{ matiere.statistiques.nombre_lessons_brouillons > 1 ? 's' : '' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">◐</span>
              <span class="stat-text">{{ matiere.statistiques?.nombre_seances || 0 }} Séance{{ (matiere.statistiques?.nombre_seances || 0) > 1 ? 's' : '' }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">☰</span>
              <span class="stat-text">{{ matiere.statistiques?.nombre_evaluations || 0 }} Éval.</span>
            </div>
          </div>

          <!-- Classes -->
          <div v-if="matiere.classes && matiere.classes.length > 0" class="course-classes">
            <span
              v-for="classe in matiere.classes"
              :key="classe.id"
              class="class-badge"
            >
              {{ classe.nom || classe.name || classe.libelle }}
            </span>
          </div>

          <!-- Bouton -->
          <button @click.stop="navigateToMatiere(matiere)" class="course-btn">
            <BookOpenIcon class="w-5 h-5" />
            Gérer la matière
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else class="empty-state-inline">
        <p class="empty-message">Aucune matière assignée</p>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import lmsService from '@/services/lms'
import { BookOpenIcon } from '@heroicons/vue/24/outline'

const router = useRouter()
const loading = ref(false)
const error = ref(null)
const matieres = ref([])

async function loadMatieres() {
  loading.value = true
  error.value = null

  try {
    console.log('[TeacherMatieres] Chargement des matières...')
    const response = await lmsService.getMyMatieres()

    console.log('[TeacherMatieres] Response reçue:', response)

    if (response && response.success) {
      matieres.value = response.data || []
      console.log('[TeacherMatieres] Matières chargées:', matieres.value.length)

      // Log détaillé pour debug
      if (matieres.value.length > 0) {
        console.log('[TeacherMatieres] Première matière:', matieres.value[0])
      }
    } else {
      error.value = response?.message || 'Erreur de chargement'
      console.error('[TeacherMatieres] Success = false:', response)
    }
  } catch (err) {
    console.error('[TeacherMatieres] Erreur:', err)
    error.value = 'Impossible de charger les matières'
  } finally {
    loading.value = false
  }
}

function navigateToMatiere(matiere) {
  console.log('[TeacherMatieres] Structure matière:', matiere)

  // Essayer différentes propriétés pour l'ID
  const matiereId = matiere.matiere_id || matiere.id || matiere.matiere?.id

  if (matiereId) {
    console.log('[TeacherMatieres] Navigation vers matière:', matiereId)
    router.push({
      name: 'matiere-details',
      params: { id: matiereId }
    })
  } else {
    console.error('[TeacherMatieres] ID matière non trouvé:', matiere)
    error.value = 'Impossible de naviguer vers cette matière'
  }
}

onMounted(() => {
  loadMatieres()
})
</script>

<style scoped>
.dashboard-content {
  padding: 2rem;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
}

/* Loading */
.loading-container {
  padding: 2rem 0;
}

/* Error state */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem 2rem;
  text-align: center;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.error-content {
  margin-bottom: 2rem;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.error-message {
  color: var(--text-secondary);
}

.error-retry-btn {
  padding: 0.75rem 2rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.error-retry-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-2px);
}

/* Course card (MÊME DESIGN que TeacherDashboard) */
.course-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.course-card:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.course-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.course-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

/* Statistiques */
.course-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-icon {
  font-size: 1rem;
  color: var(--color-primary);
}

.stat-text {
  color: var(--text-secondary);
}

/* Classes */
.course-classes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.class-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  color: rgb(37, 99, 235);
  font-size: 0.75rem;
  border-radius: 9999px;
  font-weight: 500;
}

/* Bouton */
.course-btn {
  width: 100%;
  margin-top: 0;
  padding: 0.75rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.course-btn:hover {
  background: var(--color-primary-dark);
}

/* Empty state inline */
.empty-state-inline {
  padding: 4rem 2rem;
  text-align: center;
}

.empty-message {
  color: var(--text-secondary);
  font-size: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .dashboard-content {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }
}
</style>
