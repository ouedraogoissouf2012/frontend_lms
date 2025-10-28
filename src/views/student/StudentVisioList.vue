<template>
  <DashboardLayout>
    <div class="visio-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mes Visioconférences</h1>
          <p class="page-subtitle">Toutes vos séances en ligne, toutes matières confondues</p>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="visio-grid">
        <SkeletonLoader type="card" v-for="i in 4" :key="i" height="200px" />
      </div>

      <!-- Error state -->
      <div v-if="error" class="error-state">
        <div class="error-icon">⚠</div>
        <div class="error-content">
          <h3 class="error-title">Erreur de chargement</h3>
          <p class="error-message">{{ error }}</p>
        </div>
        <button @click="loadVisioConferences" class="error-retry-btn">
          Réessayer
        </button>
      </div>

      <!-- Visio List -->
      <div v-if="!loading && visioConferences.length > 0">
        <!-- En cours -->
        <div v-if="visioEnCours.length > 0" class="visio-section mb-8">
          <h2 class="section-title">
            <span class="status-indicator active"></span>
            En cours maintenant
          </h2>
          <div class="visio-grid">
            <div
              v-for="visio in visioEnCours"
              :key="visio.id"
              class="visio-card active"
            >
              <div class="visio-header">
                <div class="visio-info">
                  <h3 class="visio-title">{{ getVisioTitle(visio) }}</h3>
                  <p class="visio-matiere">{{ visio.matiere?.name || visio.matiere?.nom || 'Matière inconnue' }}</p>
                </div>
                <span class="badge badge-active">
                  <span class="pulse-dot"></span>
                  En cours
                </span>
              </div>

              <div class="visio-details">
                <div class="detail-item">
                  <CalendarIcon class="detail-icon" />
                  <span>{{ formatDate(visio.date_cours) }}</span>
                </div>
                <div class="detail-item">
                  <ClockIcon class="detail-icon" />
                  <span>{{ visio.heure_debut }} - {{ visio.heure_fin }}</span>
                </div>
              </div>

              <button class="btn-join" @click="joinVisio(visio)">
                <VideoCameraIcon class="w-5 h-5" />
                <span>Rejoindre maintenant</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Prévues -->
        <div v-if="visioAPrevenir.length > 0" class="visio-section">
          <h2 class="section-title">
            <span class="status-indicator planned"></span>
            Séances prévues
          </h2>
          <div class="visio-grid">
            <div
              v-for="visio in visioAPrevenir"
              :key="visio.id"
              class="visio-card"
            >
              <div class="visio-header">
                <div class="visio-info">
                  <h3 class="visio-title">{{ getVisioTitle(visio) }}</h3>
                  <p class="visio-matiere">{{ visio.matiere?.name || visio.matiere?.nom || 'Matière inconnue' }}</p>
                </div>
                <span class="badge badge-planned">Prévue</span>
              </div>

              <div class="visio-details">
                <div class="detail-item">
                  <CalendarIcon class="detail-icon" />
                  <span>{{ formatDate(visio.date_cours) }}</span>
                </div>
                <div class="detail-item">
                  <ClockIcon class="detail-icon" />
                  <span>{{ visio.heure_debut }} - {{ visio.heure_fin }}</span>
                </div>
              </div>

              <button class="btn-info" @click="viewDetails(visio)">
                <EyeIcon class="w-5 h-5" />
                <span>Voir détails</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading" class="empty-state">
        <div class="empty-icon-wrapper">
          <VideoCameraIcon class="empty-icon" />
        </div>
        <h3 class="empty-title">Aucune visioconférence disponible</h3>
        <p class="empty-description">
          Vous n'avez pas de séances en ligne prévues pour le moment.<br>
          Vos prochaines visioconférences apparaîtront ici.
        </p>
        <div class="empty-actions">
          <button @click="loadVisioConferences" class="btn-reload">
            Actualiser
          </button>
          <router-link to="/student/dashboard" class="btn-secondary-link">
            Retour au dashboard
          </router-link>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import SkeletonLoader from '@/components/ui/SkeletonLoader.vue'
import { klassciService } from '@/services/klassci'
import {
  VideoCameraIcon,
  CalendarIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

export default {
  name: 'StudentVisioList',
  components: {
    DashboardLayout,
    SkeletonLoader,
    VideoCameraIcon,
    CalendarIcon,
    ClockIcon,
    EyeIcon
  },
  data() {
    return {
      visioConferences: [],
      loading: false,
      error: null
    }
  },
  computed: {
    visioEnCours() {
      return this.visioConferences.filter(v => this.isVisioPending(v))
    },
    visioAPrevenir() {
      return this.visioConferences.filter(v => !this.isVisioPending(v))
    }
  },
  methods: {
    async loadVisioConferences() {
      this.loading = true
      this.error = null

      try {
        console.log('[VISIO] Chargement des visioconférences...')
        this.visioConferences = await klassciService.getMyVisioConferences()
        console.log('[OK] Visioconférences chargées:', this.visioConferences)
      } catch (err) {
        console.error('[ERREUR] Erreur chargement visioconférences:', err)
        this.error = 'Impossible de charger vos visioconférences. Veuillez réessayer.'
      } finally {
        this.loading = false
      }
    },

    isVisioPending(visio) {
      const now = new Date()
      const visioDate = new Date(visio.date_cours + ' ' + visio.heure_debut)
      const visioEndDate = new Date(visio.date_cours + ' ' + visio.heure_fin)
      return now >= visioDate && now <= visioEndDate
    },

    getVisioTitle(visio) {
      return visio.titre || visio.nom || visio.libelle || 'Séance'
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    joinVisio(visio) {
      this.$router.push({
        name: 'seance-details',
        params: { id: visio.id }
      })
    },

    viewDetails(visio) {
      this.$router.push({
        name: 'seance-details',
        params: { id: visio.id }
      })
    }
  },
  mounted() {
    this.loadVisioConferences()
  }
}
</script>

<style scoped>
.visio-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.visio-section {
  margin-bottom: 2rem;
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

.status-indicator {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
}

.status-indicator.active {
  background: #22c55e;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
}

.status-indicator.planned {
  background: #3b82f6;
}

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
}

.visio-card.active {
  border: 2px solid #22c55e;
}

.visio-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-2px);
}

.visio-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
}

.visio-info {
  flex: 1;
}

.visio-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.visio-matiere {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.badge {
  padding: 0.375rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-active {
  background: #dcfce7;
  color: #15803d;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.badge-planned {
  background: #dbeafe;
  color: #1e40af;
}

.pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.visio-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.detail-icon {
  width: 1.25rem;
  height: 1.25rem;
}

.btn-join, .btn-info {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-join {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
}

.btn-join:hover {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  transform: scale(1.02);
}

.btn-info {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-info:hover {
  background: var(--bg-tertiary);
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.empty-icon-wrapper {
  display: inline-flex;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.empty-icon {
  width: 3rem;
  height: 3rem;
  color: var(--text-tertiary);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.empty-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-reload, .btn-secondary-link {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
  text-decoration: none;
  display: inline-block;
}

.btn-reload {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-reload:hover {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-2px);
}

.btn-secondary-link {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-secondary-link:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
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
}

.error-retry-btn {
  padding: 0.75rem 1.5rem;
  background: #DC2626;
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.error-retry-btn:hover {
  background: #B91C1C;
  transform: scale(1.02);
}

@media (max-width: 768px) {
  .visio-grid {
    grid-template-columns: 1fr;
  }

  .error-state {
    flex-direction: column;
    text-align: center;
  }

  .error-retry-btn {
    width: 100%;
  }
}
</style>
