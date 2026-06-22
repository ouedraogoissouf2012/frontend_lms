<template>
  <DashboardLayout>
  <div class="matiere-details-content">
    <!-- Notifications Toast -->
    <div class="notifications-container">
      <transition-group name="notification">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          :class="[
            'notification-toast',
            `notification-${notification.type}`
          ]"
        >
          <div class="notification-content">
            <span class="notification-icon">
              <svg v-if="notification.type === 'success'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>
              <svg v-else-if="notification.type === 'error'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>
              <svg v-else-if="notification.type === 'warning'" class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              <svg v-else class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
            </span>
            <span class="notification-message">{{ notification.message }}</span>
          </div>
        </div>
      </transition-group>
    </div>

    <!-- Simple Header -->
    <div class="page-header">
      <!-- Breadcrumb -->
      <div class="breadcrumb">
        <button @click="$router.back()" class="breadcrumb-link">
          Mes Cours
        </button>
        <span class="breadcrumb-separator">›</span>
        <span class="breadcrumb-current">{{ matiere?.nom || 'Chargement...' }}</span>
      </div>

      <!-- Title & Info -->
      <div class="header-content">
        <h1 class="page-title">{{ matiere?.nom || 'Chargement...' }}</h1>

        <!-- Info badges -->
        <div class="info-badges" v-if="matiere">
          <span v-if="matiere.code" class="info-badge">
            Code: {{ matiere.code }}
          </span>
          <span v-if="matiere.coefficient" class="info-badge">
            Coeff: {{ matiere.coefficient }}
          </span>
          <span v-if="matiere.heures?.total" class="info-badge">
            {{ matiere.heures.total }}h
          </span>
        </div>
      </div>

      <!-- Compact Stats -->
      <div class="compact-stats" v-if="statistiques">
        <div class="compact-stat">
          <span class="compact-stat-value">{{ statistiques.nombre_lessons || 0 }}</span>
          <span class="compact-stat-label">Leçons</span>
        </div>
        <div class="compact-stat">
          <span class="compact-stat-value">{{ statistiques.nombre_seances_programmees || 0 }}</span>
          <span class="compact-stat-label">Séances</span>
        </div>
        <div class="compact-stat">
          <span class="compact-stat-value">{{ statistiques.nombre_evaluations || 0 }}</span>
          <span class="compact-stat-label">Évaluations</span>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <ContentLoader v-if="loading" text="Chargement de la matière..." />

    <!-- Error -->
    <div v-else-if="error" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
      <p class="text-red-900 font-medium">{{ error }}</p>
      <button
        @click="loadMatiereDetails"
        class="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
      >
        Réessayer
      </button>
    </div>

    <!-- Tabs -->
    <div v-else class="bg-white shadow rounded-lg">
      <!-- Tab Headers -->
      <div class="border-b border-gray-200">
        <nav class="flex -mb-px">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            @click="activeTab = tab.id"
            :class="[
              'px-6 py-4 font-medium text-sm border-b-2 transition',
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
            ]"
          >
            {{ tab.label }}
            <span
              v-if="tab.count !== undefined"
              :class="[
                'ml-2 px-2 py-1 rounded-full text-xs',
                activeTab === tab.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
              ]"
            >
              {{ tab.count }}
            </span>
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="p-6">
        <!-- Onglet Lessons -->
        <div v-if="activeTab === 'lessons'">
          <!-- Actions header -->
          <div class="mb-4 flex justify-between items-center">
            <!-- Toggle view mode -->
            <div class="view-toggle">
              <button
                @click="viewMode = 'grid'"
                :class="['toggle-btn', viewMode === 'grid' ? 'active' : '']"
                title="Affichage grille"
              >
                <i class="fa fa-th"></i> Grille
              </button>
              <button
                @click="viewMode = 'list'"
                :class="['toggle-btn', viewMode === 'list' ? 'active' : '']"
                title="Affichage liste"
              >
                <i class="fa fa-bars"></i> Liste
              </button>
            </div>

            <!-- Bouton création (enseignant uniquement) -->
            <button
              v-if="isTeacher"
              @click="createLesson"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              Nouvelle leçon
            </button>
          </div>

          <!-- Grid view -->
          <div v-if="lessons && lessons.length > 0 && viewMode === 'grid'" class="lessons-grid">
            <LessonCard
              v-for="lesson in lessons"
              :key="lesson.id"
              :lesson="lesson"
              :is-teacher="isTeacher"
              :show-progress="!isTeacher"
              :show-stats="isTeacher"
              :show-status="isTeacher"
              @view="viewLesson"
              @edit="editLesson"
              @delete="confirmDeleteLesson"
              @publish="publishLesson"
              @unpublish="unpublishLesson"
            />
          </div>

          <!-- List view -->
          <div v-if="lessons && lessons.length > 0 && viewMode === 'list'" class="lessons-list">
            <LessonCard
              v-for="lesson in lessons"
              :key="lesson.id"
              :lesson="lesson"
              :is-teacher="isTeacher"
              :show-progress="!isTeacher"
              :show-stats="isTeacher"
              :show-status="isTeacher"
              @view="viewLesson"
              @edit="editLesson"
              @delete="confirmDeleteLesson"
              @publish="publishLesson"
              @unpublish="unpublishLesson"
            />
          </div>

          <!-- Empty state - only show when no lessons exist -->
          <div v-if="!loading && (!lessons || lessons.length === 0)" class="text-center py-12 text-gray-500">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p class="font-medium text-gray-900 mb-2">Aucune leçon disponible</p>
            <p class="text-sm">{{ isTeacher ? 'Créez votre première leçon pour cette matière' : 'Aucune leçon n\'a encore été publiée' }}</p>
            <button
              v-if="isTeacher"
              @click="createLesson"
              class="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              Créer ma première leçon
            </button>
          </div>
        </div>

        <!-- Onglet Séances (#28 : extrait en sous-composant) -->
        <div v-if="activeTab === 'seances'">
          <MatiereSeancesTab
            :seances="seances"
            :is-teacher="isTeacher"
            @view-seance="viewSeance"
            @hide-seance="hideSeance"
            @visio-updated="loadMatiereDetails"
          />
        </div>

        <!-- Onglet Évaluations (#28 : extrait en sous-composant) -->
        <div v-if="activeTab === 'evaluations'">
          <MatiereEvaluationsTab
            :evaluations="evaluations"
            @view-evaluation="viewEvaluation"
          />
        </div>

        <!-- Onglet Classes (#28 : extrait en sous-composant) -->
        <div v-if="activeTab === 'classes'">
          <MatiereClassesTab :classes="classes" @view-classe="viewClasse" />
        </div>
      </div>
    </div>

    <!-- Modal Création Leçon -->
    <div
      v-if="showCreateLessonModal"
      class="modal-overlay"
      @click.self="closeCreateLessonModal"
    >
      <div class="modal-content">
        <!-- Header -->
        <div class="modal-header">
          <h2 class="modal-title">Créer une nouvelle leçon</h2>
          <button @click="closeCreateLessonModal" class="modal-close">✖</button>
        </div>

        <!-- Body -->
        <div class="modal-body">
          <form @submit.prevent="submitCreateLesson" class="lesson-form">
            <!-- Titre -->
            <div class="form-group">
              <label class="form-label required">Titre de la leçon</label>
              <input
                v-model="newLesson.title"
                type="text"
                class="form-input"
                placeholder="Ex: Introduction aux boucles"
                required
              />
            </div>

            <!-- Description -->
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea
                v-model="newLesson.description"
                class="form-textarea"
                rows="3"
                placeholder="Décrivez brièvement le contenu de cette leçon..."
              ></textarea>
            </div>

            <!-- Prérequis -->
            <div class="form-group">
              <label class="form-label">Prérequis</label>
              <textarea
                v-model="newLesson.prerequis"
                class="form-textarea"
                rows="2"
                placeholder="Connaissances nécessaires avant de suivre cette leçon..."
              ></textarea>
              <p class="form-help">Ex: Comprendre les variables, les types de données</p>
            </div>

            <!-- Niveau -->
            <div class="form-group">
              <label class="form-label required">Niveau de difficulté</label>
              <select v-model="newLesson.niveau_difficulte" class="form-select">
                <option value="debutant">Débutant</option>
                <option value="intermediaire">Intermédiaire</option>
                <option value="avance">Avancé</option>
              </select>
            </div>

            <!-- Objectifs pédagogiques -->
            <div class="form-group">
              <label class="form-label">Objectifs pédagogiques</label>
              <textarea
                v-model="newLesson.objectifs_pedagogiques"
                class="form-textarea"
                rows="3"
                placeholder="Que devront savoir faire les étudiants après cette leçon ?"
              ></textarea>
              <p class="form-help">Ex: Maîtriser les boucles while et for, Résoudre des problèmes d'itération</p>
            </div>

            <!-- Durée estimée -->
            <div class="form-group">
              <label class="form-label">Durée estimée (minutes)</label>
              <input
                v-model.number="newLesson.duree_estimee_minutes"
                type="number"
                class="form-input"
                placeholder="60"
                min="5"
                max="600"
              />
              <p class="form-help">Temps nécessaire pour compléter toute la leçon</p>
            </div>

            <!-- Actions -->
            <div class="modal-actions">
              <button
                type="button"
                @click="closeCreateLessonModal"
                class="btn-secondary"
                :disabled="creatingLesson"
              >
                Annuler
              </button>
              <button
                type="submit"
                class="btn-primary"
                :disabled="creatingLesson || !newLesson.title"
              >
                {{ creatingLesson ? 'Création...' : 'Créer la leçon' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import lmsService from '@/services/lms'
import lessonService from '@/services/lesson'
import LessonCard from '@/components/lessons/LessonCard.vue'
import MatiereSeancesTab from '@/components/matieres/MatiereSeancesTab.vue'
import MatiereEvaluationsTab from '@/components/matieres/MatiereEvaluationsTab.vue'
import MatiereClassesTab from '@/components/matieres/MatiereClassesTab.vue'
import { auth } from '@/services/api'
import { createEmptyLesson, buildLessonPayload, resolveEvaluationRoute } from '@/utils/matiereDetails'
// #28 : la logique pure (statut séance/éval, durée, formatage) vit désormais
// dans les onglets extraits (MatiereSeancesTab / MatiereEvaluationsTab).
// G10 : le brouillon de leçon, son payload et le routage évaluation sont des
// fonctions pures dans utils/matiereDetails (testées unitairement).

export default {
  name: 'MatiereDetails',
  components: {
    DashboardLayout,
    ContentLoader,
    LessonCard,
    MatiereSeancesTab,
    MatiereEvaluationsTab,
    MatiereClassesTab
  },

  data() {
    return {
      loading: false,
      error: null,
      activeTab: 'lessons',
      viewMode: 'grid', // 'grid' ou 'list'
      matiere: null,
      lessons: [],
      seances: [],
      evaluations: [],
      classes: [],
      statistiques: null,
      // Modal création leçon
      showCreateLessonModal: false,
      creatingLesson: false,
      newLesson: createEmptyLesson(),
      // Système de notifications toast
      notifications: []
    }
  },

  computed: {
    matiereId() {
      return parseInt(this.$route.params.id)
    },

    tabs() {
      return [
        { id: 'lessons', label: 'Leçons', count: this.lessons?.length || 0 },
        { id: 'seances', label: 'Séances', count: this.seances?.length || 0 },
        { id: 'evaluations', label: 'Évaluations', count: this.evaluations?.length || 0 },
        { id: 'classes', label: 'Classes', count: this.classes?.length || 0 }
      ]
    },

    canManageVisio() {
      const user = lmsService.auth?.getUser?.() || {}
      return user && ['coordinateur', 'superAdmin'].includes(user.role)
    },

    isTeacher() {
      const user = auth.getUser()
      return user && ['enseignant', 'teacher', 'coordinateur'].includes(user.role)
    }
  },

  mounted() {
    this.loadMatiereDetails()
  },

  methods: {
    async loadMatiereDetails() {
      this.loading = true
      this.error = null

      try {
        console.log('[MatiereDetails] Chargement détails matière:', this.matiereId)

        // Appel via service LMS enrichi
        const data = await lmsService.getMatiereDetails(this.matiereId)

        console.log('[MatiereDetails] Données reçues (raw):', data)
        console.log('[MatiereDetails] data.success:', data.success)
        console.log('[MatiereDetails] data.data:', data.data)
        console.log('[MatiereDetails] Type de data:', typeof data)

        if (data && data.success) {
          this.matiere = data.data.matiere
          this.lessons = data.data.lessons || []
          this.seances = data.data.seances_programmees || []
          this.evaluations = data.data.evaluations_programmees || []
          this.classes = data.data.classes_concernees || []
          this.statistiques = data.data.statistiques

          console.log('[MatiereDetails] Matière assignée:', this.matiere)
          console.log('[MatiereDetails] Nom de la matière:', this.matiere?.nom)
          console.log('[MatiereDetails] Lessons:', this.lessons.length)
          console.log('[MatiereDetails] Séances:', this.seances.length)
          console.log('[MatiereDetails] Évaluations:', this.evaluations.length)
          console.log('[MatiereDetails] Classes:', this.classes.length)
          console.log('[MatiereDetails] Statistiques:', this.statistiques)
        } else {
          console.error('[MatiereDetails] Response success = false ou undefined')
          console.error('[MatiereDetails] Full response:', JSON.stringify(data, null, 2))
          this.error = data?.message || 'Impossible de charger les détails de la matière'
        }
      } catch (error) {
        console.error('[MatiereDetails] Erreur chargement matière:', error)
        console.error('[MatiereDetails] Error message:', error.message)
        console.error('[MatiereDetails] Error response:', error.response)
        console.error('[MatiereDetails] Error response data:', error.response?.data)
        this.error = error.response?.data?.message || 'Erreur lors du chargement des données'
      } finally {
        this.loading = false
      }
    },

    viewLesson(lessonId) {
      this.$router.push({ name: 'LessonView', params: { id: lessonId } })
    },

    createLesson() {
      // Ouvrir le modal au lieu de rediriger
      this.showCreateLessonModal = true
      // Réinitialiser le formulaire
      this.newLesson = createEmptyLesson()
    },

    closeCreateLessonModal() {
      this.showCreateLessonModal = false
      this.newLesson = createEmptyLesson()
    },

    async submitCreateLesson() {
      // Validation
      if (!this.newLesson.title || this.newLesson.title.trim() === '') {
        this.showNotification('fa-exclamation-triangle️ Le titre de la leçon est obligatoire', 'warning')
        return
      }

      this.creatingLesson = true

      try {
        const user = auth.getUser()

        // Préparer les données avec contexte automatique (mapping pur extrait)
        const lessonData = buildLessonPayload(this.newLesson, {
          matiere: this.matiere,
          user,
          matiereId: this.matiereId
        })

        console.log('[MatiereDetails] Création leçon contextuelle:', lessonData)

        const response = await lessonService.createLesson(lessonData)

        if (response.success) {
          this.closeCreateLessonModal()

          // Rediriger vers interface gestion chapitres
          this.$router.push({
            name: 'LessonChapters',
            params: { id: response.data.id }
          })
        }
      } catch (error) {
        console.error('[MatiereDetails] Erreur création leçon:', error)
        this.showNotification('Erreur lors de la création: ' + (error.response?.data?.message || error.message), 'error')
      } finally {
        this.creatingLesson = false
      }
    },

    editLesson(lessonId) {
      // Rediriger vers la gestion des chapitres au lieu de l'ancien éditeur
      this.$router.push({ name: 'LessonChapters', params: { id: lessonId }, query: { edit: 'true' } })
    },

    async confirmDeleteLesson(lessonId) {
      if (!confirm('Êtes-vous sûr de vouloir supprimer cette leçon ?')) {
        return
      }

      try {
        const response = await lessonService.deleteLesson(lessonId)
        if (response.success) {
          this.showNotification('fa-check Leçon supprimée avec succès', 'success')
          this.loadMatiereDetails()
        }
      } catch (error) {
        console.error('[MatiereDetails] Erreur deleteLesson:', error)
        this.showNotification('Erreur lors de la suppression: ' + (error.response?.data?.message || error.message), 'error')
      }
    },

    async publishLesson(lessonId) {
      try {
        const response = await lessonService.publishLesson(lessonId)
        if (response.success) {
          this.showNotification('fa-check Leçon publiée avec succès ! Elle est maintenant visible par les étudiants.', 'success')
          this.loadMatiereDetails()
        }
      } catch (error) {
        console.error('[MatiereDetails] Erreur publishLesson:', error)
        this.showNotification('Erreur lors de la publication: ' + (error.response?.data?.message || error.message), 'error')
      }
    },

    async unpublishLesson(lessonId) {
      try {
        const response = await lessonService.unpublishLesson(lessonId)
        if (response.success) {
          this.showNotification('fa-check Leçon dépubliée avec succès ! Elle est maintenant en mode brouillon.', 'success')
          this.loadMatiereDetails()
        }
      } catch (error) {
        console.error('[MatiereDetails] Erreur unpublishLesson:', error)
        this.showNotification('Erreur lors de la dépublication: ' + (error.response?.data?.message || error.message), 'error')
      }
    },

    // Système de notification toast
    showNotification(message, type = 'success') {
      const id = Date.now()
      this.notifications.push({
        id,
        message,
        type // 'success', 'error', 'warning', 'info'
      })

      // Auto-suppression après 4 secondes
      setTimeout(() => {
        this.notifications = this.notifications.filter(n => n.id !== id)
      }, 4000)
    },

    viewSeance(seanceId) {
      this.$router.push({ name: 'seance-details', params: { id: seanceId } })
    },

    async hideSeance(seance) {
      try {
        const seanceId = seance.id || seance.klassci_seance_id
        const response = await lmsService.hideSeance(seanceId)

        if (response.success) {
          this.showNotification('fa-check Séance masquée avec succès', 'success')
          // Recharger les données pour voir la séance disparaître
          await this.loadMatiereDetails()
        }
      } catch (error) {
        console.error('[MatiereDetails] Erreur masquage séance:', error)
        this.showNotification('Erreur lors du masquage: ' + (error.response?.data?.message || error.message), 'error')
      }
    },

    viewEvaluation(evaluation) {
      // Décision de routage déléguée à une fonction pure (testée unitairement).
      const role = auth.getUser()?.role
      const action = resolveEvaluationRoute(evaluation, { role, matiereId: this.matiereId })

      if (action.route) {
        this.$router.push(action.route)
      } else {
        this.showNotification(action.notify.message, action.notify.level)
      }
    },

    viewClasse(classeId) {
      this.$router.push({ name: 'classe-details', params: { id: classeId } })
    },

    // formatDate / calculateDuration / formatTime / statuts séance & évaluation :
    // déplacés dans les onglets extraits MatiereSeancesTab / MatiereEvaluationsTab (#28).
  }
}
</script>

<style scoped>
/* Matiere Details Content */
.matiere-details-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

/* Override Tailwind classes with theme variables */
.matiere-details-content :deep(.text-gray-900) {
  color: var(--text-primary) !important;
}

.matiere-details-content :deep(.text-gray-600) {
  color: var(--text-secondary) !important;
}

.matiere-details-content :deep(.text-gray-500) {
  color: var(--text-tertiary) !important;
}

.matiere-details-content :deep(.text-gray-700) {
  color: var(--text-secondary) !important;
}

.matiere-details-content :deep(.bg-white) {
  background-color: var(--card-bg) !important;
}

.matiere-details-content :deep(.bg-gray-50) {
  background-color: var(--bg-secondary) !important;
}

.matiere-details-content :deep(.bg-gray-100) {
  background-color: var(--bg-secondary) !important;
}

.matiere-details-content :deep(.border-gray-200) {
  border-color: var(--border-primary) !important;
}

.matiere-details-content :deep(.border-gray-300) {
  border-color: var(--border-secondary) !important;
}

.matiere-details-content :deep(.shadow),
.matiere-details-content :deep(.shadow-md),
.matiere-details-content :deep(.shadow-lg) {
  box-shadow: var(--card-shadow) !important;
}

.matiere-details-content :deep(.hover\:shadow-md:hover),
.matiere-details-content :deep(.hover\:shadow-lg:hover) {
  box-shadow: var(--card-hover-shadow) !important;
}

/* Status badges - ensure they remain visible */
.matiere-details-content :deep(.bg-orange-100) {
  background-color: rgba(251, 146, 60, 0.2) !important;
}

.matiere-details-content :deep(.text-orange-700) {
  color: rgb(234, 88, 12) !important;
}

.matiere-details-content :deep(.bg-green-100) {
  background-color: rgba(34, 197, 94, 0.2) !important;
}

.matiere-details-content :deep(.text-green-700) {
  color: rgb(21, 128, 61) !important;
}

.matiere-details-content :deep(.bg-blue-100) {
  background-color: rgba(59, 130, 246, 0.2) !important;
}

.matiere-details-content :deep(.text-blue-700) {
  color: rgb(29, 78, 216) !important;
}

.matiere-details-content :deep(.bg-red-50) {
  background-color: rgba(239, 68, 68, 0.1) !important;
}

.matiere-details-content :deep(.border-red-200) {
  border-color: rgba(239, 68, 68, 0.3) !important;
}

.matiere-details-content :deep(.text-red-900) {
  color: rgb(220, 38, 38) !important;
}

/* Loading spinner */
.matiere-details-content :deep(.border-blue-600) {
  border-color: var(--blue-600) !important;
}

/* Page Header Styles */
.page-header {
  margin-bottom: 2rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.breadcrumb-link {
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--text-primary);
}

.breadcrumb-separator {
  color: var(--text-tertiary);
}

.breadcrumb-current {
  color: var(--text-primary);
  font-weight: 500;
}

.header-content {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.info-badges {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.info-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.compact-stats {
  display: flex;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-primary);
}

.compact-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.compact-stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--blue-600);
}

.compact-stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .matiere-details-content {
    padding: 0.5rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .compact-stats {
    gap: 1rem;
  }

  .compact-stat-value {
    font-size: 1.25rem;
  }
}

/* View Toggle */
.view-toggle {
  display: flex;
  gap: 0;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  padding: 0.25rem;
  border: 1px solid var(--border-primary);
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.toggle-btn:hover {
  color: var(--text-primary);
}

.toggle-btn.active {
  background: var(--card-bg);
  color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Lessons Grid */
.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

/* Lessons List */
.lessons-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .lessons-grid {
    grid-template-columns: 1fr;
  }
}

/* ============================================
   MODAL STYLES
   ============================================ */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-content {
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-primary);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
}

.lesson-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.form-label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background-color: var(--input-bg, var(--card-bg));
  color: var(--text-primary);
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--text-muted, #9ca3af);
  opacity: 1;
}

.form-help {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 8px;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--bg-tertiary, var(--hover-bg));
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Notifications Toast System */
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
}

.notification-toast {
  min-width: 320px;
  max-width: 450px;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  backdrop-filter: blur(10px);
  animation: slideInRight 0.3s ease-out;
}

@keyframes slideInRight {
  from {
    transform: translateX(400px);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 12px;
}

.notification-icon {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.notification-message {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
  line-height: 1.4;
}

/* Success notification */
.notification-success {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border-left: 4px solid #065f46;
}

/* Error notification */
.notification-error {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
  border-left: 4px solid #991b1b;
}

/* Warning notification */
.notification-warning {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
  border-left: 4px solid #92400e;
}

/* Info notification */
.notification-info {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-left: 4px solid #1e40af;
}

/* Transitions pour Vue */
.notification-enter-active,
.notification-leave-active {
  transition: all 0.3s ease;
}

.notification-enter-from {
  transform: translateX(400px);
  opacity: 0;
}

.notification-leave-to {
  transform: translateX(400px);
  opacity: 0;
}

.notification-move {
  transition: transform 0.3s ease;
}
</style>
