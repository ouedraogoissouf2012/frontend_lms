<template>
  <!-- Modal fullscreen pour Jitsi -->
  <Modal
    :model-value="isOpen"
    teleport
    :show-close="false"
    size="xl"
    overlay-class="jitsi-modal-overlay"
    container-class="jitsi-modal-container"
    header-class="jitsi-modal-header-shell"
    body-class="jitsi-modal-body"
    transition-name="modal"
    @close="handleClose"
  >
    <template #header>
      <!-- Header avec bouton fermer -->
      <div class="jitsi-modal-header">
        <h3 class="text-lg font-semibold text-white">
          Visioconférence - {{ seanceTitle }}
        </h3>
        <button
          @click="handleClose"
          class="close-button"
          title="Quitter la visioconférence"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </template>

    <!-- Composant Jitsi -->
    <div class="jitsi-modal-content">
      <JitsiMeet
        v-if="isOpen && seanceId && jitsiLink"
        ref="jitsiMeetRef"
        :seance-id="seanceId"
        :jitsi-link="jitsiLink"
        :user-name="userName"
        :user-email="userEmail"
        @joined="handleJoined"
        @left="handleLeft"
        @close="handleClose"
        @error="handleError"
      />
    </div>
  </Modal>
</template>

<script setup>
import { ref } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import JitsiMeet from './JitsiMeet.vue'
import { confirmVisioAction } from '@/services/visioFeedback'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false
  },
  seanceId: {
    type: Number,
    required: true
  },
  seanceTitle: {
    type: String,
    default: 'Séance'
  },
  jitsiLink: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  userEmail: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close', 'joined', 'left', 'error'])

const jitsiMeetRef = ref(null)

/**
 * Gestion de la fermeture
 */
const handleClose = async () => {
  // Confirmer la sortie
  const confirmed = await confirmVisioAction('Voulez-vous vraiment quitter la visioconférence ?', {
    confirmLabel: 'Quitter',
    variant: 'danger',
  })
  if (!confirmed) return

  // Cleanup du composant Jitsi
  if (jitsiMeetRef.value) {
    await jitsiMeetRef.value.cleanup()
  }

  emit('close')
}

/**
 * Événements du composant Jitsi
 */
const handleJoined = (event) => {
  console.log('[JitsiModal] Utilisateur a rejoint la visio')
  emit('joined', event)
}

const handleLeft = (event) => {
  console.log('[JitsiModal] Utilisateur a quitté la visio')
  emit('left', event)
}

const handleError = (error) => {
  console.error('[JitsiModal] Erreur Jitsi:', error)
  emit('error', error)
}

</script>

<style scoped>
/* Overlay fullscreen */
:deep(.jitsi-modal-overlay) {
  background: rgba(0, 0, 0, 0.95);
  z-index: 9999;
  padding: 1rem;
}

/* Conteneur de la modal */
:deep(.jitsi-modal-container) {
  width: 100%;
  max-width: 1400px;
  height: 90vh;
  background: var(--gray-800);
  border-radius: 0.5rem;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

:deep(.jitsi-modal-header-shell) {
  display: block;
  padding: 0;
  border-bottom: 0;
}

:deep(.jitsi-modal-body) {
  display: flex;
  padding: 0;
  overflow: hidden;
  background: var(--black);
}

/* Header */
.jitsi-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  background: var(--gray-900);
  border-bottom: 1px solid var(--gray-700);
}

.close-button {
  color: white;
  background: var(--red-500);
  border: none;
  border-radius: 0.375rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-button:hover {
  background: var(--red-600);
}

/* Contenu Jitsi */
.jitsi-modal-content {
  flex: 1;
  overflow: hidden;
  background: var(--black);
}

/* Animations */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

:deep(.modal-enter-active .jitsi-modal-container),
:deep(.modal-leave-active .jitsi-modal-container) {
  transition: transform 0.3s ease;
}

:deep(.modal-enter-from .jitsi-modal-container),
:deep(.modal-leave-to .jitsi-modal-container) {
  transform: scale(0.9);
}

/* Responsive */
@media (max-width: 768px) {
  :deep(.jitsi-modal-overlay) {
    padding: 0;
  }

  :deep(.jitsi-modal-container) {
    max-width: 100%;
    height: 100vh;
    border-radius: 0;
  }

  .jitsi-modal-header {
    padding: 0.75rem 1rem;
  }
}
</style>
