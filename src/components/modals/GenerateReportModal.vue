<template>
  <Modal v-model="isOpen" title="Générer un Rapport PDF" size="md">
    <form @submit.prevent="handleGenerate" class="report-form">
      <!-- Type de rapport -->
      <div class="form-group">
        <label for="report-type" class="form-label">
          Type de rapport <span class="required">*</span>
        </label>
        <select id="report-type" v-model="form.type" name="type" class="form-select" required :disabled="enCours">
          <option value="">-- Sélectionner --</option>
          <option value="attendance">Rapport de Présences</option>
          <option value="grades">Rapport de Notes</option>
          <option value="activity">Rapport d'Activité Système</option>
        </select>
      </div>

      <!-- Période -->
      <div class="form-group">
        <label for="report-date-start" class="form-label">Date de début</label>
        <input
          id="report-date-start"
          v-model="form.date_start"
          name="date_start"
          type="date"
          class="form-input"
          :max="form.date_end || today"
          :disabled="enCours"
        />
      </div>

      <div class="form-group">
        <label for="report-date-end" class="form-label">Date de fin</label>
        <input
          id="report-date-end"
          v-model="form.date_end"
          name="date_end"
          type="date"
          class="form-input"
          :min="form.date_start"
          :max="today"
          :disabled="enCours"
        />
      </div>

      <!-- Seul filtre accepté au-delà de la période (spec #991) : le type d'activité. -->
      <div v-if="form.type === 'activity'" class="form-group">
        <label for="report-activity-type" class="form-label">Type d'activité</label>
        <select id="report-activity-type" v-model="form.activity_type" name="activity_type" class="form-select" :disabled="enCours">
          <option v-for="activite in ACTIVITY_TYPES" :key="activite.value" :value="activite.value">
            {{ activite.label }}
          </option>
        </select>
      </div>

      <!-- Régions présentes dès l'ouverture : seul leur texte change. -->
      <div role="alert" :class="{ 'error-message': error }">{{ error ?? '' }}</div>
      <div role="status" :class="{ 'info-box': avancement }">{{ avancement }}</div>
    </form>

    <template #footer>
      <BaseButton variant="secondary" @click="handleCancel">
        {{ enCours ? 'Fermer' : 'Annuler' }}
      </BaseButton>
      <BaseButton variant="primary" :loading="enCours" :disabled="!form.type || enCours" @click="handleGenerate">
        Générer PDF
      </BaseButton>
    </template>
  </Modal>
</template>

<script setup>
/**
 * Génération d'un rapport PDF global (D10, spec #991) : la demande est
 * ASYNCHRONE ; `useReportGeneration` la suit jusqu'au fichier. Cette fenêtre ne
 * garde que le formulaire et l'annonce de l'avancement.
 *
 * Filtres retirés : « Matière » (aucune route ne l'accepte) et « Classe » (le
 * catalogue donnait l'id d'un autre espace que celui des classes locales attendu
 * par le serveur : le filtre visait une autre classe — D41). Le choix d'une
 * évaluation pour les notes est une suite.
 */
import { ref, watch, computed } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { toast } from '@/composables/useToast'
import { useReportGeneration } from '@/composables/useReportGeneration'
import { ACTIVITY_TYPES, filtresDuRapport } from '@/constants/reports'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'generated'])

const isOpen = ref(props.modelValue)
const { etat, error, generer, annuler } = useReportGeneration()

const today = computed(() => new Date().toISOString().split('T')[0])

const AVANCEMENT = Object.freeze({
  envoi: 'Envoi de la demande…',
  attente: "Rapport en file d'attente…",
  generation: 'Génération en cours…',
  telechargement: 'Téléchargement du PDF…',
})
const avancement = computed(() => AVANCEMENT[etat.value] ?? '')
const enCours = computed(() => etat.value in AVANCEMENT)

const form = ref(formulaireVide())

function formulaireVide() {
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)
  return {
    type: '',
    date_start: lastMonth.toISOString().split('T')[0],
    date_end: today.value,
    activity_type: 'all'
  }
}

watch(() => props.modelValue, (newVal) => {
  isOpen.value = newVal
  if (newVal) {
    form.value = formulaireVide()
  } else {
    // Fermer arrête le suivi : plus aucune requête vers le serveur.
    annuler()
  }
})

watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal)
  // Fermée de l'intérieur (Échap, clic hors fenêtre) : même arrêt du suivi.
  if (!newVal) annuler()
})

async function handleGenerate() {
  if (!form.value.type || enCours.value) return

  await generer(form.value.type, filtresDuRapport(form.value.type, form.value))

  if (etat.value === 'termine') {
    toast.success('Rapport PDF téléchargé')
    emit('generated')
    isOpen.value = false
  }
}

function handleCancel() {
  isOpen.value = false
}
</script>

<style scoped>
.report-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.5rem 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.required {
  color: var(--red-500);
}

.form-input,
.form-select {
  padding: 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  font-size: 1rem;
  color: var(--text-primary);
  background: var(--card-bg);
  transition: border-color 0.2s;
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--blue-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.error-message {
  padding: 0.75rem;
  background: var(--error-bg);
  color: var(--red-600);
  border-radius: 0.5rem;
  font-size: 0.875rem;
}

.info-box {
  padding: 0.75rem;
  background: var(--info-bg);
  border-left: 4px solid var(--blue-500);
  border-radius: 0.5rem;
}

.info-box p {
  margin: 0;
  font-size: 0.875rem;
  color: var(--info-text);
}
</style>
