<template>
  <Modal
    :model-value="visible"
    title="Créer une nouvelle leçon"
    size="lg"
    @close="$emit('close')"
  >
    <form id="create-lesson-modal-form" @submit.prevent="$emit('submit')" class="lesson-form">
      <!-- Titre -->
      <div class="form-group">
        <label class="form-label required">Titre de la leçon</label>
        <input
          v-model="lesson.title"
          type="text"
          class="form-input"
          placeholder="Ex: Introduction aux boucles"
          required
        />
      </div>

      <!-- Description -->
      <div class="form-group">
        <label class="form-label">Description</label>
        <textarea
          v-model="lesson.description"
          class="form-textarea"
          rows="3"
          placeholder="Décrivez brièvement le contenu de cette leçon..."
        ></textarea>
      </div>

      <!-- Prérequis -->
      <div class="form-group">
        <label class="form-label">Prérequis</label>
        <textarea
          v-model="lesson.prerequis"
          class="form-textarea"
          rows="2"
          placeholder="Connaissances nécessaires avant de suivre cette leçon..."
        ></textarea>
        <p class="form-help">Ex: Comprendre les variables, les types de données</p>
      </div>

      <!-- Niveau -->
      <div class="form-group">
        <label class="form-label required">Niveau de difficulté</label>
        <select v-model="lesson.niveau_difficulte" class="form-select">
          <option value="debutant">Débutant</option>
          <option value="intermediaire">Intermédiaire</option>
          <option value="avance">Avancé</option>
        </select>
      </div>

      <!-- Objectifs pédagogiques -->
      <div class="form-group">
        <label class="form-label">Objectifs pédagogiques</label>
        <textarea
          v-model="lesson.objectifs_pedagogiques"
          class="form-textarea"
          rows="3"
          placeholder="Que devront savoir faire les étudiants après cette leçon ?"
        ></textarea>
        <p class="form-help">Ex: Maîtriser les boucles while et for, Résoudre des problèmes d'itération</p>
      </div>

      <!-- Durée estimée -->
      <div class="form-group">
        <label class="form-label">Durée estimée (minutes)</label>
        <input
          v-model.number="lesson.duree_estimee_minutes"
          type="number"
          class="form-input"
          placeholder="60"
          min="5"
          max="600"
        />
        <p class="form-help">Temps nécessaire pour compléter toute la leçon</p>
      </div>
    </form>

    <template #footer>
      <BaseButton
        type="button"
        variant="secondary"
        class="btn-secondary"
        :disabled="creating"
        @click="$emit('close')"
      >
        Annuler
      </BaseButton>
      <BaseButton
        type="submit"
        form="create-lesson-modal-form"
        class="btn-primary"
        :disabled="creating || !lesson.title"
        :loading="creating"
      >
        {{ creating ? 'Création...' : 'Créer la leçon' }}
      </BaseButton>
    </template>
  </Modal>
</template>

<script setup>
/**
 * Modale de création de leçon de MatiereDetails (#H9 ≤300). Présentation pure :
 * formulaire lié à l'objet `lesson` (mutation des propriétés, parité avec
 * l'ancien newLesson). Émet `close` et `submit`. CSS déplacé VERBATIM.
 */
import Modal from '@/components/ui/Modal.vue'
import BaseButton from '@/components/ui/BaseButton.vue'

defineProps({
  visible: { type: Boolean, default: false },
  lesson: { type: Object, required: true },
  creating: { type: Boolean, default: false }
})
defineEmits(['close', 'submit'])
</script>

<style scoped>
.lesson-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.875rem;
}

.form-label.required::after {
  content: ' *';
  color: var(--red-500);
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-primary);
  border-radius: 8px;
  font-size: 0.875rem;
  transition: all 0.2s;
  background-color: var(--input-bg, var(--card-bg));
  color: var(--text-primary);
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--blue-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--text-muted, #9ca3af);
  opacity: 1;
}

.form-help {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

.btn-primary,
.btn-secondary {
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-primary {
  background-color: var(--blue-500);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: var(--color-info-strong);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-secondary:hover:not(:disabled) {
  background-color: var(--bg-tertiary, var(--hover-bg));
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
