<template>
  <DashboardLayout>
    <div class="lessons-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mes Leçons</h1>
          <p class="page-subtitle">Consultez toutes vos leçons. Pour créer une nouvelle leçon, allez dans Matières → Sélectionnez une matière → Créer une leçon</p>
        </div>
      </div>

      <!-- Filtres -->
      <div class="filters-card">
        <div class="filters-grid">
          <div class="filter-item">
            <label class="filter-label">Matière</label>
            <select v-model="filters.matiere_id" @change="applyFilters" class="filter-select">
              <option value="">Toutes les matières</option>
              <option v-for="matiere in matieres" :key="matiere.id" :value="matiere.id">
                {{ matiere.name || matiere.nom }}
              </option>
            </select>
          </div>

          <div class="filter-item">
            <label class="filter-label">Statut</label>
            <select v-model="filters.status" @change="applyFilters" class="filter-select">
              <option value="">Tous les statuts</option>
              <option value="published">Publiée</option>
              <option value="draft">Brouillon</option>
              <option value="archived">Archivée</option>
            </select>
          </div>

          <div class="filter-item">
            <label class="filter-label">Type</label>
            <select v-model="filters.type" @change="applyFilters" class="filter-select">
              <option value="">Tous les types</option>
              <option value="video">Vidéo</option>
              <option value="document">Document</option>
              <option value="quiz">Quiz</option>
              <option value="tp">TP</option>
              <option value="td">TD</option>
            </select>
          </div>

          <div class="filter-item">
            <button @click="resetFilters" class="btn-reset">
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="lessons-grid">
        <SkeletonLoader type="card" v-for="i in 6" :key="i" height="250px" />
      </div>

      <!-- Error state -->
      <div v-if="error" class="error-state">
        <div class="error-icon">⚠</div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadLessons" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <!-- Content -->
      <div v-if="!loading && !error">
        <!-- Statistiques -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <BookOpenIcon class="stat-icon text-blue-600" />
              <span class="stat-label">Total</span>
            </div>
            <p class="stat-value">{{ stats.total }}</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <CheckCircleIcon class="stat-icon text-green-600" />
              <span class="stat-label">Publiées</span>
            </div>
            <p class="stat-value">{{ stats.published }}</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <DocumentTextIcon class="stat-icon text-orange-600" />
              <span class="stat-label">Brouillons</span>
            </div>
            <p class="stat-value">{{ stats.draft }}</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <ArchiveBoxIcon class="stat-icon text-gray-600" />
              <span class="stat-label">Archivées</span>
            </div>
            <p class="stat-value">{{ stats.archived }}</p>
          </div>
        </div>

        <!-- Liste des Leçons -->
        <div v-if="filteredLessons.length > 0" class="lessons-grid">
          <div
            v-for="lesson in filteredLessons"
            :key="lesson.id"
            class="lesson-card"
          >
            <div class="lesson-header">
              <div class="lesson-type-icon">
                <VideoCameraIcon v-if="lesson.content_type === 'video'" class="w-6 h-6 text-purple-600" />
                <DocumentTextIcon v-else-if="lesson.content_type === 'pdf' || lesson.content_type === 'document'" class="w-6 h-6 text-blue-600" />
                <AcademicCapIcon v-else class="w-6 h-6 text-green-600" />
              </div>
              <div class="lesson-badges">
                <span :class="getStatusClass(lesson.status)" class="status-badge">
                  {{ getStatusLabel(lesson.status) }}
                </span>
              </div>
            </div>

            <h3 class="lesson-title">{{ lesson.title || lesson.titre || 'Sans titre' }}</h3>

            <div class="lesson-matiere">
              <BookOpenIcon class="w-4 h-4" />
              <span>{{ getMatiereLabel(lesson.matiere_id) }}</span>
            </div>

            <div class="lesson-meta">
              <div class="meta-item">
                <CalendarIcon class="w-4 h-4" />
                <span>{{ formatDate(lesson.created_at) }}</span>
              </div>
              <div class="meta-item">
                <EyeIcon class="w-4 h-4" />
                <span>{{ lesson.views || 0 }} vues</span>
              </div>
            </div>

            <div class="lesson-actions">
              <button @click="viewChapters(lesson)" class="btn-action btn-view">
                <BookOpenIcon class="w-4 h-4" />
                Voir les chapitres
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="empty-state">
          <div class="empty-icon-wrapper">
            <BookOpenIcon class="empty-icon" />
          </div>
          <h3 class="empty-title">Aucune leçon trouvée</h3>
          <p class="empty-description">
            {{ filters.matiere_id || filters.status || filters.type
              ? 'Aucune leçon ne correspond à vos filtres.'
              : 'Vous n\'avez pas encore créé de leçon.' }}
          </p>
        </div>
      </div>
    </div>

    <!-- Modal Création/Édition Leçon -->
    <div v-if="showCreateModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h2 class="modal-title">{{ editingLesson ? 'Modifier la leçon' : 'Nouvelle leçon' }}</h2>
          <button @click="closeModal" class="modal-close">
            <XMarkIcon class="w-6 h-6" />
          </button>
        </div>

        <form @submit.prevent="saveLesson" class="modal-body">
          <!-- Matière (obligatoire) -->
          <div class="form-group">
            <label class="form-label required">Matière</label>
            <select v-model="lessonForm.matiere_id" required class="form-select">
              <option value="">Sélectionnez une matière</option>
              <option v-for="matiere in matieres" :key="matiere.id" :value="matiere.id">
                {{ matiere.name || matiere.nom }}
              </option>
            </select>
          </div>

          <!-- Titre -->
          <div class="form-group">
            <label class="form-label required">Titre de la leçon</label>
            <input
              v-model="lessonForm.title"
              type="text"
              required
              placeholder="Ex: Introduction à Vue.js"
              class="form-input"
            />
          </div>

          <!-- Type -->
          <div class="form-group">
            <label class="form-label">Type de contenu</label>
            <select v-model="lessonForm.type" class="form-select">
              <option value="video">Vidéo</option>
              <option value="document">Document</option>
              <option value="quiz">Quiz</option>
              <option value="tp">TP</option>
              <option value="td">TD</option>
            </select>
          </div>

          <!-- Description -->
          <div class="form-group">
            <label class="form-label">Description</label>
            <textarea
              v-model="lessonForm.description"
              rows="4"
              placeholder="Décrivez le contenu de la leçon..."
              class="form-textarea"
            ></textarea>
          </div>

          <!-- Statut -->
          <div class="form-group">
            <label class="form-label">Statut</label>
            <select v-model="lessonForm.status" class="form-select">
              <option value="draft">Brouillon</option>
              <option value="published">Publiée</option>
              <option value="archived">Archivée</option>
            </select>
          </div>

          <div class="modal-footer">
            <button type="button" @click="closeModal" class="btn-cancel">
              Annuler
            </button>
            <button type="submit" :disabled="saving" class="btn-save">
              {{ saving ? 'Enregistrement...' : (editingLesson ? 'Mettre à jour' : 'Créer') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { klassciService } from '@/services/klassci'
import lessonService from '@/services/lesson'
import {
  BookOpenIcon,
  PlusIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ArchiveBoxIcon,
  VideoCameraIcon,
  AcademicCapIcon,
  CalendarIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()

const lessons = ref([])
const matieres = ref([])
const loading = ref(false)
const error = ref(null)
const showCreateModal = ref(false)
const editingLesson = ref(null)
const saving = ref(false)

const filters = reactive({
  matiere_id: '',
  status: '',
  type: ''
})

const lessonForm = reactive({
  matiere_id: '',
  title: '',
  description: '',
  type: 'document',
  status: 'draft'
})

const CACHE_KEY_LESSONS = 'teacher_lessons_cache'
const CACHE_KEY_MATIERES = 'teacher_matieres_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Computed
const filteredLessons = computed(() => {
  let filtered = lessons.value

  if (filters.matiere_id) {
    filtered = filtered.filter(l => l.matiere_id == filters.matiere_id)
  }
  if (filters.status) {
    filtered = filtered.filter(l => l.status === filters.status)
  }
  if (filters.type) {
    filtered = filtered.filter(l => l.type === filters.type)
  }

  return filtered
})

const stats = computed(() => {
  return {
    total: lessons.value.length,
    published: lessons.value.filter(l => l.status === 'published').length,
    draft: lessons.value.filter(l => l.status === 'draft').length,
    archived: lessons.value.filter(l => l.status === 'archived').length
  }
})

// Methods
async function loadLessons() {
  // Vérifier le cache
  const cached = localStorage.getItem(CACHE_KEY_LESSONS)
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log('[CACHE] Leçons chargées depuis le cache')
        lessons.value = data
        loading.value = false
        refreshInBackground()
        return
      }
    } catch (err) {
      console.warn('[CACHE] Cache invalide, rechargement...')
    }
  }

  loading.value = true
  error.value = null

  try {
    console.log('[LESSONS] Chargement des leçons via API...')
    const response = await lessonService.getLessons()

    console.log('[DEBUG] Response complète:', response)
    console.log('[DEBUG] response.success:', response.success)
    console.log('[DEBUG] response.data:', response.data)
    console.log('[DEBUG] response.data?.data:', response.data?.data)

    if (response && response.success && response.data) {
      // L'API retourne une structure paginée : response.data.data contient le tableau de leçons
      if (response.data.data && Array.isArray(response.data.data)) {
        lessons.value = response.data.data
        console.log('[OK] Leçons chargées depuis response.data.data:', lessons.value.length, 'leçons')
      } else if (Array.isArray(response.data)) {
        lessons.value = response.data
        console.log('[OK] Leçons chargées depuis response.data:', lessons.value.length, 'leçons')
      } else {
        lessons.value = []
        console.warn('[WARN] response.data existe mais n\'est pas un tableau')
      }
    } else {
      lessons.value = []
      console.warn('[WARN] Structure de réponse invalide')
      console.warn('[WARN] response:', response)
      console.warn('[WARN] response.success:', response?.success)
      console.warn('[WARN] response.data:', response?.data)
    }

    localStorage.setItem(CACHE_KEY_LESSONS, JSON.stringify({
      data: lessons.value,
      timestamp: Date.now()
    }))
  } catch (err) {
    console.error('[ERREUR] Erreur chargement leçons:', err)
    error.value = 'Impossible de charger les leçons. Veuillez réessayer.'
    lessons.value = []
  } finally {
    loading.value = false
  }
}

async function loadMatieres() {
  const cached = localStorage.getItem(CACHE_KEY_MATIERES)
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_TTL) {
        matieres.value = data
        return
      }
    } catch (err) {
      console.warn('[CACHE] Cache matières invalide')
    }
  }

  try {
    // Utiliser getMatieres() au lieu de getTeacherDashboard() pour support coordinateur
    const matieresData = await klassciService.getMatieres()
    matieres.value = matieresData || []

    localStorage.setItem(CACHE_KEY_MATIERES, JSON.stringify({
      data: matieres.value,
      timestamp: Date.now()
    }))
  } catch (err) {
    console.error('[ERREUR] Chargement matières:', err)
  }
}

async function refreshInBackground() {
  try {
    console.log('[BACKGROUND] Rafraîchissement leçons...')
    const response = await lessonService.getLessons()

    if (response && response.success) {
      lessons.value = response.data.data || response.data || []
      localStorage.setItem(CACHE_KEY_LESSONS, JSON.stringify({
        data: lessons.value,
        timestamp: Date.now()
      }))
    }
  } catch (error) {
    console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
  }
}

function applyFilters() {
  console.log('[FILTERS] Filtres appliqués:', filters)
}

function resetFilters() {
  filters.matiere_id = ''
  filters.status = ''
  filters.type = ''
}

function getStatusClass(status) {
  const classes = {
    published: 'status-published',
    draft: 'status-draft',
    archived: 'status-archived'
  }
  return classes[status] || 'status-draft'
}

function getStatusLabel(status) {
  const labels = {
    published: 'Publiée',
    draft: 'Brouillon',
    archived: 'Archivée'
  }
  return labels[status] || 'Brouillon'
}

function getMatiereLabel(matiereId) {
  const matiere = matieres.value.find(m => m.id == matiereId)
  return matiere ? (matiere.name || matiere.nom) : 'Matière inconnue'
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function viewChapters(lesson) {
  router.push(`/teacher/lessons/${lesson.id}/chapters`)
}

// Fonction edit désactivée - Modification uniquement depuis Matières
// function editLesson(lesson) {
//   router.push(`/teacher/lessons/${lesson.id}/edit`)
// }

// Fonction delete désactivée - Suppression uniquement depuis Matières
// async function deleteLesson(lesson) {
//   if (!confirm(`Êtes-vous sûr de vouloir supprimer la leçon "${lesson.title || lesson.titre}" ?`)) {
//     return
//   }
// 
//   try {
//     const response = await lessonService.deleteLesson(lesson.id)
//     if (response && response.success) {
//       lessons.value = lessons.value.filter(l => l.id !== lesson.id)
//       console.log('[OK] Leçon supprimée')
// 
//       // Mettre à jour le cache
//       localStorage.setItem(CACHE_KEY_LESSONS, JSON.stringify({
//         data: lessons.value,
//         timestamp: Date.now()
//       }))
//     }
//   } catch (err) {
//     console.error('[ERREUR] Suppression leçon:', err)
//     alert('Erreur lors de la suppression: ' + (err.response?.data?.message || err.message))
//   }
// }

async function saveLesson() {
  if (!lessonForm.matiere_id || !lessonForm.title) {
    alert('La matière et le titre sont obligatoires')
    return
  }

  saving.value = true

  try {
    console.log('[SAVE] Sauvegarde leçon:', lessonForm)

    if (editingLesson.value) {
      // Modification
      const index = lessons.value.findIndex(l => l.id === editingLesson.value.id)
      if (index !== -1) {
        lessons.value[index] = {
          ...lessons.value[index],
          ...lessonForm,
          updated_at: new Date().toISOString()
        }
      }
    } else {
      // Création
      const newLesson = {
        id: Date.now(),
        ...lessonForm,
        created_at: new Date().toISOString(),
        views: 0
      }
      lessons.value.unshift(newLesson)
    }

    // Mettre à jour le cache
    localStorage.setItem(CACHE_KEY_LESSONS, JSON.stringify({
      data: lessons.value,
      timestamp: Date.now()
    }))

    closeModal()
    console.log('[OK] Leçon sauvegardée')
  } catch (err) {
    console.error('[ERREUR] Sauvegarde leçon:', err)
    alert('Erreur lors de la sauvegarde')
  } finally {
    saving.value = false
  }
}

function closeModal() {
  showCreateModal.value = false
  editingLesson.value = null
  lessonForm.matiere_id = ''
  lessonForm.title = ''
  lessonForm.description = ''
  lessonForm.type = 'document'
  lessonForm.status = 'draft'
}

onMounted(() => {
  loadMatieres()
  loadLessons()
})
</script>

<style scoped>
.lessons-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
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

.btn-create {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
}

/* Filtres */
.filters-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.filter-item {
  display: flex;
  flex-direction: column;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.filter-select {
  padding: 0.5rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.btn-reset {
  margin-top: 1.75rem;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: var(--bg-tertiary);
}

/* Statistiques */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-2px);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stat-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Liste Leçons */
.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

.lesson-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.lesson-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-2px);
}

.lesson-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
}

.lesson-type-icon {
  width: 3rem;
  height: 3rem;
  background: var(--bg-secondary);
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lesson-badges {
  display: flex;
  gap: 0.5rem;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-published {
  background: #dcfce7;
  color: #15803d;
}

.status-draft {
  background: #fef3c7;
  color: #92400e;
}

.status-archived {
  background: #f3f4f6;
  color: #6b7280;
}

.lesson-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.lesson-matiere {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.lesson-meta {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.lesson-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.btn-action {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-view {  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);  color: white;  border: none;}.btn-view:hover {  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);  transform: translateY(-2px);  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);}

.btn-edit:hover {
  background: var(--bg-tertiary);
}



/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-primary);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--bg-secondary);
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.form-label.required::after {
  content: ' *';
  color: #dc2626;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-primary);
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}

.btn-save {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Empty State */
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

.btn-create-empty {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create-empty:hover {
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

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    gap: 1rem;
  }

  .btn-create {
    width: 100%;
    justify-content: center;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .lessons-grid {
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
