<template>
  <DashboardLayout>
    <div class="attendance-container">
      <!-- Header -->
      <div class="welcome-header">
        <i class="fa fa-home welcome-icon"></i>
        <div>
          <h1 class="page-title">Historique des Séances</h1>
          <p class="page-subtitle">Consultez les séances et leurs listes de présences</p>
        </div>
      </div>

      <!-- Period Tabs -->
      <div class="filters-card">
        <div class="period-tabs">
          <button
            v-for="tab in periodTabs"
            :key="tab.value"
            :class="['period-tab', { active: selectedPeriod === tab.value }]"
            @click="selectPeriod(tab.value)"
          >
            <i :class="`fa ${tab.icon} tab-icon`"></i>
            <span class="tab-label">{{ tab.label }}</span>
          </button>
        </div>

        <!-- Custom Date Range -->
        <div v-if="selectedPeriod === 'custom'" class="custom-date-section">
          <div class="date-inputs-row">
            <div class="input-group">
              <label class="input-label">Date début</label>
              <input v-model="customDates.from" type="date" class="date-input" />
            </div>
            <div class="input-group">
              <label class="input-label">Date fin</label>
              <input v-model="customDates.to" type="date" class="date-input" />
            </div>
            <button @click="applyCustomDates" class="btn-primary-action">
              Appliquer
            </button>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="search-section">
          <div class="search-input-wrapper">
            <span class="search-icon">⌕</span>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              placeholder="Rechercher une matière, enseignant, séance..."
              @input="debouncedSearch"
            />
            <button v-if="searchQuery" @click="clearSearch" class="clear-search-btn">
              ✕
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement des séances..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <i class="fa fa-exclamation-triangle error-icon"></i>
        <div class="error-content">
          <h3 class="error-title">Une erreur est survenue</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadSeances" class="error-retry-btn">
          <span>↻</span>
          Réessayer
        </button>
      </div>

      <!-- Seances Table -->
      <div v-else-if="seances.length > 0" class="table-card">
        <div class="table-wrapper">
          <table class="data-table">
            <thead>
              <tr>
                <th>Matière</th>
                <th>Séance</th>
                <th>Classe</th>
                <th>Date & Heure</th>
                <th class="text-center">Durée</th>
                <th class="text-center">Participants</th>
                <th class="text-center">Durée Moy.</th>
                <th class="text-center">Taux</th>
                <th class="text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="seance in seances"
                :key="seance.id"
                :class="{ 'row-selected': selectedSeance?.id === seance.id }"
              >
                <td>{{ seance.matiere.nom }}</td>
                <td>
                  <div class="seance-cell">
                    <div class="seance-title">{{ seance.titre }}</div>
                    <div class="seance-ref">{{ seance.klassci_seance_id }}</div>
                  </div>
                </td>
                <td>
                  <span v-if="seance.classe">{{ seance.classe.nom }}</span>
                  <span v-else class="text-muted">-</span>
                </td>
                <td>
                  <div class="date-cell">
                    <div>{{ formatDate(seance.date) }}</div>
                    <div v-if="seance.visio_started_at" class="time-text">
                      {{ formatTime(seance.visio_started_at) }}
                    </div>
                  </div>
                </td>
                <td class="text-center">{{ formatDuration(seance.duree_seance_minutes) }}</td>
                <td class="text-center num-cell">{{ seance.participants_count }}</td>
                <td class="text-center">{{ formatDuration(seance.duree_moyenne_minutes) }}</td>
                <td class="text-center">
                  <span :class="['rate-text', getRateClass(seance.taux_presence)]">
                    {{ seance.taux_presence }}%
                  </span>
                </td>
                <td class="text-center">
                  <div class="actions-buttons">
                    <button
                      @click="viewAttendances(seance)"
                      class="btn-view"
                      title="Voir les présences"
                    >
                      Voir
                    </button>
                    <button
                      @click="deleteSeance(seance)"
                      class="btn-delete"
                      title="Supprimer la séance"
                    >
                      Supprimer
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="pagination.last_page > 1" class="pagination-wrapper">
          <button
            @click="changePage(pagination.current_page - 1)"
            :disabled="pagination.current_page === 1"
            class="pagination-btn"
          >
            ← Précédent
          </button>

          <span class="pagination-info">
            Page {{ pagination.current_page }} / {{ pagination.last_page }}
          </span>

          <button
            @click="changePage(pagination.current_page + 1)"
            :disabled="pagination.current_page === pagination.last_page"
            class="pagination-btn"
          >
            Suivant →
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="empty-state">
        <i class="fa fa-clipboard empty-icon"></i>
        <h3 class="empty-title">Aucune séance trouvée</h3>
        <p class="empty-message">
          {{ searchQuery ? 'Aucun résultat ne correspond à votre recherche.' : 'Aucune séance trouvée pour cette période.' }}
        </p>
        <button v-if="searchQuery" @click="clearSearch" class="btn-empty">
          Effacer la recherche
        </button>
      </div>

      <!-- Modal - Détails des Présences -->
      <transition name="modal-fade">
        <div v-if="selectedSeance" class="modal-overlay" @click="closeModal">
          <div class="modal-container" @click.stop>
            <!-- Modal Header -->
            <div class="modal-header">
              <div class="modal-header-content">
                <h3 class="modal-title">Liste de Présence</h3>
                <div class="modal-roles-row">
                  <p v-if="attendances?.seance?.enseignant_nom" class="modal-role">
                    <span class="role-label">Enseignant:</span> {{ attendances.seance.enseignant_nom }}
                  </p>
                  <p v-if="attendances?.seance" class="modal-role modal-seance-time" style="text-align: center; flex-grow: 1;">
                    <span class="role-label"><i class="fa fa-clock-o"></i> Séance:</span>
                    {{ formatTime(attendances.seance.visio_started_at) }} - {{ formatTime(attendances.seance.visio_ended_at) }}
                    <span v-if="attendances.seance.duration_minutes" class="duration-text">
                      ({{ formatDuration(attendances.seance.duration_minutes) }})
                    </span>
                  </p>
                  <p v-if="attendances?.seance?.coordinateur_nom" class="modal-role">
                    <span class="role-label">Coordinateur:</span> {{ attendances.seance.coordinateur_nom }}
                  </p>
                </div>
                <p class="modal-subtitle">Séance {{ selectedSeance.klassci_seance_id }} - {{ selectedSeance.matiere_nom }} - {{ formatDate(selectedSeance.date) }}</p>
              </div>
              <button @click="closeModal" class="modal-close-btn">✕</button>
            </div>

            <!-- Modal Body -->
            <div class="modal-body">
              <!-- Loading State -->
              <div v-if="loadingAttendances" class="modal-loading">
                <div class="loading-spinner"></div>
                <p>Chargement des présences...</p>
              </div>

              <!-- Attendances Table -->
              <div v-else-if="attendances && attendances.attendances.length > 0">
                <!-- Message pour séance en cours -->
                <div v-if="!attendances.seance?.is_finished" class="modal-info-banner">
                  ℹ️ Séance en cours - La liste définitive sera disponible après la fermeture de la séance
                </div>

                <div class="modal-table-wrapper">
                  <table class="modal-table">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th class="text-center">Arrivée</th>
                        <th class="text-center">Départ</th>
                        <th class="text-center">Durée</th>
                        <th class="text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="attendance in attendances.attendances" :key="attendance.id">
                        <td>{{ attendance.nom }}</td>
                        <td class="email-cell">{{ attendance.email }}</td>
                        <td class="text-center time-cell">{{ formatTime(attendance.joined_at) }}</td>
                        <td class="text-center time-cell">
                          {{ attendance.left_at ? formatTime(attendance.left_at) : '-' }}
                        </td>
                        <td class="text-center">{{ formatDuration(attendance.duration_minutes) }}</td>
                        <td class="text-center">
                          <span :class="getStatusBadgeClass(attendance.status_level)">
                            {{ attendance.presence_status }}
                            <span v-if="attendance.participation_percentage !== null" class="percentage-text">
                              ({{ attendance.participation_percentage }}%)
                            </span>
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <!-- Statistics Summary -->
                <div class="modal-stats">
                  <div class="modal-stat-item">
                    <span class="stat-label">Total participants:</span>
                    <span class="stat-value">{{ attendances.statistics.total_participants }}</span>
                  </div>
                  <div class="modal-stat-item">
                    <span class="stat-label">Durée moyenne:</span>
                    <span class="stat-value">{{ formatDuration(attendances.statistics.average_duration) }}</span>
                  </div>
                  <div class="modal-stat-item">
                    <span class="stat-label">Taux de présence:</span>
                    <span class="stat-value">{{ attendances.statistics.presence_rate }}%</span>
                  </div>
                </div>
              </div>

              <!-- Empty State -->
              <div v-else-if="attendances" class="modal-empty">
                <i class="fa fa-clipboard empty-icon"></i>
                <p>Aucune participation enregistrée</p>
              </div>

              <!-- Error State -->
              <div v-else-if="attendancesError" class="modal-error">
                <span><i class="fa fa-exclamation-triangle"></i></span>
                <p>{{ attendancesError }}</p>
                <button @click="viewAttendances(selectedSeance)" class="btn-retry">Réessayer</button>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="modal-footer">
              <button
                @click="exportPDF"
                :disabled="exporting"
                class="btn-export-pdf"
                title="Exporter en PDF"
              >
                <i class="fa fa-file-pdf-o"></i>
                {{ exporting ? 'Export...' : 'Exporter PDF' }}
              </button>
              <button
                @click="exportExcel"
                :disabled="exporting"
                class="btn-export-excel"
                title="Exporter en Excel"
              >
                <i class="fa fa-file-excel-o"></i>
                {{ exporting ? 'Export...' : 'Exporter Excel' }}
              </button>
              <button @click="closeModal" class="btn-modal-close">Fermer</button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import lmsService from '@/services/lms'

export default {
  name: 'SeanceAttendanceHistory',
  components: {
    DashboardLayout,
    ContentLoader
  },
  data() {
    return {
      loading: false,
      error: null,
      seances: [],
      pagination: {
        current_page: 1,
        per_page: 50,
        total: 0,
        last_page: 1
      },
      selectedPeriod: 'week',
      periodTabs: [
        { value: 'today', label: 'Aujourd\'hui', icon: 'fa-circle' },
        { value: 'week', label: 'Cette semaine', icon: 'fa-calendar' },
        { value: 'month', label: 'Ce mois', icon: 'fa-calendar-check-o' },
        { value: 'custom', label: 'Personnalisé', icon: 'fa-clock-o' }
      ],
      customDates: {
        from: '',
        to: ''
      },
      searchQuery: '',
      debounceTimer: null,
      selectedSeance: null,
      loadingAttendances: false,
      attendances: null,
      attendancesError: null,
      exporting: false
    }
  },
  mounted() {
    this.loadSeances()
  },
  methods: {
    async loadSeances(page = 1) {
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

        const response = await lmsService.getSeancesHistory(params)

        if (response.success) {
          this.seances = response.data
          this.pagination = response.pagination
        }
      } catch (err) {
        this.error = err.message || 'Erreur lors du chargement des séances'
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
        this.loadSeances()
      }
    },

    applyCustomDates() {
      this.loadSeances()
    },

    debouncedSearch() {
      clearTimeout(this.debounceTimer)
      this.debounceTimer = setTimeout(() => {
        this.loadSeances()
      }, 500)
    },

    clearSearch() {
      this.searchQuery = ''
      this.loadSeances()
    },

    changePage(page) {
      if (page >= 1 && page <= this.pagination.last_page) {
        this.loadSeances(page)
      }
    },

    async viewAttendances(seance) {
      this.selectedSeance = seance
      this.loadingAttendances = true
      this.attendances = null
      this.attendancesError = null

      try {
        const response = await lmsService.getSeanceAttendances(seance.id)
        if (response.success) {
          this.attendances = response
        }
      } catch (err) {
        this.attendancesError = err.message || 'Erreur lors du chargement des présences'
      } finally {
        this.loadingAttendances = false
      }
    },

    closeModal() {
      this.selectedSeance = null
      this.attendances = null
      this.attendancesError = null
    },

    /**
     * Exporter la liste de présence en PDF
     */
    async exportPDF() {
      if (this.exporting || !this.selectedSeance) return

      this.exporting = true
      try {
        console.log('[SeanceHistory] Export PDF de la séance', this.selectedSeance.klassci_seance_id)

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
        const token = localStorage.getItem('token')

        // Créer l'URL de téléchargement
        const url = `${API_URL}/lms/seances/${this.selectedSeance.klassci_seance_id}/export/presences/pdf`

        // Télécharger le fichier
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/pdf'
          }
        })

        if (!response.ok) {
          throw new Error('Erreur lors du téléchargement du PDF')
        }

        // Créer un blob et télécharger
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `presences_seance_${this.selectedSeance.klassci_seance_id}_${new Date().toISOString().split('T')[0]}.pdf`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)

        console.log('[SeanceHistory] ✅ PDF téléchargé avec succès')
      } catch (error) {
        console.error('[SeanceHistory] Erreur export PDF:', error)
        this.$toast?.error('Erreur lors de l\'export PDF : ' + error.message)
      } finally {
        this.exporting = false
      }
    },

    /**
     * Exporter la liste de présence en Excel
     */
    async exportExcel() {
      if (this.exporting || !this.selectedSeance) return

      this.exporting = true
      try {
        console.log('[SeanceHistory] Export Excel de la séance', this.selectedSeance.klassci_seance_id)

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
        const token = localStorage.getItem('token')

        // Créer l'URL de téléchargement
        const url = `${API_URL}/lms/seances/${this.selectedSeance.klassci_seance_id}/export/presences/excel`

        // Télécharger le fichier
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
        })

        if (!response.ok) {
          throw new Error('Erreur lors du téléchargement du fichier Excel')
        }

        // Créer un blob et télécharger
        const blob = await response.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = downloadUrl
        a.download = `presences_seance_${this.selectedSeance.klassci_seance_id}_${new Date().toISOString().split('T')[0]}.xlsx`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(downloadUrl)
        document.body.removeChild(a)

        console.log('[SeanceHistory] ✅ Excel téléchargé avec succès')
      } catch (error) {
        console.error('[SeanceHistory] Erreur export Excel:', error)
        this.$toast?.error('Erreur lors de l\'export Excel : ' + error.message)
      } finally {
        this.exporting = false
      }
    },

    async deleteSeance(seance) {
      if (!confirm(`Êtes-vous sûr de vouloir supprimer la séance ${seance.klassci_seance_id} ?`)) {
        return
      }

      try {
        await lmsService.deleteSeance(seance.id)
        this.$toast.success('Séance supprimée avec succès')
        this.loadSeances() // Recharger la liste
      } catch (err) {
        this.$toast.error(err.message || 'Erreur lors de la suppression de la séance')
      }
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

    formatDateInput(date) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    },

    formatDuration(minutes) {
      if (!minutes || minutes === 0) return '-'

      // Arrondir les minutes totales d'abord
      const totalMinutes = Math.round(minutes)
      const hours = Math.floor(totalMinutes / 60)
      const mins = totalMinutes % 60

      if (hours > 0) {
        return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
      } else {
        return `${totalMinutes} min`
      }
    },

    getInitials(name) {
      if (!name) return '?'
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    },

    getRateClass(rate) {
      if (rate >= 80) return 'rate-high'
      if (rate >= 60) return 'rate-medium'
      return 'rate-low'
    },

    getStatusBadgeClass(statusLevel) {
      const baseClass = 'status-badge'

      switch (statusLevel) {
        case 'present':
          return `${baseClass} status-present`
        case 'partial':
          return `${baseClass} status-partial`
        case 'low':
          return `${baseClass} status-low`
        case 'absent':
          return `${baseClass} status-absent`
        case 'ongoing':
          return `${baseClass} status-ongoing`
        default:
          return baseClass
      }
    },

    getStatusClass(status) {
      return status === 'connected' ? 'status-online' : 'status-offline'
    },

    getStatusLabel(status) {
      return status === 'connected' ? 'Connecté' : 'Déconnecté'
    }
  }
}
</script>

<style scoped>
/* Container */
.attendance-container {
  padding: 2rem;
  max-width: 1600px;
  margin: 0 auto;
}

/* Header */
.welcome-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 1rem;
  border: 1px solid var(--border-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.welcome-icon {
  font-size: 3rem;
  line-height: 1;
  flex-shrink: 0;
  color: var(--primary-color, #3b82f6);
}

.page-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
  letter-spacing: -0.025em;
}

.page-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
  font-weight: 500;
}

/* Filters Card */
.filters-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Period Tabs */
.period-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.period-tab {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: var(--bg-secondary);
  border: 2px solid transparent;
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
}

.period-tab:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
  border-color: #e5e7eb;
}

.period-tab.active {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-color: #3b82f6;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.tab-icon {
  font-size: 1.125rem;
  line-height: 1;
}

/* Custom Date Section */
.custom-date-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.date-inputs-row {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
}

.input-group {
  flex: 1;
}

.input-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
}

.date-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--input-bg, var(--bg-primary));
  color: var(--text-primary);
  font-size: 0.875rem;
  font-family: inherit;
  transition: all 0.2s;
}

.date-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-primary-action {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-primary-action:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Search Section */
.search-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

.search-input-wrapper {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-secondary);
  font-size: 1.25rem;
  pointer-events: none;
}

.search-input {
  width: 100%;
  padding: 0.875rem 3.5rem 0.875rem 3rem;
  border: 1px solid var(--border-color);
  border-radius: 0.75rem;
  font-size: 0.875rem;
  background: var(--input-bg, var(--bg-primary));
  color: var(--text-primary);
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.clear-search-btn {
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: var(--bg-secondary);
  border: none;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.clear-search-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

/* Loading State */
.loading-state {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 2rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Error State */
.error-state {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  background: #FEF2F2;
  border: 1px solid #FCA5A5;
  border-radius: 0.75rem;
  margin-bottom: 1.5rem;
}

.error-icon {
  font-size: 2rem;
  color: #DC2626;
  flex-shrink: 0;
}

.error-content {
  flex: 1;
}

.error-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: #991B1B;
  margin: 0 0 0.5rem 0;
}

.error-message {
  color: #B91C1C;
  margin: 0;
  font-size: 0.875rem;
}

.error-retry-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #DC2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.error-retry-btn:hover {
  background: #B91C1C;
  transform: scale(1.02);
}

/* Table Card */
.table-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.table-wrapper {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
}

.data-table thead {
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
}

.data-table th {
  padding: 0.875rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.data-table tbody tr {
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.15s ease;
}

.data-table tbody tr:hover {
  background: var(--bg-hover, rgba(0, 0, 0, 0.02));
}

.data-table tbody tr.row-selected {
  background: var(--bg-hover);
}

.data-table td {
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.text-center {
  text-align: center !important;
}

.text-muted {
  color: var(--text-tertiary);
}

/* Seance Cell */
.seance-cell {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.seance-title {
  font-weight: 500;
  color: var(--text-primary);
}

.seance-ref {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
}

/* Date Cell */
.date-cell {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.time-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  font-family: 'Courier New', monospace;
}

/* Num Cell */
.num-cell {
  font-weight: 600;
  color: var(--text-primary);
}

/* Rate Text */
.rate-text {
  font-weight: 600;
  font-size: 0.875rem;
}

.rate-text.rate-high {
  color: #10B981;
}

.rate-text.rate-medium {
  color: #F59E0B;
}

.rate-text.rate-low {
  color: #EF4444;
}

/* Action Buttons */
.actions-buttons {
  display: flex;
  gap: 0.5rem;
  justify-content: center;
  align-items: center;
}

.btn-view {
  padding: 0.5rem 1rem;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-view:hover {
  background: #2563eb;
  transform: translateY(-1px);
}

.btn-delete {
  padding: 0.5rem 1rem;
  background: #ef4444;
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-delete:hover {
  background: #dc2626;
  transform: translateY(-1px);
}

/* Pagination */
.pagination-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.pagination-btn {
  padding: 0.625rem 1.25rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  transition: all 0.2s;
}

.pagination-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border-color: #3b82f6;
  box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);
}

.pagination-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination-info {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  padding: 0 0.5rem;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--bg-primary);
  border-radius: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-icon {
  font-size: 4rem;
  line-height: 1;
  margin-bottom: 1rem;
  opacity: 0.5;
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}

.empty-message {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
  font-size: 1rem;
}

.btn-empty {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-empty:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  z-index: 999;
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.modal-container {
  background: var(--bg-primary);
  border-radius: 1rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 1200px;
  width: 100%;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid var(--border-color);
  background: var(--bg-secondary);
}

.modal-header-content {
  flex: 1;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}

.modal-roles-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.modal-role {
  font-size: 0.9rem;
  color: var(--text-primary);
  margin: 0;
  white-space: nowrap;
}

.modal-role:last-child {
  margin-left: auto;
  text-align: right;
}

.modal-role .role-label {
  font-weight: 600;
  color: var(--text-secondary);
}

.modal-seance-time {
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
}

.modal-seance-time .duration-text {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin-left: 0.25rem;
}

.modal-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  width: 2rem;
  height: 2rem;
  border-radius: 0.375rem;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 1.5rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  flex-shrink: 0;
}

.modal-close-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
}

/* Modal Loading */
.modal-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  gap: 1rem;
  color: var(--text-secondary);
}

.loading-spinner {
  width: 3rem;
  height: 3rem;
  border: 3px solid var(--bg-secondary);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Modal Info Banner */
.modal-info-banner {
  background: #DBEAFE;
  border: 1px solid #93C5FD;
  color: #1E40AF;
  padding: 0.875rem 1rem;
  border-radius: 0.5rem;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Modal Table */
.modal-table-wrapper {
  overflow-x: auto;
  margin-bottom: 2rem;
}

.modal-table {
  width: 100%;
  border-collapse: collapse;
}

.modal-table thead {
  background: var(--bg-secondary);
  border-bottom: 2px solid var(--border-color);
}

.modal-table th {
  padding: 0.875rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.modal-table tbody tr {
  border-bottom: 1px solid var(--border-color);
  transition: background-color 0.15s ease;
}

.modal-table tbody tr:hover {
  background: var(--bg-hover, rgba(0, 0, 0, 0.02));
}

.modal-table td {
  padding: 0.875rem 1rem;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.email-cell {
  color: var(--text-secondary);
  font-size: 0.8125rem;
}

.time-cell {
  font-family: 'Courier New', monospace;
  font-size: 0.8125rem;
  color: var(--text-secondary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.status-badge .percentage-text {
  font-size: 0.7rem;
  opacity: 0.9;
}

/* Présent - Vert (≥80%) */
.status-badge.status-present {
  background: #D1FAE5;
  color: #065F46;
}

/* Partiel - Orange (50-79%) */
.status-badge.status-partial {
  background: #FED7AA;
  color: #92400E;
}

/* Faible - Rouge clair (20-49%) */
.status-badge.status-low {
  background: #FECACA;
  color: #7F1D1D;
}

/* Absent - Rouge foncé (<20%) */
.status-badge.status-absent {
  background: #FEE2E2;
  color: #991B1B;
}

/* En cours - Bleu (séance non terminée) */
.status-badge.status-ongoing {
  background: #DBEAFE;
  color: #1E40AF;
}

/* Modal Stats */
.modal-stats {
  display: flex;
  gap: 2rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  border: 1px solid var(--border-color);
}

.modal-stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.modal-stat-item .stat-label {
  color: var(--text-secondary);
  font-weight: 500;
}

.modal-stat-item .stat-value {
  color: var(--text-primary);
  font-weight: 600;
}

/* Modal Empty */
.modal-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.modal-empty .empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Modal Error */
.modal-error {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  text-align: center;
  color: var(--text-secondary);
}

.modal-error span {
  font-size: 3rem;
  color: #EF4444;
}

.btn-retry {
  padding: 0.625rem 1.5rem;
  background: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}

.btn-retry:hover {
  background: #2563eb;
}

/* Modal Footer */
.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-export-pdf {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}

.btn-export-pdf:hover:not(:disabled) {
  background: linear-gradient(135deg, #b91c1c 0%, #991b1b 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
}

.btn-export-pdf:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-export-excel {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.btn-export-excel:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-export-excel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-modal-close {
  padding: 0.75rem 2rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  transition: all 0.15s;
}

.btn-modal-close:hover {
  background: var(--bg-hover);
  border-color: var(--text-tertiary);
}

/* Modal Transitions */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: all 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: scale(0.95);
  opacity: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .period-tabs {
    grid-template-columns: repeat(2, 1fr);
  }

  .panel-stats-grid {
    grid-template-columns: 1fr;
  }

  .attendance-info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .attendance-container {
    padding: 1rem;
  }

  .welcome-header {
    padding: 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }

  .date-inputs-row {
    flex-direction: column;
  }

  .side-panel {
    width: 100%;
  }
}
</style>
