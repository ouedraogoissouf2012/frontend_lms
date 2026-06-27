<template>
  <div class="seance-actions">
    <!-- Pas de visio activée -->
    <div v-if="!seance.visio || !seance.visio.enabled" class="action-section action-none">
      <p class="action-message">Aucune visioconférence programmée</p>
      <button
        @click="$emit('activate', seance)"
        :disabled="actionLoading === seance.id"
        class="btn-action btn-primary"
      >
        <i class="fa fa-play btn-icon"></i>
        {{ actionLoading === seance.id ? 'Activation...' : 'Activer la visio' }}
      </button>
    </div>

    <!-- Visio programmée -->
    <div v-else-if="seance.visio.status === 'programmee'" class="action-section action-scheduled">
      <div class="action-info">
        <div class="action-details">
          <div class="action-content">
            <i class="fa fa-dot-circle-o action-icon-programmed"></i>
            <p class="action-subtitle-room">
              Salle: <span class="room-id">{{ seance.visio.room_id }}</span>
            </p>
            <p v-if="!isEnseignant" class="action-subtitle text-blue-700 font-medium mt-1">
              ⏳ En attente que l'enseignant démarre la séance
            </p>
          </div>
        </div>
        <div v-if="isEnseignant" class="action-buttons">
          <button
            @click="$emit('start', seance)"
            :disabled="actionLoading === seance.id"
            class="btn-action btn-primary"
          >
            <i class="fa fa-play btn-icon"></i>
            {{ actionLoading === seance.id ? 'Démarrage...' : 'Démarrer maintenant' }}
          </button>
          <button
            @click="$emit('deactivate', seance)"
            :disabled="actionLoading === seance.id"
            class="btn-action btn-secondary"
          >
            <span class="btn-icon">✕</span>
            Désactiver
          </button>
        </div>
      </div>
    </div>

    <!-- Visio active -->
    <div v-else-if="seance.visio.status === 'active'" class="action-section action-active">
      <div class="action-info">
        <div class="action-details">
          <div class="flex items-center gap-3 flex-1">
            <span class="pulse-indicator"></span>
            <div>
              <p class="action-title-active">Cours EN DIRECT</p>
              <p class="action-subtitle-active">
                Démarré à {{ formatTime(seance.visio.started_at) }}
              </p>
              <p v-if="seance.visio.participants_count > 0" class="participants-count">
                <i class="fa fa-dot-circle-o count-icon"></i>
                {{ seance.visio.participants_count }} participant(s) connecté(s)
              </p>
            </div>
          </div>
        </div>
        <div class="action-buttons">
          <button
            @click="$emit('join', seance)"
            class="btn-action btn-success"
          >
            <i class="fa fa-dot-circle-o btn-icon"></i>
            Rejoindre
          </button>
          <button
            @click="$emit('end', seance)"
            :disabled="actionLoading === seance.id"
            class="btn-action btn-danger"
          >
            <span class="btn-icon">■</span>
            {{ actionLoading === seance.id ? 'Arrêt...' : 'Terminer' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Visio terminée -->
    <div v-else-if="seance.visio.status === 'terminee'" class="action-section action-finished">
      <i class="fa fa-check action-icon"></i>
      <div>
        <p class="action-title text-gray-900">Visioconférence terminée</p>
        <p class="action-subtitle">
          {{ seance.visio.participants_count || 0 }} participant(s) ont rejoint
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Actions visio d'une carte de séance (#H6 ≤300) : les 4 états (aucune visio,
 * programmée, active, terminée). Présentation pure extraite VERBATIM de
 * SeanceCard.vue ; émet les intentions, la logique reste dans la vue parente.
 */
defineProps({
  seance: { type: Object, required: true },
  isEnseignant: { type: Boolean, default: false },
  // id de la séance dont une action est en cours (ou null)
  actionLoading: { type: [Number, String, null], default: null }
})

defineEmits(['activate', 'start', 'deactivate', 'join', 'end'])

// #23 : l'heure délègue au formatter centralisé (repli 'N/A' identique).
import { formatTime as fmtTime } from '@/utils/formatters'

function formatTime(dateTimeStr) {
  return fmtTime(dateTimeStr, { fallback: 'N/A' })
}
</script>

<style scoped lang="scss">
@use '../../assets/styles/seance-card-buttons';

/* Seance Actions */
.seance-actions {
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color);
}

.action-section {
  padding: 1.25rem;
  border-radius: 0.5rem;
}

.action-none {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: var(--bg-secondary);
}

.action-message {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.action-scheduled {
  background: var(--card-bg-dark, #1f2937);
  border: 1px solid var(--border-color);
}

.action-active {
  background: var(--card-bg-dark, #1f2937);
  border: 1px solid var(--border-color);
}

.action-title-active {
  font-size: 0.9375rem;
  font-weight: 600;
  color: white;
  margin: 0 0 0.25rem 0;
}

.action-subtitle-active {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
  margin: 0;
}

.action-finished {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
}

.action-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.action-details {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  flex: 1;
}

.action-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
  color: var(--blue-500);
}

.action-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.action-icon-programmed {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
  color: white;
}

.action-title {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.action-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.action-subtitle-room {
  font-size: 0.875rem;
  color: white;
  font-weight: 500;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.room-id {
  font-family: monospace;
  background: var(--card-bg-dark, #1f2937);
  color: white;
  padding: 0.25rem 0.625rem;
  border-radius: 0.375rem;
  font-weight: 600;
  font-size: 0.8125rem;
}

.pulse-indicator {
  width: 1.25rem;
  height: 1.25rem;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  flex-shrink: 0;
}

.participants-count {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 0.5rem;
}

.count-icon {
  font-size: 1rem;
  line-height: 1;
}

.action-buttons {
  display: flex;
  gap: 0.75rem;
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
