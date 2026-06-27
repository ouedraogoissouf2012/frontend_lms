<template>
      <!-- Connection Test Result Modal -->
      <Teleport to="body">
        <div v-if="connectionResult" class="modal-overlay" @click="$emit('close')">
          <div class="modal-content modal-sm" @click.stop>
            <div class="modal-header">
              <h2 class="modal-title">Test de Connexion KLASSCI</h2>
              <button @click="$emit('close')" class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
              <div :class="['connection-status', connectionResult.success ? 'connection-success' : 'connection-error']">
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
            </div>
            <div class="modal-footer">
              <button @click="$emit('close')" class="modal-btn modal-btn-secondary">Fermer</button>
            </div>
          </div>
        </div>
      </Teleport>
</template>

<script setup>
/**
 * Modale de résultat de test de connexion KLASSCI (#G1 décompo). Affiche succès/échec
 * et les détails de la réponse. Fermeture remontée par l'event close.
 */
defineProps({
  connectionResult: { type: Object, default: null }
})
defineEmits(['close'])
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
  .modal-content {
    margin: var(--spacing-md);
  }
}
</style>
