<template>
  <DashboardLayout>
    <div class="visio-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <VideoCameraIcon class="page-icon text-blue-600" />
          <div>
            <h1 class="page-title">Visioconférences</h1>
            <p class="page-subtitle">Gérez vos séances en ligne pour toutes vos classes</p>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <SkeletonLoader v-if="loading" type="grid" :count="4" />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-content">
          <span class="error-icon">⚠</span>
          <div>
            <h3 class="error-title">Erreur de chargement</h3>
            <p class="error-message">{{ error }}</p>
          </div>
        </div>
        <button @click="loadVisioConferences" class="btn-retry">
          <ArrowPathIcon class="w-5 h-5" />
          Réessayer
        </button>
      </div>

      <template v-else>
        <!-- Statistics -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <CalendarDaysIcon class="stat-icon text-blue-600" />
              <span class="stat-label">Total</span>
            </div>
            <p class="stat-value">{{ stats.total }}</p>
            <p class="stat-change">séances avec visio</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <SignalIcon class="stat-icon text-green-600" />
              <span class="stat-label">En cours</span>
            </div>
            <p class="stat-value">{{ stats.enCours }}</p>
            <p class="stat-change">actives maintenant</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <ClockIcon class="stat-icon text-orange-600" />
              <span class="stat-label">À venir</span>
            </div>
            <p class="stat-value">{{ stats.aVenir }}</p>
            <p class="stat-change">prochainement</p>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <CheckCircleIcon class="stat-icon text-gray-600" />
              <span class="stat-label">Terminées</span>
            </div>
            <p class="stat-value">{{ stats.terminees }}</p>
            <p class="stat-change">ce mois</p>
          </div>
        </div>

        <!-- En cours Section -->
        <div v-if="visioEnCours.length > 0" class="visio-section">
          <h2 class="section-title">
            <span class="pulse-indicator-large"></span>
            En cours maintenant
          </h2>
          <div class="visio-grid">
            <div
              v-for="seance in visioEnCours"
              :key="seance.id"
              class="visio-card active-card"
            >
              <div class="card-header">
                <div class="card-info">
                  <h3 class="card-title">{{ seance.matiere?.nom || 'Matière' }}</h3>
                  <p v-if="seance.matiere?.code" class="card-subtitle">
                    Code: {{ seance.matiere.code }}
                  </p>
                </div>
                <span class="badge badge-active">
                  <span class="pulse-dot"></span>
                  EN DIRECT
                </span>
              </div>

              <div class="card-details">
                <div class="detail-row">
                  <CalendarIcon class="detail-icon" />
                  <span>{{ formatDate(seance.programmation?.date) }}</span>
                </div>
                <div class="detail-row">
                  <ClockIcon class="detail-icon" />
                  <span>
                    {{ formatTime(seance.programmation?.heure_debut) }} -
                    {{ formatTime(seance.programmation?.heure_fin) }}
                  </span>
                </div>
                <div class="detail-row">
                  <UserGroupIcon class="detail-icon" />
                  <span>{{ seance.classe?.nom || 'N/A' }}</span>
                </div>
              </div>

              <div class="card-actions">
                <a
                  v-if="seance.visio?.room_id"
                  :href="`https://meet.jit.si/${seance.visio.room_id}`"
                  target="_blank"
                  class="btn-action btn-join"
                >
                  <VideoCameraIcon class="w-5 h-5" />
                  Rejoindre maintenant
                </a>
                <button
                  @click="handleEndVisio(seance)"
                  class="btn-action btn-end"
                >
                  <StopIcon class="w-5 h-5" />
                  Terminer
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- À venir Section -->
        <div v-if="visioAVenir.length > 0" class="visio-section">
          <h2 class="section-title">
            <ClockIcon class="section-icon text-blue-600" />
            Séances à venir
          </h2>
          <div class="visio-grid">
            <div
              v-for="seance in visioAVenir"
              :key="seance.id"
              class="visio-card"
            >
              <div class="card-header">
                <div class="card-info">
                  <h3 class="card-title">{{ seance.matiere?.nom || 'Matière' }}</h3>
                  <p v-if="seance.matiere?.code" class="card-subtitle">
                    Code: {{ seance.matiere.code }}
                  </p>
                </div>
                <span class="badge badge-scheduled">
                  <ClockIcon class="w-4 h-4" />
                  Programmée
                </span>
              </div>

              <div class="card-details">
                <div class="detail-row">
                  <CalendarIcon class="detail-icon" />
                  <span>{{ formatDate(seance.programmation?.date) }}</span>
                </div>
                <div class="detail-row">
                  <ClockIcon class="detail-icon" />
                  <span>
                    {{ formatTime(seance.programmation?.heure_debut) }} -
                    {{ formatTime(seance.programmation?.heure_fin) }}
                  </span>
                </div>
                <div class="detail-row">
                  <UserGroupIcon class="detail-icon" />
                  <span>{{ seance.classe?.nom || 'N/A' }}</span>
                </div>
              </div>

              <div class="card-actions">
                <button
                  v-if="seance.visio_enabled && !seance.visio_active"
                  @click="handleStartVisio(seance)"
                  class="btn-action btn-start"
                  :disabled="actionLoading === seance.id"
                >
                  <PlayIcon class="w-5 h-5" />
                  {{ actionLoading === seance.id ? 'Démarrage...' : 'Démarrer la visio' }}
                </button>
                <button
                  v-else-if="seance.visio_active"
                  @click="handleEndVisio(seance)"
                  class="btn-action btn-end"
                  :disabled="actionLoading === seance.id"
                >
                  <StopIcon class="w-5 h-5" />
                  {{ actionLoading === seance.id ? 'Arrêt...' : 'Terminer' }}
                </button>
                <button
                  v-else-if="!seance.visio_enabled"
                  @click="handleActivateVisio(seance)"
                  class="btn-action btn-activate"
                  :disabled="actionLoading === seance.id"
                >
                  <VideoCameraIcon class="w-5 h-5" />
                  {{ actionLoading === seance.id ? 'Activation...' : 'Activer la visio' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="visioEnCours.length === 0 && visioAVenir.length === 0" class="empty-state">
          <VideoCameraIcon class="empty-icon" />
          <h3 class="empty-title">Aucune visioconférence disponible</h3>
          <p class="empty-message">
            Vous n'avez pas de séances avec visio activée pour le moment.
          </p>
          <div class="empty-actions">
            <button @click="loadVisioConferences" class="btn-empty-secondary">
              <ArrowPathIcon class="w-5 h-5" />
              Actualiser
            </button>
          </div>
        </div>
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { lmsService } from '@/services/lms'
import {
  VideoCameraIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  SignalIcon,
  CheckCircleIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
  CalendarDaysIcon
} from '@heroicons/vue/24/outline'

const seances = ref([])
const loading = ref(true)
const error = ref(null)
const actionLoading = ref(null)

// Cache
const CACHE_KEY = 'teacher_visio_cache'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Visio en cours
const visioEnCours = computed(() => {
  return seances.value.filter(s => {
    // Utiliser les champs plats au lieu de l'objet imbriqué
    if (!s.visio_enabled || !s.visio_active) return false

    const now = new Date()
    const dateStr = s.programmation?.date
    const heureDebut = s.programmation?.heure_debut
    const heureFin = s.programmation?.heure_fin

    if (!dateStr || !heureDebut || !heureFin) return false

    const startDate = new Date(`${dateStr} ${heureDebut}`)
    const endDate = new Date(`${dateStr} ${heureFin}`)

    return now >= startDate && now <= endDate
  })
})

// Visio à venir
const visioAVenir = computed(() => {
  return seances.value.filter(s => {
    // Utiliser les champs plats : afficher si visio_enabled est true
    // Exclure si terminée (visio_status === 'terminee')
    if (!s.visio_enabled || s.visio_status === 'terminee') return false
    if (visioEnCours.value.includes(s)) return false

    const now = new Date()
    const dateStr = s.programmation?.date
    const heureDebut = s.programmation?.heure_debut

    if (!dateStr || !heureDebut) return false

    const startDate = new Date(`${dateStr} ${heureDebut}`)
    return startDate > now
  })
})

// Statistics
const stats = computed(() => {
  const allVisio = seances.value.filter(s => s.visio_enabled)
  return {
    total: allVisio.length,
    enCours: visioEnCours.value.length,
    aVenir: visioAVenir.value.length,
    terminees: allVisio.filter(s => s.visio_status === 'terminee').length
  }
})

// Load visio conferences with cache
async function loadVisioConferences() {
  // Check cache first
  const cached = localStorage.getItem(CACHE_KEY)
  if (cached) {
    try {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < CACHE_TTL) {
        console.log('[CACHE] Utilisation du cache visio')
        seances.value = data
        loading.value = false
        refreshInBackground()
        return
      }
    } catch (err) {
      console.warn('[CACHE] Cache visio invalide, rechargement...')
    }
  }

  loading.value = true
  error.value = null

  try {
    console.log('[API] Chargement des visioconférences...')
    const response = await lmsService.getMyTeachingSeances()

    seances.value = response.data || []

    // Save to cache
    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: seances.value,
      timestamp: Date.now()
    }))

    console.log(`[SUCCESS] ${seances.value.length} séance(s) chargée(s)`)
    console.log(`[INFO] ${stats.value.total} avec visio activée`)
  } catch (err) {
    console.error('[ERREUR] Erreur chargement visioconférences:', err)
    error.value = 'Impossible de charger les visioconférences. Veuillez réessayer.'
  } finally {
    loading.value = false
  }
}

// Refresh in background
async function refreshInBackground() {
  try {
    console.log('[BACKGROUND] Rafraîchissement visio...')
    const response = await lmsService.getMyTeachingSeances()
    seances.value = response.data || []

    localStorage.setItem(CACHE_KEY, JSON.stringify({
      data: seances.value,
      timestamp: Date.now()
    }))

    console.log('[BACKGROUND] Visio rafraîchies')
  } catch (err) {
    console.warn('[BACKGROUND] Erreur rafraîchissement:', err)
  }
}

// Visio actions
async function handleActivateVisio(seance) {
  if (actionLoading.value) return

  actionLoading.value = seance.id

  try {
    console.log('[VISIO] Activation visio:', seance.id)
    await lmsService.activateVisio(seance.id)

    localStorage.removeItem(CACHE_KEY)
    await loadVisioConferences()
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
    console.log('[VISIO] Démarrage visio:', seance.id)
    await lmsService.startVisio(seance.id)

    localStorage.removeItem(CACHE_KEY)
    await loadVisioConferences()
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
    console.log('[VISIO] Fin visio:', seance.id)
    await lmsService.endVisio(seance.id)

    localStorage.removeItem(CACHE_KEY)
    await loadVisioConferences()
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
function formatTime(timeStr) {
  if (!timeStr) return 'N/A'
  return timeStr.substring(0, 5) // HH:MM
}

onMounted(() => {
  loadVisioConferences()
})
</script>

<style scoped>
.visio-container {
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

/* Visio Sections */
.visio-section {
  margin-bottom: 2.5rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 1.5rem;
}

.section-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.pulse-indicator-large {
  width: 1rem;
  height: 1rem;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Visio Grid */
.visio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.visio-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.visio-card:hover {
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-2px);
}

.active-card {
  border-color: #22c55e;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 100%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.card-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-active {
  background: #dcfce7;
  color: #166534;
}

.badge-scheduled {
  background: #dbeafe;
  color: #1e40af;
}

.pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

.card-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.detail-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-action {
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
  text-decoration: none;
}

.btn-join {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
}

.btn-join:hover {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  transform: scale(1.02);
}

.btn-start {
  background: #3b82f6;
  color: white;
}

.btn-start:hover {
  background: #2563eb;
}

.btn-activate {
  background: #f59e0b;
  color: white;
}

.btn-activate:hover {
  background: #d97706;
}

.btn-end {
  background: #ef4444;
  color: white;
}

.btn-end:hover {
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

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-empty-secondary {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-empty-secondary:hover {
  background: var(--bg-hover);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 768px) {
  .visio-container {
    padding: 0;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .visio-grid {
    grid-template-columns: 1fr;
  }

  .card-actions {
    flex-direction: column;
  }

  .btn-action {
    width: 100%;
  }
}
</style>
