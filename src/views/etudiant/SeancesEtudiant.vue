<template>
  <DashboardLayout>
    <div class="seances-etudiant-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <span class="page-icon">◷</span>
          <div>
            <h1 class="page-title">Mon Emploi du Temps</h1>
            <p class="page-subtitle">Consultez vos cours et rejoignez les visioconférences</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <SkeletonLoader v-if="loading" type="list" :count="4" />

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
        <!-- Filters -->
        <div class="filters-card">
          <div class="filter-item">
            <label class="filter-label">
              <span class="filter-icon">◷</span>
              Période
            </label>
            <select v-model="filters.period" @change="applyFilters" class="filter-select">
              <option value="today">Aujourd'hui</option>
              <option value="week">Cette semaine</option>
              <option value="month">Ce mois</option>
              <option value="all">Toutes</option>
            </select>
          </div>

          <div class="filter-item">
            <label class="filter-label">
              <span class="filter-icon">◉</span>
              Statut visio
            </label>
            <select v-model="filters.visio_status" @change="applyFilters" class="filter-select">
              <option value="">Tous les statuts</option>
              <option value="active">En direct</option>
              <option value="programmee">Programmée</option>
              <option value="none">Sans visio</option>
            </select>
          </div>

          <div class="filter-item filter-actions">
            <button @click="resetFilters" class="btn-reset">
              <span class="icon">✕</span>
              Réinitialiser
            </button>
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
            <p class="stat-change">cours programmés</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon stat-icon-active">☼</span>
              <span class="stat-label">En direct</span>
            </div>
            <p class="stat-value">{{ stats.active }}</p>
            <p class="stat-change">disponibles maintenant</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <span class="stat-icon stat-icon-scheduled">◑</span>
              <span class="stat-label">À venir</span>
            </div>
            <p class="stat-value">{{ stats.upcoming }}</p>
            <p class="stat-change">prochainement</p>
          </div>
        </div>

        <!-- Séances List -->
        <div v-if="filteredSeances.length > 0" class="seances-list">
          <div
            v-for="seance in filteredSeances"
            :key="seance.id"
            class="seance-card"
            :class="{
              'seance-active': seance.visio?.status === 'active',
              'seance-upcoming': isUpcoming(seance)
            }"
          >
            <!-- Header -->
            <div class="seance-header">
              <div class="seance-title-section">
                <span class="seance-icon">◘</span>
                <div>
                  <h3 class="seance-title">
                    {{ seance.matiere?.nom || 'Matière' }}
                  </h3>
                  <p class="seance-subtitle">
                    {{ seance.enseignant?.nom || 'Enseignant' }}
                  </p>
                </div>
              </div>

              <!-- Status Badge -->
              <div v-if="seance.visio">
                <span
                  v-if="seance.visio.status === 'active'"
                  class="status-badge status-active"
                >
                  <span class="pulse-dot"></span>
                  EN DIRECT
                </span>
                <span
                  v-else-if="seance.visio.status === 'programmee'"
                  class="status-badge status-scheduled"
                >
                  <span class="badge-icon">◑</span>
                  Visio programmée
                </span>
              </div>
            </div>

            <!-- Info Grid -->
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

            <!-- Actions -->
            <div class="seance-actions">
              <!-- Cours en direct -->
              <div v-if="seance.visio?.status === 'active'" class="action-section action-active">
                <div class="action-details">
                  <span class="pulse-indicator"></span>
                  <div>
                    <p class="action-title">Cours en direct</p>
                    <p class="action-subtitle">L'enseignant a démarré le cours</p>
                  </div>
                </div>
                <router-link
                  :to="`/seances/${seance.id}`"
                  class="btn-action btn-success"
                >
                  <span class="btn-icon">◉</span>
                  Rejoindre
                </router-link>
              </div>

              <!-- Visio programmée mais pas encore commencée -->
              <div v-else-if="seance.visio?.status === 'programmee'" class="action-section action-scheduled">
                <div class="action-details">
                  <span class="action-icon">◑</span>
                  <div>
                    <p class="action-title">Visioconférence programmée</p>
                    <p class="action-subtitle">En attente du démarrage</p>
                  </div>
                </div>
                <router-link
                  :to="`/seances/${seance.id}`"
                  class="btn-action btn-info"
                >
                  <span class="btn-icon">→</span>
                  Voir détails
                </router-link>
              </div>

              <!-- Pas de visio -->
              <div v-else class="action-section action-none">
                <p class="action-message">
                  <span class="message-icon">◈</span>
                  Cours en présentiel - {{ seance.salle || 'Salle à confirmer' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <span class="empty-icon">◷</span>
          <h3 class="empty-title">Aucun cours trouvé</h3>
          <p class="empty-message">
            {{ filters.period !== 'all' || filters.visio_status
              ? 'Aucun cours ne correspond à vos filtres'
              : 'Vos prochains cours apparaîtront ici' }}
          </p>
          <button v-if="filters.period !== 'today' || filters.visio_status"
                  @click="resetFilters"
                  class="btn-empty">
            Voir tous les cours
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

const seances = ref([])
const loading = ref(true)
const error = ref(null)

// Filters
const filters = reactive({
  period: 'today',
  visio_status: ''
})

// Cache
const CACHE_KEY = 'student_seances_cache'
const CACHE_TTL = 3 * 60 * 1000 // 3 minutes

// Computed - Filtered seances
const filteredSeances = computed(() => {
  let filtered = seances.value

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
    upcoming: seances.value.filter(s => isUpcoming(s)).length
  }
})

// Check if seance is upcoming (within next 24 hours)
function isUpcoming(seance) {
  if (!seance.programmation?.date) return false
  const seanceDate = new Date(seance.programmation.date)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  return seanceDate >= now && seanceDate <= tomorrow
}

// Load seances
async function loadSeances() {
  // Check cache first
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log('[CACHE] Utilisation du cache séances étudiant')
        seances.value = data
        loading.value = false
        refreshInBackground()
        return
      }
    } catch (err) {
      console.warn('[CACHE] Cache invalide, rechargement...')
    }
  }

  // Load from API
  loading.value = true
  error.value = null

  try {
    console.log('[API] Chargement séances étudiant...')
    const response = await lmsService.getMyClassesSeances()

    console.log('[API] Réponse séances:', response)
    seances.value = response.data || []

    // Save to cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: seances.value,
      timestamp: Date.now()
    }))

    console.log(`[SUCCESS] ${seances.value.length} séance(s) chargée(s)`)
  } catch (err) {
    console.error('[ERREUR] Chargement séances:', err)
    error.value = 'Impossible de charger vos cours. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}

// Refresh in background
async function refreshInBackground() {
  try {
    console.log('[BACKGROUND] Rafraîchissement des séances...')
    const response = await lmsService.getMyClassesSeances()
    seances.value = response.data || []

    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: seances.value,
      timestamp: Date.now()
    }))

    console.log('[BACKGROUND] Séances rafraîchies')
  } catch (err) {
    console.warn('[BACKGROUND] Erreur rafraîchissement:', err)
  }
}

// Apply filters
function applyFilters() {
  console.log('[FILTERS] Filtres appliqués:', filters)
}

// Reset filters
function resetFilters() {
  filters.period = 'today'
  filters.visio_status = ''
  console.log('[FILTERS] Filtres réinitialisés')
}

// Format date
function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  const date = new Date(dateStr)
  return date.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
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
  loadSeances()
})
</script>

<style scoped>
.seances-etudiant-container {
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

/* Filters */
.filters-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  margin-bottom: 2rem;
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
  border: 2px solid transparent;
}

.seance-card:hover {
  box-shadow: var(--card-shadow-hover);
}

.seance-active {
  border-color: #22c55e;
  background: #f0fdf4;
}

.seance-upcoming {
  border-color: #f59e0b;
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

.seance-subtitle {
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

.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-scheduled {
  background: #dbeafe;
  color: #1e40af;
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

/* Info Grid */
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

/* Actions */
.seance-actions {
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.action-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 0.5rem;
}

.action-none {
  background: var(--bg-secondary);
}

.action-scheduled {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
}

.action-active {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
}

.action-details {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.action-icon {
  font-size: 1.5rem;
  line-height: 1;
  color: #3b82f6;
  flex-shrink: 0;
}

.pulse-indicator {
  width: 1.25rem;
  height: 1.25rem;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  flex-shrink: 0;
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

.action-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.message-icon {
  font-size: 1rem;
  line-height: 1;
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

.btn-success {
  background: #22c55e;
  color: white;
}

.btn-success:hover {
  background: #16a34a;
}

.btn-info {
  background: #3b82f6;
  color: white;
}

.btn-info:hover {
  background: #2563eb;
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
  .seances-etudiant-container {
    padding: 0;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .filters-card {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .seance-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .seance-info-grid {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .action-section {
    flex-direction: column;
    align-items: stretch;
  }

  .btn-action {
    width: 100%;
  }
}
</style>
