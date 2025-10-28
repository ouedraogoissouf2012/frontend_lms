<template>
  <DashboardLayout>
    <div class="seances-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <span class="page-icon">◉</span>
          <div>
            <h1 class="page-title">Gestion des Séances & Visioconférence</h1>
            <p class="page-subtitle">Activez ou désactivez la visioconférence pour chaque séance</p>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filter-item">
          <label class="filter-label">
            <span class="filter-icon">◷</span>
            Période
          </label>
          <select
            v-model="filters.days"
            @change="loadSeances"
            class="filter-select"
          >
            <option :value="7">7 prochains jours</option>
            <option :value="14">14 prochains jours</option>
            <option :value="30">30 prochains jours</option>
            <option :value="60">60 prochains jours</option>
          </select>
        </div>

        <div class="filter-item">
          <label class="filter-label">
            <span class="filter-icon">☺</span>
            Enseignant
          </label>
          <select
            v-model="filters.teacher_id"
            @change="loadSeances"
            class="filter-select"
          >
            <option :value="null">Tous les enseignants</option>
            <option v-for="enseignant in enseignants" :key="enseignant.id" :value="enseignant.id">
              {{ enseignant.nom }} {{ enseignant.prenom }}
            </option>
          </select>
        </div>

        <div class="filter-item">
          <label class="filter-label">
            <span class="filter-icon">▓</span>
            Classe
          </label>
          <select
            v-model="filters.classe_id"
            @change="loadSeances"
            class="filter-select"
          >
            <option :value="null">Toutes les classes</option>
            <option v-for="classe in classes" :key="classe.id" :value="classe.id">
              {{ classe.name || classe.nom }} - {{ classe.filiere?.name || classe.filiere?.nom }} {{ classe.niveau?.name || classe.niveau?.nom }}
            </option>
          </select>
        </div>
      </div>

      <!-- Loading with SkeletonLoader -->
      <SkeletonLoader v-if="loading" type="card" :count="5" height="120px" />

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">⚠</div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadSeances" class="error-retry-btn">
          <span class="icon">↻</span>
          Réessayer
        </button>
      </div>

      <!-- Séances List -->
      <div v-else-if="seances && seances.length > 0" class="seances-list">
        <div
          v-for="seance in seances"
          :key="seance.id"
          class="seance-card"
        >
          <div class="seance-header">
            <!-- Infos séance -->
            <div class="seance-info">
              <h3 class="seance-title">
                {{ seance.matiere?.libelle || seance.matiere?.nom || 'Matière non définie' }}
              </h3>

              <div class="seance-details">
                <div class="detail-item" :title="`Date: ${formatDate(seance.programmation?.date)}`">
                  <span class="detail-icon">◷</span>
                  <div>
                    <p class="detail-label">Date</p>
                    <p class="detail-value">{{ formatDate(seance.programmation?.date) }}</p>
                  </div>
                </div>

                <div class="detail-item" :title="`Horaire: ${formatTime(seance.programmation?.heure_debut)} - ${formatTime(seance.programmation?.heure_fin)}`">
                  <span class="detail-icon">⏰</span>
                  <div>
                    <p class="detail-label">Horaire</p>
                    <p class="detail-value">{{ formatTime(seance.programmation?.heure_debut) }} - {{ formatTime(seance.programmation?.heure_fin) }}</p>
                  </div>
                </div>

                <div class="detail-item" :title="`Classe: ${seance.classe?.libelle || seance.classe?.nom || 'Non assignée'}`">
                  <span class="detail-icon">▓</span>
                  <div>
                    <p class="detail-label">Classe</p>
                    <p class="detail-value">{{ seance.classe?.libelle || seance.classe?.nom || 'Non assignée' }}</p>
                  </div>
                </div>

                <div class="detail-item" :title="`Salle: ${seance.salle || 'Non spécifiée'}`">
                  <span class="detail-icon">◈</span>
                  <div>
                    <p class="detail-label">Salle</p>
                    <p class="detail-value">{{ seance.salle || 'Non spécifiée' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Toggle Visio -->
            <div class="seance-action">
              <button
                @click="toggleSeanceVisio(seance)"
                :class="[
                  'toggle-visio-btn',
                  seance.visio_enabled ? 'visio-active' : 'visio-inactive'
                ]"
                :title="seance.visio_enabled ? 'Désactiver la visioconférence' : 'Activer la visioconférence'"
              >
                <span class="btn-icon">◉</span>
                <span v-if="seance.visio_enabled">Visio activée</span>
                <span v-else>Activer visio</span>
              </button>
            </div>
          </div>

          <!-- Options visio -->
          <div
            v-if="seance.visio_enabled"
            class="visio-panel"
          >
            <div class="visio-panel-content">
              <div class="visio-info">
                <div class="visio-icon-wrapper">
                  <span class="visio-icon">◉</span>
                </div>
                <div>
                  <p class="visio-title">Visioconférence Jitsi programmée</p>
                  <p class="visio-room">
                    <span class="room-icon">◈</span>
                    Salle: <span class="room-id">{{ seance.visio_room_id }}</span>
                  </p>
                  <p class="visio-access">
                    <span class="access-icon">⏰</span>
                    Accès possible 15 minutes avant le cours
                  </p>
                </div>
              </div>

              <div class="visio-action">
                <a
                  :href="`https://meet.jit.si/${seance.visio_room_id}`"
                  target="_blank"
                  class="open-jitsi-btn"
                  title="Ouvrir la salle Jitsi dans un nouvel onglet"
                >
                  <span class="btn-icon">↗</span>
                  Ouvrir Jitsi
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <span class="empty-icon">◷</span>
        <p class="empty-message">Aucune séance trouvée pour la période sélectionnée</p>
      </div>

      <!-- Stats -->
      <div v-if="seances && seances.length > 0" class="stats-grid">
        <div class="stat-card">
          <p class="stat-label">Total séances</p>
          <p class="stat-value">{{ seances.length }}</p>
        </div>
        <div class="stat-card stat-card-primary">
          <p class="stat-label">Visio activées</p>
          <p class="stat-value">
            {{ seances.filter(s => s.visio_enabled).length }}
          </p>
        </div>
        <div class="stat-card">
          <p class="stat-label">Taux visio</p>
          <p class="stat-value">
            {{ Math.round((seances.filter(s => s.visio_enabled).length / seances.length) * 100) }}%
          </p>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import lmsService from '@/services/lms'

// Instance pour accéder à $toast
const instance = getCurrentInstance()
const $toast = instance?.appContext.config.globalProperties.$toast

// Reactive state
const loading = ref(false)
const error = ref(null)
const seances = ref([])
const classes = ref([])
const enseignants = ref([])
const filters = reactive({
  days: 30,
  teacher_id: null,
  classe_id: null
})

// Cache
const CACHE_KEY = 'seances_management_cache'
const CACHE_TTL = 2 * 60 * 1000 // 2 minutes

// Formatters
const formatTime = (isoTimestamp) => {
  if (!isoTimestamp) return 'N/A'
  return new Date(isoTimestamp).toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDate = (date) => {
  if (!date) return 'Non défini'
  return new Date(date).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const loadClasses = async () => {
  try {
    console.log('[CLASSES] Chargement...')
    const response = await lmsService.getClasses()

    if (response && response.success) {
      classes.value = response.data || []
      console.log(`[OK] ${classes.value.length} classes chargées`)
    }
  } catch (err) {
    console.error('[ERREUR] Chargement classes:', err)
  }
}

const loadEnseignants = async () => {
  try {
    console.log('[ENSEIGNANTS] Chargement...')
    const response = await lmsService.getEnseignants()

    if (response && response.success) {
      enseignants.value = response.data || []
      console.log(`[OK] ${enseignants.value.length} enseignants chargés`)
    }
  } catch (err) {
    console.error('[ERREUR] Chargement enseignants:', err)
  }
}

const loadSeances = async () => {
  // Try cache first
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached && !filters.teacher_id && !filters.classe_id) {
    try {
      const { data, timestamp, filterState } = JSON.parse(cached)
      if (
        Date.now() - timestamp < CACHE_TTL &&
        filterState.days === filters.days
      ) {
        console.log('[CACHE] Séances chargées depuis le cache')
        seances.value = data
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
    console.log('[SEANCES] Chargement à venir...')

    const params = {}
    if (filters.days) params.days = filters.days
    if (filters.teacher_id) params.teacher_id = filters.teacher_id
    if (filters.classe_id) params.classe_id = filters.classe_id

    const data = await lmsService.getUpcomingSeances(params)

    console.log('[OK] Séances reçues:', data)

    if (data.success) {
      seances.value = Array.isArray(data.data) ? data.data : (data.data.seances || [])
      console.log(`[OK] ${seances.value.length} séances chargées`)

      // Save to cache only if no filters applied
      if (!filters.teacher_id && !filters.classe_id) {
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data: seances.value,
          timestamp: Date.now(),
          filterState: { days: filters.days }
        }))
      }
    } else {
      error.value = 'Erreur lors du chargement des séances'
    }
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
    console.log('[BACKGROUND] Rafraîchissement séances...')

    const params = { days: filters.days }
    const data = await lmsService.getUpcomingSeances(params)

    if (data.success) {
      seances.value = Array.isArray(data.data) ? data.data : (data.data.seances || [])

      localStorage.setItem(CACHE_KEY, JSON.stringify({
        data: seances.value,
        timestamp: Date.now(),
        filterState: { days: filters.days }
      }))

      console.log('[BACKGROUND] Rafraîchissement terminé')
    }
  } catch (error) {
    console.warn('[BACKGROUND] Erreur rafraîchissement:', error)
  }
}

const toggleSeanceVisio = async (seance) => {
  const newState = !seance.visio_enabled

  try {
    console.log(`[VISIO] Toggle séance ${seance.id}: ${newState ? 'ON' : 'OFF'}`)

    const response = await lmsService.toggleVisio(
      seance.id,
      newState,
      seance.visio_type || 'jitsi'
    )

    console.log('[OK] Réponse toggle:', response)

    if (response.success) {
      // Mettre à jour localement
      seance.visio_enabled = newState
      if (!newState) {
        seance.visio_type = null
        seance.visio_room_id = null
      } else {
        seance.visio_room_id = `seance_${seance.id}`
      }

      // Clear cache after update
      localStorage.removeItem(CACHE_KEY)

      $toast?.success(response.message || 'Visioconférence mise à jour')
    } else {
      $toast?.error('Erreur lors de la mise à jour')
    }
  } catch (err) {
    console.error('[ERREUR] Toggle visio:', err)
    $toast?.error('Erreur lors de l\'activation/désactivation de la visio')
  }
}

// Lifecycle hooks
onMounted(() => {
  loadClasses()
  loadEnseignants()
  loadSeances()
})
</script>

<style scoped>
/* Container */
.seances-container {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-icon {
  font-size: 3rem;
  line-height: 1;
  color: var(--primary-color, #6366f1);
  flex-shrink: 0;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0 0;
}

/* Filters */
.filters-card {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
  margin-bottom: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.filter-item {
  display: flex;
  flex-direction: column;
}

.filter-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.filter-icon {
  font-size: 1rem;
  line-height: 1;
}

.filter-select {
  width: 100%;
  padding: 0.625rem;
  background: var(--input-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.filter-select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5rem;
  padding: 3rem 2rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
}

.error-icon {
  font-size: 4rem;
}

.error-content {
  text-align: center;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.error-message {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

.error-retry-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-color);
  border: none;
  border-radius: 0.5rem;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  transition: all 0.2s;
}

.error-retry-btn:hover {
  background: #4f46e5;
}

/* Séances List */
.seances-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Seance Card */
.seance-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.seance-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.seance-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
}

.seance-info {
  flex: 1;
}

.seance-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.seance-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.detail-item {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}

.detail-icon {
  font-size: 1rem;
  line-height: 1;
  color: var(--primary-color);
  flex-shrink: 0;
  margin-top: 0.25rem;
}

.detail-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.detail-value {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
  margin: 0;
}

/* Toggle Visio Button */
.seance-action {
  flex-shrink: 0;
}

.toggle-visio-btn {
  padding: 0.75rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-icon {
  font-size: 1.125rem;
  line-height: 1;
}

.visio-active {
  background: #f3e8ff;
  color: #7c3aed;
}

.visio-active:hover {
  background: #e9d5ff;
}

.visio-inactive {
  background: var(--hover-bg);
  color: var(--text-secondary);
}

.visio-inactive:hover {
  background: #e5e7eb;
  color: var(--text-primary);
}

/* Visio Panel */
.visio-panel {
  margin-top: 1rem;
  padding: 1rem;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 0.5rem;
}

.visio-panel-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1.5rem;
}

.visio-info {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.visio-icon-wrapper {
  width: 2.5rem;
  height: 2.5rem;
  background: #22c55e;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.visio-icon {
  font-size: 1.5rem;
  line-height: 1;
  color: white;
}

.visio-title {
  font-weight: 600;
  color: #166534;
  margin: 0 0 0.5rem 0;
  font-size: 0.9375rem;
}

.visio-room {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: #15803d;
  margin: 0 0 0.5rem 0;
}

.room-icon {
  font-size: 0.875rem;
  line-height: 1;
}

.room-id {
  font-family: monospace;
  background: #dcfce7;
  padding: 0.125rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 500;
}

.visio-access {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: #16a34a;
  margin: 0;
}

.access-icon {
  font-size: 0.75rem;
  line-height: 1;
}

.visio-action {
  flex-shrink: 0;
}

.open-jitsi-btn {
  padding: 0.75rem 1.25rem;
  background: #16a34a;
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  text-decoration: none;
  transition: all 0.2s;
}

.open-jitsi-btn:hover {
  background: #15803d;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
}

.empty-icon {
  font-size: 4rem;
  line-height: 1;
  margin: 0 auto 1rem;
  color: var(--text-tertiary);
  display: block;
}

.empty-message {
  font-size: 1rem;
  color: var(--text-secondary);
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 2rem;
}

.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.stat-card-primary {
  background: #f3e8ff;
  border-color: #c084fc;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.5rem 0;
}

.stat-card-primary .stat-label {
  color: #7c3aed;
}

.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.stat-card-primary .stat-value {
  color: #6d28d9;
}

/* Responsive */
@media (max-width: 768px) {
  .seances-container {
    padding: 1rem;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .filters-card {
    grid-template-columns: 1fr;
  }

  .seance-header {
    flex-direction: column;
  }

  .seance-details {
    grid-template-columns: 1fr;
  }

  .visio-panel-content {
    flex-direction: column;
    align-items: flex-start;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>
