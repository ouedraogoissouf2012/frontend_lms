<template>
  <aside class="chapter-sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <h2 class="sidebar-title">Sommaire</h2>
      <button @click="$emit('toggle')" class="btn-toggle-sidebar">
        <i :class="collapsed ? 'fa fa-chevron-right' : 'fa fa-chevron-left'"></i>
      </button>
    </div>

    <!-- Lesson Meta -->
    <div class="sidebar-meta" v-if="lesson">
      <div class="meta-row" v-if="lesson.enseignant">
        <i class="fa fa-user"></i>
        <span>{{ lesson.enseignant.name || lesson.enseignant }}</span>
      </div>
      <div class="meta-row" v-if="lesson.matiere">
        <i class="fa fa-book"></i>
        <span>{{ lesson.matiere.name || lesson.matiere.libelle || lesson.matiere }}</span>
      </div>
      <div class="meta-row" v-if="lesson.duree_estimee_minutes">
        <i class="fa fa-clock-o"></i>
        <span>{{ lesson.duree_estimee_minutes }} min</span>
      </div>
    </div>

    <!-- Chapter List -->
    <nav class="chapter-list">
      <button
        v-for="(chapter, index) in chapters"
        :key="chapter.id"
        class="chapter-nav-item"
        :class="{
          active: activeChapterIndex === index,
          completed: isChapterCompleted(chapter.id)
        }"
        @click="$emit('select', index)"
      >
        <div class="chapter-status-icon">
          <i v-if="isChapterCompleted(chapter.id)" class="fa fa-check-circle"></i>
          <span v-else class="chapter-number">{{ index + 1 }}</span>
        </div>
        <div class="chapter-nav-info">
          <span class="chapter-nav-title">{{ chapter.title }}</span>
          <span class="chapter-nav-type">{{ getContentTypeLabel(chapter.content_type) }}</span>
        </div>
      </button>
    </nav>
  </aside>
</template>

<script setup>
/**
 * Sidebar de navigation des chapitres d'une leçon (#28, tranche 2).
 * Sous-composant de présentation extrait de StudentLessonView.vue.
 * Émet select (index) / toggle ; l'état (collapsed, chapitre actif) reste au parent.
 */
import { getContentTypeLabel } from '@/utils/lessonContent'

const props = defineProps({
  lesson: { type: Object, default: null },
  chapters: { type: Array, default: () => [] },
  activeChapterIndex: { type: Number, default: 0 },
  // Set des ids de chapitres complétés
  completedChapters: { type: Object, default: () => new Set() },
  collapsed: { type: Boolean, default: false }
})

defineEmits(['select', 'toggle'])

function isChapterCompleted(chapterId) {
  return props.completedChapters.has(chapterId)
}
</script>

<style scoped>
.chapter-sidebar {
  width: 300px;
  background: var(--card-bg);
  border-right: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
  transition: width 0.3s ease, transform 0.3s ease;
}

.chapter-sidebar.collapsed {
  width: 0;
  overflow: hidden;
  border-right: none;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-primary);
}

.sidebar-title {
  font-size: 1rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

.btn-toggle-sidebar {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  font-size: 1rem;
}

.sidebar-meta {
  padding: 0.75rem 1.25rem;
  border-bottom: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.meta-row i {
  width: 1rem;
  text-align: center;
  color: var(--blue-500);
}

/* Chapter navigation items */
.chapter-list {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.chapter-nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  border-left: 3px solid transparent;
  color: var(--text-secondary);
  cursor: pointer;
  text-align: left;
  transition: all 0.2s;
}

.chapter-nav-item:hover {
  background: rgba(59, 130, 246, 0.05);
  color: var(--text-primary);
}

.chapter-nav-item.active {
  background: rgba(59, 130, 246, 0.1);
  border-left-color: var(--blue-500);
  color: var(--text-primary);
}

.chapter-nav-item.completed .chapter-status-icon {
  color: #10b981;
}

.chapter-status-icon {
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: var(--bg-secondary);
  flex-shrink: 0;
  font-size: 0.75rem;
  font-weight: 700;
}

.chapter-nav-item.active .chapter-status-icon {
  background: var(--blue-500);
  color: white;
}

.chapter-nav-item.completed .chapter-status-icon {
  background: rgba(16, 185, 129, 0.15);
}

.chapter-nav-item.completed .chapter-status-icon i {
  font-size: 1rem;
}

.chapter-number {
  font-size: 0.75rem;
  font-weight: 700;
}

.chapter-nav-info {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.chapter-nav-title {
  font-size: 0.875rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chapter-nav-type {
  font-size: 0.7rem;
  opacity: 0.6;
  margin-top: 2px;
}

/* Responsive */
@media (max-width: 768px) {
  .chapter-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 50;
    width: 280px;
    box-shadow: 4px 0 20px rgba(0, 0, 0, 0.3);
  }

  .chapter-sidebar.collapsed {
    transform: translateX(-100%);
    width: 280px;
  }
}
</style>
