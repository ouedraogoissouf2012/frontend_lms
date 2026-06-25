<template>
  <div>
    <!-- Actions header -->
    <div class="mb-4 flex justify-between items-center">
      <!-- Toggle view mode -->
      <div class="view-toggle">
        <button
          @click="viewMode = 'grid'"
          :class="['toggle-btn', viewMode === 'grid' ? 'active' : '']"
          title="Affichage grille"
        >
          <i class="fa fa-th"></i> Grille
        </button>
        <button
          @click="viewMode = 'list'"
          :class="['toggle-btn', viewMode === 'list' ? 'active' : '']"
          title="Affichage liste"
        >
          <i class="fa fa-bars"></i> Liste
        </button>
      </div>

      <!-- Bouton création (enseignant uniquement) -->
      <button
        v-if="isTeacher"
        @click="$emit('create')"
        class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
      >
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
        </svg>
        Nouvelle leçon
      </button>
    </div>

    <!-- Grid view -->
    <div v-if="lessons && lessons.length > 0 && viewMode === 'grid'" class="lessons-grid">
      <LessonCard
        v-for="lesson in lessons"
        :key="lesson.id"
        :lesson="lesson"
        :is-teacher="isTeacher"
        :show-progress="!isTeacher"
        :show-stats="isTeacher"
        :show-status="isTeacher"
        @view="$emit('view', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @publish="$emit('publish', $event)"
        @unpublish="$emit('unpublish', $event)"
      />
    </div>

    <!-- List view -->
    <div v-if="lessons && lessons.length > 0 && viewMode === 'list'" class="lessons-list">
      <LessonCard
        v-for="lesson in lessons"
        :key="lesson.id"
        :lesson="lesson"
        :is-teacher="isTeacher"
        :show-progress="!isTeacher"
        :show-stats="isTeacher"
        :show-status="isTeacher"
        @view="$emit('view', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
        @publish="$emit('publish', $event)"
        @unpublish="$emit('unpublish', $event)"
      />
    </div>

    <!-- Empty state - only show when no lessons exist -->
    <div v-if="!loading && (!lessons || lessons.length === 0)" class="text-center py-12 text-gray-500">
      <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
      <p class="font-medium text-gray-900 mb-2">Aucune leçon disponible</p>
      <p class="text-sm">{{ isTeacher ? 'Créez votre première leçon pour cette matière' : 'Aucune leçon n\'a encore été publiée' }}</p>
      <button
        v-if="isTeacher"
        @click="$emit('create')"
        class="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
      >
        Créer ma première leçon
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Onglet Leçons de MatiereDetails (#H9 ≤300). Présentation pure : bascule
 * d'affichage grille/liste, cartes LessonCard et état vide. Relaie les actions
 * (create/view/edit/delete/publish/unpublish) ; viewMode en v-model.
 */
import LessonCard from '@/components/lessons/LessonCard.vue'

defineProps({
  lessons: { type: Array, default: () => [] },
  isTeacher: { type: Boolean, default: false },
  loading: { type: Boolean, default: false }
})
const viewMode = defineModel('viewMode', { type: String, default: 'grid' })
defineEmits(['create', 'view', 'edit', 'delete', 'publish', 'unpublish'])
</script>

<style scoped>
/* View Toggle */
.view-toggle {
  display: flex;
  gap: 0;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  padding: 0.25rem;
  border: 1px solid var(--border-primary);
}

.toggle-btn {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.toggle-btn:hover {
  color: var(--text-primary);
}

.toggle-btn.active {
  background: var(--card-bg);
  color: #3b82f6;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Lessons Grid */
.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
}

/* Lessons List */
.lessons-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .lessons-grid {
    grid-template-columns: 1fr;
  }
}
</style>
