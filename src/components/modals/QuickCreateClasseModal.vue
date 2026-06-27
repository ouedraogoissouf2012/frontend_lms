<template>
  <Modal v-model="isOpen" title="Création rapide - Classe" size="md">
    <form @submit.prevent="handleSubmit" class="quick-form">
      <!-- Nom de la classe -->
      <div class="form-group">
        <label class="form-label" for="classe-name">
          Nom de la classe <span class="required">*</span>
        </label>
        <input
          id="classe-name"
          v-model="form.name"
          type="text"
          class="form-input"
          placeholder="Ex: L3 Informatique A"
          required
        />
      </div>

      <!-- Filière -->
      <div class="form-group">
        <label class="form-label" for="filiere">
          Filière <span class="required">*</span>
        </label>
        <select
          id="filiere"
          v-model="form.filiere_id"
          class="form-select"
          required
        >
          <option value="">-- Sélectionner une filière --</option>
          <option
            v-for="filiere in filieres"
            :key="filiere.id"
            :value="filiere.id"
          >
            {{ filiere.name || filiere.nom }} ({{ filiere.code }})
          </option>
        </select>
      </div>

      <!-- Niveau -->
      <div class="form-group">
        <label class="form-label" for="niveau">
          Niveau <span class="required">*</span>
        </label>
        <select
          id="niveau"
          v-model="form.niveau_id"
          class="form-select"
          required
        >
          <option value="">-- Sélectionner un niveau --</option>
          <option
            v-for="niveau in niveaux"
            :key="niveau.id"
            :value="niveau.id"
          >
            {{ niveau.name || niveau.nom }}
          </option>
        </select>
      </div>

      <!-- Capacité -->
      <div class="form-group">
        <label class="form-label" for="capacity">
          Capacité (nombre de places)
        </label>
        <input
          id="capacity"
          v-model.number="form.places_totales"
          type="number"
          class="form-input"
          placeholder="Ex: 30"
          min="1"
        />
      </div>

      <!-- Active -->
      <div class="form-group-checkbox">
        <label class="checkbox-label">
          <input
            v-model="form.is_active"
            type="checkbox"
            class="form-checkbox"
          />
          <span>Classe active</span>
        </label>
      </div>

      <!-- Message d'erreur -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </form>

    <template #footer>
      <BaseButton variant="secondary" :disabled="loading" @click="handleCancel">
        Annuler
      </BaseButton>
      <BaseButton variant="primary" :loading="loading" @click="handleSubmit">
        Créer la classe
      </BaseButton>
    </template>
  </Modal>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { klassciService } from '@/services/klassci'
import { toast } from '@/services/toast'

const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'created'])

const isOpen = ref(props.modelValue)
const loading = ref(false)
const error = ref(null)
const filieres = ref([])
const niveaux = ref([])

const form = ref({
  name: '',
  filiere_id: '',
  niveau_id: '',
  places_totales: 30,
  is_active: true
})

watch(() => props.modelValue, (newVal) => {
  isOpen.value = newVal
  if (newVal) {
    resetForm()
    loadStructure()
  }
})

watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal)
})

function resetForm() {
  form.value = {
    name: '',
    filiere_id: '',
    niveau_id: '',
    places_totales: 30,
    is_active: true
  }
  error.value = null
}

async function loadStructure() {
  try {
    const structure = await klassciService.getStructure()
    filieres.value = structure.filieres || []
    niveaux.value = structure.niveaux_etude || []
  } catch (err) {
    console.error('Erreur chargement structure:', err)
    toast.error('Impossible de charger les filières et niveaux')
  }
}

async function handleSubmit() {
  error.value = null
  loading.value = true

  try {
    // NOTE: Adapter selon ton API backend
    // Pour l'instant, simulation
    console.log('Création classe:', form.value)

    // Simuler délai API
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast.success('Classe créée avec succès')
    emit('created', form.value)
    isOpen.value = false
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de la création'
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
    loadStructure()
  }
})
</script>

<style scoped>
.quick-form {
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

.form-input::placeholder {
  color: var(--text-tertiary);
}

.form-group-checkbox {
  display: flex;
  align-items: center;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: var(--text-primary);
}

.form-checkbox {
  width: 1.125rem;
  height: 1.125rem;
  cursor: pointer;
}

.error-message {
  padding: 0.75rem;
  background: var(--error-bg);
  color: var(--red-600);
  border-radius: 0.5rem;
  font-size: 0.875rem;
}
</style>
