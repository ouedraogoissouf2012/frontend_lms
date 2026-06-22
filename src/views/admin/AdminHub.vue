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
        <HubCard
          to="/admin/classes"
          :icon="BuildingOfficeIcon"
          icon-class="classes-icon"
          title="Classes"
          description="Gérer les classes et leurs étudiants"
          :stat="stats.classes"
          stat-label="classe(s)"
          footer-text="Voir les classes"
        />

        <!-- Section Matieres -->
        <HubCard
          to="/admin/matieres"
          :icon="BookOpenIcon"
          icon-class="matieres-icon"
          title="Matières"
          description="Gérer les matières enseignées"
          :stat="stats.matieres"
          stat-label="matière(s)"
          footer-text="Voir les matières"
        />

        <!-- Section Enseignants -->
        <HubCard
          to="/admin/enseignants"
          :icon="UserGroupIcon"
          icon-class="enseignants-icon"
          title="Enseignants"
          description="Gérer les enseignants et leurs affectations"
          :stat="stats.enseignants"
          stat-label="enseignant(s)"
          footer-text="Voir les enseignants"
        />
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
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import HubCard from '@/components/admin/HubCard.vue'
import { useAdminHub } from '@/composables/useAdminHub'
import {
  BuildingOfficeIcon,
  BookOpenIcon,
  UserGroupIcon,
  CalendarIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon
} from '@heroicons/vue/24/outline'

const { loading, stats } = useAdminHub()
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
