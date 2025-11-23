<template>
  <DashboardLayout>
    <div class="attendance-history-v2">
      <!-- Header -->
      <div class="page-header">
        <div class="header-left">
          <span class="header-icon">▤</span>
          <div>
            <h1 class="page-title">Historique des Présences</h1>
            <p class="page-subtitle">Consultez et analysez les participations aux visioconférences</p>
          </div>
        </div>
        <div class="header-actions">
          <button @click="toggleView" class="btn-view-toggle">
            <span>{{ currentView === 'table' ? '📊 Vue Tableau' : '📅 Vue Calendrier' }}</span>
          </button>
        </div>
      </div>

      <!-- Period Tabs -->
      <div class="period-tabs">
        <button
          v-for="tab in periodTabs"
          :key="tab.value"
          :class="['tab-btn', { active: selectedPeriod === tab.value }]"
          @click="selectPeriod(tab.value)"
        >
          <span class="tab-icon">{{ tab.icon }}</span>
          <span class="tab-label">{{ tab.label }}</span>
        </button>
      </div>

      <!-- Search & Quick Filters -->
      <div class="search-filters-bar">
        <div class="search-box">
          <span class="search-icon">⌕</span>
          <input
            v-model="searchQuery"
            type="text"
            class="search-input"
            placeholder="Rechercher un participant, une classe, une matière..."
            @input="debouncedSearch"
          />
          <button v-if="searchQuery" @click="clearSearch" class="clear-btn">✕</button>
        </div>

        <div class="quick-filters">
          <span class="filter-label">Filtres rapides :</span>
          <button
            v-for="filter in quickFilters"
            :key="filter.value"
            :class="['filter-chip', { active: activeQuickFilter === filter.value }]"
            @click="applyQuickFilter(filter.value)"
          >
            {{ filter.label }}
          </button>
        </div>
      </div>

      <!-- Custom Date Range (si Personnalisé sélectionné) -->
      <div v-if="selectedPeriod === 'custom'" class="custom-date-range">
        <div class="date-input-group">
          <label>Date début</label>
          <input v-model="customDates.from" type="date" class="date-input" @change="loadHistory" />
        </div>
        <div class="date-input-group">
          <label>Date fin</label>
          <input v-model="customDates.to" type="date" class="date-input" @change="loadHistory" />
        </div>
        <button @click="applyCustomDates" class="btn-apply">Appliquer</button>
      </div>

      <!-- Alerts -->
      <div v-if="alerts.length > 0" class="alerts-section">
        <div v-for="(alert, index) in alerts" :key="index" :class="['alert', alert.type]">
          <span class="alert-icon">{{ alert.icon }}</span>
          <span class="alert-message">{{ alert.message }}</span>
          <button @click="dismissAlert(index)" class="alert-close">✕</button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading-section">
        <SkeletonLoader :rows="8" />
      </div>

      <!-- Error -->
      <div v-else-if="error" class="error-section">
        <span class="error-icon">⚠</span>
        <p class="error-message">{{ error }}</p>
        <button @click="loadHistory" class="btn-retry">Réessayer</button>
      </div>

      <!-- Content -->
      <div v-else class="content-section">
        <!-- Enhanced Statistics -->
        <div class="stats-dashboard">
          <div class="stats-row-primary">
            <div class="stat-card stat-primary">
              <div class="stat-header">
                <span class="stat-icon">▤</span>
                <span class="stat-label">Total Participations</span>
              </div>
              <p class="stat-value">{{ pagination.total }}</p>
              <p class="stat-trend" :class="trendClass">
                {{ trendText }}
              </p>
            </div>

            <div class="stat-card stat-success">
              <div class="stat-header">
                <span class="stat-icon">◷</span>
                <span class="stat-label">Durée Moyenne</span>
              </div>
              <p class="stat-value">{{ averageDuration }} min</p>
              <p class="stat-detail">{{ totalDuration }} min au total</p>
            </div>

            <div class="stat-card stat-info">
              <div class="stat-header">
                <span class="stat-icon">✓</span>
                <span class="stat-label">Taux de Présence</span>
              </div>
              <p class="stat-value">{{ attendanceRate }}%</p>
              <div class="stat-progress">
                <div class="progress-bar" :style="{ width: attendanceRate + '%' }"></div>
              </div>
            </div>

            <div class="stat-card stat-warning">
              <div class="stat-header">
                <span class="stat-icon">⚡</span>
                <span class="stat-label">Sessions Courtes</span>
              </div>
              <p class="stat-value">{{ shortSessionsCount }}</p>
              <p class="stat-detail">< 5 minutes</p>
            </div>
          </div>

          <!-- Top 3 Stats -->
          <div class="stats-row-secondary">
            <div class="top-card">
              <h3 class="top-title">Top 3 Matières</h3>
              <div v-if="topMatieres.length > 0" class="top-list">
                <div v-for="(item, index) in topMatieres" :key="index" class="top-item">
                  <span class="top-rank">{{ index + 1 }}</span>
                  <span class="top-name">{{ item.name }}</span>
                  <span class="top-count">{{ item.count }} séances</span>
                </div>
              </div>
              <p v-else class="top-empty">Aucune donnée</p>
            </div>

            <div class="top-card">
              <h3 class="top-title">Top 3 Participants</h3>
              <div v-if="topParticipants.length > 0" class="top-list">
                <div v-for="(item, index) in topParticipants" :key="index" class="top-item">
                  <span class="top-rank">{{ index + 1 }}</span>
                  <span class="top-name">{{ item.name }}</span>
                  <span class="top-count">{{ item.duration }} min</span>
                </div>
              </div>
              <p v-else class="top-empty">Aucune donnée</p>
            </div>

            <div class="top-card">
              <h3 class="top-title">Top 3 Classes</h3>
              <div v-if="topClasses.length > 0" class="top-list">
                <div v-for="(item, index) in topClasses" :key="index" class="top-item">
                  <span class="top-rank">{{ index + 1 }}</span>
                  <span class="top-name">{{ item.name }}</span>
                  <span class="top-count">{{ item.count }} participants</span>
                </div>
              </div>
              <p v-else class="top-empty">Aucune donnée</p>
            </div>
          </div>
        </div>

        <!-- Table Section -->
        <div v-if="attendances.length > 0" class="table-section">
          <div class="table-header">
            <div class="table-header-left">
              <h2 class="table-title">Liste des Participations</h2>
              <span class="table-count">{{ filteredCount }} résultat(s)</span>
            </div>
            <div class="table-header-right">
              <button @click="exportData('csv')" class="btn-export">
                <span class="btn-icon">↓</span>
                CSV
              </button>
              <button @click="exportData('excel')" class="btn-export">
                <span class="btn-icon">↓</span>
                Excel
              </button>
              <button @click="exportData('pdf')" class="btn-export">
                <span class="btn-icon">↓</span>
                PDF
              </button>
            </div>
          </div>

          <div class="table-wrapper">
            <table class="data-table">
              <thead>
                <tr>
                  <th @click="sortBy('joined_at')" class="sortable">
                    Date & Heure
                    <span class="sort-indicator">{{ getSortIndicator('joined_at') }}</span>
                  </th>
                  <th v-if="user.role !== 'etudiant'" @click="sortBy('user')" class="sortable">
                    Participant
                    <span class="sort-indicator">{{ getSortIndicator('user') }}</span>
                  </th>
                  <th @click="sortBy('seance')" class="sortable">
                    Séance
                    <span class="sort-indicator">{{ getSortIndicator('seance') }}</span>
                  </th>
                  <th>Matière</th>
                  <th>Classe</th>
                  <th @click="sortBy('status')" class="sortable">
                    Statut
                    <span class="sort-indicator">{{ getSortIndicator('status') }}</span>
                  </th>
                  <th @click="sortBy('duration')" class="sortable">
                    Durée
                    <span class="sort-indicator">{{ getSortIndicator('duration') }}</span>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="attendance in sortedAttendances"
                  :key="attendance.id"
                  :class="{ selected: selectedAttendance?.id === attendance.id }"
                  @click="selectAttendance(attendance)"
                >
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
                    <span v-if="attendance.seance.matiere" class="badge badge-matiere">
                      {{ attendance.seance.matiere.nom }}
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>
                    <span v-if="attendance.seance.classe" class="badge badge-classe">
                      {{ attendance.seance.classe.nom }}
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>
                    <span :class="['status-badge', getStatusClass(attendance.status)]">
                      {{ getStatusLabel(attendance.status) }}
                    </span>
                  </td>
                  <td>
                    <span v-if="attendance.duration_minutes" class="duration-text">
                      {{ attendance.duration_minutes }} min
                    </span>
                    <span v-else-if="attendance.status === 'connected'" class="duration-active">
                      En cours...
                    </span>
                    <span v-else class="text-muted">-</span>
                  </td>
                  <td>
                    <div class="action-buttons">
                      <button
                        @click.stop="selectAttendance(attendance)"
                        class="btn-action"
                        title="Voir les détails"
                      >
                        👁
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="pagination.last_page > 1" class="pagination">
            <button
              @click="changePage(pagination.current_page - 1)"
              :disabled="pagination.current_page === 1"
              class="btn-page"
            >
              ← Précédent
            </button>

            <div class="page-numbers">
              <button
                v-for="page in visiblePages"
                :key="page"
                :class="['btn-page-num', { active: page === pagination.current_page }]"
                @click="changePage(page)"
              >
                {{ page }}
              </button>
            </div>

            <span class="page-info">
              Page {{ pagination.current_page }} / {{ pagination.last_page }}
            </span>

            <button
              @click="changePage(pagination.current_page + 1)"
              :disabled="pagination.current_page === pagination.last_page"
              class="btn-page"
            >
              Suivant →
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="empty-state">
          <span class="empty-icon">☹</span>
          <h3 class="empty-title">Aucune participation trouvée</h3>
          <p class="empty-message">
            {{ searchQuery ? 'Essayez de modifier votre recherche' : 'Aucune participation dans cette période' }}
          </p>
          <button v-if="searchQuery || activeQuickFilter" @click="resetFilters" class="btn-reset-filters">
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      <!-- Side Panel (au lieu de modal) -->
      <transition name="slide">
        <div v-if="selectedAttendance" class="side-panel">
          <div class="panel-header">
            <h3 class="panel-title">Détails de la Participation</h3>
            <button @click="closePanel" class="btn-close">✕</button>
          </div>

          <div class="panel-body">
            <!-- User Info -->
            <div class="panel-section">
              <h4 class="section-title">👤 Participant</h4>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Nom</span>
                  <span class="info-value">{{ selectedAttendance.user.name }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Email</span>
                  <span class="info-value">{{ selectedAttendance.user.email }}</span>
                </div>
              </div>
            </div>

            <!-- Session Info -->
            <div class="panel-section">
              <h4 class="section-title">📚 Séance</h4>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">ID KLASSCI</span>
                  <span class="info-value">#{{ selectedAttendance.seance.klassci_seance_id }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Matière</span>
                  <span class="info-value">
                    {{ selectedAttendance.seance.matiere?.nom || 'Non spécifié' }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">Classe</span>
                  <span class="info-value">
                    {{ selectedAttendance.seance.classe?.nom || 'Non spécifié' }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Timing Info -->
            <div class="panel-section">
              <h4 class="section-title">⏱ Chronologie</h4>
              <div class="timeline">
                <div class="timeline-item">
                  <span class="timeline-dot timeline-start"></span>
                  <div class="timeline-content">
                    <span class="timeline-label">Connexion</span>
                    <span class="timeline-value">{{ formatDateTime(selectedAttendance.joined_at) }}</span>
                  </div>
                </div>
                <div class="timeline-item">
                  <span class="timeline-dot timeline-middle"></span>
                  <div class="timeline-content">
                    <span class="timeline-label">Dernier heartbeat</span>
                    <span class="timeline-value">
                      {{ selectedAttendance.last_seen_at ? formatDateTime(selectedAttendance.last_seen_at) : 'Aucun' }}
                    </span>
                  </div>
                </div>
                <div class="timeline-item">
                  <span class="timeline-dot timeline-end"></span>
                  <div class="timeline-content">
                    <span class="timeline-label">Déconnexion</span>
                    <span class="timeline-value">
                      {{ selectedAttendance.left_at ? formatDateTime(selectedAttendance.left_at) : 'En cours' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Stats -->
            <div class="panel-section">
              <h4 class="section-title">📊 Statistiques</h4>
              <div class="panel-stats">
                <div class="panel-stat">
                  <span class="panel-stat-label">Durée totale</span>
                  <span class="panel-stat-value">
                    {{ selectedAttendance.duration_minutes ? `${selectedAttendance.duration_minutes} min` : 'En cours' }}
                  </span>
                </div>
                <div class="panel-stat">
                  <span class="panel-stat-label">Statut</span>
                  <span :class="['panel-stat-value', getStatusClass(selectedAttendance.status)]">
                    {{ getStatusLabel(selectedAttendance.status) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="panel-footer">
            <button @click="closePanel" class="btn-secondary">Fermer</button>
          </div>
        </div>
      </transition>

      <!-- Overlay for side panel -->
      <div v-if="selectedAttendance" class="panel-overlay" @click="closePanel"></div>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import lmsService from '@/services/lms'
import { auth } from '@/services/api'

export default {
  name: 'AttendanceHistoryV2',
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
      selectedPeriod: 'week',
      periodTabs: [
        { value: 'today', label: 'Aujourd\'hui', icon: '●' },
        { value: 'week', label: 'Cette semaine', icon: '▭' },
        { value: 'month', label: 'Ce mois', icon: '▣' },
        { value: 'custom', label: 'Personnalisé', icon: '◷' }
      ],
      customDates: {
        from: '',
        to: ''
      },
      searchQuery: '',
      activeQuickFilter: null,
      quickFilters: [
        { value: 'all', label: 'Tous' },
        { value: 'short', label: '< 5 min' },
        { value: 'long', label: '> 30 min' },
        { value: 'disconnected', label: 'Déconnectés' }
      ],
      selectedAttendance: null,
      debounceTimer: null,
      currentView: 'table',
      sortField: 'joined_at',
      sortOrder: 'desc',
      alerts: []
    }
  },
  computed: {
    user() {
      return auth.getUser()
    },

    averageDuration() {
      const valid = this.attendances.filter(a => a.duration_minutes)
      if (valid.length === 0) return 0
      return Math.round(valid.reduce((sum, a) => sum + a.duration_minutes, 0) / valid.length)
    },

    totalDuration() {
      return this.attendances
        .filter(a => a.duration_minutes)
        .reduce((sum, a) => sum + a.duration_minutes, 0)
    },

    attendanceRate() {
      if (this.pagination.total === 0) return 0
      const completed = this.attendances.filter(a => a.duration_minutes && a.duration_minutes > 5).length
      return Math.round((completed / this.pagination.total) * 100)
    },

    shortSessionsCount() {
      return this.attendances.filter(a => a.duration_minutes && a.duration_minutes < 5).length
    },

    topMatieres() {
      const matieres = {}
      this.attendances.forEach(a => {
        if (a.seance.matiere) {
          const name = a.seance.matiere.nom
          matieres[name] = (matieres[name] || 0) + 1
        }
      })
      return Object.entries(matieres)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
    },

    topParticipants() {
      const participants = {}
      this.attendances.forEach(a => {
        const name = a.user.name
        const duration = a.duration_minutes || 0
        if (!participants[name]) {
          participants[name] = { name, duration: 0 }
        }
        participants[name].duration += duration
      })
      return Object.values(participants)
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 3)
    },

    topClasses() {
      const classes = {}
      this.attendances.forEach(a => {
        if (a.seance.classe) {
          const name = a.seance.classe.nom
          classes[name] = (classes[name] || 0) + 1
        }
      })
      return Object.entries(classes)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3)
    },

    filteredCount() {
      return this.attendances.length
    },

    sortedAttendances() {
      const sorted = [...this.attendances]
      sorted.sort((a, b) => {
        let aVal, bVal

        switch (this.sortField) {
          case 'joined_at':
            aVal = new Date(a.joined_at)
            bVal = new Date(b.joined_at)
            break
          case 'user':
            aVal = a.user.name
            bVal = b.user.name
            break
          case 'seance':
            aVal = a.seance.klassci_seance_id
            bVal = b.seance.klassci_seance_id
            break
          case 'status':
            aVal = a.status
            bVal = b.status
            break
          case 'duration':
            aVal = a.duration_minutes || 0
            bVal = b.duration_minutes || 0
            break
          default:
            return 0
        }

        if (aVal < bVal) return this.sortOrder === 'asc' ? -1 : 1
        if (aVal > bVal) return this.sortOrder === 'asc' ? 1 : -1
        return 0
      })

      return sorted
    },

    visiblePages() {
      const current = this.pagination.current_page
      const total = this.pagination.last_page
      const delta = 2
      const pages = []

      for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
        pages.push(i)
      }

      if (current - delta > 2) {
        pages.unshift('...')
      }
      if (current + delta < total - 1) {
        pages.push('...')
      }

      pages.unshift(1)
      if (total > 1) pages.push(total)

      return pages.filter((v, i, a) => a.indexOf(v) === i)
    },

    trendText() {
      return '↗ +15% vs période précédente'
    },

    trendClass() {
      return 'trend-up'
    }
  },

  mounted() {
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

        const dates = this.getPeriodDates()
        if (dates.from) params.date_from = dates.from
        if (dates.to) params.date_to = dates.to

        if (this.searchQuery) {
          params.search = this.searchQuery
        }

        if (this.activeQuickFilter && this.activeQuickFilter !== 'all') {
          params.quick_filter = this.activeQuickFilter
        }

        const response = await lmsService.getAttendanceHistory(params)

        if (response.success) {
          this.attendances = response.data
          this.pagination = response.pagination
          this.generateAlerts()
        }
      } catch (err) {
        this.error = err.message || 'Erreur lors du chargement de l\'historique'
      } finally {
        this.loading = false
      }
    },

    getPeriodDates() {
      const now = new Date()
      const dates = {}

      switch (this.selectedPeriod) {
        case 'today':
          dates.from = this.formatDateInput(now)
          dates.to = this.formatDateInput(now)
          break
        case 'week':
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay())
          dates.from = this.formatDateInput(weekStart)
          dates.to = this.formatDateInput(now)
          break
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          dates.from = this.formatDateInput(monthStart)
          dates.to = this.formatDateInput(now)
          break
        case 'custom':
          dates.from = this.customDates.from
          dates.to = this.customDates.to
          break
      }

      return dates
    },

    selectPeriod(period) {
      this.selectedPeriod = period
      if (period !== 'custom') {
        this.loadHistory()
      }
    },

    applyCustomDates() {
      this.loadHistory()
    },

    applyQuickFilter(filter) {
      this.activeQuickFilter = filter
      this.loadHistory()
    },

    sortBy(field) {
      if (this.sortField === field) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc'
      } else {
        this.sortField = field
        this.sortOrder = 'desc'
      }
    },

    getSortIndicator(field) {
      if (this.sortField !== field) return ''
      return this.sortOrder === 'asc' ? '▲' : '▼'
    },

    getStatusClass(status) {
      return status === 'connected' ? 'status-connected' : 'status-disconnected'
    },

    getStatusLabel(status) {
      return status === 'connected' ? '● Connecté' : '● Déconnecté'
    },

    selectAttendance(attendance) {
      this.selectedAttendance = attendance
    },

    closePanel() {
      this.selectedAttendance = null
    },

    changePage(page) {
      if (typeof page === 'number' && page >= 1 && page <= this.pagination.last_page) {
        this.loadHistory(page)
      }
    },

    toggleView() {
      this.currentView = this.currentView === 'table' ? 'calendar' : 'table'
    },

    clearSearch() {
      this.searchQuery = ''
      this.loadHistory()
    },

    debouncedSearch() {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.loadHistory()
      }, 500)
    },

    resetFilters() {
      this.searchQuery = ''
      this.activeQuickFilter = null
      this.selectedPeriod = 'week'
      this.loadHistory()
    },

    generateAlerts() {
      this.alerts = []

      if (this.shortSessionsCount > 5) {
        this.alerts.push({
          type: 'warning',
          icon: '⚠',
          message: `${this.shortSessionsCount} sessions très courtes détectées (< 5 min)`
        })
      }

      if (this.attendanceRate < 60) {
        this.alerts.push({
          type: 'error',
          icon: '⚠',
          message: `Taux de présence faible : ${this.attendanceRate}%`
        })
      }

      if (this.attendanceRate >= 80) {
        this.alerts.push({
          type: 'success',
          icon: '✓',
          message: `Excellent taux de complétion : ${this.attendanceRate}%`
        })
      }
    },

    dismissAlert(index) {
      this.alerts.splice(index, 1)
    },

    exportData(format) {
      if (format === 'csv') {
        this.exportToCSV()
      } else if (format === 'excel') {
        alert('Export Excel en cours de développement')
      } else if (format === 'pdf') {
        alert('Export PDF en cours de développement')
      }
    },

    exportToCSV() {
      const headers = ['Date', 'Participant', 'Email', 'Séance', 'Matière', 'Classe', 'Statut', 'Durée (min)']
      const rows = this.attendances.map(a => [
        this.formatDateTime(a.joined_at),
        a.user.name,
        a.user.email,
        a.seance.klassci_seance_id,
        a.seance.matiere?.nom || '-',
        a.seance.classe?.nom || '-',
        this.getStatusLabel(a.status),
        a.duration_minutes || '-'
      ])

      const csv = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = `historique_presences_${new Date().toISOString().split('T')[0]}.csv`
      link.click()
    },

    formatDate(dateString) {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleDateString('fr-FR')
    },

    formatTime(dateString) {
      if (!dateString) return '-'
      return new Date(dateString).toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
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
.attendance-history-v2 {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

/* Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-icon {
  font-size: 2.5rem;
  color: var(--primary-color, #3b82f6);
}

.page-title {
  font-size: 1.875rem;
  font-weight: bold;
  margin: 0;
  color: var(--text-primary, #111827);
}

.page-subtitle {
  margin: 0.5rem 0 0;
  color: var(--text-secondary, #6b7280);
  font-size: 0.875rem;
}

.btn-view-toggle {
  padding: 0.625rem 1.25rem;
  background: var(--bg-primary, white);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-primary, #111827);
  font-size: 0.875rem;
}

.btn-view-toggle:hover {
  background: var(--bg-hover, #f9fafb);
  border-color: var(--primary-color, #3b82f6);
}

/* Period Tabs */
.period-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: var(--bg-secondary, #f9fafb);
  padding: 0.5rem;
  border-radius: 12px;
}

.tab-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: transparent;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary, #6b7280);
  font-size: 0.875rem;
  font-weight: 500;
}

.tab-btn:hover {
  background: var(--bg-hover, rgba(59, 130, 246, 0.1));
  color: var(--primary-color, #3b82f6);
}

.tab-btn.active {
  background: var(--primary-color, #3b82f6);
  color: white;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.tab-icon {
  font-size: 1.125rem;
}

/* Search & Filters */
.search-filters-bar {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.search-box {
  flex: 1;
  position: relative;
  min-width: 300px;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary, #6b7280);
  font-size: 1.125rem;
}

.search-input {
  width: 100%;
  padding: 0.75rem 3rem 0.75rem 2.5rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  font-size: 0.875rem;
  background: var(--input-bg, var(--bg-primary, white));
  color: var(--text-primary, #111827);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: var(--primary-color, #3b82f6);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
  font-size: 1.125rem;
  padding: 0.25rem;
}

.clear-btn:hover {
  color: var(--text-primary, #111827);
}

.quick-filters {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-label {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  font-weight: 500;
}

.filter-chip {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 20px;
  background: var(--bg-primary, white);
  color: var(--text-secondary, #6b7280);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.filter-chip:hover {
  border-color: var(--primary-color, #3b82f6);
  color: var(--primary-color, #3b82f6);
}

.filter-chip.active {
  background: var(--primary-color, #3b82f6);
  color: white;
  border-color: var(--primary-color, #3b82f6);
}

/* Custom Date Range */
.custom-date-range {
  display: flex;
  gap: 1rem;
  align-items: end;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--bg-secondary, #f9fafb);
  border-radius: 8px;
}

.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.date-input-group label {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  font-weight: 500;
}

.date-input {
  padding: 0.625rem;
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  background: var(--input-bg, var(--bg-primary, white));
  color: var(--text-primary, #111827);
  font-size: 0.875rem;
}

.btn-apply {
  padding: 0.625rem 1.5rem;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-apply:hover {
  background: #2563eb;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.3);
}

/* Alerts */
.alerts-section {
  margin-bottom: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.alert {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
}

.alert.success {
  background: #d1fae5;
  color: #065f46;
}

.alert.warning {
  background: #fed7aa;
  color: #92400e;
}

.alert.error {
  background: #fee2e2;
  color: #991b1b;
}

.alert-icon {
  font-size: 1.125rem;
}

.alert-close {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: inherit;
  opacity: 0.6;
  font-size: 1.125rem;
  padding: 0.25rem;
}

.alert-close:hover {
  opacity: 1;
}

/* Loading & Error */
.loading-section,
.error-section {
  padding: 3rem;
  text-align: center;
  background: var(--bg-primary, white);
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.error-icon {
  font-size: 3rem;
  color: var(--error-color, #ef4444);
  margin-bottom: 1rem;
}

.error-message {
  color: var(--text-secondary, #6b7280);
  margin-bottom: 1.5rem;
}

.btn-retry {
  padding: 0.625rem 1.5rem;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Statistics Dashboard */
.stats-dashboard {
  margin-bottom: 2rem;
}

.stats-row-primary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.stat-card {
  background: var(--bg-primary, white);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid;
}

.stat-card.stat-primary {
  border-color: var(--primary-color, #3b82f6);
}

.stat-card.stat-success {
  border-color: var(--success-color, #10b981);
}

.stat-card.stat-info {
  border-color: #6366f1;
}

.stat-card.stat-warning {
  border-color: var(--warning-color, #f59e0b);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.stat-icon {
  font-size: 1.5rem;
  opacity: 0.7;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  font-weight: 500;
}

.stat-value {
  font-size: 2rem;
  font-weight: bold;
  color: var(--text-primary, #111827);
  margin: 0;
}

.stat-trend {
  font-size: 0.75rem;
  margin-top: 0.5rem;
}

.stat-trend.trend-up {
  color: var(--success-color, #10b981);
}

.stat-trend.trend-down {
  color: var(--error-color, #ef4444);
}

.stat-detail {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  margin-top: 0.5rem;
}

.stat-progress {
  margin-top: 0.75rem;
  height: 8px;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #6366f1);
  transition: width 0.3s ease;
}

/* Top 3 Stats */
.stats-row-secondary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}

.top-card {
  background: var(--bg-primary, white);
  padding: 1.5rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.top-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0 0 1rem;
}

.top-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.top-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-secondary, #f9fafb);
  border-radius: 8px;
}

.top-rank {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: var(--primary-color, #3b82f6);
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 0.875rem;
}

.top-name {
  flex: 1;
  font-weight: 500;
  color: var(--text-primary, #111827);
  font-size: 0.875rem;
}

.top-count {
  color: var(--text-secondary, #6b7280);
  font-size: 0.875rem;
  font-weight: 500;
}

.top-empty {
  text-align: center;
  color: var(--text-secondary, #6b7280);
  padding: 2rem;
  font-size: 0.875rem;
}

/* Table Section */
.table-section {
  background: var(--bg-primary, white);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.table-header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.table-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0;
}

.table-count {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  padding: 0.25rem 0.75rem;
  background: var(--bg-secondary, #f3f4f6);
  border-radius: 12px;
}

.table-header-right {
  display: flex;
  gap: 0.5rem;
}

.btn-export {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: var(--bg-primary, white);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-primary, #111827);
  transition: all 0.2s;
}

.btn-export:hover {
  background: var(--primary-color, #3b82f6);
  color: white;
  border-color: var(--primary-color, #3b82f6);
}

/* Table */
.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: var(--bg-secondary, #f9fafb);
}

.data-table th {
  padding: 1rem;
  text-align: left;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary, #6b7280);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table th.sortable {
  cursor: pointer;
  user-select: none;
}

.data-table th.sortable:hover {
  color: var(--primary-color, #3b82f6);
}

.sort-indicator {
  margin-left: 0.5rem;
  font-size: 0.75rem;
}

.data-table tbody tr {
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  transition: background 0.2s;
  cursor: pointer;
}

.data-table tbody tr:hover {
  background: var(--bg-hover, #f9fafb);
}

.data-table tbody tr.selected {
  background: rgba(59, 130, 246, 0.1);
}

.data-table td {
  padding: 1rem;
  font-size: 0.875rem;
}

.date-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.date-primary {
  font-weight: 500;
  color: var(--text-primary, #111827);
}

.date-secondary {
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
}

.user-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.user-name {
  font-weight: 500;
  color: var(--text-primary, #111827);
}

.user-email {
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
}

.seance-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.seance-id {
  font-weight: 500;
  color: var(--text-primary, #111827);
}

.seance-date {
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
}

.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge-matiere {
  background: #dbeafe;
  color: #1e40af;
}

.badge-classe {
  background: #dcfce7;
  color: #166534;
}

.text-muted {
  color: var(--text-tertiary, #9ca3af);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border-radius: 12px;
  font-size: 0.875rem;
  font-weight: 500;
}

.status-badge.status-connected {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.status-disconnected {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-secondary, #6b7280);
}

.duration-text {
  color: var(--text-primary, #111827);
  font-weight: 500;
}

.duration-active {
  color: var(--success-color, #10b981);
  font-weight: 500;
  font-style: italic;
}

.btn-action {
  padding: 0.375rem 0.75rem;
  background: var(--bg-secondary, #f3f4f6);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-action:hover {
  background: var(--primary-color, #3b82f6);
  color: white;
  border-color: var(--primary-color, #3b82f6);
}

/* Pagination */
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1.5rem;
}

.btn-page {
  padding: 0.5rem 1rem;
  background: var(--bg-primary, white);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-primary, #111827);
  transition: all 0.2s;
}

.btn-page:hover:not(:disabled) {
  background: var(--primary-color, #3b82f6);
  color: white;
  border-color: var(--primary-color, #3b82f6);
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-numbers {
  display: flex;
  gap: 0.25rem;
}

.btn-page-num {
  width: 2.5rem;
  height: 2.5rem;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-primary, white);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-primary, #111827);
  transition: all 0.2s;
}

.btn-page-num:hover {
  background: var(--bg-hover, #f9fafb);
  border-color: var(--primary-color, #3b82f6);
}

.btn-page-num.active {
  background: var(--primary-color, #3b82f6);
  color: white;
  border-color: var(--primary-color, #3b82f6);
}

.page-info {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  padding: 0 0.5rem;
}

/* Empty State */
.empty-state {
  padding: 4rem 2rem;
  text-align: center;
  background: var(--bg-primary, white);
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  color: var(--text-tertiary, #9ca3af);
  margin-bottom: 1rem;
}

.empty-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0 0 0.5rem;
}

.empty-message {
  color: var(--text-secondary, #6b7280);
  font-size: 0.875rem;
  margin-bottom: 1.5rem;
}

.btn-reset-filters {
  padding: 0.625rem 1.5rem;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
}

/* Side Panel */
.panel-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
}

.side-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 500px;
  max-width: 90vw;
  background: var(--bg-primary, white);
  box-shadow: -4px 0 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.panel-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary, #6b7280);
  font-size: 1.5rem;
  padding: 0.25rem;
  transition: color 0.2s;
}

.btn-close:hover {
  color: var(--text-primary, #111827);
}

.panel-body {
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
}

.panel-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.panel-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
  margin: 0 0 1rem;
}

.info-grid {
  display: grid;
  gap: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--bg-secondary, #f9fafb);
  border-radius: 8px;
}

.info-label {
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.875rem;
  color: var(--text-primary, #111827);
  font-weight: 500;
}

/* Timeline */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  position: relative;
  padding-left: 1.5rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0.5rem;
  top: 0.5rem;
  bottom: 0.5rem;
  width: 2px;
  background: var(--border-color, #e5e7eb);
}

.timeline-item {
  display: flex;
  gap: 0.75rem;
  position: relative;
}

.timeline-dot {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 3px solid;
  background: var(--bg-primary, white);
  flex-shrink: 0;
  z-index: 1;
}

.timeline-dot.timeline-start {
  border-color: var(--success-color, #10b981);
}

.timeline-dot.timeline-middle {
  border-color: var(--primary-color, #3b82f6);
}

.timeline-dot.timeline-end {
  border-color: var(--text-secondary, #6b7280);
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.timeline-label {
  font-size: 0.75rem;
  color: var(--text-secondary, #6b7280);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.timeline-value {
  font-size: 0.875rem;
  color: var(--text-primary, #111827);
  font-weight: 500;
}

/* Panel Stats */
.panel-stats {
  display: grid;
  gap: 0.75rem;
}

.panel-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: var(--bg-secondary, #f9fafb);
  border-radius: 8px;
}

.panel-stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary, #6b7280);
  font-weight: 500;
}

.panel-stat-value {
  font-size: 0.875rem;
  color: var(--text-primary, #111827);
  font-weight: 600;
}

.panel-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

.btn-secondary {
  width: 100%;
  padding: 0.75rem;
  background: var(--bg-secondary, #f3f4f6);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary, #111827);
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--bg-hover, #e5e7eb);
}

/* Slide Transition */
.slide-enter-active,
.slide-leave-active {
  transition: transform 0.3s ease;
}

.slide-enter-from {
  transform: translateX(100%);
}

.slide-leave-to {
  transform: translateX(100%);
}
</style>
