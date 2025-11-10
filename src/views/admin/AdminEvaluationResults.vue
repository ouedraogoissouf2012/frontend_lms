<template>
  <DashboardLayout>
    <div class="evaluations-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <DocumentTextIcon class="page-icon text-blue-600" />
          <div>
            <h1 class="page-title">Résultats des Évaluations</h1>
            <p class="page-subtitle">Consultez les résultats détaillés par classe et évaluation</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="loading-state">
        <SkeletonLoader type="card" height="100px" />
        <SkeletonLoader type="card" height="100px" />
        <SkeletonLoader type="card" height="100px" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <span class="error-icon">⚠</span>
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
        <!-- Stats Cards -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrapper bg-blue-100">
              <DocumentTextIcon class="stat-icon text-blue-600" />
            </div>
            <div class="stat-content">
              <p class="stat-label">Total</p>
              <p class="stat-value">{{ stats.total }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper bg-green-100">
              <PlayIcon class="stat-icon text-green-600" />
            </div>
            <div class="stat-content">
              <p class="stat-label">En cours</p>
              <p class="stat-value">{{ stats.enCours }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper bg-purple-100">
              <CheckCircleIcon class="stat-icon text-purple-600" />
            </div>
            <div class="stat-content">
              <p class="stat-label">Terminées</p>
              <p class="stat-value">{{ stats.terminees }}</p>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper bg-indigo-100">
              <ComputerDesktopIcon class="stat-icon text-indigo-600" />
            </div>
            <div class="stat-content">
              <p class="stat-label">En ligne</p>
              <p class="stat-value">{{ stats.avecVersionEnLigne }}</p>
            </div>
          </div>
        </div>

        <!-- Filters Card -->
        <div class="filters-card">
          <div class="filters-grid-coordinator">
            <!-- Filtre Enseignant (NOUVEAU pour coordinateur) -->
            <div class="filter-item">
              <label class="filter-label">
                <UserIcon class="w-4 h-4" />
                Enseignant
              </label>
              <select v-model="filters.enseignant_id" @change="applyFilters" class="filter-select">
                <option value="">Tous les enseignants</option>
                <option v-for="enseignant in enseignants" :key="enseignant.klassci_id" :value="enseignant.klassci_id">
                  {{ enseignant.name }}
                </option>
              </select>
            </div>

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
                <option value="brouillon">Brouillon</option>
                <option value="planifiee">Planifiée</option>
                <option value="en_cours">En cours</option>
                <option value="terminee">Terminée</option>
              </select>
            </div>

            <!-- Reset -->
            <div class="filter-item">
              <label class="filter-label">&nbsp;</label>
              <button @click="resetFilters" class="filter-reset-btn">
                <XMarkIcon class="w-4 h-4" />
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        <!-- Evaluations List -->
        <div class="evaluations-list">
          <div v-if="filteredEvaluations.length === 0" class="empty-state">
            <DocumentTextIcon class="empty-icon" />
            <p class="empty-text">Aucune évaluation trouvée</p>
          </div>

          <div v-for="evaluation in filteredEvaluations" :key="evaluation.id" class="evaluation-card">
            <div class="evaluation-header">
              <div class="evaluation-title-section">
                <h3 class="evaluation-title">{{ evaluation.titre }}</h3>
                <div class="evaluation-meta">
                  <span class="meta-badge meta-enseignant">
                    <UserIcon class="w-3 h-3" />
                    {{ evaluation.enseignant_nom || 'Ens. inconnu' }}
                  </span>
                  <span class="meta-badge meta-matiere">
                    <BookOpenIcon class="w-3 h-3" />
                    {{ evaluation.matiere?.nom || 'Matière inconnue' }}
                  </span>
                  <span class="meta-badge meta-classe">
                    <UserGroupIcon class="w-3 h-3" />
                    {{ evaluation.classe?.nom || evaluation.classe?.libelle || 'Classe inconnue' }}
                  </span>
                </div>
              </div>
              <span :class="getStatusClass(evaluation.effective_status || evaluation.status)" class="status-badge">
                {{ getStatusLabel(evaluation.effective_status || evaluation.status) }}
              </span>
            </div>

            <div class="evaluation-stats">
              <div class="stat-item">
                <CalendarIcon class="stat-item-icon" />
                <span>{{ formatDate(evaluation.date_evaluation) }}</span>
              </div>
              <div class="stat-item">
                <ClockIcon class="stat-item-icon" />
                <span>{{ evaluation.duree_minutes }} min</span>
              </div>
              <div class="stat-item">
                <DocumentTextIcon class="stat-item-icon" />
                <span>{{ evaluation.questions_count || 0 }} questions</span>
              </div>
              <div class="stat-item">
                <UserGroupIcon class="stat-item-icon" />
                <span>{{ evaluation.submissions_count || 0 }} soumissions</span>
              </div>
            </div>

            <div class="evaluation-actions">
              <button @click="viewResults(evaluation.id)" class="btn-primary">
                <ChartBarIcon class="w-4 h-4" />
                Voir résultats détaillés
              </button>
              <button
                @click="viewDetails(evaluation.id)"
                class="btn-secondary"
                :disabled="isCoordinateur && !isEvaluationTerminee(evaluation)"
                :class="{ 'btn-disabled': isCoordinateur && !isEvaluationTerminee(evaluation) }"
                :title="isCoordinateur && !isEvaluationTerminee(evaluation) ? 'Accessible uniquement pour les évaluations terminées' : ''"
              >
                <EyeIcon class="w-4 h-4" />
                Prévisualiser
                <svg v-if="isCoordinateur && !isEvaluationTerminee(evaluation)" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 ml-1">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import {
  DocumentTextIcon,
  UserIcon,
  UserGroupIcon,
  BookOpenIcon,
  FlagIcon,
  XMarkIcon,
  ArrowPathIcon,
  CalendarIcon,
  ClockIcon,
  PlayIcon,
  CheckCircleIcon,
  ComputerDesktopIcon,
  ChartBarIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'
import api, { auth } from '@/services/api'

const router = useRouter()

// User role check
const currentUser = computed(() => auth.getUser())
const isCoordinateur = computed(() => currentUser.value?.role === 'coordinateur')

// State
const loading = ref(true)
const error = ref(null)
const evaluations = ref([])
const enseignants = ref([])
const classes = ref([])
const matieres = ref([])

// Filters
const filters = ref({
  enseignant_id: '',
  classe_id: '',
  matiere_id: '',
  statut: ''
})

// Computed
const filteredEvaluations = computed(() => {
  let filtered = evaluations.value

  if (filters.value.enseignant_id) {
    filtered = filtered.filter(e => e.klassci_enseignant_id == filters.value.enseignant_id)
  }

  if (filters.value.classe_id) {
    filtered = filtered.filter(e => e.klassci_classe_id == filters.value.classe_id)
  }

  if (filters.value.matiere_id) {
    filtered = filtered.filter(e => e.klassci_matiere_id == filters.value.matiere_id)
  }

  if (filters.value.statut) {
    filtered = filtered.filter(e => e.status === filters.value.statut)
  }

  return filtered
})

const stats = computed(() => {
  const all = filteredEvaluations.value
  return {
    total: all.length,
    enCours: all.filter(e => e.status === 'planifiee').length,
    terminees: all.filter(e => e.submissions_count > 0 || e.status === 'terminee').length,
    avecVersionEnLigne: all.filter(e => e.is_online).length
  }
})

// Methods
const loadData = async () => {
  loading.value = true
  error.value = null

  try {
    // Charger les évaluations
    const evalsResponse = await api.get('/evaluations')
    evaluations.value = evalsResponse.data || []

    // Extraire la liste unique des enseignants
    const enseignantsMap = new Map()
    evaluations.value.forEach(evaluation => {
      if (evaluation.klassci_enseignant_id && evaluation.enseignant_nom) {
        enseignantsMap.set(evaluation.klassci_enseignant_id, {
          klassci_id: evaluation.klassci_enseignant_id,
          name: evaluation.enseignant_nom,
          email: evaluation.enseignant?.email || ''
        })
      }
    })
    enseignants.value = Array.from(enseignantsMap.values()).sort((a, b) => a.name.localeCompare(b.name))

    // Charger classes et matières
    const [classesResponse, matieresResponse] = await Promise.all([
      api.get('/proxy/classes'),
      api.get('/proxy/matieres')
    ])

    classes.value = classesResponse.data.data || []
    matieres.value = matieresResponse.data.data || []

  } catch (err) {
    console.error('Erreur chargement données:', err)
    error.value = err.response?.data?.message || 'Erreur lors du chargement des données'
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  // Les filtres sont automatiquement appliqués via computed
}

const resetFilters = () => {
  filters.value = {
    enseignant_id: '',
    classe_id: '',
    matiere_id: '',
    statut: ''
  }
}

const viewResults = (id) => {
  // Rediriger vers la page de détails avec classe/évaluation
  router.push(`/admin/evaluations/${id}/details`)
}

const viewDetails = (id) => {
  // Utiliser la route appropriée selon le rôle
  if (isCoordinateur.value) {
    router.push(`/coordinateur/evaluations/${id}/preview`)
  } else {
    router.push(`/teacher/evaluations/${id}/preview`)
  }
}

const getStatusClass = (status) => {
  const classes = {
    'brouillon': 'status-draft',
    'planifiee': 'status-planned',
    'en_cours': 'status-active',
    'terminee': 'status-completed'
  }
  return classes[status] || 'status-draft'
}

const getStatusLabel = (status) => {
  const labels = {
    'brouillon': 'Brouillon',
    'planifiee': 'Planifiée',
    'en_cours': 'En cours',
    'terminee': 'Terminée'
  }
  return labels[status] || status
}

const isEvaluationTerminee = (evaluation) => {
  // Utilise le statut effectif calculé par le backend (date + durée)
  // Si pas de effective_status, fallback sur status
  const effectiveStatus = evaluation.effective_status || evaluation.status
  return effectiveStatus === 'terminee'
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.evaluations-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

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
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--card-shadow);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.stat-icon-wrapper {
  width: 3rem;
  height: 3rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

/* Filters */
.filters-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: var(--card-shadow);
}

.filters-grid-coordinator {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-select {
  padding: 0.625rem 0.875rem;
  border: 1px solid var(--input-border);
  border-radius: var(--radius-md);
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: border-color var(--transition-fast);
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary);
}

.filter-reset-btn {
  padding: 0.625rem 1rem;
  background: var(--danger);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background var(--transition-fast);
}

.filter-reset-btn:hover {
  background: var(--danger-hover);
}

/* Evaluations List */
.evaluations-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.evaluation-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--card-shadow);
  transition: transform var(--transition-fast), box-shadow var(--transition-fast);
}

.evaluation-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--card-shadow-hover);
}

.evaluation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.evaluation-title-section {
  flex: 1;
}

.evaluation-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.75rem;
}

.evaluation-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
}

.meta-enseignant {
  background: var(--primary-light);
  color: var(--primary);
}

.meta-matiere {
  background: var(--success-light);
  color: var(--success);
}

.meta-classe {
  background: var(--warning-light);
  color: var(--warning);
}

.status-badge {
  padding: 0.5rem 1rem;
  border-radius: var(--radius-full);
  font-size: 0.875rem;
  font-weight: 500;
  white-space: nowrap;
}

.status-draft {
  background: var(--neutral-light);
  color: var(--text-secondary);
}

.status-planned {
  background: var(--info-light);
  color: var(--info);
}

.status-active {
  background: var(--success-light);
  color: var(--success);
}

.status-completed {
  background: var(--primary-light);
  color: var(--primary);
}

.evaluation-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
  margin-bottom: 1rem;
  padding: 1rem 0;
  border-top: 1px solid var(--border-light);
  border-bottom: 1px solid var(--border-light);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-item-icon {
  width: 1rem;
  height: 1rem;
}

.evaluation-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1rem;
}

.btn-primary,
.btn-secondary {
  padding: 0.625rem 1.25rem;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all var(--transition-fast);
  border: none;
}

.btn-primary {
  background: var(--primary);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-hover);
}

.btn-secondary {
  background: var(--card-bg);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-secondary:hover {
  background: var(--hover-bg);
}

/* Empty/Error States */
.empty-state,
.error-state {
  text-align: center;
  padding: 3rem;
}

.empty-icon,
.error-icon {
  width: 4rem;
  height: 4rem;
  color: var(--text-secondary);
  margin: 0 auto 1rem;
  opacity: 0.5;
}

.empty-text {
  color: var(--text-secondary);
  font-size: 1rem;
}

.loading-state {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}

.error-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.error-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--danger);
  margin: 0 0 0.5rem;
}

.error-message {
  color: var(--text-secondary);
  margin: 0;
}

.btn-retry {
  padding: 0.75rem 1.5rem;
  background: var(--primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: background var(--transition-fast);
}

.btn-retry:hover {
  background: var(--primary-hover);
}

.btn-disabled {
  opacity: 0.5;
  cursor: not-allowed !important;
  pointer-events: none;
  background: var(--neutral-light) !important;
  color: var(--text-secondary) !important;
  border-color: var(--border-light) !important;
}

.btn-disabled:hover {
  transform: none !important;
  box-shadow: none !important;
}

</style>
