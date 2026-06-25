<template>
  <div class="widget-card mb-6">
    <div class="widget-header">
      <DocumentTextIcon class="widget-icon text-purple-600" />
      <h2 class="widget-title">Actions Rapides</h2>
    </div>
    <div class="quick-actions-grid">
      <QuickActionButton
        label="Gérer Séances & Visio"
        :icon="CalendarIcon"
        variant="primary"
        @click="emit('navigate', '/coordinateur/seances')"
      />
      <QuickActionButton
        label="Voir Classes"
        :icon="BuildingLibraryIcon"
        variant="success"
        @click="emit('navigate', '/admin/classes')"
      />
      <QuickActionButton
        label="Voir Matières"
        :icon="BookOpenIcon"
        variant="warning"
        @click="emit('navigate', '/admin/matieres')"
      />
      <QuickActionButton
        label="Voir Statistiques"
        :icon="ChartBarIcon"
        variant="secondary"
        @click="emit('navigate', '/admin/stats')"
      />
      <QuickActionButton
        label="Générer Rapport"
        :icon="DocumentArrowDownIcon"
        variant="danger"
        @click="emit('generate-report')"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * Widget actions rapides d'AdminDashboard (#H3 ≤300). Présentation pure : émet
 * 'navigate' (avec le chemin) et 'generate-report' ; le parent câble la logique.
 */
import QuickActionButton from '@/components/ui/QuickActionButton.vue'
import {
  BuildingLibraryIcon,
  BookOpenIcon,
  DocumentTextIcon,
  CalendarIcon,
  ChartBarIcon,
  DocumentArrowDownIcon
} from '@heroicons/vue/24/outline'

const emit = defineEmits(['navigate', 'generate-report'])
</script>

<style scoped>
/* Widget card */
.widget-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.widget-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

.widget-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.widget-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
  flex: 1;
}

/* Quick Actions Grid */
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

@media (max-width: 768px) {
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .quick-actions-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
