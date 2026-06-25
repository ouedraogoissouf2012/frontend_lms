<template>
  <div class="widget-card mb-6">
    <div class="widget-header">
      <ChartBarIcon class="widget-icon text-indigo-600" />
      <h2 class="widget-title">Activité des 30 derniers jours</h2>
    </div>
    <ActivityChart :data="data" :height="300" />
  </div>
</template>

<script setup>
/** Widget graphe d'activité (30 jours) d'AdminDashboard (#H3 ≤300). */
import ActivityChart from '@/components/charts/ActivityChart.vue'
import { ChartBarIcon } from '@heroicons/vue/24/outline'

defineProps({
  data: { type: Object, default: null },
})
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
</style>
