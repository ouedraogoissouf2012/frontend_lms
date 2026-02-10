<template>
  <DashboardLayout>
    <div class="evaluations-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <DocumentTextIcon class="page-icon text-blue-600" />
          <div>
            <h1 class="page-title">Évaluations</h1>
            <p class="page-subtitle">Gérez les évaluations en ligne de vos classes</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des évaluations..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <i class="fa fa-exclamation-triangle error-icon"></i>
          <div>
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">{{ error }}</p>
          </div>
        </div>
        <button @click="loadData" class="btn-retry">
          <ArrowPathIcon class="w-5 h-5" />
          Réessayer
        </button>
      </div>

      <template v-else>
        <!-- Filters Card -->
        <div class="filters-card">
          <div class="filters-grid">
            <!-- Filtre Classe -->
            <div class="filter-item">
              <label class="filter-label">
                <UserGroupIcon class="w-4 h-4" />
                Classe
              </label>
              <select v-model="filters.classe_id" @change="applyFilters" class="filter-select">
                <option value="">Toutes les classes</option>
                <option v-for="classe in classes" :key="classe.id" :value="classe.id">
                  {{ classe.name || classe.libelle }}
                </option>
              </select>
            </div>

            <!-- Filtre Matière -->
            <div class="filter-item">
              <label class="filter-label">
                <BookOpenIcon class="w-4 h-4" />
                Matière
              </label>
              <select v-model="filters.matiere_id" @change="applyFilters" class="filter-select">
                <option value="">Toutes les matières</option>
                <option v-for="matiere in matieres" :key="matiere.id" :value="matiere.id">
                  {{ matiere.name || matiere.nom }}
                </option>
              </select>
            </div>

            <!-- Filtre Statut -->
            <div class="filter-item">
              <label class="filter-label">
                <FlagIcon class="w-4 h-4" />
                Statut
              </label>
              <select v-model="filters.statut" @change="applyFilters" class="filter-select">
                <option value="">Tous les statuts</option>
                <option value="planifiee">Planifiée</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
              </select>
            </div>

            <!-- Reset -->
            <div class="filter-item filter-actions">
              <button @click="resetFilters" class="btn-reset">
                <XMarkIcon class="w-4 h-4" />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        <!-- Statistics -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <DocumentTextIcon class="stat-icon text-blue-600" />
              <span class="stat-label">Total</span>
            </div>
            <p class="stat-value">{{ stats.total }}</p>
            <p class="stat-change">évaluations</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <ClockIcon class="stat-icon text-green-600" />
              <span class="stat-label">En cours</span>
            </div>
            <p class="stat-value">{{ stats.enCours }}</p>
            <p class="stat-change">actives</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <CheckCircleIcon class="stat-icon text-gray-600" />
              <span class="stat-label">Terminées</span>
            </div>
            <p class="stat-value">{{ stats.terminees }}</p>
            <p class="stat-change">ce mois</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <ComputerDesktopIcon class="stat-icon text-purple-600" />
              <span class="stat-label">En ligne</span>
            </div>
            <p class="stat-value">{{ stats.avecVersionEnLigne }}</p>
            <p class="stat-change">configurées</p>
          </div>
        </div>

        <!-- Evaluations List -->
        <div v-if="filteredEvaluations.length > 0" class="evaluations-list">
          <div
            v-for="evaluation in filteredEvaluations"
            :key="evaluation.id"
            class="evaluation-card"
          >
            <!-- Header -->
            <div class="eval-header">
              <div class="eval-title-section">
                <h3 class="eval-title">{{ evaluation.titre }}</h3>
                <div class="eval-badges">
                  <span
                    :class="getStatusBadgeClass(evaluation)"
                    class="status-badge"
                    :title="getStatusTooltip(evaluation.status)"
                  >
                    <component :is="getStatusIcon(evaluation.status)" class="w-4 h-4" />
                    {{ getStatusLabel(evaluation.status) }}
                  </span>
                  <span
                    v-if="evaluation.has_online"
                    class="online-badge"
                    title="Cette évaluation dispose d'une version interactive en ligne avec QCM"
                  >
                    <CheckCircleIcon class="w-4 h-4" />
                    Version en ligne
                  </span>
                </div>
              </div>
            </div>

            <!-- Info Grid -->
            <div class="eval-info-grid">
              <div class="info-item">
                <BookOpenIcon class="info-icon" />
                <div>
                  <p class="info-label">Matière</p>
                  <p class="info-value">
                    {{ evaluation.matiere?.nom || evaluation.matiere?.name || 'Non définie' }}
                  </p>
                </div>
              </div>

              <div class="info-item">
                <UserGroupIcon class="info-icon" />
                <div>
                  <p class="info-label">Classe</p>
                  <p class="info-value">
                    {{ evaluation.classe?.nom || evaluation.classe?.name || evaluation.classe?.libelle || 'Non définie' }}
                  </p>
                </div>
              </div>

              <div class="info-item">
                <CalendarIcon class="info-icon" />
                <div>
                  <p class="info-label">Date</p>
                  <p class="info-value">
                    {{ formatDate(evaluation.programmation?.date_evaluation || evaluation.date_evaluation) }}
                  </p>
                </div>
              </div>

              <div class="info-item">
                <ClockIcon class="info-icon" />
                <div>
                  <p class="info-label">Coefficient / Barème</p>
                  <p class="info-value">
                    {{ evaluation.programmation?.coefficient || evaluation.coefficient || 1 }} -
                    {{ evaluation.programmation?.bareme || evaluation.bareme || 20 }}/20
                  </p>
                </div>
              </div>
            </div>

            <!-- Window Status -->
            <div v-if="evaluation.programmation?.window" class="window-status">
              <div v-if="!evaluation.programmation.window.has_started" class="status-item status-pending">
                <ClockIcon class="status-icon" />
                <div>
                  <p class="status-text">Prévue</p>
                  <p class="status-detail">L'évaluation n'a pas encore commencé</p>
                </div>
              </div>
              <div v-else-if="evaluation.programmation.window.is_open" class="status-item status-active">
                <span class="pulse-dot"></span>
                <div>
                  <p class="status-text">En cours</p>
                  <p class="status-detail">{{ evaluation.programmation.window.time_left_minutes }} minutes restantes</p>
                </div>
              </div>
              <div v-else class="status-item status-finished">
                <CheckCircleIcon class="status-icon" />
                <div>
                  <p class="status-text">Terminée</p>
                  <p class="status-detail">La fenêtre de composition est fermée</p>
                </div>
              </div>
            </div>

            <!-- Online Version Info -->
            <div v-if="evaluation.has_online && evaluation.online_version" class="online-info">
              <ComputerDesktopIcon class="online-icon" />
              <div class="online-details">
                <p class="online-title">Version en ligne configurée</p>
                <div class="online-stats">
                  <span class="online-stat">
                    <DocumentTextIcon class="w-4 h-4" />
                    {{ evaluation.online_version.questions_count || 0 }} questions
                  </span>
                  <span class="online-stat">
                    <ClockIcon class="w-4 h-4" />
                    {{ evaluation.online_version.duree_minutes }} min
                  </span>
                  <span class="online-stat">
                    <UserGroupIcon class="w-4 h-4" />
                    {{ evaluation.online_version.submissions_count || 0 }} soumissions
                  </span>
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="eval-actions">
              <button
                v-if="!evaluation.has_online"
                @click="createOnlineVersion(evaluation)"
                class="btn-action btn-create"
                title="Créer une version interactive avec QCM pour cette évaluation KLASSCI"
              >
                <PlusIcon class="w-5 h-5" />
                Créer version en ligne
              </button>
              <button
                v-else
                @click="editOnlineVersion(evaluation)"
                class="btn-action btn-edit"
                title="Modifier les questions de la version en ligne"
              >
                <PencilIcon class="w-5 h-5" />
                Modifier les questions
              </button>
              <button
                v-if="evaluation.has_online && evaluation.online_version?.submissions_count > 0"
                @click="viewResults(evaluation)"
                class="btn-action btn-view-results"
                title="Voir les notes et résultats des étudiants"
              >
                <ChartBarIcon class="w-5 h-5" />
                Voir les notes
              </button>
              <button
                v-if="evaluation.has_online && !evaluation.online_version?.is_published"
                @click="publishEvaluation(evaluation)"
                class="btn-action btn-publish"
                title="Publier l'évaluation pour la rendre visible aux étudiants"
              >
                <MegaphoneIcon class="w-5 h-5" />
                Publier
              </button>
              <button
                v-if="evaluation.has_online"
                @click="previewEvaluation(evaluation)"
                class="btn-action btn-preview"
                title="Prévisualiser l'évaluation"
              >
                <EyeIcon class="w-5 h-5" />
                Prévisualiser
              </button>
              <button
                v-if="evaluation.has_online && evaluation.online_version?.submissions_count > 0"
                @click="syncToKlassci(evaluation)"
                :disabled="syncing === evaluation.id"
                class="btn-action btn-sync"
                title="Synchroniser les notes vers KLASSCI"
              >
                <ArrowPathIcon class="w-5 h-5" :class="{ 'animate-spin': syncing === evaluation.id }" />
                {{ syncing === evaluation.id ? 'Synchronisation...' : 'Synchroniser les notes' }}
              </button>
              <button
                v-if="evaluation.has_online && !evaluation.online_version?.is_locked && !(evaluation.online_version?.submissions_count > 0)"
                @click="deleteEvaluation(evaluation)"
                class="btn-action btn-delete"
                title="Supprimer la version en ligne"
              >
                <TrashIcon class="w-5 h-5" />
                Supprimer
              </button>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <DocumentTextIcon class="empty-icon" />
          <h3 class="empty-title">Aucune évaluation trouvée</h3>
          <p class="empty-message">
            {{ filters.classe_id || filters.matiere_id || filters.statut
              ? 'Aucune évaluation ne correspond à vos filtres'
              : 'Vos évaluations apparaîtront ici' }}
          </p>
          <button
            v-if="filters.classe_id || filters.matiere_id || filters.statut"
            @click="resetFilters"
            class="btn-empty"
          >
            Réinitialiser les filtres
          </button>
        </div>
      <!-- Modal: Create Online Version -->
      <div v-if="showCreateModal" class="modal-overlay" @click="closeCreateModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h2 class="modal-title">Créer version en ligne</h2>
            <button @click="closeCreateModal" class="modal-close">
              <XMarkIcon class="w-6 h-6" />
            </button>
          </div>

          <div class="modal-body">
            <div class="modal-info">
              <p class="info-text">
                <strong>Évaluation KLASSCI:</strong> {{ selectedEvaluation?.titre }}
              </p>
              <p class="info-text">
                <strong>Matière:</strong> {{ selectedEvaluation?.matiere?.nom || selectedEvaluation?.matiere?.name }}
              </p>
              <p class="info-text">
                <strong>Classe:</strong> {{ selectedEvaluation?.classe?.nom || selectedEvaluation?.classe?.libelle }}
              </p>
            </div>

            <form @submit.prevent="submitCreateOnlineVersion" class="modal-form">
              <div class="form-group">
                <label class="form-label required">Type d'évaluation</label>
                <select v-model="onlineForm.type" required class="form-select">
                  <option value="qcm">QCM uniquement</option>
                  <option value="qcm_multiple">QCM à choix multiples</option>
                  <option value="mixte">Mixte (QCM + réponses courtes)</option>
                </select>
              </div>

              <div class="form-group">
                <label class="form-label required">Durée (en minutes)</label>
                <input
                  v-model.number="onlineForm.duree_minutes"
                  type="number"
                  min="5"
                  max="240"
                  required
                  class="form-input"
                  placeholder="60"
                />
              </div>

              <div class="form-group">
                <label class="form-label">Description / Consignes</label>
                <textarea
                  v-model="onlineForm.description"
                  rows="3"
                  class="form-textarea"
                  placeholder="Instructions pour les étudiants..."
                ></textarea>
              </div>

              <div class="modal-actions">
                <button type="button" @click="closeCreateModal" class="btn-cancel">
                  Annuler
                </button>
                <button type="submit" :disabled="creating" class="btn-submit">
                  <ArrowPathIcon v-if="creating" class="w-5 h-5 animate-spin" />
                  <PlusIcon v-else class="w-5 h-5" />
                  {{ creating ? 'Création...' : 'Créer et ajouter des questions' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      </template>

    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import klassciService from '@/services/klassci'
import evaluationService from '@/services/evaluation'
import {
  DocumentTextIcon,
  BookOpenIcon,
  UserGroupIcon,
  CalendarIcon,
  ClockIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
  FlagIcon,
  XMarkIcon,
  PlusIcon,
  PencilIcon,
  ArrowPathIcon,
  ChartBarIcon,
  EyeIcon,
  MegaphoneIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()

const evaluationsKlassci = ref([])
const evaluationsLMS = ref([])
const classes = ref([])
const matieres = ref([])
const loading = ref(true)
const error = ref(null)
const syncing = ref(null)
const showCreateModal = ref(false)
const selectedEvaluation = ref(null)
const creating = ref(false)
const onlineForm = reactive({
  type: 'qcm',
  duree_minutes: 60,
  description: ''
})

// Filters
const filters = reactive({
  classe_id: '',
  matiere_id: '',
  statut: ''
})

// Cache
const CACHE_KEY_EVALUATIONS = 'teacher_evaluations_cache'
const CACHE_KEY_CLASSES = 'teacher_classes_cache'
const CACHE_KEY_MATIERES = 'teacher_matieres_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Merge KLASSCI evaluations with LMS online versions
const evaluationsWithOnline = computed(() => {
  return evaluationsKlassci.value.map(evaluation => ({
    ...evaluation,
    online_version: evaluationsLMS.value.find(e => e.klassci_evaluation_id === evaluation.id),
    has_online: evaluationsLMS.value.some(e => e.klassci_evaluation_id === evaluation.id)
  }))
})

// Filtered evaluations
const filteredEvaluations = computed(() => {
  let filtered = evaluationsWithOnline.value

  // Filter by classe
  if (filters.classe_id) {
    filtered = filtered.filter(e => e.classe?.id == filters.classe_id)
  }

  // Filter by matiere
  if (filters.matiere_id) {
    filtered = filtered.filter(e => e.matiere?.id == filters.matiere_id)
  }

  // Filter by statut
  if (filters.statut) {
    filtered = filtered.filter(e => e.status === filters.statut)
  }

  return filtered
})

// Statistics
const stats = computed(() => {
  const all = evaluationsWithOnline.value
  return {
    total: all.length,
    enCours: all.filter(e => e.programmation?.window?.is_open).length,
    terminees: all.filter(e => e.status === 'terminee').length,
    avecVersionEnLigne: all.filter(e => e.has_online).length
  }
})

// Load all data with cache
async function loadData() {
  loading.value = true
  error.value = null

  try {
    // Load classes and matieres in parallel
    await Promise.all([
      loadClasses(),
      loadMatieres()
    ])

    // Load evaluations
    await Promise.all([
      loadEvaluationsKlassci(),
      loadEvaluationsLMS()
    ])

    console.log('[SUCCESS] Données chargées')
  } catch (err) {
    console.error('[ERREUR] Chargement données:', err)
    error.value = 'Impossible de charger les évaluations. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}

// Load classes with cache
async function loadClasses() {
  const cached = localStorage.getItem(CACHE_KEY_CLASSES)
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_TTL) {
        classes.value = data
        return
      }
    } catch (err) {
      console.warn('[CACHE] Cache classes invalide')
    }
  }

  try {
    const classesData = await klassciService.getClasses()
    classes.value = Array.isArray(classesData) ? classesData : []

    localStorage.setItem(CACHE_KEY_CLASSES, JSON.stringify({
      data: classes.value,
      timestamp: Date.now()
    }))
  } catch (err) {
    console.error('[ERREUR] Chargement classes:', err)
  }
}

// Load matieres with cache
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
    const matieresData = await klassciService.getMatieres()
    matieres.value = Array.isArray(matieresData) ? matieresData : []

    localStorage.setItem(CACHE_KEY_MATIERES, JSON.stringify({
      data: matieres.value,
      timestamp: Date.now()
    }))
  } catch (err) {
    console.error('[ERREUR] Chargement matières:', err)
  }
}

// Load KLASSCI evaluations
async function loadEvaluationsKlassci() {
  try {
    const result = await klassciService.getEvaluations(filters)
    if (result.success) {
      evaluationsKlassci.value = result.data
      console.log('[SUCCESS] Évaluations KLASSCI:', evaluationsKlassci.value.length)
    }
  } catch (err) {
    console.error('[ERREUR] Chargement évaluations KLASSCI, utilisation du dashboard:', err)

    // Fallback: use dashboard
    try {
      const dashboard = await klassciService.getTeacherDashboard()
      if (dashboard && dashboard.evaluations) {
        evaluationsKlassci.value = dashboard.evaluations
        console.log('[SUCCESS] Évaluations depuis dashboard:', evaluationsKlassci.value.length)
      }
    } catch (dashboardError) {
      console.error('[ERREUR] Fallback dashboard:', dashboardError)
    }
  }
}

// Load LMS evaluations
async function loadEvaluationsLMS() {
  try {
    const result = await evaluationService.getEvaluations()
    if (result.success) {
      evaluationsLMS.value = result.data.map(e => ({
        ...e,
        questions_count: e.questions?.length || 0,
        submissions_count: e.submissions?.length || 0
      }))
      console.log('[SUCCESS] Évaluations LMS:', evaluationsLMS.value.length)
    }
  } catch (err) {
    console.warn('[INFO] Aucune évaluation LMS (normal si aucune créée):', err.message)
    evaluationsLMS.value = []
  }
}

// Apply filters
function applyFilters() {
  console.log('[FILTERS] Filtres appliqués:', filters)
}

// Reset filters
function resetFilters() {
  filters.classe_id = ''
  filters.matiere_id = ''
  filters.statut = ''
  console.log('[FILTERS] Filtres réinitialisés')
}

// Get status badge class
function getStatusBadgeClass(evaluation) {
  const baseClass = 'status-badge'

  if (evaluation.programmation?.window?.is_open) {
    return `${baseClass} status-badge-active`
  }

  const statusClasses = {
    'planifiee': `${baseClass} status-badge-planned`,
    'en_cours': `${baseClass} status-badge-active`,
    'terminee': `${baseClass} status-badge-finished`,
    'brouillon': `${baseClass} status-badge-draft`
  }

  return statusClasses[evaluation.status] || `${baseClass} status-badge-default`
}

// Get status label
function getStatusLabel(status) {
  const labels = {
    'planifiee': 'Planifiée',
    'en_cours': 'En cours',
    'terminee': 'Terminée',
    'brouillon': 'Brouillon',
    'draft': 'Brouillon',
    'in_progress': 'En cours',
    'completed': 'Terminée'
  }
  return labels[status] || status
}

// Get status icon
function getStatusIcon(status) {
  const icons = {
    'planifiee': CalendarIcon,
    'en_cours': ClockIcon,
    'terminee': CheckCircleIcon,
    'brouillon': DocumentTextIcon,
    'draft': DocumentTextIcon,
    'in_progress': ClockIcon,
    'completed': CheckCircleIcon
  }
  return icons[status] || DocumentTextIcon
}

// Get status tooltip
function getStatusTooltip(status) {
  const tooltips = {
    'planifiee': 'Évaluation programmée dans le calendrier KLASSCI',
    'en_cours': 'Fenêtre temporelle ouverte - Les étudiants peuvent composer',
    'terminee': 'Fenêtre fermée - Composition terminée',
    'brouillon': 'Évaluation en préparation, non encore programmée',
    'draft': 'Évaluation en préparation, non encore programmée',
    'in_progress': 'Fenêtre temporelle ouverte - Les étudiants peuvent composer',
    'completed': 'Fenêtre fermée - Composition terminée'
  }
  return tooltips[status] || 'Statut de l\'évaluation'
}

// Format date
function formatDate(date) {
  if (!date) return 'Non définie'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// Create online version
function createOnlineVersion(evaluation) {
  selectedEvaluation.value = evaluation
  onlineForm.type = 'qcm'
  onlineForm.duree_minutes = 60
  onlineForm.description = ''
  showCreateModal.value = true
}

// Close modal
function closeCreateModal() {
  showCreateModal.value = false
  selectedEvaluation.value = null
  onlineForm.type = 'qcm'
  onlineForm.duree_minutes = 60
  onlineForm.description = ''
}

// Submit create online version
async function submitCreateOnlineVersion() {
  if (!selectedEvaluation.value) return

  // Vérifier côté frontend qu'une version en ligne n'existe pas déjà
  const alreadyExists = evaluationsLMS.value.some(
    e => e.klassci_evaluation_id === selectedEvaluation.value.id
  )
  if (alreadyExists) {
    alert('⚠ Une version en ligne existe déjà pour cette évaluation.')
    closeCreateModal()
    return
  }

  creating.value = true
  try {
    const newEvaluation = {
      klassci_evaluation_id: selectedEvaluation.value.id,
      klassci_matiere_id: selectedEvaluation.value.matiere?.id,
      klassci_classe_id: selectedEvaluation.value.classe?.id,
      titre: selectedEvaluation.value.titre,
      description: onlineForm.description || selectedEvaluation.value.description || '',
      type: onlineForm.type,
      date_evaluation: selectedEvaluation.value.programmation?.date_evaluation || selectedEvaluation.value.date_evaluation,
      duree_minutes: onlineForm.duree_minutes,
      coefficient: selectedEvaluation.value.programmation?.coefficient || selectedEvaluation.value.coefficient || 1,
      bareme: selectedEvaluation.value.programmation?.bareme || selectedEvaluation.value.bareme || 20,
      questions: []
    }

    console.log('[CREATE] Création évaluation LMS:', newEvaluation)
    const result = await evaluationService.createEvaluation(newEvaluation)

    if (result.success) {
      console.log('[SUCCESS] Évaluation créée:', result.data)
      alert('✓ Version en ligne créée! Vous pouvez maintenant ajouter des questions.')
      
      // Reload evaluations
      await loadEvaluationsLMS()
      
      // Close modal
      closeCreateModal()
      
      // TODO: Rediriger vers page d'édition des questions
      // router.push({ name: 'EditQuestions', params: { id: result.data.id } })
    }
  } catch (err) {
    console.error('[ERREUR] Création évaluation:', err)
    if (err.response?.status === 409) {
      alert('⚠ Une version en ligne existe déjà pour cette évaluation.')
      await loadEvaluationsLMS()
      closeCreateModal()
    } else {
      alert('⚠ Erreur lors de la création de la version en ligne')
    }
  } finally {
    creating.value = false
  }
}

// Edit online version
function editOnlineVersion(evaluation) {
  if (!evaluation.online_version) return

  router.push({
    name: 'EditQuestions',
    params: { id: evaluation.online_version.id },
    query: {
      klassci_id: evaluation.id
    }
  })
}

// View results
function viewResults(evaluation) {
  if (!evaluation.online_version) return

  router.push({
    name: 'EvaluationCorrections',
    params: { id: evaluation.online_version.id }
  })
}

// Sync to KLASSCI
async function syncToKlassci(evaluation) {
  if (!evaluation.online_version) return

  const submissionsCount = evaluation.online_version.submissions_count || 0
  if (submissionsCount === 0) {
    alert('Aucune soumission à synchroniser')
    return
  }

  if (!confirm(`Synchroniser ${submissionsCount} note(s) vers KLASSCI ?`)) {
    return
  }

  syncing.value = evaluation.id
  try {
    const result = await evaluationService.syncToKlassci(evaluation.online_version.id)
    if (result.success) {
      alert('✓ Notes synchronisées avec succès vers KLASSCI !')
      await loadEvaluationsLMS()
    }
  } catch (err) {
    console.error('[ERREUR] Synchronisation:', err)
    alert('⚠ Erreur lors de la synchronisation')
  } finally {
    syncing.value = null
  }
}

// Publish evaluation
async function publishEvaluation(evaluation) {
  if (!evaluation.online_version) return

  const questionsCount = evaluation.online_version.questions_count || 0
  if (questionsCount === 0) {
    alert('Impossible de publier : ajoutez d\'abord des questions à cette évaluation.')
    return
  }

  if (!confirm(`Publier "${evaluation.titre}" ? Les étudiants pourront la voir.`)) {
    return
  }

  try {
    const result = await evaluationService.publishEvaluation(evaluation.online_version.id)
    if (result.success) {
      alert('Évaluation publiée avec succès !')
      await loadEvaluationsLMS()
    }
  } catch (err) {
    console.error('[ERREUR] Publication:', err)
    const message = err.response?.data?.message || 'Erreur lors de la publication'
    alert(message)
  }
}

// Preview evaluation
function previewEvaluation(evaluation) {
  if (!evaluation.online_version) return

  router.push({
    name: 'PreviewEvaluation',
    params: { id: evaluation.online_version.id }
  })
}

// Delete evaluation
async function deleteEvaluation(evaluation) {
  if (!evaluation.online_version) return

  if (!confirm(`Supprimer la version en ligne de "${evaluation.titre}" ? Cette action est irréversible.`)) {
    return
  }

  try {
    const result = await evaluationService.deleteEvaluation(evaluation.online_version.id)
    if (result.success) {
      alert('Version en ligne supprimée.')
      await loadEvaluationsLMS()
    }
  } catch (err) {
    console.error('[ERREUR] Suppression:', err)
    const message = err.response?.data?.message || 'Erreur lors de la suppression'
    alert(message)
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.evaluations-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

/* Header */
.page-header {
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-icon {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0 0;
}

/* Error State */
.error-state {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 0.75rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 2rem;
}

.error-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.error-icon {
  font-size: 2rem;
  line-height: 1;
}

.error-title {
  font-size: 1rem;
  font-weight: 600;
  color: #c00;
  margin: 0 0 0.25rem 0;
}

.error-message {
  font-size: 0.875rem;
  color: #900;
  margin: 0;
}

.btn-retry {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #dc2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: #b91c1c;
}

/* Filters Card */
.filters-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.filter-select {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: var(--primary-color);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-actions {
  display: flex;
  align-items: flex-end;
}

.btn-reset {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  justify-content: center;
}

.btn-reset:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Statistics */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
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
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.stat-icon {
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
}

.stat-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.stat-change {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Evaluations List */
.evaluations-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.evaluation-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.evaluation-card:hover {
  box-shadow: var(--card-shadow-hover);
}

.eval-header {
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.eval-title-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.eval-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.eval-badges {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: help;
  transition: all 0.2s;
}

.status-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-badge-planned {
  background: #dbeafe;
  color: #1e40af;
  border: 1px solid #bfdbfe;
}

.status-badge-active {
  background: #dcfce7;
  color: #166534;
  border: 1px solid #86efac;
  animation: pulse-badge 2s ease-in-out infinite;
}

@keyframes pulse-badge {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4);
  }
  50% {
    box-shadow: 0 0 0 4px rgba(34, 197, 94, 0);
  }
}

.status-badge-finished {
  background: #f3f4f6;
  color: #4b5563;
  border: 1px solid #e5e7eb;
}

.status-badge-draft {
  background: #fef3c7;
  color: #92400e;
  border: 1px solid #fde68a;
}

.status-badge-default {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.online-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  background: #d1fae5;
  color: #065f46;
  border: 1px solid #6ee7b7;
  cursor: help;
  transition: all 0.2s;
}

.online-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.2);
}

/* Info Grid */
.eval-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.info-icon {
  width: 1.25rem;
  height: 1.25rem;
  color: var(--text-secondary);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.info-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

/* Window Status */
.window-status {
  margin-bottom: 1.5rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border-left: 3px solid;
  background: var(--card-bg);
}

.status-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.status-pending {
  border-color: #f59e0b;
  background: rgba(245, 158, 11, 0.05);
}

.status-pending .status-icon {
  color: #f59e0b;
}

.status-pending .status-text {
  color: #d97706;
}

.status-pending .status-detail {
  color: var(--text-secondary);
}

.status-active {
  border-color: #10b981;
  background: rgba(16, 185, 129, 0.05);
}

.status-active .status-text {
  color: #059669;
}

.status-active .status-detail {
  color: var(--text-secondary);
}

.status-finished {
  border-color: #6b7280;
  background: rgba(107, 114, 128, 0.05);
}

.status-finished .status-icon {
  color: #6b7280;
}

.status-finished .status-text {
  color: #4b5563;
}

.status-finished .status-detail {
  color: var(--text-secondary);
}

.status-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.pulse-dot {
  width: 0.75rem;
  height: 0.75rem;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.status-text {
  font-size: 0.9375rem;
  font-weight: 600;
  margin: 0 0 0.125rem 0;
}

.status-detail {
  font-size: 0.8125rem;
  opacity: 0.8;
  margin: 0;
}

/* Online Info */
.online-info {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
}

.online-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: #2563eb;
  flex-shrink: 0;
}

.online-details {
  flex: 1;
}

.online-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1e40af;
  margin: 0 0 0.5rem 0;
}

.online-stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.online-stat {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #1e40af;
}

/* Actions */
.eval-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-create {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-create:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-edit {
  background: #f59e0b;
  color: white;
}

.btn-edit:hover:not(:disabled) {
  background: #d97706;
}

.btn-view-results {
  background: #8b5cf6;
  color: white;
}

.btn-view-results:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-sync {
  background: #22c55e;
  color: white;
}

.btn-sync:hover:not(:disabled) {
  background: #16a34a;
}

.btn-publish {
  background: #8b5cf6;
  color: white;
}

.btn-publish:hover:not(:disabled) {
  background: #7c3aed;
}

.btn-preview {
  background: #6366f1;
  color: white;
}

.btn-preview:hover:not(:disabled) {
  background: #4f46e5;
}

.btn-delete {
  background: #ef4444;
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background: #dc2626;
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
}

.empty-icon {
  width: 6rem;
  height: 6rem;
  color: var(--text-tertiary);
  margin: 0 auto 1.5rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.empty-message {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0 0 1.5rem 0;
  line-height: 1.6;
}

.btn-empty {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-empty:hover {
  background: var(--primary-hover);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .evaluations-container {
    padding: 0;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .eval-info-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .eval-actions {
    flex-direction: column;
  }

  .btn-action {
    width: 100%;
  }

  .online-stats {
    flex-direction: column;
    gap: 0.5rem;
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-text {
  font-size: 0.875rem;
  color: #1e40af;
  margin: 0.25rem 0;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-label.required::after {
  content: ' *';
  color: #dc2626;
}

.form-select,
.form-input,
.form-textarea {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-cancel,
.btn-submit {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-cancel:hover {
  background: var(--bg-hover);
}

.btn-submit {
  background: #3b82f6;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #2563eb;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
