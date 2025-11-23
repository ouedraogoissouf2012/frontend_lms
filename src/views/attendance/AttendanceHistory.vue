<template>
  <DashboardLayout>
    <div class="attendance-history-container">
      <!-- Header -->
      <div class="welcome-header">
        <span class="welcome-icon">▤</span>
        <div>
          <h1 class="page-title">Historique des Présences</h1>
          <p class="page-subtitle">Consultez l'historique complet des participations aux visioconférences</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="filters-card">
        <div class="filters-grid">
          <div class="filter-item">
            <label class="filter-label">
              <span class="filter-icon">◷</span>
              Date début
            </label>
            <input
              v-model="filters.dateFrom"
              type="date"
              class="filter-input"
              @change="loadHistory"
            />
          </div>

          <div class="filter-item">
            <label class="filter-label">
              <span class="filter-icon">◷</span>
              Date fin
            </label>
            <input
              v-model="filters.dateTo"
              type="date"
              class="filter-input"
              @change="loadHistory"
            />
          </div>

          <div class="filter-item">
            <label class="filter-label">
              <span class="filter-icon">⌕</span>
              Séance KLASSCI ID
            </label>
            <input
              v-model="filters.seanceId"
              type="text"
              class="filter-input"
              placeholder="ID de la séance"
              @input="debouncedLoad"
            />
          </div>

          <div class="filter-actions">
            <button
              v-if="filters.dateFrom || filters.dateTo || filters.seanceId"
              @click="resetFilters"
              class="btn-reset"
              title="Réinitialiser tous les filtres"
            >
              Réinitialiser
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-container">
        <SkeletonLoader :rows="5" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-container">
        <p class="error-message">{{ error }}</p>
        <button @click="loadHistory" class="btn-retry">Réessayer</button>
      </div>

      <!-- Results -->
      <div v-else-if="attendances.length > 0" class="results-section">
        <!-- Statistics -->
        <div class="stats-grid">
          <div class="stat-card border-l-blue">
            <div class="stat-header">
              <span class="stat-icon">▤</span>
              <span class="stat-label">Total Participations</span>
            </div>
            <p class="stat-value">{{ pagination.total }}</p>
          </div>

          <div class="stat-card border-l-green">
            <div class="stat-header">
              <span class="stat-icon">◷</span>
              <span class="stat-label">Durée Moyenne</span>
            </div>
            <p class="stat-value">{{ averageDuration }} min</p>
          </div>

          <div class="stat-card border-l-orange">
            <div class="stat-header">
              <span class="stat-icon">✓</span>
              <span class="stat-label">Présents</span>
            </div>
            <p class="stat-value">{{ connectedCount }}</p>
          </div>

          <div class="stat-card border-l-red">
            <div class="stat-header">
              <span class="stat-icon">✕</span>
              <span class="stat-label">Déconnectés</span>
            </div>
            <p class="stat-value">{{ disconnectedCount }}</p>
          </div>
        </div>

        <!-- Table -->
        <div class="table-card">
          <div class="table-header">
            <h2 class="table-title">Liste des Participations</h2>
            <button @click="exportToCSV" class="btn-export">
              ↓ Exporter CSV
            </button>
          </div>

          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Date & Heure</th>
                  <th v-if="user.role !== 'etudiant'">Participant</th>
                  <th>Séance</th>
                  <th>Matière</th>
                  <th>Classe</th>
                  <th>Statut</th>
                  <th>Durée</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="attendance in attendances" :key="attendance.id">
                  <td>
                    <div class="date-cell">
                      <div class="date-primary">{{ formatDate(attendance.joined_at) }}</div>
                      <div class="date-secondary">{{ formatTime(attendance.joined_at) }}</div>
                    </div>
                  </td>
                  <td v-if="user.role !== 'etudiant'">
                    <div class="user-cell">
                      <span class="user-name">{{ attendance.user.name }}</span>
                      <span class="user-email">{{ attendance.user.email }}</span>
                    </div>
                  </td>
                  <td>
                    <div class="seance-cell">
                      <span class="seance-id">#{{ attendance.seance.klassci_seance_id }}</span>
                      <span class="seance-date">{{ formatDate(attendance.seance.date) }}</span>
                    </div>
                  </td>
                  <td>
                    <span v-if="attendance.seance.matiere" class="matiere-badge">
                      {{ attendance.seance.matiere.nom }}
                    </span>
                    <span v-else class="text-gray">-</span>
                  </td>
                  <td>
                    <span v-if="attendance.seance.classe" class="classe-badge">
                      {{ attendance.seance.classe.nom }}
                    </span>
                    <span v-else class="text-gray">-</span>
                  </td>
                  <td>
                    <span
                      :class="['status-badge', attendance.status === 'connected' ? 'status-connected' : 'status-disconnected']"
                    >
                      {{ attendance.status === 'connected' ? '● Connecté' : '● Déconnecté' }}
                    </span>
                  </td>
                  <td>
                    <span v-if="attendance.duration_minutes" class="duration-text">
                      {{ attendance.duration_minutes }} min
                    </span>
                    <span v-else-if="attendance.status === 'connected'" class="duration-text text-green">
                      En cours...
                    </span>
                    <span v-else class="text-gray">-</span>
                  </td>
                  <td>
                    <button
                      @click="viewDetails(attendance)"
                      class="btn-action"
                      title="Voir les détails"
                    >
                      👁
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.last_page > 1" class="pagination">
            <button
              @click="loadPage(pagination.current_page - 1)"
              :disabled="pagination.current_page === 1"
              class="btn-page"
            >
              ← Précédent
            </button>

            <span class="page-info">
              Page {{ pagination.current_page }} / {{ pagination.last_page }}
              ({{ pagination.total }} résultats)
            </span>

            <button
              @click="loadPage(pagination.current_page + 1)"
              :disabled="pagination.current_page === pagination.last_page"
              class="btn-page"
            >
              Suivant →
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <span class="empty-icon">☹</span>
        <p class="empty-message">Aucune participation trouvée</p>
        <p class="empty-hint">Essayez de modifier les filtres ou d'élargir la période de recherche</p>
      </div>

      <!-- Details Modal -->
      <div v-if="selectedAttendance" class="modal-overlay" @click="closeDetails">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3 class="modal-title">Détails de la Participation</h3>
            <button @click="closeDetails" class="btn-close">✕</button>
          </div>

          <div class="modal-body">
            <div class="detail-grid">
              <div class="detail-item">
                <span class="detail-label">Participant</span>
                <span class="detail-value">{{ selectedAttendance.user.name }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Email</span>
                <span class="detail-value">{{ selectedAttendance.user.email }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Séance ID</span>
                <span class="detail-value">#{{ selectedAttendance.seance.klassci_seance_id }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Date Séance</span>
                <span class="detail-value">{{ formatDate(selectedAttendance.seance.date) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Heure de Connexion</span>
                <span class="detail-value">{{ formatDateTime(selectedAttendance.joined_at) }}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Dernier Heartbeat</span>
                <span class="detail-value">
                  {{ selectedAttendance.last_seen_at ? formatDateTime(selectedAttendance.last_seen_at) : 'Aucun' }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Heure de Déconnexion</span>
                <span class="detail-value">
                  {{ selectedAttendance.left_at ? formatDateTime(selectedAttendance.left_at) : 'En cours' }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Durée Totale</span>
                <span class="detail-value">
                  {{ selectedAttendance.duration_minutes ? `${selectedAttendance.duration_minutes} minutes` : 'En cours' }}
                </span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Statut</span>
                <span :class="['detail-value', selectedAttendance.status === 'connected' ? 'text-green' : 'text-red']">
                  {{ selectedAttendance.status === 'connected' ? '● Connecté' : '● Déconnecté' }}
                </span>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <button @click="closeDetails" class="btn-secondary">Fermer</button>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import lmsService from '@/services/lms'
import { auth } from '@/services/api'

export default {
  name: 'AttendanceHistory',
  components: {
    DashboardLayout,
    SkeletonLoader
  },
  data() {
    return {
      loading: false,
      error: null,
      attendances: [],
      pagination: {
        current_page: 1,
        per_page: 50,
        total: 0,
        last_page: 1
      },
      filters: {
        dateFrom: '',
        dateTo: '',
        seanceId: ''
      },
      selectedAttendance: null,
      debounceTimer: null
    }
  },
  computed: {
    user() {
      return auth.getUser()
    },
    averageDuration() {
      const validDurations = this.attendances.filter(a => a.duration_minutes)
      if (validDurations.length === 0) return 0
      const sum = validDurations.reduce((acc, a) => acc + a.duration_minutes, 0)
      return Math.round(sum / validDurations.length)
    },
    connectedCount() {
      return this.attendances.filter(a => a.status === 'connected').length
    },
    disconnectedCount() {
      return this.attendances.filter(a => a.status === 'disconnected').length
    }
  },
  mounted() {
    // Set default date range (last 30 days)
    const today = new Date()
    const thirtyDaysAgo = new Date(today)
    thirtyDaysAgo.setDate(today.getDate() - 30)

    this.filters.dateFrom = this.formatDateInput(thirtyDaysAgo)
    this.filters.dateTo = this.formatDateInput(today)

    this.loadHistory()
  },
  methods: {
    async loadHistory(page = 1) {
      this.loading = true
      this.error = null

      try {
        const params = {
          page,
          per_page: this.pagination.per_page
        }

        if (this.filters.dateFrom) {
          params.date_from = this.filters.dateFrom
        }

        if (this.filters.dateTo) {
          params.date_to = this.filters.dateTo
        }

        if (this.filters.seanceId) {
          params.seance_id = this.filters.seanceId
        }

        const response = await lmsService.getAttendanceHistory(params)

        if (response.success) {
          this.attendances = response.data
          this.pagination = response.pagination
        } else {
          throw new Error(response.message || 'Erreur lors du chargement de l\'historique')
        }
      } catch (err) {
        console.error('[AttendanceHistory] Erreur:', err)
        this.error = err.response?.data?.message || err.message || 'Erreur lors du chargement de l\'historique'
      } finally {
        this.loading = false
      }
    },

    loadPage(page) {
      if (page >= 1 && page <= this.pagination.last_page) {
        this.loadHistory(page)
      }
    },

    resetFilters() {
      const today = new Date()
      const thirtyDaysAgo = new Date(today)
      thirtyDaysAgo.setDate(today.getDate() - 30)

      this.filters.dateFrom = this.formatDateInput(thirtyDaysAgo)
      this.filters.dateTo = this.formatDateInput(today)
      this.filters.seanceId = ''

      this.loadHistory()
    },

    debouncedLoad() {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.loadHistory()
      }, 500)
    },

    viewDetails(attendance) {
      this.selectedAttendance = attendance
    },

    closeDetails() {
      this.selectedAttendance = null
    },

    exportToCSV() {
      const headers = [
        'Date',
        'Heure',
        'Participant',
        'Email',
        'Séance ID',
        'Matière',
        'Classe',
        'Statut',
        'Durée (min)',
        'Connexion',
        'Déconnexion'
      ]

      const rows = this.attendances.map(a => [
        this.formatDate(a.joined_at),
        this.formatTime(a.joined_at),
        a.user.name,
        a.user.email,
        a.seance.klassci_seance_id,
        a.seance.matiere?.nom || '-',
        a.seance.classe?.nom || '-',
        a.status === 'connected' ? 'Connecté' : 'Déconnecté',
        a.duration_minutes || '-',
        this.formatDateTime(a.joined_at),
        a.left_at ? this.formatDateTime(a.left_at) : 'En cours'
      ])

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\n')

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `historique_presences_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    },

    formatTime(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    },

    formatDateTime(dateString) {
      if (!dateString) return '-'
      return `${this.formatDate(dateString)} ${this.formatTime(dateString)}`
    },

    formatDateInput(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
  }
}
</script>

<style scoped>
.attendance-history-container {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.welcome-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

.welcome-icon {
  font-size: 2.5rem;
  color: #3b82f6;
}

.page-title {
  font-size: 1.875rem;
  font-weight: bold;
  margin: 0;
  color: var(--text-primary);
}

.page-subtitle {
  margin: 0.5rem 0 0;
  color: var(--text-secondary);
}

/* Statistics Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: var(--bg-primary);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
}

.border-l-blue { border-left-color: #3b82f6; }
.border-l-green { border-left-color: #10b981; }
.border-l-orange { border-left-color: #f59e0b; }
.border-l-red { border-left-color: #ef4444; }
.border-l-purple { border-left-color: #8b5cf6; }

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-primary);
  margin: 0;
}

/* Filters */
.filters-card {
  background: var(--bg-primary);
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.filters-grid {
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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.filter-icon {
  font-size: 1rem;
}

.filter-input,
.filter-select {
  padding: 0.625rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-reset {
  padding: 0.625rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* Table */
.table-card {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.table-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.btn-export {
  padding: 0.625rem 1rem;
  background: #10b981;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-export:hover {
  background: #059669;
  transform: translateY(-1px);
}

.table-responsive {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: var(--bg-secondary);
}

.data-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table td {
  padding: 1rem;
  border-top: 1px solid var(--border-color);
  font-size: 0.875rem;
}

.data-table tbody tr:hover {
  background: var(--bg-hover);
}

.date-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-primary {
  font-weight: 500;
  color: var(--text-primary);
}

.date-secondary {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name {
  font-weight: 500;
  color: var(--text-primary);
}

.user-email {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.seance-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.seance-id {
  font-weight: 500;
  color: #3b82f6;
}

.seance-date {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.matiere-badge,
.classe-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e0e7ff;
  color: #3730a3;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-connected {
  background: #d1fae5;
  color: #065f46;
}

.status-disconnected {
  background: #fee2e2;
  color: #991b1b;
}

.duration-text {
  font-weight: 500;
  color: var(--text-primary);
}

.text-green {
  color: #10b981;
}

.text-gray {
  color: var(--text-tertiary);
}

.text-red {
  color: #ef4444;
}

.btn-action {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1.25rem;
  transition: transform 0.2s;
}

.btn-action:hover {
  transform: scale(1.2);
}

/* Pagination */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.btn-page {
  padding: 0.625rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-page:hover:not(:disabled) {
  background: #2563eb;
}

.btn-page:disabled {
  background: #d1d5db;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Loading & Error */
.loading-container,
.error-container {
  padding: 3rem;
  text-align: center;
}

.error-message {
  color: #ef4444;
  font-size: 1rem;
  margin-bottom: 1rem;
}

.btn-retry {
  padding: 0.625rem 1.5rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retry:hover {
  background: #2563eb;
}

/* Empty State */
.empty-state {
  padding: 4rem 2rem;
  text-align: center;
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  display: block;
  margin-bottom: 1rem;
}

.empty-message {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.empty-hint {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

/* Modal */
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
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.detail-grid {
  display: grid;
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.detail-label {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.detail-value {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
  text-align: right;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 0.625rem 1.5rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #4b5563;
}

/* Responsive */
@media (max-width: 768px) {
  .attendance-history-container {
    padding: 1rem;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .filters-grid {
    grid-template-columns: 1fr;
  }

  .table-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .data-table {
    font-size: 0.75rem;
  }

  .data-table th,
  .data-table td {
    padding: 0.5rem;
  }

  .pagination {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
