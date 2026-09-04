<template>
  <div class="seances-grid">
    <div v-for="seance in seances" :key="seance.id" class="seance-card">
      <div class="seance-header">
        <div class="seance-title-group">
          <VideoCameraIcon class="seance-icon" />
          <h3 class="seance-title" :title="`Séance: ${seance.matiere?.nom || 'N/A'}`">
            {{ seance.matiere?.nom || 'Matière inconnue' }}
          </h3>
        </div>
        <span
          :class="['status-badge', `status-${getSeanceStatus(seance)}`]"
          :title="`Statut: ${getSeanceStatusLabel(seance)}`"
        >
          {{ getSeanceStatusLabel(seance) }}
        </span>
      </div>

      <div class="seance-body">
        <div class="info-row" :title="`Classe: ${seance.classe?.name || 'N/A'}`">
          <BuildingLibraryIcon class="info-icon" />
          <span class="info-text">{{ seance.classe?.name || 'N/A' }}</span>
        </div>

        <div class="info-row" :title="`Enseignant: ${seance.enseignant?.nom || 'N/A'} ${seance.enseignant?.prenom || ''}`">
          <UserIcon class="info-icon" />
          <span class="info-text">
            {{ seance.enseignant?.nom || 'N/A' }} {{ seance.enseignant?.prenom || '' }}
          </span>
        </div>

        <div class="info-row" :title="`Date: ${formatDate(seance.date_debut)}`">
          <CalendarIcon class="info-icon" />
          <span class="info-text">{{ formatDate(seance.date_debut) }}</span>
        </div>

        <div class="info-row" :title="`Heure: ${formatTime(seance.date_debut)} - ${formatTime(seance.date_fin)}`">
          <ClockIcon class="info-icon" />
          <span class="info-text">
            {{ formatTime(seance.date_debut) }} - {{ formatTime(seance.date_fin) }}
          </span>
        </div>
      </div>

      <div class="seance-footer">
        <button
          v-if="seance.visio_enabled"
          @click="$emit('view-details', seance)"
          class="action-btn primary"
          title="Voir les détails de la séance"
        >
          <EyeIcon class="w-4 h-4" />
          Détails
        </button>
        <button
          v-else
          @click="$emit('enable-visio', seance)"
          class="action-btn secondary"
          title="Activer la visioconférence"
        >
          <VideoCameraIcon class="w-4 h-4" />
          Activer Visio
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { formatDateLong, formatTime as fmtTime } from '@/utils/formatters'
/**
 * Grille des cartes de séances d'AdminSeances (#G1 ≤300). Présentation pure :
 * reçoit la liste `seances` en prop, calcule le statut/les libellés et formate
 * date/heure pour l'affichage, et émet `view-details` / `enable-visio`.
 */
import {
  CalendarIcon,
  VideoCameraIcon,
  BuildingLibraryIcon,
  UserIcon,
  ClockIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

defineProps({
  seances: { type: Array, default: () => [] },
})

defineEmits(['view-details', 'enable-visio'])

function getSeanceStatus(seance) {
  const now = new Date()
  const debut = new Date(seance.date_debut)
  const fin = new Date(seance.date_fin)

  if (now >= debut && now <= fin) return 'active'
  if (now < debut) return 'scheduled'
  return 'completed'
}

function getSeanceStatusLabel(seance) {
  const status = getSeanceStatus(seance)
  const labels = {
    active: 'En cours',
    scheduled: 'Planifiée',
    completed: 'Terminée'
  }
  return labels[status] || 'Inconnu'
}

// #283 : délèguent aux formatters canoniques (replis locaux conservés).
function formatDate(dateString) {
  return formatDateLong(dateString, { fallback: 'N/A' })
}

function formatTime(dateString) {
  return fmtTime(dateString, { fallback: 'N/A' })
}
</script>

<style scoped>
/* Seances Grid */
.seances-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.seance-card {
  background: var(--card-bg);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  box-shadow: var(--shadow-sm);
  transition: all 0.2s;
}

.seance-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.seance-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-md);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-color);
}

.seance-title-group {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex: 1;
  min-width: 0;
}

.seance-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--color-primary);
  flex-shrink: 0;
}

.seance-title {
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
  background: var(--success-bg);
  color: var(--success-text);
}

.status-scheduled {
  background: var(--info-bg);
  color: var(--info-text);
}

.status-completed {
  background: var(--gray-100);
  color: var(--gray-500);
}

.seance-body {
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

.seance-footer {
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
  .seances-grid {
    grid-template-columns: 1fr;
  }
}
</style>
