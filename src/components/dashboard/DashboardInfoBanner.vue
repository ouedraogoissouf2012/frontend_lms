<template>
  <div class="info-banner">
    <CalendarIcon class="info-icon" />
    <p class="info-text">
      Année universitaire courante : <strong>{{ annee?.nom || 'Non définie' }}</strong>
    </p>
  </div>
</template>

<script setup>
/** Bannière année universitaire d'AdminDashboard (#H3 ≤300). Présentation pure. */
import { CalendarIcon } from '@heroicons/vue/24/outline'

defineProps({
  annee: { type: Object, default: null },
})
</script>

<style scoped>
/* Info banner */
.info-banner {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  background: var(--info-bg);
  border-radius: 0.75rem;
}

.info-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--info-text);
}

.info-text {
  font-size: 0.875rem;
  color: var(--info-text);
  margin: 0;
}
</style>
