<template>
  <DashboardLayout>
    <div class="courses-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mes Cours</h1>
          <p class="page-subtitle">Tous vos cours disponibles</p>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filters-section" v-if="availableFilters.matieres.length > 0 || availableFilters.enseignants.length > 0">
        <div class="filters-row">
          <!-- Filtre par matière -->
          <div class="filter-group" v-if="availableFilters.matieres.length > 0">
            <label class="filter-label">Matière</label>
            <select v-model="selectedMatiere" @change="applyFilters" class="filter-select">
              <option value="">Toutes les matières</option>
              <option v-for="matiere in availableFilters.matieres" :key="matiere.id" :value="matiere.id">
                {{ matiere.name }}
              </option>
            </select>
          </div>

          <!-- Filtre par enseignant -->
          <div class="filter-group" v-if="availableFilters.enseignants.length > 0">
            <label class="filter-label">Enseignant</label>
            <select v-model="selectedEnseignant" @change="applyFilters" class="filter-select">
              <option value="">Tous les enseignants</option>
              <option v-for="enseignant in availableFilters.enseignants" :key="enseignant.id" :value="enseignant.id">
                {{ enseignant.name }}
              </option>
            </select>
          </div>

          <!-- Bouton reset filtres -->
          <button v-if="selectedMatiere || selectedEnseignant" @click="resetFilters" class="reset-filters-btn">
            <i class="fa fa-times"></i> Effacer filtres
          </button>
        </div>
      </div>

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement des cours..." />

      <!-- Error state -->
      <div v-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadCourses" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <!-- Courses Grid -->
      <div v-if="!loading && !error && courses.length > 0" class="courses-grid">
        <div
          v-for="course in courses"
          :key="course.id"
          class="course-card"
          @click="navigateToCourse(course)"
          @keydown.enter="navigateToCourse(course)"
          @keydown.space.prevent="navigateToCourse(course)"
          role="button"
          tabindex="0"
          :aria-label="`Accéder au cours ${course.title}`"
        >
          <!-- Badge type -->
          <div class="course-type-badge" :class="course.type">
            {{ getTypeLabel(course.type) }}
          </div>

          <div class="course-header">
            <h3 class="course-title">{{ course.title }}</h3>
            <p class="course-description" v-if="course.description">
              {{ truncateText(course.description, 80) }}
            </p>
          </div>

          <!-- Info enseignant et matière -->
          <div class="course-meta">
            <div class="meta-item" v-if="course.enseignant">
              <i class="fa fa-user"></i>
              <span>{{ course.enseignant.name }}</span>
            </div>
            <div class="meta-item" v-if="course.matiere">
              <i class="fa fa-book"></i>
              <span>{{ course.matiere.name }}</span>
            </div>
            <div class="meta-item" v-if="course.duree_estimee">
              <i class="fa fa-clock-o"></i>
              <span>{{ course.duree_estimee }} min</span>
            </div>
          </div>

          <!-- Progression -->
          <div class="course-progress" v-if="course.progress">
            <div class="progress-bar-container">
              <div class="progress-bar" :style="{ width: course.progress.percentage + '%' }"></div>
            </div>
            <span class="progress-text">{{ course.progress.percentage }}% complété</span>
          </div>

          <button class="course-button" aria-label="Voir les détails du cours">
            <span>Voir le cours</span>
            <span class="button-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading && !error" class="empty-state">
        <div class="empty-icon-wrapper">
          <i class="fa fa-book empty-icon"></i>
        </div>
        <h3 class="empty-title">Aucun cours disponible</h3>
        <p class="empty-description">
          <template v-if="selectedMatiere || selectedEnseignant">
            Aucun cours ne correspond à vos filtres.<br>
            Essayez de modifier vos critères de recherche.
          </template>
          <template v-else>
            Vos enseignants n'ont pas encore publié de cours.<br>
            Revenez plus tard pour consulter les nouveaux cours.
          </template>
        </p>
        <div class="empty-actions">
          <button v-if="selectedMatiere || selectedEnseignant" @click="resetFilters" class="btn-reload">
            Effacer les filtres
          </button>
          <button @click="loadCourses" class="btn-reload" aria-label="Actualiser la liste des cours">
            Actualiser
          </button>
          <router-link to="/student/dashboard" class="btn-secondary-link" aria-label="Retourner au tableau de bord">
            Retour au dashboard
          </router-link>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { klassciService } from '@/services/klassci'
import { toast } from '@/services/toast'

export default {
  name: 'StudentCourses',
  components: {
    DashboardLayout,
    ContentLoader
  },
  data() {
    return {
      courses: [],
      loading: false,
      error: null,
      selectedMatiere: '',
      selectedEnseignant: '',
      availableFilters: {
        matieres: [],
        enseignants: []
      }
    }
  },
  methods: {
    async loadCourses() {
      this.loading = true
      this.error = null

      try {
        const filters = {}
        if (this.selectedMatiere) filters.matiere_id = this.selectedMatiere
        if (this.selectedEnseignant) filters.enseignant_id = this.selectedEnseignant

        console.log('[COURSES] Chargement des cours avec filtres:', filters)
        const response = await klassciService.getMyCourses(filters)
        console.log('[OK] Cours chargés:', response)

        this.courses = response.data || []

        // Sauvegarder les filtres disponibles (seulement si pas de filtre actif)
        if (!this.selectedMatiere && !this.selectedEnseignant && response.filters) {
          this.availableFilters = response.filters
        }

      } catch (err) {
        console.error('[ERREUR] Erreur chargement cours:', err)
        this.error = 'Impossible de charger vos cours. Veuillez réessayer.'
      } finally {
        this.loading = false
      }
    },

    applyFilters() {
      this.loadCourses()
    },

    resetFilters() {
      this.selectedMatiere = ''
      this.selectedEnseignant = ''
      this.loadCourses()
    },

    navigateToCourse(course) {
      if (course.id) {
        console.log('[NAV] Navigation vers cours:', course.id)
        this.$router.push({
          name: 'lesson-details',
          params: { id: course.id }
        })
      } else {
        console.error('[ERREUR] ID cours non trouvé:', course)
        toast.error('Impossible de naviguer vers ce cours')
      }
    },

    getTypeLabel(type) {
      const types = {
        cours: 'Cours',
        tp: 'TP',
        td: 'TD',
        projet: 'Projet',
        autre: 'Autre'
      }
      return types[type] || 'Cours'
    },

    truncateText(text, maxLength) {
      if (!text) return ''
      if (text.length <= maxLength) return text
      return text.substring(0, maxLength) + '...'
    }
  },
  mounted() {
    this.loadCourses()
  }
}
</script>

<style scoped>
.courses-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

.page-header {
  margin-bottom: 1.5rem;
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

/* Filtres */
.filters-section {
  background: var(--card-bg);
  border-radius: 0.75rem;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: var(--card-shadow);
}

.filters-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 200px;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.filter-select {
  padding: 0.625rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: var(--primary);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.reset-filters-btn {
  padding: 0.625rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.reset-filters-btn:hover {
  background: #fee2e2;
  color: #dc2626;
  border-color: #dc2626;
}

/* Courses Grid */
.courses-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.course-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  display: flex;
  flex-direction: column;
}

.course-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-4px);
}

/* Badge type */
.course-type-badge {
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.course-type-badge.cours {
  background: #dbeafe;
  color: #1e40af;
}

.course-type-badge.tp {
  background: #dcfce7;
  color: #166534;
}

.course-type-badge.td {
  background: #fef3c7;
  color: #92400e;
}

.course-type-badge.projet {
  background: #f3e8ff;
  color: #7c3aed;
}

.course-type-badge.autre {
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.course-header {
  margin-bottom: 1rem;
  padding-right: 4rem;
}

.course-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  line-height: 1.4;
}

.course-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.5;
}

/* Meta infos */
.course-meta {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.meta-item i {
  width: 1rem;
  text-align: center;
  color: var(--primary);
}

/* Progress */
.course-progress {
  margin-bottom: 1rem;
}

.progress-bar-container {
  height: 6px;
  background: var(--bg-secondary);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #2563eb);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.course-button {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  margin-top: auto;
}

.course-button:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: scale(1.02);
}

.button-arrow {
  font-size: 1.25rem;
  line-height: 1;
  font-weight: bold;
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
  font-size: 3rem;
  color: var(--text-secondary);
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

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-reload, .btn-secondary-link {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
  text-decoration: none;
  display: inline-block;
}

.btn-reload {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-reload:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
}

.btn-secondary-link {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-secondary-link:hover {
  background: var(--bg-tertiary);
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
  .courses-grid {
    grid-template-columns: 1fr;
  }

  .filters-row {
    flex-direction: column;
    align-items: stretch;
  }

  .filter-group {
    min-width: auto;
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
