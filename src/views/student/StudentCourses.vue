<template>
  <DashboardLayout>
    <div class="courses-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mes Cours</h1>
          <p class="page-subtitle">Tous vos cours et matières</p>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="courses-grid">
        <SkeletonLoader type="card" v-for="i in 6" :key="i" />
      </div>

      <!-- Error state -->
      <div v-if="error" class="error-state">
        <div class="error-icon">⚠</div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadCourses" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <!-- Courses Grid -->
      <div v-if="!loading && courses.length > 0" class="courses-grid">
        <div
          v-for="course in courses"
          :key="course.id || course.matiere_id"
          class="course-card"
          @click="navigateToCourse(course)"
          @keydown.enter="navigateToCourse(course)"
          @keydown.space.prevent="navigateToCourse(course)"
          role="button"
          tabindex="0"
          :aria-label="`Accéder au cours ${course.name || course.nom || 'sans nom'}`"
        >
          <div class="course-header">
            <h3 class="course-title">
              {{ course.name || course.nom || course.libelle || course.matiere?.name || 'Cours sans nom' }}
            </h3>
            <span v-if="course.coefficient || course.matiere?.coefficient" class="course-coefficient">
              Coeff: {{ course.coefficient || course.matiere?.coefficient }}
            </span>
          </div>

          <div class="course-stats">
            <div class="stat">
              <span class="stat-icon-emoji">📖</span>
              <div class="stat-info">
                <span class="stat-value">{{ course.stats?.lessons || 0 }}</span>
                <span class="stat-label">Leçons</span>
              </div>
            </div>
            <div class="stat">
              <span class="stat-icon-emoji">🎥</span>
              <div class="stat-info">
                <span class="stat-value">{{ course.stats?.seances || 0 }}</span>
                <span class="stat-label">Séances</span>
              </div>
            </div>
            <div class="stat">
              <span class="stat-icon-emoji">📄</span>
              <div class="stat-info">
                <span class="stat-value">{{ course.stats?.evaluations || 0 }}</span>
                <span class="stat-label">Éval.</span>
              </div>
            </div>
          </div>

          <button class="course-button" aria-label="Voir les détails du cours">
            <span>Voir détails</span>
            <span class="button-arrow" aria-hidden="true">→</span>
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading" class="empty-state">
        <div class="empty-icon-wrapper">
          <span class="empty-icon-emoji">📚</span>
        </div>
        <h3 class="empty-title">Aucun cours disponible</h3>
        <p class="empty-description">
          Vous n'avez pas encore de cours assignés.<br>
          Vos cours apparaîtront ici dès qu'ils seront disponibles.
        </p>
        <div class="empty-actions">
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
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { klassciService } from '@/services/klassci'
import { toast } from '@/services/toast'

export default {
  name: 'StudentCourses',
  components: {
    DashboardLayout,
    SkeletonLoader
  },
  data() {
    return {
      courses: [],
      loading: false,
      error: null
    }
  },
  methods: {
    async loadCourses() {
      this.loading = true
      this.error = null

      try {
        console.log('[COURSES] Chargement des cours...')
        const courses = await klassciService.getMyCourses()
        console.log('[OK] Cours chargés:', courses)

        // Enrichir chaque cours avec ses statistiques
        const enrichedCourses = await Promise.all(
          courses.map(async (course) => {
            const matiereId = course.id || course.matiere_id || course.matiere?.id

            if (!matiereId) {
              return { ...course, stats: { lessons: 0, seances: 0, evaluations: 0 } }
            }

            try {
              // Utiliser l'endpoint LMS pour avoir les leçons
              const details = await klassciService.getLmsMatiereDetails(matiereId)
              console.log(`[DEBUG] Details matière LMS ${matiereId}:`, details)

              if (details && details.success && details.data) {
                const data = details.data
                const stats = data.statistiques || {}

                console.log(`[DEBUG] Statistiques matière ${matiereId}:`, stats)
                console.log(`[DEBUG] Lessons array:`, data.lessons)

                // Compter directement les lessons si présentes
                const lessonsCount = data.lessons?.length || stats.nombre_lessons || 0
                const seancesCount = data.seances_programmees?.length || stats.nombre_seances_programmees || 0
                const evaluationsCount = data.evaluations_programmees?.length || stats.nombre_evaluations || 0

                console.log(`[INFO] Stats calculées - Lessons: ${lessonsCount}, Séances: ${seancesCount}, Éval: ${evaluationsCount}`)

                return {
                  ...course,
                  stats: {
                    lessons: lessonsCount,
                    seances: seancesCount,
                    evaluations: evaluationsCount
                  }
                }
              }
            } catch (error) {
              console.warn(`[WARN] Impossible de charger stats pour matière ${matiereId}:`, error)
              console.error(`[ERROR] Détails:`, error.response?.data)
            }

            return { ...course, stats: { lessons: 0, seances: 0, evaluations: 0 } }
          })
        )

        this.courses = enrichedCourses
        console.log('[OK] Cours enrichis avec stats:', this.courses)
      } catch (err) {
        console.error('[ERREUR] Erreur chargement cours:', err)
        this.error = 'Impossible de charger vos cours. Veuillez réessayer.'
      } finally {
        this.loading = false
      }
    },

    navigateToCourse(course) {
      const matiereId = course.id || course.matiere_id || course.matiere?.id
      if (matiereId) {
        console.log('[NAV] Navigation vers cours:', matiereId)
        this.$router.push({
          name: 'matiere-details',
          params: { id: matiereId }
        })
      } else {
        console.error('[ERREUR] ID matière non trouvé:', course)
        toast.error('Impossible de naviguer vers ce cours')
      }
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
  margin-bottom: 2rem;
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
}

.course-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-4px);
}

.course-header {
  margin-bottom: 1rem;
}

.course-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.course-coefficient {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 600;
}

.course-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-primary);
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 0.75rem 0.5rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.stat:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}

.stat-icon-emoji {
  font-size: 1.5rem;
  line-height: 1;
  display: block;
  margin-bottom: 0.5rem;
}

.stat-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
  width: 100%;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  line-height: 1;
  font-weight: 500;
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

.empty-icon-emoji {
  font-size: 3rem;
  line-height: 1;
  display: block;
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

  .error-state {
    flex-direction: column;
    text-align: center;
  }

  .error-retry-btn {
    width: 100%;
  }
}
</style>
