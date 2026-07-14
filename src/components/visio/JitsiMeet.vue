<template>
  <div class="jitsi-container">
    <!-- Conteneur pour l'iframe Jitsi -->
    <div ref="jitsiContainer" class="jitsi-iframe-wrapper"></div>

    <!-- Overlay de chargement -->
    <JitsiLoadingOverlay v-if="isLoading" />

    <!-- Erreur -->
    <JitsiErrorOverlay v-if="error" :error="error" @close="$emit('close')" />
  </div>
</template>

<script setup>
/**
 * JitsiMeet (#h13 ≤300) — shell présentationnel. Toute la logique (script
 * externe, init IFrame API, événements, heartbeat, cleanup, lifecycle) vit dans
 * `useJitsiMeet`. Les overlays chargement/erreur sont des sous-composants.
 * API publique inchangée : props seanceId/jitsiLink/userName/userEmail,
 * emits close/joined/left/error, et `cleanup` exposé au parent (JitsiModal).
 */
import { toRefs } from 'vue'
import { useJitsiMeet } from '@/composables/useJitsiMeet'
import JitsiLoadingOverlay from './JitsiLoadingOverlay.vue'
import JitsiErrorOverlay from './JitsiErrorOverlay.vue'

const props = defineProps({
  seanceId: {
    type: Number,
    required: true
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
  },
  recordingProviderEnabled: {
    type: Boolean,
    default: false
  },
  recordingMode: {
    type: String,
    default: 'file'
  }
})

const emit = defineEmits([
  'close',
  'joined',
  'left',
  'error',
  'recording-status-changed',
  'recording-link-available',
  'recording-command-error',
])

const {
  seanceId,
  jitsiLink,
  userName,
  userEmail,
  recordingProviderEnabled,
  recordingMode,
} = toRefs(props)

const {
  jitsiContainer,
  isLoading,
  error,
  cleanup,
  startJitsiRecording,
  stopJitsiRecording,
} = useJitsiMeet({
  seanceId,
  jitsiLink,
  userName,
  userEmail,
  recordingProviderEnabled,
  recordingMode,
  emit
})

// Exposer cleanup pour pouvoir l'appeler depuis le parent
defineExpose({
  startJitsiRecording,
  stopJitsiRecording,
  cleanup
})
</script>

<style scoped>
.jitsi-container {
  position: relative;
  width: 100%;
  height: 100%;
  min-height: 600px;
  background: var(--black);
}

.jitsi-iframe-wrapper {
  width: 100%;
  height: 100%;
}
</style>
