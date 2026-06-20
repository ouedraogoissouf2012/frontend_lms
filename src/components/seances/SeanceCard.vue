<template>
  <div class="seance-card">
    <!-- Header Séance -->
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

    <!-- Infos Séance -->
    <div class="seance-info-grid">
      <div class="info-item">
        <span class="info-icon">◷</span>
        <div>
          <p class="info-label">Date</p>
          <p class="info-value">{{ formatDate(seance.programmation?.date) }}</p>
        </div>
      </div>

      <div class="info-item">
        <i class="fa fa-clock-o info-icon"></i>
        <div>
          <p class="info-label">Horaire</p>
          <p class="info-value">
            {{ formatTime(seance.programmation?.heure_debut) }} - {{ formatTime(seance.programmation?.heure_fin) }}
          </p>
        </div>
      </div>

      <div class="info-item">
        <i class="fa fa-building info-icon"></i>
        <div>
          <p class="info-label">Classe</p>
          <p class="info-value">{{ seance.classe?.nom || 'N/A' }}</p>
        </div>
      </div>

      <div class="info-item">
        <i class="fa fa-diamond info-icon"></i>
        <div>
          <p class="info-label">Salle</p>
          <p class="info-value">{{ seance.salle || 'N/A' }}</p>
        </div>
      </div>
    </div>

    <!-- Actions Visio -->
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
  </div>
</template>

<script setup>
/**
 * Carte d'une séance enseignant (#28, tranche 2).
 * Sous-composant de présentation extrait de TeacherSeances.vue.
 * Émet les intentions d'action visio ; la logique (services, participation,
 * lien Jitsi) reste dans la vue parente.
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

// formatDate gardé local : format « ven. 19 juin 2026 » (weekday court + jour
// numérique) sans équivalent canonique strict (#23 — pas de convergence forcée).
function formatDate(dateStr) {
  if (!dateStr) return 'N/A'
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

function formatTime(dateTimeStr) {
  return fmtTime(dateTimeStr, { fallback: 'N/A' })
}
</script>

<style scoped>
.seance-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.seance-card:hover {
  box-shadow: var(--card-shadow-hover);
}

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
  color: #3b82f6;
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
  background: #dbeafe;
  color: #1e40af;
}

.status-active {
  background: #dcfce7;
  color: #166534;
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

/* Seance Info Grid */
.seance-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.info-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}

.info-icon {
  font-size: 1.25rem;
  line-height: 1;
  color: var(--text-secondary);
  flex-shrink: 0;
  margin-top: 0.125rem;
}

.info-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.info-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

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
  color: #3b82f6;
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

/* Action Buttons */
.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  text-decoration: none;
}

.btn-icon {
  font-size: 1.125rem;
  line-height: 1;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-success {
  background: #22c55e;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #16a34a;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #dc2626;
}

.btn-secondary {
  background: var(--bg-secondary);
  color: var(--text-secondary);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--bg-hover);
  color: var(--text-primary);
}
</style>
