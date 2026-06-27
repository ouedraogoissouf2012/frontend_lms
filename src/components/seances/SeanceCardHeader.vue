<template>
  <div class="seance-header">
    <div class="seance-title-section">
      <i class="fa fa-circle seance-icon"></i>
      <div>
        <h3 class="seance-title">
          {{ seance.matiere?.nom || 'Matière non définie' }}
        </h3>
        <p v-if="seance.matiere?.code" class="seance-code">
          Code: {{ seance.matiere.code }}
        </p>
      </div>
    </div>

    <!-- Badge Status Visio -->
    <div v-if="seance.visio">
      <span
        v-if="seance.visio.status === 'programmee'"
        class="status-badge status-scheduled"
      >
        <span class="badge-icon">◑</span>
        Visio Programmée
      </span>
      <span
        v-else-if="seance.visio.status === 'active'"
        class="status-badge status-active"
      >
        <span class="pulse-dot"></span>
        EN DIRECT
      </span>
      <span
        v-else-if="seance.visio.status === 'terminee'"
        class="status-badge status-finished"
      >
        <i class="fa fa-check badge-icon"></i>
        Terminée
      </span>
    </div>
  </div>
</template>

<script setup>
/**
 * En-tête d'une carte de séance (#H6 ≤300) : titre matière + code + badge de
 * statut visio. Présentation pure, extrait VERBATIM de SeanceCard.vue.
 */
defineProps({
  seance: { type: Object, required: true }
})
</script>

<style scoped>
.seance-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.seance-title-section {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.seance-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
  color: var(--blue-500);
}

.seance-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.seance-code {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0 0;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-icon {
  font-size: 1rem;
  line-height: 1;
}

.status-scheduled {
  background: var(--info-bg);
  color: var(--info-text);
}

.status-active {
  background: var(--success-bg);
  color: var(--success-text);
}

.status-finished {
  background: #f3f4f6;
  color: #4b5563;
}

.pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: currentColor;
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
