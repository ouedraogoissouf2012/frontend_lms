<template>
  <div class="lesson-actions">
    <!-- Enseignant: actions CRUD -->
    <template v-if="isTeacher">
      <button
        v-if="lesson.status === 'draft'"
        @click.stop="$emit('publish', lesson.id)"
        class="btn-action btn-publish"
      >
        <i class="fa fa-check"></i> Publier
      </button>
      <button
        v-else-if="lesson.status === 'published'"
        @click.stop="$emit('unpublish', lesson.id)"
        class="btn-action btn-unpublish"
      >
        <i class="fa fa-times"></i> Dépublier
      </button>
      <button
        @click.stop="$emit('edit', lesson.id)"
        class="btn-action btn-edit"
      >
        <i class="fa fa-pencil"></i> Modifier
      </button>
      <button
        @click.stop="$emit('delete', lesson.id)"
        class="btn-action btn-delete"
      >
        <i class="fa fa-trash-o"></i> Supprimer
      </button>
    </template>

    <!-- Étudiant/Tous: bouton consulter -->
    <button
      @click.stop="$emit('view', lesson.id)"
      class="btn-primary"
    >
      {{ isTeacher ? '▶ Détails' : '▶ Consulter' }}
    </button>
  </div>
</template>

<script setup>
/**
 * Actions du pied d'une LessonCard (#H4 ≤300). Selon `isTeacher` : CRUD
 * (publier/dépublier/modifier/supprimer) ou simple consultation. Relaie les actions
 * via emit, API identique à l'original (view/edit/delete/publish/unpublish).
 */
defineProps({
  lesson: { type: Object, required: true },
  isTeacher: { type: Boolean, default: false }
})

defineEmits(['view', 'edit', 'delete', 'publish', 'unpublish'])
</script>

<style scoped>
.lesson-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Buttons */
.btn-action,
.btn-primary {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-action {
  background: var(--bg-primary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-action:hover {
  background: var(--border-primary);
}

.btn-publish {
  color: var(--emerald-600);
  border-color: var(--emerald-600);
}

.btn-publish:hover {
  background: var(--emerald-100);
}

.btn-unpublish {
  color: var(--amber-600);
  border-color: var(--amber-600);
}

.btn-unpublish:hover {
  background: var(--warning-bg);
}

.btn-edit {
  color: var(--blue-500);
  border-color: var(--blue-500);
}

.btn-edit:hover {
  background: var(--blue-100);
}

.btn-delete {
  color: var(--red-600);
  border-color: var(--red-600);
}

.btn-delete:hover {
  background: var(--error-bg);
}

.btn-primary {
  background: linear-gradient(135deg, var(--blue-500), var(--violet-500));
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-primary:hover {
  background: linear-gradient(135deg, var(--color-info-strong), var(--violet-600));
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 640px) {
  .lesson-actions {
    flex-direction: column;
  }
}
</style>
