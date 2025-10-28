<template>
  <DashboardLayout>
    <div class="admin-visio-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <VideoCameraIcon class="page-icon" />
          <div>
            <h1 class="page-title">Visioconférences</h1>
            <p class="page-subtitle">Gérer toutes les visioconférences actives et planifiées</p>
          </div>
        </div>
        <button @click="refreshData" class="refresh-btn" title="Actualiser les données">
          <ArrowPathIcon :class="['w-5 h-5', { 'animate-spin': loading }]" />
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon-wrapper active">
            <VideoCameraIcon class="stat-icon" />
          </div>
          <div class="stat-content">
            <p class="stat-label">En cours</p>
            <p class="stat-value">{{ stats.active }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper scheduled">
            <CalendarIcon class="stat-icon" />
          </div>
          <div class="stat-content">
            <p class="stat-label">Planifiées</p>
            <p class="stat-value">{{ stats.scheduled }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper completed">
            <CheckCircleIcon class="stat-icon" />
          </div>
          <div class="stat-content">
            <p class="stat-label">Terminées</p>
            <p class="stat-value">{{ stats.completed }}</p>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon-wrapper total">
            <ChartBarIcon class="stat-icon" />
          </div>
          <div class="stat-content">
            <p class="stat-label">Total</p>
            <p class="stat-value">{{ stats.total }}</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filters-grid">
          <div class="filter-group">
            <label class="filter-label">Période</label>
            <select v-model="filters.days" @change="loadVisioconferences" class="filter-select">
              <option value="1">Aujourd'hui</option>
              <option value="7">7 derniers jours</option>
              <option value="14">14 derniers jours</option>
              <option value="30">30 derniers jours</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Statut</label>
            <select v-model="filters.status" @change="filterVisioconferences" class="filter-select">
              <option value="">Tous</option>
              <option value="active">En cours</option>
              <option value="scheduled">Planifiées</option>
              <option value="completed">Terminées</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Recherche</label>
            <input
              v-model="filters.search"
              @input="filterVisioconferences"
              type="text"
              placeholder="Matière, classe, enseignant..."
              class="filter-input"
            />
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="visio-grid">
        <SkeletonLoader type="card" />
        <SkeletonLoader type="card" />
        <SkeletonLoader type="card" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <ExclamationTriangleIcon class="error-icon" />
        <p class="error-message">⚠ {{ error }}</p>
        <button @click="loadVisioconferences" class="retry-btn">Réessayer</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredVisioconferences.length === 0" class="empty-state">
        <VideoCameraIcon class="empty-icon" />
        <h3 class="empty-title">Aucune visioconférence trouvée</h3>
        <p class="empty-message">Aucune visioconférence ne correspond aux critères sélectionnés</p>
      </div>

      <!-- Visioconferences Grid -->
      <div v-else class="visio-grid">
        <div v-for="visio in filteredVisioconferences" :key="visio.id" class="visio-card">
          <div class="visio-header">
            <div class="visio-title-group">
              <VideoCameraIcon class="visio-icon" />
              <h3 class="visio-title" :title="`Matière: ${visio.matiere || 'N/A'}`">
                {{ visio.matiere || 'Matière inconnue' }}
              </h3>
            </div>
            <span
              :class="['status-badge', `status-${visio.status}`]"
              :title="`Statut: ${getStatusLabel(visio.status)}`"
            >
              {{ getStatusLabel(visio.status) }}
            </span>
          </div>

          <div class="visio-body">
            <div class="info-row" :title="`Classe: ${visio.classe || 'N/A'}`">
              <BuildingLibraryIcon class="info-icon" />
              <span class="info-text">{{ visio.classe || 'N/A' }}</span>
            </div>

            <div class="info-row" :title="`Enseignant: ${visio.enseignant || 'N/A'}`">
              <UserIcon class="info-icon" />
              <span class="info-text">{{ visio.enseignant || 'N/A' }}</span>
            </div>

            <div class="info-row" :title="`Date: ${formatDate(visio.date_debut)}`">
              <CalendarIcon class="info-icon" />
              <span class="info-text">{{ formatDate(visio.date_debut) }}</span>
            </div>

            <div class="info-row" :title="`Heure: ${formatTime(visio.date_debut)} - ${formatTime(visio.date_fin)}`">
              <ClockIcon class="info-icon" />
              <span class="info-text">
                {{ formatTime(visio.date_debut) }} - {{ formatTime(visio.date_fin) }}
              </span>
            </div>

            <div v-if="visio.participants_count" class="info-row" :title="`${visio.participants_count} participant(s)`">
              <UsersIcon class="info-icon" />
              <span class="info-text">{{ visio.participants_count }} participant(s)</span>
            </div>
          </div>

          <div class="visio-footer">
            <button
              v-if="visio.status === 'active'"
              @click="joinVisio(visio)"
              class="action-btn primary"
              title="Rejoindre la visioconférence"
            >
              <VideoCameraIcon class="w-4 h-4" />
              Rejoindre
            </button>
            <button
              @click="viewVisioDetails(visio)"
              class="action-btn secondary"
              title="Voir les détails"
            >
              <EyeIcon class="w-4 h-4" />
              Détails
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="filteredVisioconferences.length > 0" class="pagination">
        <p class="pagination-info">
          Affichage de <strong>{{ filteredVisioconferences.length }}</strong> visioconférence(s)
        </p>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { klassciService } from '@/services/klassci'
import {
  VideoCameraIcon,
  CalendarIcon,
  BuildingLibraryIcon,
  UserIcon,
  ClockIcon,
  UsersIcon,
  EyeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline'

const loading = ref(true)
const error = ref(null)
const visioconferences = ref([])

const filters = ref({
  days: '7',
  status: '',
  search: ''
})

const CACHE_KEY = 'admin_visio_cache'
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

// Stats computées
const stats = computed(() => {
  const allVisio = visioconferences.value
  return {
    active: allVisio.filter(v => v.status === 'active').length,
    scheduled: allVisio.filter(v => v.status === 'scheduled').length,
    completed: allVisio.filter(v => v.status === 'completed').length,
    total: allVisio.length
  }
})

// Filtrage des visioconférences
const filteredVisioconferences = computed(() => {
  let result = visioconferences.value

  // Filtre par statut
  if (filters.value.status) {
    result = result.filter(v => v.status === filters.value.status)
  }

  // Filtre par recherche
  if (filters.value.search) {
    const search = filters.value.search.toLowerCase()
    result = result.filter(v =>
      (v.matiere || '').toLowerCase().includes(search) ||
      (v.classe || '').toLowerCase().includes(search) ||
      (v.enseignant || '').toLowerCase().includes(search)
    )
  }

  return result
})

async function loadVisioconferences() {
  loading.value = true
  error.value = null

  try {
    // Tenter de charger depuis le cache
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      try {
        const { data, timestamp, filterState } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_TTL && filterState.days === filters.value.days) {
          console.log('[CACHE] Visioconférences admin chargées depuis le cache')
          processVisioData(data)
          loading.value = false
          refreshInBackground()
          return
        }
      } catch (err) {
        console.warn('[CACHE] Cache invalide, rechargement...')
      }
    }

    // Charger depuis l'API - utiliser getSeances et filtrer celles avec visio_enabled
    const response = await klassciService.getSeances({
      days: filters.value.days
    })

    if (response.success) {
      const seances = response.data || []
      processVisioData(seances)

      // Mettre en cache
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: seances,
        timestamp: Date.now(),
        filterState: { days: filters.value.days }
      }))
    } else {
      throw new Error(response.message || 'Erreur lors du chargement des visioconférences')
    }
  } catch (err) {
    console.error('❌ Erreur chargement visioconférences:', err)
    error.value = err.message || 'Impossible de charger les visioconférences'
  } finally {
    loading.value = false
  }
}

function processVisioData(seances) {
  // Transformer les séances en données de visioconférence
  visioconferences.value = seances
    .filter(s => s.visio_enabled)
    .map(s => ({
      id: s.id,
      matiere: s.matiere?.nom || 'N/A',
      classe: s.classe?.name || 'N/A',
      enseignant: `${s.enseignant?.nom || ''} ${s.enseignant?.prenom || ''}`.trim() || 'N/A',
      date_debut: s.date_debut,
      date_fin: s.date_fin,
      status: getSeanceStatus(s),
      room_name: s.room_name,
      participants_count: s.participants_count || 0
    }))
}

async function refreshInBackground() {
  try {
    const response = await klassciService.getSeances({
      days: filters.value.days
    })

    if (response.success) {
      const seances = response.data || []
      processVisioData(seances)

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: seances,
        timestamp: Date.now(),
        filterState: { days: filters.value.days }
      }))
      console.log('[CACHE] Visioconférences admin rafraîchies en arrière-plan')
    }
  } catch (err) {
    console.warn('[CACHE] Erreur rafraîchissement:', err)
  }
}

function refreshData() {
  loadVisioconferences()
}

function filterVisioconferences() {
  // Le filtrage est géré par le computed filteredVisioconferences
}

function getSeanceStatus(seance) {
  const now = new Date()
  const debut = new Date(seance.date_debut)
  const fin = new Date(seance.date_fin)

  if (now >= debut && now <= fin) return 'active'
  if (now < debut) return 'scheduled'
  return 'completed'
}

function getStatusLabel(status) {
  const labels = {
    active: 'En cours',
    scheduled: 'Planifiée',
    completed: 'Terminée'
  }
  return labels[status] || 'Inconnu'
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

function formatTime(dateString) {
  if (!dateString) return 'N/A'
  const date = new Date(dateString)
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

function joinVisio(visio) {
  // TODO: Rejoindre la visioconférence
  console.log('Rejoindre visio:', visio)
  if (visio.room_name) {
    window.open(`/video-conference/${visio.room_name}`, '_blank')
  }
}

function viewVisioDetails(visio) {
  // TODO: Ouvrir modal avec détails
  console.log('Voir détails visio:', visio)
}

onMounted(() => {
  loadVisioconferences()
})
</script>

<style scoped>
.admin-visio-container {
  padding: var(--spacing-xl);
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
}

.header-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-icon {
  width: 2.5rem;
  height: 2.5rem;
  color: var(--color-primary);
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
  margin-top: 0.25rem;
}

.refresh-btn {
  padding: var(--spacing-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary);
}

.refresh-btn:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.stat-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.stat-icon-wrapper {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-icon-wrapper.active {
  background: #dcfce7;
}

.stat-icon-wrapper.scheduled {
  background: #dbeafe;
}

.stat-icon-wrapper.completed {
  background: #f3f4f6;
}

.stat-icon-wrapper.total {
  background: #fef3c7;
}

.stat-icon {
  width: 2rem;
  height: 2rem;
}

.stat-icon-wrapper.active .stat-icon {
  color: #166534;
}

.stat-icon-wrapper.scheduled .stat-icon {
  color: #1e40af;
}

.stat-icon-wrapper.completed .stat-icon {
  color: #6b7280;
}

.stat-icon-wrapper.total .stat-icon {
  color: #b45309;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 0.25rem;
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
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
  box-shadow: var(--shadow-sm);
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: var(--spacing-md);
}

.filter-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.filter-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
}

.filter-select,
.filter-input {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--text-primary);
  transition: all 0.2s;
}

.filter-select {
  cursor: pointer;
}

.filter-select:hover,
.filter-input:hover {
  border-color: var(--color-primary);
}

.filter-select:focus,
.filter-input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Visioconferences Grid */
.visio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.visio-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.visio-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.visio-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.visio-title-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  min-width: 0;
}

.visio-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-primary);
  flex-shrink: 0;
}

.visio-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-scheduled {
  background: #dbeafe;
  color: #1e40af;
}

.status-completed {
  background: #f3f4f6;
  color: #6b7280;
}

.visio-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.info-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.info-icon {
  width: 1rem;
  height: 1rem;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.info-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visio-footer {
  display: flex;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

.action-btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.action-btn.primary {
  background: var(--color-primary);
  color: white;
  border: none;
}

.action-btn.primary:hover {
  background: var(--color-primary-dark);
}

.action-btn.secondary {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.action-btn.secondary:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
}

/* States */
.error-state,
.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.error-icon,
.empty-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto var(--spacing-lg);
  color: var(--text-tertiary);
}

.error-message,
.empty-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-message {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.retry-btn {
  margin-top: var(--spacing-md);
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.retry-btn:hover {
  background: var(--color-primary-dark);
}

/* Pagination */
.pagination {
  text-align: center;
  padding: var(--spacing-lg);
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.pagination-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .admin-visio-container {
    padding: var(--spacing-md);
  }

  .page-title {
    font-size: 1.5rem;
  }

  .stats-grid,
  .visio-grid {
    grid-template-columns: 1fr;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
