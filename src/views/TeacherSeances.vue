<template>
  <DashboardLayout>
    <div class="seances-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <i class="fa fa-dot-circle-o page-icon"></i>
          <div>
            <h1 class="page-title">Mes Séances</h1>
            <p class="page-subtitle">Gérez vos cours et visioconférences</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des séances..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <i class="fa fa-exclamation-triangle error-icon"></i>
          <div>
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">{{ error }}</p>
          </div>
        </div>
        <button @click="loadSeances" class="btn-retry">
          <i class="fa fa-refresh icon"></i>
          Réessayer
        </button>
      </div>

      <template v-else>
        <!-- Filters Card -->
        <div class="filters-card">
          <div class="filters-grid">
            <!-- Filtre Matière -->
            <div class="filter-item">
              <label class="filter-label">
                <i class="fa fa-circle filter-icon"></i>
                Matière
              </label>
              <select v-model="filters.matiere_id" @change="applyFilters" class="filter-select">
                <option value="">Toutes les matières</option>
                <option v-for="matiere in matieres" :key="matiere.id" :value="matiere.id">
                  {{ matiere.nom || matiere.name }}
                </option>
              </select>
            </div>

            <!-- Filtre Statut Visio -->
            <div class="filter-item">
              <label class="filter-label">
                <i class="fa fa-dot-circle-o filter-icon"></i>
                Statut visio
              </label>
              <select v-model="filters.visio_status" @change="applyFilters" class="filter-select">
                <option value="">Tous les statuts</option>
                <option value="none">Sans visio</option>
                <option value="programmee">Programmée</option>
                <option value="active">En direct</option>
                <option value="terminee">Terminée</option>
              </select>
            </div>

            <!-- Filtre Période -->
            <div class="filter-item">
              <label class="filter-label">
                <span class="filter-icon">◷</span>
                Période
              </label>
              <select v-model="filters.period" @change="applyFilters" class="filter-select">
                <option value="all">Toutes les périodes</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
            </div>

            <!-- Reset -->
            <div class="filter-item filter-actions">
              <button @click="resetFilters" class="btn-reset">
                <span class="icon">✕</span>
                Réinitialiser
              </button>
            </div>
          </div>
        </div>

        <!-- Statistics -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <i class="fa fa-dot-circle-o stat-icon"></i>
              <span class="stat-label">Total</span>
            </div>
            <p class="stat-value">{{ stats.total }}</p>
            <p class="stat-change">séances programmées</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <i class="fa fa-sun-o stat-icon stat-icon-active"></i>
              <span class="stat-label">En direct</span>
            </div>
            <p class="stat-value">{{ stats.active }}</p>
            <p class="stat-change">cours en cours</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon stat-icon-scheduled">◑</span>
              <span class="stat-label">Programmées</span>
            </div>
            <p class="stat-value">{{ stats.scheduled }}</p>
            <p class="stat-change">à venir</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <i class="fa fa-check stat-icon stat-icon-finished"></i>
              <span class="stat-label">Terminées</span>
            </div>
            <p class="stat-value">{{ stats.finished }}</p>
            <p class="stat-change">ce mois</p>
          </div>
        </div>

        <!-- Séances List (#28 : carte extraite en sous-composant) -->
        <div v-if="filteredSeances.length > 0" class="seances-list">
          <SeanceCard
            v-for="seance in filteredSeances"
            :key="seance.id"
            :seance="seance"
            :is-enseignant="isEnseignant"
            :action-loading="actionLoading"
            @activate="handleActivateVisio"
            @start="handleStartVisio"
            @deactivate="handleDeactivateVisio"
            @join="handleJoinVisio"
            @end="handleEndVisio"
          />
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <span class="empty-icon">◷</span>
          <h3 class="empty-title">Aucune séance trouvée</h3>
          <p class="empty-message">
            {{ filters.matiere_id || filters.visio_status || filters.period !== 'all'
              ? 'Aucune séance ne correspond à vos filtres'
              : 'Vos prochaines séances apparaîtront ici' }}
          </p>
          <button v-if="filters.matiere_id || filters.visio_status || filters.period !== 'all'"
                  @click="resetFilters"
                  class="btn-empty">
            Voir toutes les séances
          </button>
        </div>
      </template>
    </div>


  </DashboardLayout>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { useVisioParticipation } from '@/composables/useVisioParticipation'
import { lmsService } from '@/services/lms'
import { klassciService } from '@/services/klassci'
import { useAuthStore } from '@/stores/auth'
import { toast } from '@/services/toast'
import { normalizeError } from '@/services/errorHandler'
import { readCache, writeCache, clearCache } from '@/services/cache'
import { buildJitsiUrl } from '@/constants/visio'
// #28 : logique métier pure extraite (testée dans tests/unit/seances.test.js)
import { filterSeances, computeSeancesStats } from '@/utils/seances'
import SeanceCard from '@/components/seances/SeanceCard.vue'

const seances = ref([])
const matieres = ref([])
const loading = ref(true)
const error = ref(null)
const actionLoading = ref(null)

// État de la modal Jitsi
// visioParticipation sera créé dynamiquement pour chaque séance
const visioParticipations = reactive({})

// Get current user (#19 : via store, plus de localStorage('user'))
const currentUser = useAuthStore().currentUser
const isEnseignant = currentUser?.role === 'enseignant'

// Filters
const filters = reactive({
  matiere_id: '',
  visio_status: '',
  period: 'all'
})


// Computeds délégués à la logique pure extraite (#28)
const filteredSeances = computed(() => filterSeances(seances.value, filters))

const stats = computed(() => computeSeancesStats(seances.value))

// Load seances with cache
async function loadSeances() {
  // Check cache first
  const cachedData = readCache('teacher_seances')
  if (cachedData !== null) {
    console.log('[CACHE] Utilisation du cache séances')
    seances.value = cachedData
    loading.value = false
    // Refresh in background
    refreshInBackground()
    return
  }

  // Load from API
  loading.value = true
  error.value = null

  try {
    console.log('[API] Chargement séances enseignant...')
    const response = await lmsService.getMyTeachingSeances()

    console.log('[API] Réponse séances:', response)
    seances.value = response.data || []

    // Save to cache
    writeCache('teacher_seances', seances.value)

    console.log(`[SUCCESS] ${seances.value.length} séance(s) chargée(s)`)
  } catch (err) {
    console.error('[ERREUR] Chargement séances:', err)
    error.value = 'Impossible de charger les séances. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}

// Refresh in background
async function refreshInBackground() {
  try {
    console.log('[BACKGROUND] Rafraîchissement des séances...')
    const response = await lmsService.getMyTeachingSeances()
    seances.value = response.data || []

    writeCache('teacher_seances', seances.value)

    console.log('[BACKGROUND] Séances rafraîchies')
  } catch (err) {
    console.warn('[BACKGROUND] Erreur rafraîchissement:', err)
  }
}

// Load matières with cache
async function loadMatieres() {
  const cachedData = readCache('teacher_matieres')
  if (cachedData !== null) {
    console.log('[CACHE] Utilisation du cache matières')
    matieres.value = cachedData
    return
  }

  try {
    console.log('[API] Chargement matières...')
    const dashboardData = await klassciService.getTeacherDashboard()
    matieres.value = dashboardData.matieres || []

    writeCache('teacher_matieres', matieres.value)

    console.log('[SUCCESS] Matières chargées')
  } catch (err) {
    console.error('[ERREUR] Chargement matières:', err)
  }
}

// Apply filters
function applyFilters() {
  console.log('[FILTERS] Filtres appliqués:', filters)
}

// Reset filters
function resetFilters() {
  filters.matiere_id = ''
  filters.visio_status = ''
  filters.period = 'all'
  console.log('[FILTERS] Filtres réinitialisés')
}

// Visio actions
async function handleActivateVisio(seance) {
  if (actionLoading.value) return

  actionLoading.value = seance.id

  try {
    console.log('[VISIO] Activation visio pour séance:', seance.id)
    const response = await lmsService.activateVisio(seance.id)

    console.log('[VISIO] Visio activée:', response)

    // Invalidate cache and reload
    clearCache('teacher_seances')
    await loadSeances()
  } catch (err) {
    console.error('[ERREUR] Activation visio:', err)
    error.value = 'Erreur lors de l\'activation de la visio'
  } finally {
    actionLoading.value = null
  }
}

async function handleDeactivateVisio(seance) {
  if (actionLoading.value) return

  if (!confirm('Voulez-vous vraiment désactiver la visioconférence ?')) {
    return
  }

  actionLoading.value = seance.id

  try {
    console.log('[VISIO] Désactivation visio pour séance:', seance.id)
    const response = await lmsService.deactivateVisio(seance.id)

    console.log('[VISIO] Visio désactivée:', response)

    // Invalidate cache and reload
    clearCache('teacher_seances')
    await loadSeances()
  } catch (err) {
    console.error('[ERREUR] Désactivation visio:', err)
    error.value = 'Erreur lors de la désactivation de la visio'
  } finally {
    actionLoading.value = null
  }
}

async function handleStartVisio(seance) {
  if (actionLoading.value) return

  actionLoading.value = seance.id

  try {
    console.log('[VISIO] Démarrage visio pour séance:', seance.id)
    const response = await lmsService.startVisio(seance.id)

    console.log('[VISIO] Visio démarrée:', response)

    // Invalidate cache and reload
    clearCache('teacher_seances')
    await loadSeances()
  } catch (err) {
    console.error('[ERREUR] Démarrage visio:', err)
    error.value = 'Erreur lors du démarrage de la visio'
  } finally {
    actionLoading.value = null
  }
}


async function handleJoinVisio(seance) {
  try {
    console.log('[VISIO] Rejoindre visio:', seance.id)

    // Créer le composable pour cette séance si pas déjà créé
    if (!visioParticipations[seance.id]) {
      visioParticipations[seance.id] = useVisioParticipation(seance.id)
    }

    // Ouvrir window.open avec tracking
    const roomId = seance.visio.room_id
    const jitsiLink = buildJitsiUrl(roomId)

    await visioParticipations[seance.id].joinVisio(jitsiLink)

    console.log('[VISIO] Visio rejointe avec window.open + tracking Web Worker')

    // Rafraîchir les séances pour mettre à jour le compteur de participants
    clearCache('teacher_seances')
    loadSeances()
  } catch (error) {
    console.error('[ERREUR] Join visio:', error)
    toast.error(error.userMessage ?? normalizeError(error).userMessage)
  }
}

async function handleEndVisio(seance) {
  if (actionLoading.value) return

  if (!confirm('Voulez-vous vraiment terminer cette visioconférence ?')) {
    return
  }

  actionLoading.value = seance.id

  try {
    console.log('[VISIO] Fin visio pour séance:', seance.id)
    const response = await lmsService.endVisio(seance.id)

    console.log('[VISIO] Visio terminée:', response)

    // Invalidate cache and reload
    clearCache('teacher_seances')
    await loadSeances()
  } catch (err) {
    console.error('[ERREUR] Fin visio:', err)
    error.value = 'Erreur lors de la terminaison de la visio'
  } finally {
    actionLoading.value = null
  }
}

// formatDate/formatTime : déplacés dans SeanceCard (#28).

onMounted(() => {
  loadMatieres()
  loadSeances()
})
</script>

<style scoped>
.seances-container {
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
  font-size: 2.5rem;
  line-height: 1;
  flex-shrink: 0;
  color: #3b82f6;
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

.filter-icon {
  font-size: 1rem;
  line-height: 1;
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
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}

.stat-icon-active {
  color: #22c55e;
}

.stat-icon-scheduled {
  color: #f59e0b;
}

.stat-icon-finished {
  color: #6b7280;
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

/* Seances List */
.seances-list {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
  font-size: 6rem;
  line-height: 1;
  color: var(--text-tertiary);
  margin: 0 auto 1.5rem;
  display: block;
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
  .seances-container {
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

  .seance-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .seance-info-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .action-info {
    flex-direction: column;
    align-items: stretch;
  }

  .action-buttons {
    flex-direction: column;
  }

  .btn-action {
    width: 100%;
  }
}
</style>
