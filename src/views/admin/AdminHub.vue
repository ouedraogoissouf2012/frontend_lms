<template>
  <DashboardLayout>
    <div class="hub-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Espace Administration</h1>
          <p class="page-subtitle">Gérez les classes, matières et enseignants</p>
        </div>
      </div>

      <!-- Loading state -->
      <ContentLoader v-if="loading" text="Chargement..." />

      <!-- Hub Grid -->
      <div v-else class="hub-grid">
        <!-- Section Classes -->
        <router-link to="/admin/classes" class="hub-card">
          <div class="card-icon classes-icon">
            <BuildingOfficeIcon class="icon" />
          </div>
          <div class="card-content">
            <h2 class="card-title">Classes</h2>
            <p class="card-description">Gérer les classes et leurs étudiants</p>
            <div class="card-stat">
              <span class="stat-number">{{ stats.classes }}</span>
              <span class="stat-label">classe(s)</span>
            </div>
          </div>
          <div class="card-footer">
            <span>Voir les classes</span>
            <ArrowRightIcon class="arrow-icon" />
          </div>
        </router-link>

        <!-- Section Matieres -->
        <router-link to="/admin/matieres" class="hub-card">
          <div class="card-icon matieres-icon">
            <BookOpenIcon class="icon" />
          </div>
          <div class="card-content">
            <h2 class="card-title">Matières</h2>
            <p class="card-description">Gérer les matières enseignées</p>
            <div class="card-stat">
              <span class="stat-number">{{ stats.matieres }}</span>
              <span class="stat-label">matière(s)</span>
            </div>
          </div>
          <div class="card-footer">
            <span>Voir les matières</span>
            <ArrowRightIcon class="arrow-icon" />
          </div>
        </router-link>

        <!-- Section Enseignants -->
        <router-link to="/admin/enseignants" class="hub-card">
          <div class="card-icon enseignants-icon">
            <UserGroupIcon class="icon" />
          </div>
          <div class="card-content">
            <h2 class="card-title">Enseignants</h2>
            <p class="card-description">Gérer les enseignants et leurs affectations</p>
            <div class="card-stat">
              <span class="stat-number">{{ stats.enseignants }}</span>
              <span class="stat-label">enseignant(s)</span>
            </div>
          </div>
          <div class="card-footer">
            <span>Voir les enseignants</span>
            <ArrowRightIcon class="arrow-icon" />
          </div>
        </router-link>
      </div>

      <!-- Quick Stats -->
      <div v-if="!loading" class="quick-stats">
        <h3 class="section-title">Aperçu rapide</h3>
        <div class="stats-grid">
          <div class="stat-card">
            <UsersIcon class="stat-icon text-blue-500" />
            <div>
              <p class="stat-value">{{ stats.etudiants }}</p>
              <p class="stat-label">Étudiants total</p>
            </div>
          </div>
          <div class="stat-card">
            <CalendarIcon class="stat-icon text-orange-500" />
            <div>
              <p class="stat-value">{{ stats.seances }}</p>
              <p class="stat-label">Séances programmées</p>
            </div>
          </div>
          <div class="stat-card">
            <ClipboardDocumentCheckIcon class="stat-icon text-green-500" />
            <div>
              <p class="stat-value">{{ stats.evaluations }}</p>
              <p class="stat-label">Évaluations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import { klassciService } from '@/services/klassci'
import {
  BuildingOfficeIcon,
  BookOpenIcon,
  UserGroupIcon,
  ArrowRightIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon
} from '@heroicons/vue/24/outline'

const loading = ref(true)
const stats = ref({
  classes: 0,
  matieres: 0,
  enseignants: 0,
  etudiants: 0,
  seances: 0,
  evaluations: 0
})

async function loadStats() {
  loading.value = true

  try {
    // Charger les données en parallèle
    const [classes, matieres, enseignants, dashboard] = await Promise.all([
      klassciService.getClasses().catch(() => []),
      klassciService.getMatieres().catch(() => []),
      klassciService.getEnseignants().catch(() => []),
      klassciService.getAdminDashboard().catch(() => ({}))
    ])

    // Compter les classes
    stats.value.classes = Array.isArray(classes) ? classes.length : 0

    // Compter les matières
    stats.value.matieres = Array.isArray(matieres) ? matieres.length : 0

    // Compter les enseignants
    stats.value.enseignants = Array.isArray(enseignants) ? enseignants.length : 0

    // Stats depuis le dashboard
    stats.value.etudiants = dashboard?.total_etudiants || dashboard?.nb_etudiants || 0
    stats.value.seances = dashboard?.total_seances || dashboard?.nb_seances || 0
    stats.value.evaluations = dashboard?.total_evaluations || dashboard?.nb_evaluations || 0

    console.log('[ADMIN HUB] Stats chargées:', stats.value)
  } catch (error) {
    console.error('[ADMIN HUB] Erreur chargement stats:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadStats()
})
</script>

<style scoped>
.hub-container {
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

/* Hub Grid - 3 colonnes */
.hub-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

/* Hub Card */
.hub-card {
  background: var(--card-bg);
  border-radius: 1rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  text-decoration: none;
  cursor: pointer;
}

.hub-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 16px 32px rgba(0, 0, 0, 0.18);
  border-color: var(--primary-color, #3b82f6);
}

.hub-card:hover .card-footer {
  background: var(--primary-color, #3b82f6);
  color: white;
}

.hub-card:hover .arrow-icon {
  transform: translateX(4px);
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
}

.card-icon .icon {
  width: 32px;
  height: 32px;
  color: white;
}

.classes-icon {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.matieres-icon {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.enseignants-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.card-content {
  flex: 1;
}

.card-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.card-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.card-stat {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.stat-number {
  font-size: 2.5rem;
  font-weight: 800;
  color: var(--text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.875rem 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  color: var(--primary-color, #3b82f6);
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  margin-top: auto;
}

.card-footer .arrow-icon {
  width: 1.25rem;
  height: 1.25rem;
  transition: transform 0.2s ease;
}

/* Quick Stats Section */
.quick-stats {
  margin-top: 1rem;
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  padding: 1.25rem;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: var(--card-shadow);
}

.stat-icon {
  width: 2.5rem;
  height: 2.5rem;
  flex-shrink: 0;
}

.stat-card .stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.stat-card .stat-label {
  font-size: 0.8125rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .hub-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .hub-grid {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .page-title {
    font-size: 1.5rem;
  }
}

/* Text color utilities */
.text-blue-500 {
  color: #3b82f6;
}

.text-orange-500 {
  color: #f59e0b;
}

.text-green-500 {
  color: #10b981;
}
</style>
