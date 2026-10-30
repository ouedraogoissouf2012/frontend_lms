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

      <!-- #238 : chargement partiel (chiffres incomplets) — distinct d'un état vide -->
      <div v-if="!loading && error" class="hub-error" role="alert">
        {{ error }}
      </div>

      <!-- Hub Grid -->
      <div v-if="!loading" class="hub-grid">
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
          <div v-for="carte in apercu" :key="carte.label" class="stat-card">
            <component :is="carte.icon" :class="['stat-icon', carte.iconClass]" />
            <div>
              <!-- Non mesuré : « — » à l'œil, « non disponible » au lecteur d'écran. -->
              <p class="stat-value">
                <span :aria-hidden="carte.valeur === null ? 'true' : null">{{ formatCount(carte.valeur) }}</span>
                <span v-if="carte.valeur === null" class="sr-only">non disponible</span>
              </p>
              <p class="stat-label">{{ carte.label }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { computed } from 'vue'
import { formatCount } from '@/utils/formatters'
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

const { loading, error, stats } = useAdminHub()

// `null` = NON MESURÉ (useAdminHub) : formatCount le rend « — », jamais 0.
const apercu = computed(() => [
  { label: 'Étudiants total', icon: UsersIcon, iconClass: 'text-blue-500', valeur: stats.value.etudiants },
  { label: 'Séances programmées', icon: CalendarIcon, iconClass: 'text-orange-500', valeur: stats.value.seances },
  { label: 'Évaluations', icon: ClipboardDocumentCheckIcon, iconClass: 'text-green-500', valeur: stats.value.evaluations },
])
</script>

<style scoped>
.hub-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

/* #238 : bannière de chargement partiel (distincte d'un état vide) */
.hub-error {
  margin-bottom: 1.5rem;
  padding: 0.75rem 1rem;
  background: var(--error-bg);
  color: var(--red-600);
  border-radius: 0.5rem;
  font-weight: 600;
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
  color: var(--blue-500);
}

.text-orange-500 {
  color: var(--amber-500);
}

.text-green-500 {
  color: var(--emerald-500);
}
</style>
