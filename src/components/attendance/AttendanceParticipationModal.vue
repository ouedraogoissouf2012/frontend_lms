<template>
  <div v-if="attendance" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h3 class="modal-title">Détails de la Participation</h3>
        <button @click="$emit('close')" class="btn-close">✕</button>
      </div>

      <div class="modal-body">
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">Participant</span>
            <span class="detail-value">{{ attendance.user.name }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Email</span>
            <span class="detail-value">{{ attendance.user.email }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Séance ID</span>
            <span class="detail-value">#{{ attendance.seance.klassci_seance_id }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Date Séance</span>
            <span class="detail-value">{{ formatDate(attendance.seance.date) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Heure de Connexion</span>
            <span class="detail-value">{{ formatDateTime(attendance.joined_at) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Dernier Heartbeat</span>
            <span class="detail-value">
              {{ attendance.last_seen_at ? formatDateTime(attendance.last_seen_at) : 'Aucun' }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Heure de Déconnexion</span>
            <span class="detail-value">
              {{ attendance.left_at ? formatDateTime(attendance.left_at) : 'En cours' }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Durée Totale</span>
            <span class="detail-value">
              {{ attendance.duration_minutes ? `${attendance.duration_minutes} minutes` : 'En cours' }}
            </span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Statut</span>
            <span :class="['detail-value', attendance.status === 'connected' ? 'text-green' : 'text-red']">
              {{ attendance.status === 'connected' ? 'fa-circle Connecté' : 'fa-circle Déconnecté' }}
            </span>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button @click="$emit('close')" class="btn-secondary">Fermer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Modale « Détails de la Participation » de l'historique des présences (H7) —
 * sous-composant présentationnel extrait d'AttendanceHistory.vue (distinct de
 * AttendanceDetailModal, qui liste les présences d'une séance). Reçoit la
 * participation sélectionnée + les formateurs date/heure LOCAUX du parent
 * (parité, #H7) ; émet close.
 */
defineProps({
  attendance: { type: Object, default: null },
  formatDate: { type: Function, required: true },
  formatDateTime: { type: Function, required: true }
})

defineEmits(['close'])
</script>

<style scoped>
/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 12px;
  box-shadow: 0 20px 25px rgba(0, 0, 0, 0.15);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.btn-close {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0;
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  transition: all 0.2s;
}

.btn-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.detail-grid {
  display: grid;
  gap: 1rem;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 8px;
}

.detail-label {
  font-weight: 500;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.detail-value {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
  text-align: right;
}

.text-green {
  color: var(--emerald-500);
}

.text-red {
  color: var(--red-500);
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: flex-end;
}

.btn-secondary {
  padding: 0.625rem 1.5rem;
  background: #6b7280;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: #4b5563;
}
</style>
