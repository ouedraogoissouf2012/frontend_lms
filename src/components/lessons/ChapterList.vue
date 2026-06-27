<template>
  <div class="chapters-container">
    <!-- Existing chapters -->
    <div
      v-for="(chapter, index) in chapters"
      :key="chapter.id || chapter.tempId"
      class="chapter-block"
    >
      <div class="chapter-header-bar">
        <div class="chapter-number-badge">Chapitre {{ index + 1 }}</div>
        <div v-if="!chapter.isEditing && !readonly" class="chapter-actions-inline">
          <button @click="$emit('edit', chapter)" class="btn-edit" title="Modifier">
            Modifier
          </button>
          <button @click="$emit('delete', chapter)" class="btn-delete" title="Supprimer">
            Supprimer
          </button>
        </div>
      </div>

      <!-- Edit Mode (#28 : extrait en sous-composant) -->
      <ChapterEditForm
        v-if="chapter.isEditing"
        :chapter="chapter"
        :quiz="getChapterQuiz(chapter.id)"
        :saving="saving"
        @save="$emit('save', $event)"
        @cancel="$emit('cancel', $event)"
        @open-quiz-editor="(...args) => $emit('open-quiz-editor', ...args)"
      />

      <!-- View Mode (#28 : extrait en sous-composant) -->
      <ChapterViewMode
        v-else
        :chapter="chapter"
        :quiz="getChapterQuiz(chapter.id)"
        :readonly="readonly"
        @open-quiz-player="$emit('open-quiz-player', $event)"
        @open-quiz-editor="(...args) => $emit('open-quiz-editor', ...args)"
      />
    </div>

    <!-- Add Chapter Button (at the end) -->
    <div v-if="!readonly" class="add-chapter-section">
      <button @click="$emit('add')" class="btn-add-chapter-professional">
        + Ajouter un chapitre
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Liste des chapitres d'une leçon (#28 ; éclaté sous 300 lignes en H5).
 * Sous-composant présentationnel extrait de ChapterManager.vue : rend chaque
 * chapitre (badge + actions + mode édition/lecture) et le bouton d'ajout.
 * Les données et la logique restent au parent via useChapterManager ; ce
 * composant ne fait que rendre et relayer les actions. CSS déplacé verbatim.
 */
import ChapterViewMode from '@/components/lessons/ChapterViewMode.vue'
import ChapterEditForm from '@/components/lessons/ChapterEditForm.vue'

defineProps({
  chapters: { type: Array, default: () => [] },
  readonly: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
  // Résout le quiz d'un chapitre depuis l'état knowledgeChecks (au parent).
  getChapterQuiz: { type: Function, required: true }
})

defineEmits(['edit', 'delete', 'save', 'cancel', 'open-quiz-editor', 'open-quiz-player', 'add'])
</script>

<style scoped>
/* Chapters Container */
.chapters-container {
  padding: 24px;
}

.chapter-block {
  background: var(--card-bg);
  border: 3px solid var(--border-color);
  border-left: 6px solid var(--color-primary, var(--emerald-500));
  border-radius: 12px;
  margin-bottom: 24px;
  overflow: hidden;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
}

.chapter-block:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  transform: translateY(-3px);
  border-color: var(--color-primary, var(--emerald-500));
}

.chapter-header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: var(--bg-secondary);
  border-bottom: 3px solid var(--color-primary, var(--emerald-500));
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.chapter-number-badge {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary, var(--blue-500));
}

.chapter-actions-inline {
  display: flex;
  gap: 8px;
}

.btn-edit,
.btn-delete {
  padding: 6px 12px;
  font-size: 0.8125rem;
  border: 3px solid var(--border-color);
  border-radius: 6px;
  background: var(--card-bg);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

.btn-edit {
  color: var(--color-primary, var(--emerald-500));
}

.btn-edit:hover {
  background: rgba(16, 185, 129, 0.15);
  border-color: var(--color-primary, var(--emerald-500));
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-delete {
  color: var(--red-600);
}

.btn-delete:hover {
  background: rgba(220, 38, 38, 0.15);
  border-color: var(--red-600);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.3);
}

/* Add Chapter Section */
.add-chapter-section {
  text-align: center;
  padding: 24px 0 0;
}

.btn-add-chapter-professional {
  padding: 14px 36px;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-primary, var(--emerald-500));
  background: var(--card-bg);
  border: 4px dashed var(--color-primary, var(--emerald-500));
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.btn-add-chapter-professional:hover {
  background: rgba(16, 185, 129, 0.15);
  border-style: solid;
  border-width: 4px;
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.3);
}

/* Responsive */
@media (max-width: 768px) {
  .chapters-container {
    padding: 16px;
  }

  .chapter-header-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
