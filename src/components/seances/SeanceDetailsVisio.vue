<template>
  <div class="bg-white shadow rounded-lg p-6 mb-6">
    <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
      <i class="fa fa-dot-circle-o visio-header-icon"></i> Visioconférence {{ visio.type }}
    </h2>

    <!-- Fenêtre temporelle info -->
    <div
      v-if="visio.window"
      :class="[
        'mb-4 p-4 rounded-lg border-2',
        visio.window.is_in_window ? 'bg-green-50 border-green-300' :
        !visio.window.has_started ? 'bg-orange-50 border-orange-300' :
        'bg-gray-50 border-gray-300'
      ]"
    >
      <p class="font-medium">
        <span v-if="!visio.window.has_started">
          <i class="fa fa-clock-o status-icon"></i> La visio ouvrira 15 minutes avant le cours
        </span>
        <span v-else-if="visio.window.is_in_window">
          <i class="fa fa-check status-icon"></i> Fenêtre visio active
        </span>
        <span v-else>
          <span class="status-icon">■</span> Fenêtre visio fermée
        </span>
      </p>
    </div>

    <div
      v-if="recordingStatus"
      class="mb-4 p-4 rounded-lg border"
      :class="recordingStatus.containerClass"
      role="status"
      aria-live="polite"
      data-test="recording-status"
    >
      <div
        class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold"
        :class="recordingStatus.badgeClass"
      >
        <i :class="recordingStatus.iconClass"></i>
        {{ recordingStatus.label }}
      </div>
      <p class="mt-2 text-sm">
        {{ recordingStatus.description }}
      </p>
      <p v-if="recording.isFailed && recording.errorMessage" class="mt-1 text-sm font-medium">
        {{ recording.errorMessage }}
      </p>
      <p v-if="recording.canOpen" class="mt-3">
        <a
          :href="recording.href"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 text-blue-700 hover:underline font-semibold"
          data-test="recording-link"
        >
          <i class="fa fa-play recording-icon"></i> Voir l'enregistrement
        </a>
      </p>
    </div>

    <div
      v-if="recording.isRecording"
      class="mb-4 p-4 rounded-lg border border-yellow-300 bg-yellow-50 text-yellow-900"
      data-test="recording-consent"
    >
      <p class="font-semibold flex items-center gap-2">
        <i class="fa fa-info-circle"></i>
        Cette séance est enregistrée
      </p>
      <p class="mt-1 text-sm">
        La vidéo pourra être rattachée au cours et consultée par les participants autorisés.
      </p>
    </div>

    <!-- Bouton Enseignant / Coordinateur -->
    <div v-if="isTeacher">
      <!-- Si le cours est déjà actif, permettre de rejoindre (pour coordinateur aussi) -->
      <div v-if="visio.status === 'active'">
        <div class="mb-3 p-3 bg-red-50 border-2 border-red-400 rounded-lg text-center">
          <span class="text-red-600 font-bold text-lg"><i class="fa fa-circle text-red"></i> COURS EN DIRECT</span>
        </div>
        <button
          @click="$emit('join')"
          class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
        >
          <i class="fa fa-dot-circle-o btn-icon"></i> Rejoindre le cours
        </button>

        <div
          v-if="canManageRecording"
          class="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg"
          data-test="recording-controls"
        >
          <button
            v-if="recording.isRecording"
            data-test="recording-stop"
            type="button"
            :disabled="recordingActionLoading"
            @click="$emit('stop-recording')"
            class="w-full px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {{ recordingActionLoading ? 'Action en cours...' : "Arrêter l'enregistrement" }}
          </button>
          <button
            v-else-if="recording.isIdle || recording.isFailed"
            data-test="recording-start"
            type="button"
            :disabled="recordingActionLoading"
            @click="$emit('start-recording')"
            class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
          >
            {{ recordingActionLoading ? 'Action en cours...' : "Démarrer l'enregistrement" }}
          </button>
          <p v-else class="text-sm text-gray-600 text-center">
            Statut d'enregistrement suivi par le backend.
          </p>
          <p v-if="recordingPolling" class="mt-2 text-xs text-gray-500 text-center">
            Mise à jour du statut en cours...
          </p>
        </div>
      </div>
      <!-- Sinon, afficher le bouton de démarrage (enseignant seulement) -->
      <div v-else>
        <button
          v-if="visio.window?.can_start"
          @click="$emit('start')"
          class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2"
        >
          <i class="fa fa-play btn-icon"></i> Démarrer le cours
        </button>
        <div v-else class="text-center py-4 text-gray-600">
          <p v-if="!visio.window?.has_started">
            Vous pourrez démarrer le cours 15 minutes avant l'heure prévue
          </p>
          <p v-else>
            La fenêtre pour démarrer le cours est fermée
          </p>
        </div>
      </div>
    </div>

    <!-- Bouton Étudiant -->
    <div v-else-if="isStudent">
      <!-- Cours EN DIRECT: Accessible si status = 'active' OU dans la fenêtre temporelle -->
      <div v-if="visio.status === 'active' || (visio.window?.is_accessible && roomActive)">
        <div v-if="visio.status === 'active'" class="mb-3 p-3 bg-red-50 border-2 border-red-400 rounded-lg text-center">
          <span class="text-red-600 font-bold text-lg"><i class="fa fa-circle text-red"></i> COURS EN DIRECT</span>
        </div>

        <button
          @click="$emit('join')"
          :disabled="joiningVisio"
          class="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <span v-if="!joiningVisio"><i class="fa fa-dot-circle-o btn-icon"></i> Rejoindre le cours</span>
          <span v-else><i class="fa fa-clock-o waiting-icon"></i> Validation en cours...</span>
        </button>
      </div>

      <!-- Cours pas encore démarré -->
      <div v-else-if="!visio.window?.has_started" class="text-center py-6">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg">
          <i class="fa fa-clock-o waiting-icon"></i> En attente de l'enseignant
        </div>
        <p class="mt-2 text-sm text-gray-600">
          Le cours commencera à {{ seance.heure_debut }}
        </p>
      </div>

      <!-- Cours terminé -->
      <div v-else-if="visio.window?.has_ended" class="text-center py-6">
        <div class="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg">
          <i class="fa fa-check finished-icon"></i> Cours terminé
        </div>
      </div>

      <!-- Fallback: en attente -->
      <div v-else class="text-center py-6 text-gray-600">
        <p>En attente du démarrage par l'enseignant...</p>
      </div>
    </div>

    <!-- Info Room -->
    <div v-if="visio.room_id" class="mt-4 p-3 bg-gray-50 rounded text-sm text-gray-600">
      <p><strong>Room ID:</strong> {{ visio.room_id }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { normalizeVisioRecording, recordingStatusPresentation } from '@/utils/visioRecording'

/**
 * Section visioconférence de SeanceDetails (#H6 ≤300) : fenêtre temporelle,
 * commandes enseignant/coordinateur (démarrer/rejoindre), parcours étudiant
 * (en direct / attente / terminé) et infos room. Présentation pure extraite
 * VERBATIM ; émet `start` et `join`, la logique reste dans la vue parente.
 */
const props = defineProps({
  visio: { type: Object, required: true },
  seance: { type: Object, required: true },
  isTeacher: { type: Boolean, default: false },
  isStudent: { type: Boolean, default: false },
  canManageRecording: { type: Boolean, default: false },
  roomActive: { type: Boolean, default: false },
  joiningVisio: { type: Boolean, default: false },
  recordingActionLoading: { type: Boolean, default: false },
  recordingPolling: { type: Boolean, default: false }
})

defineEmits(['start', 'join', 'start-recording', 'stop-recording'])

const recording = computed(() => normalizeVisioRecording(props.visio))
const recordingStatus = computed(() => recordingStatusPresentation(recording.value))
</script>

<style scoped lang="scss">
@use '../../assets/styles/seance-details';
</style>
