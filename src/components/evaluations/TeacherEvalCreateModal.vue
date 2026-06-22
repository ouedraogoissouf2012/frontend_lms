<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">Créer version en ligne</h2>
        <button @click="$emit('close')" class="modal-close">
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <div class="modal-body">
        <div class="modal-info">
          <p class="info-text">
            <strong>Évaluation KLASSCI:</strong> {{ evaluation?.titre }}
          </p>
          <p class="info-text">
            <strong>Matière:</strong> {{ evaluation?.matiere?.nom || evaluation?.matiere?.name }}
          </p>
          <p class="info-text">
            <strong>Classe:</strong> {{ evaluation?.classe?.nom || evaluation?.classe?.libelle }}
          </p>
        </div>

        <form @submit.prevent="$emit('submit')" class="modal-form">
          <div class="form-group">
            <label class="form-label required">Type d'évaluation</label>
            <select v-model="onlineForm.type" required class="form-select">
              <option value="qcm">QCM uniquement</option>
              <option value="qcm_multiple">QCM à choix multiples</option>
              <option value="mixte">Mixte (QCM + réponses courtes)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label required">Durée (en minutes)</label>
            <input
              v-model.number="onlineForm.duree_minutes"
              type="number"
              min="5"
              max="240"
              required
              class="form-input"
              placeholder="60"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Description / Consignes</label>
            <textarea
              v-model="onlineForm.description"
              rows="3"
              class="form-textarea"
              placeholder="Instructions pour les étudiants..."
            ></textarea>
          </div>

          <div class="modal-actions">
            <button type="button" @click="$emit('close')" class="btn-cancel">
              Annuler
            </button>
            <button type="submit" :disabled="creating" class="btn-submit">
              <ArrowPathIcon v-if="creating" class="w-5 h-5 animate-spin" />
              <PlusIcon v-else class="w-5 h-5" />
              {{ creating ? 'Création...' : 'Créer et ajouter des questions' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Modale de création d'une version en ligne (H1, TeacherEvaluations). Le
 * formulaire est lié au modèle réactif `onlineForm` partagé (même référence) ;
 * émet `close` et `submit`. CSS déplacé verbatim depuis TeacherEvaluations
 * (styles de modale, de formulaire et animation `animate-spin`).
 */
import { XMarkIcon, PlusIcon, ArrowPathIcon } from '@heroicons/vue/24/outline'

defineProps({
  show: { type: Boolean, default: false },
  evaluation: { type: Object, default: null },
  onlineForm: { type: Object, required: true },
  creating: { type: Boolean, default: false }
})

defineEmits(['close', 'submit'])
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border: none;
  background: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 0.375rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
}

.modal-info {
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-text {
  font-size: 0.875rem;
  color: #1e40af;
  margin: 0.25rem 0;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-primary);
}

.form-label.required::after {
  content: ' *';
  color: #dc2626;
}

.form-select,
.form-input,
.form-textarea {
  width: 100%;
  padding: 0.625rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  background: var(--input-bg);
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-select:focus,
.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.btn-cancel,
.btn-submit {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
}

.btn-cancel:hover {
  background: var(--bg-hover);
}

.btn-submit {
  background: #3b82f6;
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: #2563eb;
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
