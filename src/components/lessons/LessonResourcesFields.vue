<template>
  <div class="form-section">
    <div class="section-header">
      <h2 class="section-title"><i class="fa fa-paperclip"></i> Ressources supplémentaires</h2>
      <button type="button" @click="$emit('add')" class="btn-add">
        + Ajouter une ressource
      </button>
    </div>

    <p class="section-description">
      Ajoutez des documents PDF, liens, vidéos complémentaires ou autres ressources pour enrichir votre leçon
    </p>

    <div v-if="resources && resources.length > 0" class="resources-list">
      <div
        v-for="(resource, index) in resources"
        :key="index"
        class="resource-card"
      >
        <div class="resource-header">
          <span class="resource-number">#{{ index + 1 }}</span>
          <button
            type="button"
            @click="$emit('remove', index)"
            class="btn-remove"
          >
            Supprimer
          </button>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Titre</label>
            <input
              v-model="resource.title"
              type="text"
              class="form-input"
              placeholder="Nom de la ressource"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Type</label>
            <select v-model="resource.type" class="form-select">
              <option value="pdf">PDF</option>
              <option value="document">Document</option>
              <option value="link">Lien</option>
              <option value="video">Vidéo</option>
              <option value="image">Image</option>
              <option value="archive">Archive</option>
              <option value="other">Autre</option>
            </select>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group full-width">
            <label class="form-label">URL</label>
            <input
              v-model="resource.url"
              type="url"
              class="form-input"
              placeholder="https://exemple.com/ressource.pdf"
            />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group full-width">
            <label class="form-label">Description (optionnelle)</label>
            <textarea
              v-model="resource.description"
              rows="2"
              class="form-textarea"
              placeholder="Description de la ressource..."
            ></textarea>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="resources-empty">
      <p>Aucune ressource supplémentaire</p>
      <p class="text-hint">Cliquez sur "Ajouter une ressource" pour en ajouter</p>
    </div>
  </div>
</template>

<script setup>
/**
 * Section « Ressources supplémentaires » de LessonEditor (#H4 ≤300) : liste éditable
 * de ressources. `add`/`remove` relayés au parent (la mutation de la liste reste dans
 * le composable) ; les champs éditent en place les objets ressources passés par
 * référence via la prop `resources`. Chrome dupliqué VERBATIM.
 */
defineProps({
  resources: { type: Array, default: () => [] }
})

defineEmits(['add', 'remove'])
</script>

<style scoped>
.form-section {
  background: var(--card-bg);
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: var(--card-shadow);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
}

.section-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group.full-width {
  grid-column: 1 / -1;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.5rem;
}

.form-input,
.form-select,
.form-textarea {
  width: 100%;
  padding: 0.75rem 1rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  color: var(--text-primary);
  font-size: 0.875rem;
  transition: all 0.2s;
}

.form-input:focus,
.form-select:focus,
.form-textarea:focus {
  outline: none;
  border-color: var(--blue-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: var(--text-tertiary);
}

.form-textarea {
  resize: vertical;
  font-family: inherit;
}

/* Resources */
.resources-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.resource-card {
  padding: 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.resource-number {
  font-weight: 700;
  color: var(--text-primary);
}

.btn-remove {
  padding: 0.5rem 1rem;
  background: var(--error-bg);
  color: var(--red-600);
  border: 1px solid var(--error-border);
  border-radius: 0.375rem;
  font-size: 0.813rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: var(--red-200);
}

.resources-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-tertiary);
}

.resources-empty p {
  margin: 0.5rem 0;
}

.text-hint {
  font-size: 0.875rem;
}

.btn-add {
  padding: 0.75rem 1.5rem;
  background: var(--blue-100);
  color: #1d4ed8;
  border: 1px solid var(--blue-300);
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-add:hover {
  background: var(--blue-200);
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
