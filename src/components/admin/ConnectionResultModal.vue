<template>
  <Modal
    :model-value="Boolean(connectionResult)"
    title="Test de Connexion KLASSCI"
    size="sm"
    class="connection-result-modal"
    @update:model-value="handleModelUpdate"
  >
    <div v-if="connectionResult" :class="['connection-status', connectionResult.success ? 'connection-success' : 'connection-error']">
      <i :class="connectionResult.success ? 'fa fa-check-circle' : 'fa fa-times-circle'" class="connection-icon"></i>
      <p class="connection-message">{{ connectionResult.message }}</p>
      <div v-if="connectionResult.data" class="connection-details">
        <div class="detail-item">
          <span class="detail-label">URL :</span>
          <span class="detail-value">{{ connectionResult.data.api_url }}</span>
        </div>
        <div v-if="connectionResult.data.status_code" class="detail-item">
          <span class="detail-label">Status :</span>
          <span class="detail-value">{{ connectionResult.data.status_code }}</span>
        </div>
        <div v-if="connectionResult.data.response_time_ms" class="detail-item">
          <span class="detail-label">Temps :</span>
          <span class="detail-value">{{ connectionResult.data.response_time_ms }}ms</span>
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="secondary" class="modal-btn modal-btn-secondary" @click="handleClose">
        Fermer
      </BaseButton>
    </template>
  </Modal>
</template>

<script setup>
/**
 * Modale de résultat de test de connexion KLASSCI (#G1 décompo). Affiche succès/échec
 * et les détails de la réponse. Fermeture remontée par l'event close.
 */
import Modal from '@/components/ui/Modal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  connectionResult: { type: Object, default: null }
})
const emit = defineEmits(['close'])

function handleClose() {
  emit('close')
}

function handleModelUpdate(value) {
  if (!value) handleClose()
}
</script>

<style scoped lang="scss">
@use '../../assets/styles/admin-modal';
@use '../../assets/styles/institution-modal';

/* Connection Result */
.connection-status {
  text-align: center;
  padding: var(--spacing-xl);
}
.connection-icon {
  font-size: 3rem;
  margin-bottom: var(--spacing-md);
}
.connection-success .connection-icon {
  color: var(--emerald-500);
}
.connection-error .connection-icon {
  color: var(--red-500);
}
.connection-message {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 var(--spacing-lg) 0;
}
.connection-details {
  text-align: left;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-md);
}
.detail-item {
  display: flex;
  justify-content: space-between;
  padding: var(--spacing-xs) 0;
  font-size: var(--font-size-sm);
}
.detail-item + .detail-item {
  border-top: 1px solid var(--border-color);
}
.detail-label {
  color: var(--text-secondary);
  font-weight: 500;
}
.detail-value {
  color: var(--text-primary);
  font-family: monospace;
  word-break: break-all;
}

@media (max-width: 768px) {
  .connection-result-modal {
    margin: var(--spacing-md);
  }
}
</style>
