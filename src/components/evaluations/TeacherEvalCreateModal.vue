<template>
  <Modal
    :model-value="show"
    title="Créer version en ligne"
    size="lg"
    @close="$emit('close')"
  >
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
          <option value="reponse_courte">Réponses courtes</option>
          <option value="dissertation">Dissertation</option>
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
        <BaseButton type="button" variant="secondary" class="btn-cancel" @click="$emit('close')">
          Annuler
        </BaseButton>
        <BaseButton type="submit" class="btn-submit" :loading="creating">
          <template #icon>
            <PlusIcon class="w-5 h-5" />
          </template>
          {{ creating ? 'Création...' : 'Créer et ajouter des questions' }}
        </BaseButton>
      </div>
    </form>
  </Modal>
</template>

<script setup>
/**
 * Modale de création d'une version en ligne (H1, TeacherEvaluations). Le
 * formulaire est lié au modèle réactif `onlineForm` partagé (même référence) ;
 * émet `close` et `submit`. Les actions utilisent le bouton de base réutilisable.
 */
import Modal from '@/components/ui/Modal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { PlusIcon } from '@heroicons/vue/24/outline'

defineProps({
  show: { type: Boolean, default: false },
  evaluation: { type: Object, default: null },
  onlineForm: { type: Object, required: true },
  creating: { type: Boolean, default: false }
})

defineEmits(['close', 'submit'])
</script>

<style scoped>
.modal-info {
  background: var(--blue-50);
  border: 1px solid var(--blue-200);
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.info-text {
  font-size: 0.875rem;
  color: var(--info-text);
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
  color: var(--red-600);
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
  background: var(--blue-500);
  color: white;
}

.btn-submit:hover:not(:disabled) {
  background: var(--color-info-strong);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

</style>
