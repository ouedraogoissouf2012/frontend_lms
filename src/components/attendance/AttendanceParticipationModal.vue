<template>
  <Modal
    :model-value="Boolean(attendance)"
    title="Détails de la Participation"
    size="lg"
    @close="$emit('close')"
  >
    <div v-if="attendance" class="detail-grid">
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

    <template #footer>
      <BaseButton variant="secondary" class="btn-secondary" @click="$emit('close')">
        Fermer
      </BaseButton>
    </template>
  </Modal>
</template>

<script setup>
/**
 * Modale « Détails de la Participation » de l'historique des présences (H7) —
 * sous-composant présentationnel extrait d'AttendanceHistory.vue (distinct de
 * AttendanceDetailModal, qui liste les présences d'une séance). Reçoit la
 * participation sélectionnée + les formateurs date/heure LOCAUX du parent
 * (parité, #H7) ; émet close.
 */
import Modal from '@/components/ui/Modal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  attendance: { type: Object, default: null },
  formatDate: { type: Function, required: true },
  formatDateTime: { type: Function, required: true }
})

defineEmits(['close'])
</script>

<style scoped>
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

.btn-secondary {
  padding: 0.625rem 1.5rem;
  background: var(--gray-500);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background: var(--gray-600);
}
</style>
