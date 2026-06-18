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

      <!-- Modal - Détails des Présences (#28 : sous-composant extrait) -->
      <AttendanceDetailModal
        :selected-seance="selectedSeance"
        :attendances="attendances"
        :loading-attendances="loadingAttendances"
        :attendances-error="attendancesError"
        :exporting="exporting"
        @close="closeModal"
        @export-pdf="exportPDF"
        @export-excel="exportExcel"
        @retry="viewAttendances(selectedSeance)"
      />
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import lmsService from '@/services/lms'
import attendanceExportService from '@/services/attendanceExport'
import AttendanceDetailModal from '@/components/attendance/AttendanceDetailModal.vue'
// #28 : logique métier pure extraite (testée dans tests/unit/attendance.test.js)
import { getAttendanceRateClass, getPeriodDates } from '@/utils/attendance'

export default {
  name: 'SeanceAttendanceHistory',
  components: {
    DashboardLayout,
    ContentLoader,
    AttendanceDetailModal
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
  async mounted() {
    await this.loadSeances()

    // Si un seanceId est passé en paramètre, ouvrir directement le modal de présences
    const seanceId = this.$route.params.seanceId
    if (seanceId) {
      this.openSeanceById(parseInt(seanceId))
    }
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
      // #28 : logique pure déléguée à utils/attendance
      return getPeriodDates(this.selectedPeriod, this.customDates)
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

    async openSeanceById(seanceId) {
      // Chercher la séance dans la liste déjà chargée
      let seance = this.seances.find(s => s.id === seanceId)

      if (seance) {
        // Séance trouvée dans la liste, ouvrir le modal
        await this.viewAttendances(seance)
      } else {
        // Séance pas dans la liste (autre période), charger directement les présences
        this.selectedSeance = { id: seanceId, klassci_seance_id: seanceId, matiere_nom: '', date: '' }
        this.loadingAttendances = true
        this.attendances = null
        this.attendancesError = null

        try {
          const response = await lmsService.getSeanceAttendances(seanceId)
          if (response.success) {
            this.attendances = response
            // Mettre à jour les infos de la séance depuis la réponse
            if (response.seance) {
              this.selectedSeance = {
                ...this.selectedSeance,
                matiere_nom: response.seance.matiere_nom || '',
                date: response.seance.date || '',
                enseignant_nom: response.seance.enseignant_nom || '',
                klassci_seance_id: response.seance.klassci_seance_id || seanceId
              }
            }
          }
        } catch (err) {
          this.attendancesError = err.message || 'Erreur lors du chargement des présences'
        } finally {
          this.loadingAttendances = false
        }
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
    // #28 : téléchargement (fetch + blob) délégué à attendanceExportService.
    async exportPDF() {
      if (this.exporting || !this.selectedSeance) return
      this.exporting = true
      try {
        await attendanceExportService.exportPdf(this.selectedSeance.klassci_seance_id)
      } catch (error) {
        console.error('[SeanceHistory] Erreur export PDF:', error)
        this.$toast?.error('Erreur lors de l\'export PDF : ' + error.message)
      } finally {
        this.exporting = false
      }
    },

    async exportExcel() {
      if (this.exporting || !this.selectedSeance) return
      this.exporting = true
      try {
        await attendanceExportService.exportExcel(this.selectedSeance.klassci_seance_id)
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

    // #28 : logique pure déléguée à utils/attendance
    getRateClass(rate) {
      return getAttendanceRateClass(rate)
    }
    // getStatusBadgeClass/Class/Label déplacés dans AttendanceDetailModal (#28).
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
