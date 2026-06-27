<template>
  <Modal v-model="isOpen" title="Générer un Rapport PDF" size="md">
    <form @submit.prevent="handleGenerate" class="report-form">
      <!-- Type de rapport -->
      <div class="form-group">
        <label class="form-label">
          Type de rapport <span class="required">*</span>
        </label>
        <select v-model="form.type" class="form-select" required>
          <option value="">-- Sélectionner --</option>
          <option value="attendance">Rapport de Présences</option>
          <option value="grades">Rapport de Notes</option>
          <option value="activity">Rapport d'Activité Système</option>
        </select>
      </div>

      <!-- Période -->
      <div class="form-group">
        <label class="form-label">Date de début</label>
        <input
          v-model="form.date_start"
          type="date"
          class="form-input"
          :max="form.date_end || today"
        />
      </div>

      <div class="form-group">
        <label class="form-label">Date de fin</label>
        <input
          v-model="form.date_end"
          type="date"
          class="form-input"
          :min="form.date_start"
          :max="today"
        />
      </div>

      <!-- Filtres optionnels selon le type -->
      <div v-if="form.type === 'attendance'" class="form-group">
        <label class="form-label">Classe (optionnel)</label>
        <select v-model="form.classe_id" class="form-select">
          <option value="">Toutes les classes</option>
          <option v-for="classe in classes" :key="classe.id" :value="classe.id">
            {{ classe.name }}
          </option>
        </select>
      </div>

      <div v-if="form.type === 'grades'" class="form-group">
        <label class="form-label">Matière (optionnel)</label>
        <select v-model="form.matiere_id" class="form-select">
          <option value="">Toutes les matières</option>
          <option v-for="matiere in matieres" :key="matiere.id" :value="matiere.id">
            {{ matiere.nom }}
          </option>
        </select>
      </div>

      <!-- Message d'erreur -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>

      <!-- Info -->
      <div class="info-box">
        <p>Le rapport sera généré au format PDF et téléchargé automatiquement.</p>
      </div>
    </form>

    <template #footer>
      <BaseButton variant="secondary" :disabled="loading" @click="handleCancel">
        Annuler
      </BaseButton>
      <BaseButton variant="primary" :loading="loading" :disabled="!form.type" @click="handleGenerate">
        Générer PDF
      </BaseButton>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch, onMounted, computed } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { klassciService } from '@/services/klassci'
import api from '@/services/api'
import { toast } from '@/services/toast'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'generated'])

const isOpen = ref(props.modelValue)
const loading = ref(false)
const error = ref(null)
const classes = ref([])
const matieres = ref([])

const today = computed(() => {
  return new Date().toISOString().split('T')[0]
})

const form = ref({
  type: '',
  date_start: '',
  date_end: today.value,
  classe_id: '',
  matiere_id: ''
})

watch(() => props.modelValue, (newVal) => {
  isOpen.value = newVal
  if (newVal) {
    resetForm()
    loadData()
  }
})

watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal)
})

function resetForm() {
  const lastMonth = new Date()
  lastMonth.setMonth(lastMonth.getMonth() - 1)

  form.value = {
    type: '',
    date_start: lastMonth.toISOString().split('T')[0],
    date_end: today.value,
    classe_id: '',
    matiere_id: ''
  }
  error.value = null
}

async function loadData() {
  try {
    const [classesData, matieresData] = await Promise.all([
      klassciService.getClasses(),
      klassciService.getMatieres()
    ])
    classes.value = classesData
    matieres.value = matieresData
  } catch (err) {
    console.error('Erreur chargement données:', err)
  }
}

async function handleGenerate() {
  if (!form.value.type) {
    error.value = 'Veuillez sélectionner un type de rapport'
    return
  }

  error.value = null
  loading.value = true

  try {
    const endpoint = `/admin/reports/${form.value.type}`
    const payload = {
      date_start: form.value.date_start,
      date_end: form.value.date_end
    }

    if (form.value.classe_id) {
      payload.classe_id = form.value.classe_id
    }
    if (form.value.matiere_id) {
      payload.matiere_id = form.value.matiere_id
    }

    // Appel API pour générer le PDF (réponse blob)
    const response = await api.post(endpoint, payload, {
      responseType: 'blob'
    })

    // Créer un lien de téléchargement
    const blob = new Blob([response], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `rapport-${form.value.type}-${new Date().getTime()}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)

    toast.success('Rapport PDF généré avec succès')
    emit('generated')
    isOpen.value = false

  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de la génération du rapport'
    toast.error(error.value)
  } finally {
    loading.value = false
  }
}

function handleCancel() {
  if (!loading.value) {
    isOpen.value = false
  }
}

onMounted(() => {
  if (isOpen.value) {
    loadData()
  }
})
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
  color: #ef4444;
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
  color: #dc2626;
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
