<template>
  <Modal
    :model-value="show"
    :title="editingLesson ? 'Modifier la leçon' : 'Nouvelle leçon'"
    size="lg"
    @close="$emit('close')"
  >
    <form id="lesson-form-modal" @submit.prevent="$emit('save')" class="modal-form">
      <!-- Matière (obligatoire) -->
      <div class="form-group">
        <label class="form-label required">Matière</label>
        <select v-model="matiereId" required class="form-select">
          <option value="">Sélectionnez une matière</option>
          <option v-for="matiere in matieres" :key="matiere.id" :value="matiere.id">
            {{ matiere.name || matiere.nom }}
          </option>
        </select>
      </div>

      <!-- Titre -->
      <div class="form-group">
        <label class="form-label required">Titre de la leçon</label>
        <input
          v-model="title"
          type="text"
          required
          placeholder="Ex: Introduction à Vue.js"
          class="form-input"
        />
      </div>

      <!-- Type -->
      <div class="form-group">
        <label class="form-label">Type de contenu</label>
        <select v-model="type" class="form-select">
          <option value="video">Vidéo</option>
          <option value="document">Document</option>
          <option value="quiz">Quiz</option>
          <option value="tp">TP</option>
          <option value="td">TD</option>
        </select>
      </div>

      <!-- Description -->
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea
          v-model="description"
          rows="4"
          placeholder="Décrivez le contenu de la leçon..."
          class="form-textarea"
        ></textarea>
      </div>

      <!-- Statut -->
      <div class="form-group">
        <label class="form-label">Statut</label>
        <select v-model="status" class="form-select">
          <option value="draft">Brouillon</option>
          <option value="published">Publiée</option>
          <option value="archived">Archivée</option>
        </select>
      </div>
    </form>

    <template #footer>
      <BaseButton type="button" variant="secondary" class="btn-cancel" @click="$emit('close')">
        Annuler
      </BaseButton>
      <BaseButton type="submit" form="lesson-form-modal" class="btn-save" :loading="saving">
        {{ saving ? 'Enregistrement...' : (editingLesson ? 'Mettre à jour' : 'Créer') }}
      </BaseButton>
    </template>
  </Modal>
</template>

<script setup>
/**
 * Modale création/édition d'une leçon enseignant (#H4 ≤300). Champs en v-model
 * (defineModel) ; ouverture pilotée par `show`, soumission/annulation relayées via
 * emit (save/close). NB : UI sans déclencheur dans le parent (dette pré-existante).
 */
import Modal from '@/components/ui/Modal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

const matiereId = defineModel('matiereId', { default: '' })
const title = defineModel('title', { type: String, default: '' })
const type = defineModel('type', { type: String, default: 'document' })
const description = defineModel('description', { type: String, default: '' })
const status = defineModel('status', { type: String, default: 'draft' })

defineProps({
  show: { type: Boolean, default: false },
  editingLesson: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  matieres: { type: Array, default: () => [] }
})

defineEmits(['close', 'save'])
</script>

<style scoped>
.modal-form {
  display: flex;
  flex-direction: column;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.form-label.required::after {
  content: ' *';
  color: var(--red-600);
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 0.875rem;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--blue-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.btn-cancel,
.btn-save {
  flex: 1;
  padding: 0.75rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}

.btn-save {
  background: linear-gradient(135deg, var(--blue-500) 0%, var(--color-info-strong) 100%);
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-info-strong) 0%, var(--color-info-stronger) 100%);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
