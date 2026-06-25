<template>
  <div
    v-if="visible"
    class="modal-overlay"
    @click.self="$emit('close')"
  >
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header">
        <h2 class="modal-title">Créer une nouvelle leçon</h2>
        <button @click="$emit('close')" class="modal-close">✖</button>
      </div>

      <!-- Body -->
      <div class="modal-body">
        <form @submit.prevent="$emit('submit')" class="lesson-form">
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

          <!-- Actions -->
          <div class="modal-actions">
            <button
              type="button"
              @click="$emit('close')"
              class="btn-secondary"
              :disabled="creating"
            >
              Annuler
            </button>
            <button
              type="submit"
              class="btn-primary"
              :disabled="creating || !lesson.title"
            >
              {{ creating ? 'Création...' : 'Créer la leçon' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Modale de création de leçon de MatiereDetails (#H9 ≤300). Présentation pure :
 * formulaire lié à l'objet `lesson` (mutation des propriétés, parité avec
 * l'ancien newLesson). Émet `close` et `submit`. CSS déplacé VERBATIM.
 */
defineProps({
  visible: { type: Boolean, default: false },
  lesson: { type: Object, required: true },
  creating: { type: Boolean, default: false }
})
defineEmits(['close', 'submit'])
</script>

<style scoped>
/* MODAL STYLES */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}

.modal-content {
  background: var(--card-bg);
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid var(--border-primary);
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.modal-close:hover {
  background-color: var(--bg-secondary);
  color: var(--text-primary);
}

.modal-body {
  padding: 24px;
}

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
  color: #ef4444;
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
  border-color: #3b82f6;
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

.modal-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding-top: 8px;
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
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
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
