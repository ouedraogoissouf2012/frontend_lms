<template>
  <Modal
    :model-value="true"
    :show-close="false"
    size="xl"
    overlay-class="participants-modal-overlay"
    container-class="participants-modal-container"
    header-class="participants-modal-header-shell"
    body-class="participants-modal-body"
    footer-class="participants-modal-footer"
    @close="close"
  >
    <template #header>
      <ParticipantsModalHeader
        :teacher="teacher"
        :coordinator="coordinator"
        :seance-time="seanceTime"
        :seance-duration="seanceDuration"
        @close="close"
      />
    </template>

    <!-- Content -->
    <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        <p class="font-medium">Erreur lors du chargement des participants</p>
        <p class="text-sm mt-1">{{ error }}</p>
      </div>

      <!-- Liste de présence chargée -->
      <div v-else>
        <!-- Boutons d'export -->
        <div class="flex justify-end gap-3 mb-6">
          <button
            @click="exportPDF"
            :disabled="exporting"
            class="inline-flex items-center px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            {{ exporting ? 'Export...' : 'Exporter PDF' }}
          </button>
          <button
            @click="exportExcel"
            :disabled="exporting"
            class="inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors duration-200"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            {{ exporting ? 'Export...' : 'Exporter Excel' }}
          </button>
        </div>

        <ParticipantsStats :stats="stats" :format-duration="formatDuration" />

        <ParticipantsTable :students="students" :stats="stats" :get-initials="getInitials" />
      </div>
    </div>

    <template #footer>
      <button
        @click="close"
        class="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors duration-200"
      >
        Fermer
      </button>
    </template>
  </Modal>
</template>

<script setup>
/**
 * Liste de présence d'une séance (orchestrateur #H13 ≤300). La donnée et la logique
 * (chargement, auto-refresh 15 s, stats, exports PDF/Excel, formatage) vivent dans
 * useParticipantsModal ; l'UI est composée de ParticipantsModalHeader,
 * ParticipantsStats et ParticipantsTable. API publique inchangée : prop `seanceId`,
 * émission `close`. Le chrome de la modale (overlay, loading/error, boutons d'export,
 * footer) et son CSS sont conservés VERBATIM.
 */
import { toRefs } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import ParticipantsModalHeader from './ParticipantsModalHeader.vue'
import ParticipantsStats from './ParticipantsStats.vue'
import ParticipantsTable from './ParticipantsTable.vue'
import { useParticipantsModal } from '@/composables/useParticipantsModal'

const props = defineProps({
  seanceId: {
    type: Number,
    required: true
  }
})
const emit = defineEmits(['close'])

const { seanceId } = toRefs(props)

const {
  loading, error, students, teacher, coordinator,
  stats, exporting, seanceDuration, seanceTime,
  formatDuration, getInitials, exportPDF, exportExcel,
} = useParticipantsModal(seanceId)

function close() {
  emit('close')
}
</script>

<style scoped>
/* Modal animations */
:deep(.participants-modal-overlay) {
  background: rgba(17, 24, 39, 0.5);
  z-index: 50;
  animation: fadeIn 0.2s ease-out;
}

:deep(.participants-modal-container) {
  max-width: 72rem;
  width: calc(100% - 2rem);
  max-height: 90vh;
  background: var(--white);
  border-radius: 0.5rem;
}

:deep(.participants-modal-header-shell) {
  display: block;
  padding: 0;
  border-bottom: 0;
}

:deep(.participants-modal-body) {
  padding: 0;
  overflow: hidden;
}

:deep(.participants-modal-footer) {
  background: var(--gray-50);
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--gray-200);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>
