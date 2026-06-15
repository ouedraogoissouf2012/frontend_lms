<template>
  <DashboardLayout>
    <div class="seances-container">
      <!-- Header -->
      <div class="page-header">
        <div class="header-content">
          <i class="fa fa-dot-circle-o page-icon"></i>
          <div>
            <h1 class="page-title">Gestion des Séances & Visioconférence</h1>
            <p class="page-subtitle">Activez ou désactivez la visioconférence pour chaque séance</p>
          </div>
        </div>
      </div>

      <!-- View Toggle -->
      <div class="view-toggle">
        <button
          :class="['toggle-btn', viewMode === 'list' ? 'active' : '']"
          @click="viewMode = 'list'"
        >
          <i class="fa fa-list"></i>
          Liste
        </button>
        <button
          :class="['toggle-btn', viewMode === 'calendar' ? 'active' : '']"
          @click="viewMode = 'calendar'"
        >
          <i class="fa fa-calendar"></i>
          Calendrier
        </button>
      </div>

      <!-- Calendar View -->
      <div v-if="viewMode === 'calendar'" class="calendar-section">
        <UniversalCalendar
          ref="calendarRef"
          user-role="coordinator"
          @event-action="handleCalendarAction"
        />
      </div>

      <!-- List View -->
      <template v-else>
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
            <i class="fa fa-user filter-icon"></i>
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
            <i class="fa fa-building filter-icon"></i>
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

      <!-- Loading -->
      <ContentLoader v-if="loading" text="Chargement des séances..." />

      <!-- Error -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon"><i class="fa fa-exclamation-triangle"></i></div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadSeances" class="error-retry-btn">
          <i class="fa fa-refresh icon"></i>
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
                  <i class="fa fa-clock-o detail-icon"></i>
                  <div>
                    <p class="detail-label">Horaire</p>
                    <p class="detail-value">{{ formatTime(seance.programmation?.heure_debut) }} - {{ formatTime(seance.programmation?.heure_fin) }}</p>
                  </div>
                </div>

                <div class="detail-item" :title="`Classe: ${seance.classe?.libelle || seance.classe?.nom || 'Non assignée'}`">
                  <i class="fa fa-building detail-icon"></i>
                  <div>
                    <p class="detail-label">Classe</p>
                    <p class="detail-value">{{ seance.classe?.libelle || seance.classe?.nom || 'Non assignée' }}</p>
                  </div>
                </div>

                <div class="detail-item" :title="`Salle: ${seance.salle || 'Non spécifiée'}`">
                  <i class="fa fa-diamond detail-icon"></i>
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
                <i class="fa fa-dot-circle-o btn-icon"></i>
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
                  <i class="fa fa-dot-circle-o visio-icon"></i>
                </div>
                <div>
                  <p class="visio-title">Visioconférence Jitsi programmée</p>
                  <p class="visio-room">
                    <i class="fa fa-diamond room-icon"></i>
                    Salle: <span class="room-id">{{ seance.visio_room_id }}</span>
                  </p>
                  <p class="visio-access">
                    <i class="fa fa-clock-o access-icon"></i>
                    Accès possible 15 minutes avant le cours
                  </p>
                </div>
              </div>

              <div class="visio-action">
                <button
                  @click="showParticipants(seance)"
                  class="participants-btn"
                  title="Voir la liste des participants avec heures d'entrée/sortie"
                >
                  <i class="fa fa-users btn-icon"></i>
                  Voir participants
                </button>

                <!-- Coordinateur ne peut que rejoindre si active, pas démarrer -->
                <div v-if="seance.visio_status === 'active' || seance.visio_active" class="visio-status-group">
                  <button
                    @click="handleJoinVisio(seance)"
                    class="open-jitsi-btn"
                    title="Rejoindre la visioconférence en cours"
                  >
                    <span class="btn-icon">↗</span>
                    Rejoindre
                  </button>
                </div>
                <div v-else class="waiting-message">
                  <span class="waiting-icon">⏳</span>
                  <span class="waiting-text">En attente que l'enseignant démarre</span>
                </div>
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
      </template>
    </div>

    <!-- Participants Modal -->
    <ParticipantsModal
      v-if="showParticipantsModal"
      :seance-id="selectedSeanceId"
      @close="showParticipantsModal = false"
    />

    <!-- Jitsi Modal -->

  </DashboardLayout>
</template>

<script setup>
import { ref, reactive, onMounted, getCurrentInstance } from 'vue'
import { useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import UniversalCalendar from '@/components/calendar/UniversalCalendar.vue'
import { useVisioParticipation } from '@/composables/useVisioParticipation'
import ParticipantsModal from '@/components/visio/ParticipantsModal.vue'
import { useAuthStore } from '@/stores/auth'

import lmsService from '@/services/lms'
import { readCache, writeCache, clearCache } from '@/services/cache'

const router = useRouter()

// Instance pour accéder à $toast
const instance = getCurrentInstance()
const $toast = instance?.appContext.config.globalProperties.$toast

// Reactive state
const loading = ref(false)
const error = ref(null)
const seances = ref([])
const classes = ref([])
const enseignants = ref([])
const showParticipantsModal = ref(false)
const selectedSeanceId = ref(null)
const viewMode = ref('list')
const calendarRef = ref(null)
const filters = reactive({
  days: 30,
  teacher_id: null,
  classe_id: null
})

// Get current user for Jitsi (#19 : via store, plus de localStorage('user'))
const currentUser = useAuthStore().currentUser

// État de la modal Jitsi
// visioParticipation sera créé dynamiquement pour chaque séance
const visioParticipations = reactive({})


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
  if (!filters.teacher_id && !filters.classe_id) {
    const cachedEntry = readCache('seances_management')
    if (cachedEntry !== null && cachedEntry.filterState?.days === filters.days) {
      console.log('[CACHE] Séances chargées depuis le cache')
      seances.value = cachedEntry.data
      loading.value = false
      refreshInBackground()
      return
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
        writeCache('seances_management', {
          data: seances.value,
          filterState: { days: filters.days }
        })
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

      writeCache('seances_management', {
        data: seances.value,
        filterState: { days: filters.days }
      })

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
      clearCache('seances_management')

      $toast?.success(response.message || 'Visioconférence mise à jour')
    } else {
      $toast?.error('Erreur lors de la mise à jour')
    }
  } catch (err) {
    console.error('[ERREUR] Toggle visio:', err)
    $toast?.error('Erreur lors de l\'activation/désactivation de la visio')
  }
}

const showParticipants = (seance) => {
  console.log('[PARTICIPANTS] Ouverture modal pour séance:', seance.id)
  selectedSeanceId.value = seance.id
  showParticipantsModal.value = true
}

const handleJoinVisio = async (seance) => {
  try {
    console.log('[VISIO] Rejoindre visio coordinateur:', seance.id)

    // Créer le composable pour cette séance si pas déjà créé
    if (!visioParticipations[seance.id]) {
      visioParticipations[seance.id] = useVisioParticipation(seance.id)
    }

    // Ouvrir window.open avec tracking
    const roomId = seance.visio_room_id
    const jitsiLink = `https://meet.jit.si/${roomId}`

    await visioParticipations[seance.id].joinVisio(jitsiLink)

    console.log('[VISIO] Coordinateur a rejoint avec window.open + tracking Web Worker')

    // Rafraîchir les séances
    await loadSeances()
  } catch (error) {
    console.error('[ERREUR] Join visio coordinateur:', error)
    alert('Erreur lors de la connexion à la visio: ' + error.message)
  }
}

// Gestion des actions du calendrier
async function handleCalendarAction({ type, data }) {
  console.log('[CoordinatorSeances] Calendar action:', type, data)

  switch (type) {
    case 'toggleVisio':
      // Activer/desactiver la visio
      try {
        const newState = !(data.visio?.enabled || data.visio_enabled)
        await lmsService.toggleVisio(data.id, newState, 'jitsi')
        console.log('[CoordinatorSeances] Visio toggled:', data.id, newState)
        if (calendarRef.value?.refreshEvents) {
          await calendarRef.value.refreshEvents()
        }
        $toast?.success(newState ? 'Visio activee' : 'Visio desactivee')
      } catch (error) {
        console.error('[CoordinatorSeances] Erreur toggle visio:', error)
        $toast?.error('Erreur lors de la modification')
      }
      break

    case 'joinVisio':
      // Coordinateur rejoint la visio
      {
        const roomId = data.visio?.room_id || data.visio_room_id || `seance_${data.id}`
        const userName = encodeURIComponent(currentUser?.name || 'Coordinateur')
        const jitsiLink = `https://meet.jit.si/${roomId}#config.prejoinConfig.enabled=false&userInfo.displayName=${userName}`
        window.open(jitsiLink, '_blank')
      }
      break

    case 'viewParticipants':
      // Voir les participants
      selectedSeanceId.value = data.id
      showParticipantsModal.value = true
      break

    case 'exportAttendance':
      // Exporter les presences
      router.push(`/attendance/seances/${data.id}?export=true`)
      break

    case 'viewDetails':
      // Voir les details
      router.push(`/seances/${data.id}`)
      break

    case 'delete':
      // Supprimer la seance
      if (confirm('Voulez-vous vraiment supprimer cette seance ?')) {
        try {
          await lmsService.deleteSeance(data.id)
          if (calendarRef.value?.refreshEvents) {
            await calendarRef.value.refreshEvents()
          }
          $toast?.success('Seance supprimee')
        } catch (error) {
          console.error('[CoordinatorSeances] Erreur suppression:', error)
          $toast?.error('Erreur lors de la suppression')
        }
      }
      break

    case 'viewEvaluationResults':
      router.push(`/coordinateur/evaluations/${data.id}/results`)
      break

    case 'editEvaluation':
      router.push(`/coordinateur/evaluations/${data.id}/edit`)
      break

    default:
      console.warn('[CoordinatorSeances] Action non geree:', type)
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

/* View Toggle */
.view-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: var(--card-bg);
  padding: 0.5rem;
  border-radius: 0.75rem;
  width: fit-content;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.toggle-btn.active {
  background: var(--primary-color, #6366f1);
  color: white;
}

.toggle-btn i {
  font-size: 1rem;
}

/* Calendar Section */
.calendar-section {
  background: var(--card-bg);
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
  background: var(--card-bg-dark, #1f2937);
  border: 1px solid var(--border-color);
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
  background: var(--primary-color);
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
  color: white;
  margin: 0 0 0.5rem 0;
  font-size: 0.9375rem;
}

.visio-room {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: white;
  margin: 0 0 0.5rem 0;
}

.room-icon {
  font-size: 0.875rem;
  line-height: 1;
}

.room-id {
  font-family: monospace;
  background: var(--card-bg-dark, #1f2937);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
  font-weight: 600;
}

.visio-access {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.7);
  margin: 0;
}

.access-icon {
  font-size: 0.75rem;
  line-height: 1;
}

.visio-action {
  flex-shrink: 0;
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.participants-btn {
  padding: 0.75rem 1.25rem;
  background: #3b82f6;
  border: none;
  border-radius: 0.5rem;
  color: white;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.participants-btn:hover {
  background: #2563eb;
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

.waiting-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: #fef3c7;
  border-radius: 0.5rem;
  border: 1px solid #fcd34d;
}

.waiting-icon {
  font-size: 1.125rem;
  line-height: 1;
}

.waiting-text {
  font-size: 0.875rem;
  font-weight: 500;
  color: #92400e;
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
