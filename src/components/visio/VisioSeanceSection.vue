<template>
  <div class="visio-section">
    <h2 class="section-title">
      <span v-if="variant === 'active'" class="pulse-indicator-large"></span>
      <ClockIcon v-else class="section-icon text-blue-600" />
      {{ title }}
    </h2>
    <div class="visio-grid">
      <VisioSeanceCard
        v-for="seance in seances"
        :key="seance.id"
        :seance="seance"
        :variant="variant"
        :action-loading="actionLoading"
        :build-jitsi-url="buildJitsiUrl"
        :format-date="formatDate"
        :format-time="formatTime"
        @start="$emit('start', $event)"
        @end="$emit('end', $event)"
        @activate="$emit('activate', $event)"
      />
    </div>
  </div>
</template>

<script setup>
/**
 * Section de séances visio de TeacherVisioList (#G1 ≤300) : titre (indicateur
 * « en direct » pour la variante active, sinon icône horloge) + grille de cartes.
 * Présentation pure ; relaie les événements start / end / activate des cartes.
 */
import { ClockIcon } from '@heroicons/vue/24/outline'
import VisioSeanceCard from '@/components/visio/VisioSeanceCard.vue'

defineProps({
  title: { type: String, required: true },
  variant: { type: String, default: 'scheduled' },
  seances: { type: Array, default: () => [] },
  actionLoading: { type: [String, Number, null], default: null },
  buildJitsiUrl: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  formatTime: { type: Function, required: true }
})

defineEmits(['start', 'end', 'activate'])
</script>

<style scoped>
/* Visio Sections */
.visio-section {
  margin-bottom: 2.5rem;
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

.section-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.pulse-indicator-large {
  width: 1rem;
  height: 1rem;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  box-shadow: 0 0 0 4px rgba(34, 197, 94, 0.2);
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Visio Grid */
.visio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* Responsive */
@media (max-width: 768px) {
  .visio-grid {
    grid-template-columns: 1fr;
  }
}
</style>
