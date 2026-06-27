<template>
  <div class="visio-card" :class="{ 'active-card': variant === 'active' }">
    <div class="card-header">
      <div class="card-info">
        <h3 class="card-title">{{ seance.matiere?.nom || 'Matière' }}</h3>
        <p v-if="seance.matiere?.code" class="card-subtitle">
          Code: {{ seance.matiere.code }}
        </p>
      </div>
      <span v-if="variant === 'active'" class="badge badge-active">
        <span class="pulse-dot"></span>
        EN DIRECT
      </span>
      <span v-else class="badge badge-scheduled">
        <ClockIcon class="w-4 h-4" />
        Programmée
      </span>
    </div>

    <div class="card-details">
      <div class="detail-row">
        <CalendarIcon class="detail-icon" />
        <span>{{ formatDate(seance.programmation?.date) }}</span>
      </div>
      <div class="detail-row">
        <ClockIcon class="detail-icon" />
        <span>
          {{ formatTime(seance.programmation?.heure_debut) }} -
          {{ formatTime(seance.programmation?.heure_fin) }}
        </span>
      </div>
      <div class="detail-row">
        <UserGroupIcon class="detail-icon" />
        <span>{{ seance.classe?.nom || 'N/A' }}</span>
      </div>
    </div>

    <!-- Actions : variante "en cours" -->
    <div v-if="variant === 'active'" class="card-actions">
      <a
        v-if="seance.visio?.room_id"
        :href="buildJitsiUrl(seance.visio.room_id)"
        target="_blank"
        class="btn-action btn-join"
      >
        <VideoCameraIcon class="w-5 h-5" />
        Rejoindre maintenant
      </a>
      <button
        @click="$emit('end', seance)"
        class="btn-action btn-end"
      >
        <StopIcon class="w-5 h-5" />
        Terminer
      </button>
    </div>

    <!-- Actions : variante "à venir" -->
    <div v-else class="card-actions">
      <button
        v-if="seance.visio_enabled && !seance.visio_active"
        @click="$emit('start', seance)"
        class="btn-action btn-start"
        :disabled="actionLoading === seance.id"
      >
        <PlayIcon class="w-5 h-5" />
        {{ actionLoading === seance.id ? 'Démarrage...' : 'Démarrer la visio' }}
      </button>
      <button
        v-else-if="seance.visio_active"
        @click="$emit('end', seance)"
        class="btn-action btn-end"
        :disabled="actionLoading === seance.id"
      >
        <StopIcon class="w-5 h-5" />
        {{ actionLoading === seance.id ? 'Arrêt...' : 'Terminer' }}
      </button>
      <button
        v-else-if="!seance.visio_enabled"
        @click="$emit('activate', seance)"
        class="btn-action btn-activate"
        :disabled="actionLoading === seance.id"
      >
        <VideoCameraIcon class="w-5 h-5" />
        {{ actionLoading === seance.id ? 'Activation...' : 'Activer la visio' }}
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte d'une séance avec visio (#G1 ≤300). Présentation pure : en-tête (matière /
 * badge), détails (date / horaire / classe) et actions selon `variant` :
 *  - 'active'  → bouton « Rejoindre » (lien Jitsi) + « Terminer ».
 *  - 'scheduled' (défaut) → « Démarrer » / « Terminer » / « Activer » selon l'état
 *    plat de la séance (visio_enabled / visio_active).
 * Émet start / end / activate avec la séance ; la logique vit dans le composable.
 */
import {
  VideoCameraIcon,
  CalendarIcon,
  ClockIcon,
  UserGroupIcon,
  PlayIcon,
  StopIcon
} from '@heroicons/vue/24/outline'

defineProps({
  seance: { type: Object, required: true },
  variant: { type: String, default: 'scheduled' },
  actionLoading: { type: [String, Number, null], default: null },
  buildJitsiUrl: { type: Function, required: true },
  formatDate: { type: Function, required: true },
  formatTime: { type: Function, required: true }
})

defineEmits(['start', 'end', 'activate'])
</script>

<style scoped>
.visio-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
  border: 2px solid transparent;
}

.visio-card:hover {
  box-shadow: var(--card-shadow-hover);
  transform: translateY(-2px);
}

.active-card {
  border-color: #22c55e;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.05) 0%, transparent 100%);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.card-info {
  flex: 1;
}

.card-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.card-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge-active {
  background: var(--success-bg);
  color: var(--success-text);
}

.badge-scheduled {
  background: var(--info-bg);
  color: var(--info-text);
}

.pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: #22c55e;
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

.card-details {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.detail-icon {
  width: 1.25rem;
  height: 1.25rem;
  flex-shrink: 0;
}

.card-actions {
  display: flex;
  gap: 0.75rem;
}

.btn-action {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
}

.btn-join {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
  color: white;
}

.btn-join:hover {
  background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
  transform: scale(1.02);
}

.btn-start {
  background: var(--blue-500);
  color: white;
}

.btn-start:hover {
  background: var(--color-info-strong);
}

.btn-activate {
  background: var(--amber-500);
  color: white;
}

.btn-activate:hover {
  background: var(--amber-600);
}

.btn-end {
  background: var(--red-500);
  color: white;
}

.btn-end:hover {
  background: var(--red-600);
}

/* Responsive */
@media (max-width: 768px) {
  .card-actions {
    flex-direction: column;
  }

  .btn-action {
    width: 100%;
  }
}
</style>
