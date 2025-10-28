<template>
  <DashboardLayout>
    <div class="admin-seances-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <CalendarIcon class="page-icon" />
          <div>
            <h1 class="page-title">Gestion des Séances</h1>
            <p class="page-subtitle">Gérer toutes les séances de visioconférence</p>
          </div>
        </div>
        <button @click="refreshData" class="refresh-btn" title="Actualiser les données">
          <ArrowPathIcon :class="['w-5 h-5', { 'animate-spin': loading }]" />
        </button>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filters-grid">
          <div class="filter-group">
            <label class="filter-label">Période</label>
            <select v-model="filters.days" @change="loadSeances" class="filter-select">
              <option value="7">7 derniers jours</option>
              <option value="14">14 derniers jours</option>
              <option value="30">30 derniers jours</option>
              <option value="60">60 derniers jours</option>
              <option value="90">90 derniers jours</option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Enseignant</label>
            <select v-model="filters.teacher_id" @change="loadSeances" class="filter-select">
              <option value="">Tous les enseignants</option>
              <option v-for="teacher in teachers" :key="teacher.id" :value="teacher.id">
                {{ teacher.nom }} {{ teacher.prenom }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Classe</label>
            <select v-model="filters.classe_id" @change="loadSeances" class="filter-select">
              <option value="">Toutes les classes</option>
              <option v-for="classe in classes" :key="classe.id" :value="classe.id">
                {{ classe.name || classe.libelle }}
              </option>
            </select>
          </div>

          <div class="filter-group">
            <label class="filter-label">Statut</label>
            <select v-model="filters.status" @change="loadSeances" class="filter-select">
              <option value="">Tous les statuts</option>
              <option value="active">Actives</option>
              <option value="scheduled">Planifiées</option>
              <option value="completed">Terminées</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="seances-grid">
        <SkeletonLoader type="card" />
        <SkeletonLoader type="card" />
        <SkeletonLoader type="card" />
      </div>

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <ExclamationTriangleIcon class="error-icon" />
        <p class="error-message">⚠ {{ error }}</p>
        <button @click="loadSeances" class="retry-btn">Réessayer</button>
      </div>

      <!-- Empty State -->
      <div v-else-if="seances.length === 0" class="empty-state">
        <CalendarIcon class="empty-icon" />
        <h3 class="empty-title">Aucune séance trouvée</h3>
        <p class="empty-message">Aucune séance ne correspond aux critères sélectionnés</p>
      </div>

      <!-- Seances Grid -->
      <div v-else class="seances-grid">
        <div v-for="seance in seances" :key="seance.id" class="seance-card">
          <div class="seance-header">
            <div class="seance-title-group">
              <VideoCameraIcon class="seance-icon" />
              <h3 class="seance-title" :title="`Séance: ${seance.matiere?.nom || 'N/A'}`">
                {{ seance.matiere?.nom || 'Matière inconnue' }}
              </h3>
            </div>
            <span
              :class="['status-badge', `status-${getSeanceStatus(seance)}`]"
              :title="`Statut: ${getSeanceStatusLabel(seance)}`"
            >
              {{ getSeanceStatusLabel(seance) }}
            </span>
          </div>

          <div class="seance-body">
            <div class="info-row" :title="`Classe: ${seance.classe?.name || 'N/A'}`">
              <BuildingLibraryIcon class="info-icon" />
              <span class="info-text">{{ seance.classe?.name || 'N/A' }}</span>
            </div>

            <div class="info-row" :title="`Enseignant: ${seance.enseignant?.nom || 'N/A'} ${seance.enseignant?.prenom || ''}`">
              <UserIcon class="info-icon" />
              <span class="info-text">
                {{ seance.enseignant?.nom || 'N/A' }} {{ seance.enseignant?.prenom || '' }}
              </span>
            </div>

            <div class="info-row" :title="`Date: ${formatDate(seance.date_debut)}`">
              <CalendarIcon class="info-icon" />
              <span class="info-text">{{ formatDate(seance.date_debut) }}</span>
            </div>

            <div class="info-row" :title="`Heure: ${formatTime(seance.date_debut)} - ${formatTime(seance.date_fin)}`">
              <ClockIcon class="info-icon" />
              <span class="info-text">
                {{ formatTime(seance.date_debut) }} - {{ formatTime(seance.date_fin) }}
              </span>
            </div>
          </div>

          <div class="seance-footer">
            <button
              v-if="seance.visio_enabled"
              @click="viewSeanceDetails(seance)"
              class="action-btn primary"
              title="Voir les détails de la séance"
            >
              <EyeIcon class="w-4 h-4" />
              Détails
            </button>
            <button
              v-else
              @click="enableVisio(seance)"
              class="action-btn secondary"
              title="Activer la visioconférence"
            >
              <VideoCameraIcon class="w-4 h-4" />
              Activer Visio
            </button>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="seances.length > 0" class="pagination">
        <p class="pagination-info">
          Affichage de <strong>{{ seances.length }}</strong> séance(s)
        </p>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { klassciService } from '@/services/klassci'
import {
  CalendarIcon,
  VideoCameraIcon,
  BuildingLibraryIcon,
  UserIcon,
  ClockIcon,
  EyeIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/vue/24/outline'

const loading = ref(true)
const error = ref(null)
const seances = ref([])
const teachers = ref([])
const classes = ref([])

const filters = ref({
  days: '30',
  teacher_id: '',
  classe_id: '',
  status: ''
})

const CACHE_KEY = 'admin_seances_cache'
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

async function loadSeances() {
  loading.value = true
  error.value = null

  try {
    // Tenter de charger depuis le cache
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached && !filters.value.teacher_id && !filters.value.classe_id) {
      try {
        const { data, timestamp, filterState } = JSON.parse(cached)
        if (Date.now() - timestamp < CACHE_TTL && filterState.days === filters.value.days) {
          console.log('[CACHE] Séances admin chargées depuis le cache')
          seances.value = data
          loading.value = false
          refreshInBackground()
          return
        }
      } catch (err) {
        console.warn('[CACHE] Cache invalide, rechargement...')
      }
    }

    // Charger depuis l'API
    const response = await klassciService.getSeances({
      days: filters.value.days,
      teacher_id: filters.value.teacher_id,
      classe_id: filters.value.classe_id
    })

    if (response.success) {
      seances.value = response.data || []

      // Mettre en cache si aucun filtre actif
      if (!filters.value.teacher_id && !filters.value.classe_id) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: seances.value,
          timestamp: Date.now(),
          filterState: { days: filters.value.days }
        }))
      }
    } else {
      throw new Error(response.message || 'Erreur lors du chargement des séances')
    }
  } catch (err) {
    console.error('❌ Erreur chargement séances:', err)
    error.value = err.message || 'Impossible de charger les séances'
  } finally {
    loading.value = false
  }
}

async function refreshInBackground() {
  try {
    const response = await klassciService.getSeances({
      days: filters.value.days
    })

    if (response.success) {
      seances.value = response.data || []
      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: seances.value,
        timestamp: Date.now(),
        filterState: { days: filters.value.days }
      }))
      console.log('[CACHE] Séances admin rafraîchies en arrière-plan')
    }
  } catch (err) {
    console.warn('[CACHE] Erreur rafraîchissement:', err)
  }
}

async function loadTeachers() {
  try {
    const response = await klassciService.getTeachers()
    teachers.value = response || []
  } catch (err) {
    console.error('❌ Erreur chargement enseignants:', err)
  }
}

async function loadClasses() {
  try {
    const classesData = await klassciService.getClasses()
    classes.value = classesData || []
  } catch (err) {
    console.error('❌ Erreur chargement classes:', err)
  }
}

function refreshData() {
  loadSeances()
  loadTeachers()
  loadClasses()
}

function getSeanceStatus(seance) {
  const now = new Date()
  const debut = new Date(seance.date_debut)
  const fin = new Date(seance.date_fin)

  if (now >= debut && now <= fin) return 'active'
  if (now < debut) return 'scheduled'
  return 'completed'
}

function getSeanceStatusLabel(seance) {
  const status = getSeanceStatus(seance)
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

function viewSeanceDetails(seance) {
  // TODO: Ouvrir modal avec détails ou naviguer vers page détails
  console.log('Voir détails séance:', seance)
}

function enableVisio(seance) {
  // TODO: Activer la visioconférence pour cette séance
  console.log('Activer visio pour séance:', seance)
}

onMounted(() => {
  loadSeances()
  loadTeachers()
  loadClasses()
})
</script>

<style scoped>
.admin-seances-container {
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

.filter-select {
  padding: var(--spacing-sm) var(--spacing-md);
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s;
}

.filter-select:hover {
  border-color: var(--color-primary);
}

.filter-select:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Seances Grid */
.seances-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.seance-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.seance-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.seance-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.seance-title-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  min-width: 0;
}

.seance-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-primary);
  flex-shrink: 0;
}

.seance-title {
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

.seance-body {
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

.seance-footer {
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
  .admin-seances-container {
    padding: var(--spacing-md);
  }

  .page-title {
    font-size: 1.5rem;
  }

  .seances-grid {
    grid-template-columns: 1fr;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }
}
</style>
