<template>
  <div class="form-section">
    <h2 class="section-title"><i class="fa fa-info-circle"></i> Informations de base</h2>

    <div class="form-row">
      <div class="form-group full-width">
        <label class="form-label required">Titre</label>
        <input
          v-model="title"
          type="text"
          required
          class="form-input"
          placeholder="Ex: Introduction à Laravel"
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group full-width">
        <label class="form-label">Description courte</label>
        <textarea
          v-model="description"
          rows="3"
          class="form-textarea"
          placeholder="Résumé de la leçon (2-3 phrases)"
        ></textarea>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label required">Type de leçon</label>
        <select v-model="type" required class="form-select">
          <option value="cours">Cours magistral</option>
          <option value="tp">Travaux Pratiques (TP)</option>
          <option value="td">Travaux Dirigés (TD)</option>
          <option value="projet">Projet</option>
          <option value="autre">Autre</option>
        </select>
      </div>

      <div class="form-group">
        <label class="form-label">Durée estimée (minutes)</label>
        <input
          v-model.number="durationMinutes"
          type="number"
          min="1"
          class="form-input"
          placeholder="Ex: 120"
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Matière</label>
        <select v-model.number="matiereId" class="form-select" @change="$emit('load-chapters')">
          <option :value="null">Sélectionnez une matière</option>
          <option v-for="matiere in matieres" :key="matiere.id" :value="matiere.id">
            {{ matiere.nom || matiere.name }}
          </option>
        </select>
        <p class="form-hint">Optionnel - Matière associée à cette leçon</p>
      </div>

      <div class="form-group">
        <label class="form-label">Classe</label>
        <select v-model.number="classeId" class="form-select">
          <option :value="null">Sélectionnez une classe</option>
          <option v-for="classe in classes" :key="classe.id" :value="classe.id">
            {{ classe.name || classe.nom }}
          </option>
        </select>
        <p class="form-hint">Optionnel - Classe associée à cette leçon</p>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group full-width">
        <label class="form-label">Chapitre / Module (optionnel)</label>
        <select v-model="chapterId" class="form-select" :disabled="loadingChapters">
          <option :value="null">Aucun chapitre (leçon indépendante)</option>
          <option v-for="chapter in chapters" :key="chapter.id" :value="chapter.id">
            {{ chapter.title }}
          </option>
        </select>
        <p class="form-hint">Associer cette leçon à un chapitre pour mieux organiser votre cours</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Section « Informations de base » de LessonEditor (#H4 ≤300) : titre, description,
 * type, durée, matière, classe, chapitre. Champs en v-model (defineModel) ; matières/
 * classes/chapitres via props ; `load-chapters` émis au changement de matière.
 * Chrome de formulaire dupliqué VERBATIM (pas de partial, choix utilisateur).
 */
const title = defineModel('title', { type: String, default: '' })
const description = defineModel('description', { type: String, default: '' })
const type = defineModel('type', { type: String, default: 'cours' })
const durationMinutes = defineModel('durationMinutes', { default: null })
const matiereId = defineModel('matiereId', { default: null })
const classeId = defineModel('classeId', { default: null })
const chapterId = defineModel('chapterId', { default: null })

defineProps({
  matieres: { type: Array, default: () => [] },
  classes: { type: Array, default: () => [] },
  chapters: { type: Array, default: () => [] },
  loadingChapters: { type: Boolean, default: false }
})

defineEmits(['load-chapters'])
</script>

<style scoped>
.form-section {
  background: var(--card-bg);
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: var(--card-shadow);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
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

.form-label.required::after {
  content: ' *';
  color: #ef4444;
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

.form-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

/* Responsive */
@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
</style>
