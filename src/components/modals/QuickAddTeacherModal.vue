<template>
  <Modal v-model="isOpen" title="Ajout rapide - Enseignant" size="md">
    <form @submit.prevent="handleSubmit" class="quick-form">
      <!-- Nom -->
      <div class="form-group">
        <label class="form-label" for="teacher-name">
          Nom complet <span class="required">*</span>
        </label>
        <input
          id="teacher-name"
          v-model="form.name"
          type="text"
          class="form-input"
          placeholder="Ex: Jean Dupont"
          required
        />
      </div>

      <!-- Email -->
      <div class="form-group">
        <label class="form-label" for="teacher-email">
          Email <span class="required">*</span>
        </label>
        <input
          id="teacher-email"
          v-model="form.email"
          type="email"
          class="form-input"
          placeholder="Ex: jean.dupont@example.com"
          required
        />
      </div>

      <!-- Téléphone -->
      <div class="form-group">
        <label class="form-label" for="teacher-phone">
          Téléphone
        </label>
        <input
          id="teacher-phone"
          v-model="form.telephone"
          type="tel"
          class="form-input"
          placeholder="Ex: +221 77 123 45 67"
        />
      </div>

      <!-- Matières assignées (optionnel) -->
      <div class="form-group">
        <label class="form-label" for="teacher-matieres">
          Matières assignées (optionnel)
        </label>
        <select
          id="teacher-matieres"
          v-model="form.matiere_ids"
          class="form-select"
          multiple
          size="4"
        >
          <option
            v-for="matiere in matieres"
            :key="matiere.id"
            :value="matiere.id"
          >
            {{ matiere.nom }} ({{ matiere.code }})
          </option>
        </select>
        <p class="form-hint">Maintenez Ctrl/Cmd pour sélectionner plusieurs matières</p>
      </div>

      <!-- Mot de passe temporaire -->
      <div class="form-group">
        <label class="form-label" for="teacher-password">
          Mot de passe temporaire <span class="required">*</span>
        </label>
        <input
          id="teacher-password"
          v-model="form.password"
          type="password"
          class="form-input"
          placeholder="Minimum 6 caractères"
          required
          minlength="6"
        />
        <p class="form-hint">L'enseignant devra changer ce mot de passe à sa première connexion</p>
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
        Ajouter l'enseignant
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
const matieres = ref([])

const form = ref({
  name: '',
  email: '',
  telephone: '',
  password: '',
  matiere_ids: [],
  role: 'enseignant'
})

watch(() => props.modelValue, (newVal) => {
  isOpen.value = newVal
  if (newVal) {
    resetForm()
    loadMatieres()
  }
})

watch(isOpen, (newVal) => {
  emit('update:modelValue', newVal)
})

function resetForm() {
  form.value = {
    name: '',
    email: '',
    telephone: '',
    password: '',
    matiere_ids: [],
    role: 'enseignant'
  }
  error.value = null
}

async function loadMatieres() {
  try {
    matieres.value = await klassciService.getMatieres()
  } catch (err) {
    console.error('Erreur chargement matières:', err)
  }
}

async function handleSubmit() {
  error.value = null
  loading.value = true

  try {
    // NOTE: Adapter selon ton API backend
    // Pour l'instant, simulation
    console.log('Création enseignant:', form.value)

    // Simuler délai API
    await new Promise(resolve => setTimeout(resolve, 1000))

    toast.success('Enseignant ajouté avec succès')
    emit('created', form.value)
    isOpen.value = false
  } catch (err) {
    error.value = err.response?.data?.message || 'Erreur lors de l\'ajout'
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
    loadMatieres()
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

.form-input::placeholder {
  color: var(--text-tertiary);
}

.form-select[multiple] {
  min-height: 120px;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

.error-message {
  padding: 0.75rem;
  background: var(--error-bg);
  color: #dc2626;
  border-radius: 0.5rem;
  font-size: 0.875rem;
}
</style>
