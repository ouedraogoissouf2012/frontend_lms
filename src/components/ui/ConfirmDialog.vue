<template>
  <Modal
    :model-value="state.open"
    :title="state.title || 'Confirmation'"
    size="sm"
    :teleport="true"
    teleport-to="body"
    @update:model-value="onModelUpdate"
    @close="cancel"
  >
    <p class="confirm-dialog__message">{{ state.message }}</p>
    <template #footer>
      <div class="confirm-dialog__actions">
        <BaseButton variant="secondary" @click="cancel">{{ state.cancelLabel }}</BaseButton>
        <BaseButton
          :variant="state.variant === 'danger' ? 'danger' : 'primary'"
          @click="accept"
        >{{ state.confirmLabel }}</BaseButton>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import Modal from './Modal.vue'
import BaseButton from './BaseButton.vue'
import { useConfirm } from '@/composables/useConfirm'

// Boîte de confirmation GLOBALE : montée une seule fois (App.vue), pilotée par
// l'état singleton de useConfirm. Aucun état local — pur rendu + relais des
// actions (accept/cancel) vers le composable.
const { state, accept, cancel } = useConfirm()

// Modal émet update:modelValue(false) sur fermeture (croix/overlay/Échap) :
// on la traite comme une annulation pour résoudre la promesse à false.
function onModelUpdate(value) {
  if (!value) cancel()
}
</script>

<style scoped>
.confirm-dialog__message {
  margin: 0;
  color: var(--text-primary);
  line-height: 1.5;
  white-space: pre-line;
}

.confirm-dialog__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}
</style>
