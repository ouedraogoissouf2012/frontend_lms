<template>
  <div v-if="show" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2 class="modal-title">{{ editingLesson ? 'Modifier la leçon' : 'Nouvelle leçon' }}</h2>
        <button @click="$emit('close')" class="modal-close">
          <XMarkIcon class="w-6 h-6" />
        </button>
      </div>

      <form @submit.prevent="$emit('save')" class="modal-body">
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

        <div class="modal-footer">
          <button type="button" @click="$emit('close')" class="btn-cancel">
            Annuler
          </button>
          <button type="submit" :disabled="saving" class="btn-save">
            {{ saving ? 'Enregistrement...' : (editingLesson ? 'Mettre à jour' : 'Créer') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
/**
 * Modale création/édition d'une leçon enseignant (#H4 ≤300). Champs en v-model
 * (defineModel) ; ouverture pilotée par `show`, soumission/annulation relayées via
 * emit (save/close). NB : UI sans déclencheur dans le parent (dette pré-existante).
 */
import { XMarkIcon } from '@heroicons/vue/24/outline'

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
/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  padding: 1rem;
}

.modal-content {
  background: var(--bg-primary);
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-primary);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  padding: 0.5rem;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: 0.5rem;
  transition: all 0.2s;
}

.modal-close:hover {
  background: var(--bg-secondary);
}

.modal-body {
  padding: 1.5rem;
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

.modal-footer {
  display: flex;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid var(--border-primary);
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
  background: linear-gradient(135deg, var(--color-info-strong) 0%, #1d4ed8 100%);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
