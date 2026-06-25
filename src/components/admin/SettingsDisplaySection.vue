<template>
  <div class="settings-section">
    <div class="section-header">
      <AdjustmentsHorizontalIcon class="section-icon" />
      <h2 class="section-title">Préférences d'affichage</h2>
    </div>
    <div class="section-body">
      <div class="preference-item">
        <div class="preference-info">
          <label class="preference-label">Thème</label>
          <p class="preference-description">Choisir entre le mode clair et sombre</p>
        </div>
        <div class="preference-control">
          <ThemeToggle />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Section « Préférences d'affichage » d'AdminSettings (#H3 ≤300). Présentation
 * pure : bascule de thème (ThemeToggle, autonome). Aucune donnée ni appel API.
 */
import { AdjustmentsHorizontalIcon } from '@heroicons/vue/24/outline'
import ThemeToggle from '@/components/ui/ThemeToggle.vue'
</script>

<style scoped>
.settings-section {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.section-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--text-secondary);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.section-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Preferences */
.preference-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.preference-info {
  flex: 1;
}

.preference-label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  display: block;
  margin-bottom: 0.25rem;
}

.preference-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.preference-control {
  margin-left: 1rem;
}

@media (max-width: 768px) {
  .preference-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 1rem;
  }

  .preference-control {
    margin-left: 0;
  }
}
</style>
