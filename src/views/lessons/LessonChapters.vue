<template>
  <DashboardLayout>
    <div class="lesson-chapters-page">
      <!-- Breadcrumb & Header -->
      <div class="page-header">
        <div class="breadcrumb">
          <button @click="goBack" class="breadcrumb-link">
            ← Retour
          </button>
        </div>

        <!-- Message mode lecture seule -->
        <div v-if="isReadOnly" class="readonly-notice">
          <div class="notice-icon">ℹ️</div>
          <div class="notice-content">
            <strong>Mode consultation</strong>
            <p>Vous consultez cette leçon. Pour la modifier, allez dans <strong>Matières</strong> → Sélectionnez la matière → Modifier la leçon.</p>
          </div>
        </div>

        <!-- Lesson info -->
        <div v-if="lesson" class="lesson-info-card">
          <div class="lesson-info-header">
            <div>
              <h1 class="lesson-title">{{ lesson.title }}</h1>
              <p v-if="lesson.description" class="lesson-description">{{ lesson.description }}</p>
              <div class="lesson-meta">
                <span v-if="lesson.niveau_difficulte" class="meta-badge" :class="`badge-${lesson.niveau_difficulte}`">
                  {{ getNiveauLabel(lesson.niveau_difficulte) }}
                </span>
                <span v-if="lesson.duree_estimee_minutes" class="meta-info">
                  ⏱ {{ lesson.duree_estimee_minutes }} min
                </span>
                <span class="meta-info">
                  {{ lesson.status === 'published' ? '✓ Publiée' : '📝 Brouillon' }}
                </span>
              </div>
            </div>
            <div v-if="lesson.status === 'draft' && !isReadOnly" class="lesson-actions">
              <button
                @click="previewLesson"
                class="btn-preview"
              >
                ◈ Prévisualiser
              </button>
              <button
                @click="publishLesson"
                class="btn-publish"
                :disabled="publishing"
              >
                {{ publishing ? 'Publication...' : 'Publier la leçon' }}
              </button>
            </div>
          </div>

          <!-- Prerequisites -->
          <div v-if="lesson.prerequis" class="lesson-section">
            <h3 class="section-title">Prérequis</h3>
            <p class="section-content">{{ lesson.prerequis }}</p>
          </div>

          <!-- Objectifs -->
          <div v-if="lesson.objectifs_pedagogiques" class="lesson-section">
            <h3 class="section-title">Objectifs pédagogiques</h3>
            <p class="section-content">{{ lesson.objectifs_pedagogiques }}</p>
          </div>
        </div>

        <!-- Loading lesson -->
        <div v-else-if="loadingLesson" class="loading-card">
          <div class="spinner"></div>
          <p>Chargement de la leçon...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="error-card">
          <p class="error-message">{{ error }}</p>
          <button @click="loadLesson" class="btn-retry">Réessayer</button>
        </div>
      </div>

      <!-- Chapter Manager Component -->
      <ChapterManager
        v-if="lesson"
        :lesson-id="lessonId"
        :readonly="isReadOnly"
        @chapters-updated="onChaptersUpdated"
      />
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ChapterManager from '@/components/lessons/ChapterManager.vue'
import lessonService from '@/services/lesson'

export default {
  name: 'LessonChapters',
  components: {
    DashboardLayout,
    ChapterManager
  },

  data() {
    return {
      lesson: null,
      loadingLesson: false,
      error: null,
      publishing: false
    }
  },

  computed: {
    lessonId() {
      return parseInt(this.$route.params.id)
    },
    // Mode lecture seule si on vient de l'onglet Leçons (pas de contexte matière)
    isReadOnly() {
      // Si pas de query param matiere_id ou edit=true, c'est en mode lecture seule
      return !this.$route.query.edit
    }
  },

  mounted() {
    this.loadLesson()
  },

  methods: {
    async loadLesson() {
      this.loadingLesson = true
      this.error = null

      try {
        const response = await lessonService.getLesson(this.lessonId)
        if (response.success) {
          this.lesson = response.data
        }
      } catch (error) {
        console.error('[LessonChapters] Erreur chargement leçon:', error)
        this.error = error.response?.data?.message || 'Erreur lors du chargement de la leçon'
      } finally {
        this.loadingLesson = false
      }
    },

    previewLesson() {
      // Ouvrir la prévisualisation dans un nouvel onglet
      const previewUrl = this.$router.resolve({
        name: 'LessonView',
        params: { id: this.lessonId }
      }).href
      window.open(previewUrl, '_blank')
    },

    async publishLesson() {
      if (!confirm('Publier cette leçon ? Elle sera visible par les étudiants.')) {
        return
      }

      this.publishing = true
      try {
        const response = await lessonService.publishLesson(this.lessonId)
        if (response.success) {
          alert('Leçon publiée avec succès!')

          // Rediriger vers la page de la matière
          if (this.lesson?.matiere_id) {
            this.$router.push({
              name: 'matiere-details',
              params: { id: this.lesson.matiere_id }
            })
          } else {
            await this.loadLesson()
          }
        }
      } catch (error) {
        console.error('[LessonChapters] Erreur publication:', error)
        alert('Erreur: ' + (error.response?.data?.message || error.message))
      } finally {
        this.publishing = false
      }
    },

    onChaptersUpdated() {
      // Callback quand les chapitres sont mis à jour
      console.log('[LessonChapters] Chapitres mis à jour')
    },

    goBack() {
      // Retourner à la page de la matière si possible
      if (this.lesson?.matiere_id) {
        this.$router.push({
          name: 'MatiereDetails',
          params: { id: this.lesson.matiere_id }
        })
      } else {
        this.$router.back()
      }
    },

    getNiveauLabel(niveau) {
      const labels = {
        debutant: 'Débutant',
        intermediaire: 'Intermédiaire',
        avance: 'Avancé'
      }
      return labels[niveau] || niveau
    }
  }
}
</script>

<style scoped>

/* Readonly Notice */
.readonly-notice {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%);
  border: 2px solid #3b82f6;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
}

.notice-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.notice-content {
  flex: 1;
}

.notice-content strong {
  display: block;
  color: #1e40af;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}

.notice-content p {
  margin: 0;
  color: #1e3a8a;
  font-size: 0.875rem;
  line-height: 1.5;
}

<style scoped>
.lesson-chapters-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 24px;
  background: var(--bg-primary);
}

.page-header {
  margin-bottom: 32px;
}

.breadcrumb {
  margin-bottom: 16px;
}

.breadcrumb-link {
  background: none;
  border: none;
  color: var(--color-primary, #3b82f6);
  font-size: 0.875rem;
  cursor: pointer;
  padding: 4px 0;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--color-primary-dark, #2563eb);
  text-decoration: underline;
}

/* Lesson info card */
.lesson-info-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  box-shadow: var(--card-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
  margin-bottom: 24px;
}

.lesson-info-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--border-color);
}

.lesson-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.lesson-description {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 12px 0;
}

.lesson-meta {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.meta-badge {
  padding: 4px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.badge-debutant {
  background-color: rgba(59, 130, 246, 0.1);
  color: #3b82f6;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.badge-intermediaire {
  background-color: rgba(245, 158, 11, 0.1);
  color: #f59e0b;
  border: 1px solid rgba(245, 158, 11, 0.3);
}

.badge-avance {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border: 1px solid rgba(239, 68, 68, 0.3);
}

.meta-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.lesson-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.btn-preview {
  padding: 10px 20px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-preview:hover {
  background-color: var(--hover-bg);
  border-color: var(--border-hover);
}

.btn-publish {
  padding: 10px 20px;
  background-color: var(--color-primary, #10b981);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-publish:hover:not(:disabled) {
  opacity: 0.9;
}

.btn-publish:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Lesson sections */
.lesson-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.section-content {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
  line-height: 1.6;
  white-space: pre-wrap;
}

/* Loading */
.loading-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 48px;
  text-align: center;
  box-shadow: var(--card-shadow, 0 1px 3px rgba(0, 0, 0, 0.1));
}

.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top-color: var(--color-primary, #3b82f6);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 16px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.loading-card p {
  color: var(--text-secondary);
  margin: 0;
}

/* Error */
.error-card {
  background: var(--card-bg);
  border: 1px solid rgba(239, 68, 68, 0.3);
  border-radius: 12px;
  padding: 24px;
  text-align: center;
}

.error-message {
  color: #dc2626;
  font-weight: 500;
  margin: 0 0 16px 0;
}

.btn-retry {
  padding: 8px 16px;
  background-color: var(--color-primary, #3b82f6);
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  opacity: 0.9;
}

/* Responsive */
@media (max-width: 768px) {
  .lesson-chapters-page {
    padding: 16px;
  }

  .lesson-info-header {
    flex-direction: column;
  }

  .lesson-actions {
    width: 100%;
    flex-direction: column;
  }

  .btn-preview,
  .btn-publish {
    width: 100%;
  }

  .lesson-title {
    font-size: 1.5rem;
  }
}
</style>
