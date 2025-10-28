<template>
  <DashboardLayout>
    <div class="seances-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <span class="page-icon">◉</span>
          <div>
            <h1 class="page-title">Mes Séances</h1>
            <p class="page-subtitle">Gérez vos cours et visioconférences</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <SkeletonLoader v-if="loading" type="list" :count="3" />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <span class="error-icon">⚠</span>
          <div>
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">{{ error }}</p>
          </div>
        </div>
        <button @click="loadSeances" class="btn-retry">
          <span class="icon">↻</span>
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
                <span class="filter-icon">◘</span>
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
                <span class="filter-icon">◉</span>
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
              <span class="stat-icon">◉</span>
              <span class="stat-label">Total</span>
            </div>
            <p class="stat-value">{{ stats.total }}</p>
            <p class="stat-change">séances programmées</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon stat-icon-active">☼</span>
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
              <span class="stat-icon stat-icon-finished">✓</span>
              <span class="stat-label">Terminées</span>
            </div>
            <p class="stat-value">{{ stats.finished }}</p>
            <p class="stat-change">ce mois</p>
          </div>
        </div>

        <!-- Séances List -->
        <div v-if="filteredSeances.length > 0" class="seances-list">
          <div
            v-for="seance in filteredSeances"
            :key="seance.id"
            class="seance-card"
          >
            <!-- Header Séance -->
            <div class="seance-header">
              <div class="seance-title-section">
                <span class="seance-icon">◘</span>
                <div>
                  <h3 class="seance-title">
                    {{ seance.matiere?.nom || 'Matière non définie' }}
                  </h3>
                  <p v-if="seance.matiere?.code" class="seance-code">
                    Code: {{ seance.matiere.code }}
                  </p>
                </div>
              </div>

              <!-- Badge Status Visio -->
              <div v-if="seance.visio">
                <span
                  v-if="seance.visio.status === 'programmee'"
                  class="status-badge status-scheduled"
                >
                  <span class="badge-icon">◑</span>
                  Visio Programmée
                </span>
                <span
                  v-else-if="seance.visio.status === 'active'"
                  class="status-badge status-active"
                >
                  <span class="pulse-dot"></span>
                  EN DIRECT
                </span>
                <span
                  v-else-if="seance.visio.status === 'terminee'"
                  class="status-badge status-finished"
                >
                  <span class="badge-icon">✓</span>
                  Terminée
                </span>
              </div>
            </div>

            <!-- Infos Séance -->
            <div class="seance-info-grid">
              <div class="info-item">
                <span class="info-icon">◷</span>
                <div>
                  <p class="info-label">Date</p>
                  <p class="info-value">{{ formatDate(seance.programmation?.date) }}</p>
                </div>
              </div>

              <div class="info-item">
                <span class="info-icon">⏰</span>
                <div>
                  <p class="info-label">Horaire</p>
                  <p class="info-value">
                    {{ formatTime(seance.programmation?.heure_debut) }} - {{ formatTime(seance.programmation?.heure_fin) }}
                  </p>
                </div>
              </div>

              <div class="info-item">
                <span class="info-icon">▓</span>
                <div>
                  <p class="info-label">Classe</p>
                  <p class="info-value">{{ seance.classe?.nom || 'N/A' }}</p>
                </div>
              </div>

              <div class="info-item">
                <span class="info-icon">◈</span>
                <div>
                  <p class="info-label">Salle</p>
                  <p class="info-value">{{ seance.salle || 'N/A' }}</p>
                </div>
              </div>
            </div>

            <!-- Actions Visio -->
            <div class="seance-actions">
              <!-- Pas de visio activée -->
              <div v-if="!seance.visio || !seance.visio.enabled" class="action-section action-none">
                <p class="action-message">Aucune visioconférence programmée</p>
                <button
                  @click="handleActivateVisio(seance)"
                  :disabled="actionLoading === seance.id"
                  class="btn-action btn-primary"
                >
                  <span class="btn-icon">▶</span>
                  {{ actionLoading === seance.id ? 'Activation...' : 'Activer la visio' }}
                </button>
              </div>

              <!-- Visio programmée -->
              <div v-else-if="seance.visio.status === 'programmee'" class="action-section action-scheduled">
                <div class="action-info">
                  <div class="action-details">
                    <span class="action-icon">◉</span>
                    <div>
                      <p class="action-title">Visioconférence Jitsi programmée</p>
                      <p class="action-subtitle">
                        Salle: <span class="room-id">{{ seance.visio.room_id }}</span>
                      </p>
                    </div>
                  </div>
                  <button
                    @click="handleStartVisio(seance)"
                    :disabled="actionLoading === seance.id"
                    class="btn-action btn-success"
                  >
                    <span class="btn-icon">▶</span>
                    {{ actionLoading === seance.id ? 'Démarrage...' : 'Démarrer maintenant' }}
                  </button>
                </div>
              </div>

              <!-- Visio active -->
              <div v-else-if="seance.visio.status === 'active'" class="action-section action-active">
                <div class="action-info">
                  <div class="action-details">
                    <div class="flex items-center gap-3 flex-1">
                      <span class="pulse-indicator"></span>
                      <div>
                        <p class="action-title text-green-900">Cours EN DIRECT</p>
                        <p class="action-subtitle">
                          Démarré à {{ formatTime(seance.visio.started_at) }}
                        </p>
                        <p v-if="seance.visio.participants_count > 0" class="participants-count">
                          <span class="count-icon">☺</span>
                          {{ seance.visio.participants_count }} participant(s) connecté(s)
                        </p>
                      </div>
                    </div>
                  </div>
                  <div class="action-buttons">
                    <a
                      :href="`https://meet.jit.si/${seance.visio.room_id}`"
                      target="_blank"
                      class="btn-action btn-success"
                    >
                      <span class="btn-icon">◉</span>
                      Rejoindre
                    </a>
                    <button
                      @click="handleEndVisio(seance)"
                      :disabled="actionLoading === seance.id"
                      class="btn-action btn-danger"
                    >
                      <span class="btn-icon">■</span>
                      {{ actionLoading === seance.id ? 'Arrêt...' : 'Terminer' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Visio terminée -->
              <div v-else-if="seance.visio.status === 'terminee'" class="action-section action-finished">
                <span class="action-icon">✓</span>
                <div>
                  <p class="action-title text-gray-900">Visioconférence terminée</p>
                  <p class="action-subtitle">
                    {{ seance.visio.participants_count || 0 }} participant(s) ont rejoint
                  </p>
                </div>
              </div>
            </div>
          </div>
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
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { lmsService } from '@/services/lms'
import { klassciService } from '@/services/klassci'

const seances = ref([])
const matieres = ref([])
const loading = ref(true)
const error = ref(null)
const actionLoading = ref(null)

// Filters
const filters = reactive({
  matiere_id: '',
  visio_status: '',
  period: 'all'
})

// Cache
const CACHE_KEY_SEANCES = 'teacher_seances_cache'
const CACHE_KEY_MATIERES = 'teacher_matieres_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Computed - Filtered seances
const filteredSeances = computed(() => {
  let filtered = seances.value

  // Filter by matière
  if (filters.matiere_id) {
    filtered = filtered.filter(s => s.matiere?.id == filters.matiere_id)
  }

  // Filter by visio status
  if (filters.visio_status) {
    if (filters.visio_status === 'none') {
      filtered = filtered.filter(s => !s.visio || !s.visio.enabled)
    } else {
      filtered = filtered.filter(s => s.visio?.status === filters.visio_status)
    }
  }

  // Filter by period
  if (filters.period !== 'all') {
    const now = new Date()
    filtered = filtered.filter(s => {
      if (!s.programmation?.date) return false
      const seanceDate = new Date(s.programmation.date)

      if (filters.period === 'today') {
        return seanceDate.toDateString() === now.toDateString()
      } else if (filters.period === 'week') {
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - now.getDay())
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 7)
        return seanceDate >= weekStart && seanceDate < weekEnd
      } else if (filters.period === 'month') {
        return seanceDate.getMonth() === now.getMonth() &&
               seanceDate.getFullYear() === now.getFullYear()
      }
      return true
    })
  }

  return filtered
})

// Computed - Statistics
const stats = computed(() => {
  return {
    total: seances.value.length,
    active: seances.value.filter(s => s.visio?.status === 'active').length,
    scheduled: seances.value.filter(s => s.visio?.status === 'programmee').length,
    finished: seances.value.filter(s => s.visio?.status === 'terminee').length
  }
})

// Load seances with cache
async function loadSeances() {
  // Check cache first
  const cached = localStorage.getItem(CACHE_KEY_SEANCES)
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log('[CACHE] Utilisation du cache séances')
        seances.value = data
        loading.value = false
        // Refresh in background
        refreshInBackground()
        return
      }
    } catch (err) {
      console.warn('[CACHE] Cache séances invalide, rechargement...')
    }
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
    localStorage.setItem(CACHE_KEY_SEANCES, JSON.stringify({
      data: seances.value,
      timestamp: Date.now()
    }))

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

    localStorage.setItem(CACHE_KEY_SEANCES, JSON.stringify({
      data: seances.value,
      timestamp: Date.now()
    }))

    console.log('[BACKGROUND] Séances rafraîchies')
  } catch (err) {
    console.warn('[BACKGROUND] Erreur rafraîchissement:', err)
  }
}

// Load matières with cache
async function loadMatieres() {
  const cached = localStorage.getItem(CACHE_KEY_MATIERES)
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log('[CACHE] Utilisation du cache matières')
        matieres.value = data
        return
      }
    } catch (err) {
      console.warn('[CACHE] Cache matières invalide')
    }
  }

  try {
    console.log('[API] Chargement matières...')
    const dashboardData = await klassciService.getTeacherDashboard()
    matieres.value = dashboardData.matieres || []

    localStorage.setItem(CACHE_KEY_MATIERES, JSON.stringify({
      data: matieres.value,
      timestamp: Date.now()
    }))

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
    localStorage.removeItem(CACHE_KEY_SEANCES)
    await loadSeances()
  } catch (err) {
    console.error('[ERREUR] Activation visio:', err)
    error.value = 'Erreur lors de l\'activation de la visio'
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
    localStorage.removeItem(CACHE_KEY_SEANCES)
    await loadSeances()
  } catch (err) {
    console.error('[ERREUR] Démarrage visio:', err)
    error.value = 'Erreur lors du démarrage de la visio'
  } finally {
    actionLoading.value = null
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
    localStorage.removeItem(CACHE_KEY_SEANCES)
    await loadSeances()
  } catch (err) {
    console.error('[ERREUR] Fin visio:', err)
    error.value = 'Erreur lors de la terminaison de la visio'
  } finally {
    actionLoading.value = null
  }
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

// Format time
function formatTime(dateTimeStr) {
  if (!dateTimeStr) return 'N/A'
  const date = new Date(dateTimeStr)
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

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

.seance-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.seance-card:hover {
  box-shadow: var(--card-shadow-hover);
}

.seance-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.seance-title-section {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.seance-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
  color: #3b82f6;
}

.seance-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.seance-code {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-icon {
  font-size: 1rem;
  line-height: 1;
}

.status-scheduled {
  background: #dbeafe;
  color: #1e40af;
}

.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-finished {
  background: #f3f4f6;
  color: #4b5563;
}

.pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: currentColor;
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Seance Info Grid */
.seance-info-grid {
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
  font-size: 1.25rem;
  line-height: 1;
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

/* Seance Actions */
.seance-actions {
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.action-section {
  padding: 1.25rem;
  border-radius: 0.5rem;
}

.action-none {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: var(--bg-secondary);
}

.action-message {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.action-scheduled {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.action-active {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.action-finished {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.action-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.action-details {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.action-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
  color: #3b82f6;
}

.action-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.action-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.room-id {
  font-family: monospace;
  background: rgba(255, 255, 255, 0.5);
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 600;
}

.pulse-indicator {
  width: 1.25rem;
  height: 1.25rem;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  flex-shrink: 0;
}

.participants-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-top: 0.5rem;
}

.count-icon {
  font-size: 1rem;
  line-height: 1;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
}

/* Action Buttons */
.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  text-decoration: none;
}

.btn-icon {
  font-size: 1.125rem;
  line-height: 1;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-success {
  background: #22c55e;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #16a34a;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
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
