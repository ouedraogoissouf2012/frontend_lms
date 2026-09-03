<template>
  <div v-if="visioStore.roomConfig" class="visio-room" role="dialog" aria-label="Salle de visioconférence">
    <div class="visio-room__bar">
      <span class="visio-room__title">Visioconférence en cours</span>
      <span v-if="room.isRecording.value" class="visio-room__recording">
        <i class="fa fa-circle" aria-hidden="true"></i> Enregistrement en cours
      </span>
      <button type="button" class="visio-room__leave" @click="leave">
        Quitter le cours
      </button>
    </div>

    <div ref="container" class="visio-room__frame"></div>

    <p v-if="mountError" class="visio-room__error" role="alert">{{ mountError }}</p>
  </div>
</template>

<script setup>
import { ref, watch, onBeforeUnmount } from 'vue'
import { useVisioStore } from '@/stores/visio'
import { useJitsiRoom } from '@/composables/useJitsiRoom'
import { useVisioRecordingMirror } from '@/composables/useVisioRecordingMirror'

/**
 * Salle de visioconférence embarquée (#673).
 *
 * ## Pourquoi ce composant est monté à la RACINE de l'application
 *
 * Il suit le motif déjà posé dans `App.vue` pour `ToastContainer` et
 * `ConfirmDialog` : monté une fois, hors de `<router-view>`. C'est ce qui fait
 * survivre la salle à la navigation interne — la propriété que l'onglet séparé
 * apportait, et qu'il fallait conserver en le supprimant.
 *
 * ## Ce qu'il apporte au-delà de l'affichage
 *
 * Il porte le **miroir d'enregistrement** : le LMS persiste l'état qu'il
 * OBSERVE chez le fournisseur, et non celui qu'il a demandé. Sans cela, un
 * enregistrement lancé depuis le bouton natif de Jitsi produisait une vidéo que
 * le LMS refusait en 404 (cf. `useVisioRecordingMirror`).
 */
const visioStore = useVisioStore()
const container = ref(null)
const mountError = ref(null)

const room = useJitsiRoom()
const mirror = useVisioRecordingMirror({ getSeanceId: () => visioStore.activeSeanceId })

// L'observation est posée AVANT le montage : un enregistrement déjà en cours
// à l'entrée en salle doit être reflété, pas manqué.
room.on('recordingStatusChanged', (payload) => { void mirror.onProviderStatus(payload) })
room.on('videoConferenceLeft', () => visioStore.handleRoomLeft())
room.on('readyToClose', () => visioStore.handleRoomLeft())

async function leave() {
  await visioStore.leaveVisio()
}

/**
 * `flush: 'post'` est indispensable : le conteneur n'existe dans le DOM
 * qu'après le rendu déclenché par `roomConfig`. Sans lui, `parentNode` serait
 * `null` et le montage échouerait à chaque fois.
 */
watch(
  () => visioStore.roomConfig,
  async (config) => {
    room.dispose()
    mirror.reset()
    mountError.value = null
    if (!config) return

    try {
      await room.mount({ ...config, parentNode: container.value })
    } catch (error) {
      mountError.value = error.message
      // La participation est déjà écrite côté serveur : sans compensation,
      // l'utilisateur resterait présent à une séance qu'il ne suit pas.
      await visioStore.leaveVisio()
    }
  },
  { flush: 'post' },
)

onBeforeUnmount(() => room.dispose())
</script>

<style scoped>
.visio-room {
  position: fixed;
  inset: 0;
  z-index: 9997;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.visio-room__bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.6rem 1rem;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-primary);
  color: var(--text-primary);
}

.visio-room__title {
  font-weight: 600;
}

.visio-room__recording {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  font-size: 0.85rem;
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border: 1px solid var(--color-danger-border);
}

.visio-room__leave {
  margin-left: auto;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 600;
  padding: 0.5rem 1rem;
  background: var(--color-danger);
  color: var(--bg-primary);
}

.visio-room__frame {
  flex: 1;
  min-height: 0;
}

.visio-room__frame :deep(iframe) {
  width: 100%;
  height: 100%;
  border: 0;
}

.visio-room__error {
  margin: 0;
  padding: 0.75rem 1rem;
  background: var(--color-danger-bg);
  color: var(--color-danger-text);
  border-top: 1px solid var(--color-danger-border);
}
</style>
