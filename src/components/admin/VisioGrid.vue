<template>
  <div class="visio-grid">
    <div v-for="visio in visioconferences" :key="visio.id" class="visio-card">
      <div class="visio-header">
        <div class="visio-title-group">
          <VideoCameraIcon class="visio-icon" />
          <h3 class="visio-title" :title="`Matière: ${visio.matiere || 'N/A'}`">
            {{ visio.matiere || 'Matière inconnue' }}
          </h3>
        </div>
        <span
          :class="['status-badge', `status-${visio.status}`]"
          :title="`Statut: ${getStatusLabel(visio.status)}`"
        >
          {{ getStatusLabel(visio.status) }}
        </span>
      </div>

      <div class="visio-body">
        <div class="info-row" :title="`Classe: ${visio.classe || 'N/A'}`">
          <BuildingLibraryIcon class="info-icon" />
          <span class="info-text">{{ visio.classe || 'N/A' }}</span>
        </div>

        <div class="info-row" :title="`Enseignant: ${visio.enseignant || 'N/A'}`">
          <UserIcon class="info-icon" />
          <span class="info-text">{{ visio.enseignant || 'N/A' }}</span>
        </div>

        <div class="info-row" :title="`Date: ${formatDate(visio.date_debut)}`">
          <CalendarIcon class="info-icon" />
          <span class="info-text">{{ formatDate(visio.date_debut) }}</span>
        </div>

        <div class="info-row" :title="`Heure: ${formatTime(visio.date_debut)} - ${formatTime(visio.date_fin)}`">
          <ClockIcon class="info-icon" />
          <span class="info-text">
            {{ formatTime(visio.date_debut) }} - {{ formatTime(visio.date_fin) }}
          </span>
        </div>

        <div v-if="visio.participants_count" class="info-row" :title="`${visio.participants_count} participant(s)`">
          <UsersIcon class="info-icon" />
          <span class="info-text">{{ visio.participants_count }} participant(s)</span>
        </div>
      </div>

      <div class="visio-footer">
        <button
          v-if="visio.status === 'active'"
          @click="$emit('join', visio)"
          class="action-btn primary"
          title="Rejoindre la visioconférence"
        >
          <VideoCameraIcon class="w-4 h-4" />
          Rejoindre
        </button>
        <button
          @click="$emit('view', visio)"
          class="action-btn secondary"
          title="Voir les détails"
        >
          <EyeIcon class="w-4 h-4" />
          Détails
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Grille de cartes de visioconférences d'AdminVisio (#G1 ≤300). Présentation pure :
 * reçoit la liste filtrée + les helpers de statut/format en props ; émet `join` et
 * `view` (parité avec joinVisio / viewVisioDetails).
 */
import {
  VideoCameraIcon,
  CalendarIcon,
  BuildingLibraryIcon,
  UserIcon,
  ClockIcon,
  UsersIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

defineProps({
  visioconferences: { type: Array, default: () => [] },
  getStatusLabel: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  formatTime: { type: Function, required: true }
})

defineEmits(['join', 'view'])
</script>

<style scoped>
/* Visioconferences Grid */
.visio-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.visio-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.visio-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.visio-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.visio-title-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  min-width: 0;
}

.visio-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-primary);
  flex-shrink: 0;
}

.visio-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.status-active {
  background: #dcfce7;
  color: #166534;
}

.status-scheduled {
  background: #dbeafe;
  color: #1e40af;
}

.status-completed {
  background: #f3f4f6;
  color: #6b7280;
}

.visio-body {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.info-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.info-icon {
  width: 1rem;
  height: 1rem;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.info-text {
  font-size: 0.875rem;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.visio-footer {
  display: flex;
  gap: var(--spacing-sm);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-color);
}

.action-btn {
  flex: 1;
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.action-btn.primary {
  background: var(--color-primary);
  color: white;
  border: none;
}

.action-btn.primary:hover {
  background: var(--color-primary-dark);
}

.action-btn.secondary {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.action-btn.secondary:hover {
  background: var(--bg-hover);
  border-color: var(--color-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .visio-grid {
    grid-template-columns: 1fr;
  }
}
</style>
