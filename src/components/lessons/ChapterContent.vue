<template>
  <div class="chapter-content-wrapper">
    <!-- Chapter Header -->
    <div class="chapter-header">
      <div class="chapter-breadcrumb">
        Chapitre {{ activeChapterIndex + 1 }} sur {{ chaptersLength }}
      </div>
      <h2 class="chapter-title">{{ chapter.title }}</h2>
      <div class="chapter-type-badge" :class="chapter.content_type">
        <i :class="getContentTypeIcon(chapter.content_type)"></i>
        {{ getContentTypeLabel(chapter.content_type) }}
      </div>
    </div>

    <!-- ==================== CONTENT RENDERERS ==================== -->

    <!-- TEXT / WORD -->
    <ChapterTextRenderer :chapter="chapter" />

    <!-- VIDEO / PDF / LINK -->
    <ChapterMediaRenderer :chapter="chapter" />

    <!-- POWERPOINT (slides images) — #28 : diaporama extrait en sous-composant -->
    <div v-if="chapter.content_type === 'powerpoint'" class="content-block content-slides">
      <SlidesViewer :slides="chapter.slides_images" />
    </div>

    <!-- QUIZ -->
    <ChapterQuizRenderer
      v-if="chapter.content_type === 'quiz'"
      :quiz="quiz"
      @completed="$emit('quiz-completed', $event)"
      @close="$emit('quiz-close')"
    />

    <!-- No content fallback (exclude types that have their own empty state) -->
    <div v-if="isContentEmpty(chapter) && !['quiz', 'powerpoint', 'pdf'].includes(chapter.content_type)" class="content-block content-empty-chapter">
      <i class="fa fa-info-circle"></i>
      <p>Le contenu de ce chapitre n'est pas encore disponible.</p>
    </div>

    <!-- ==================== BOTTOM ACTIONS ==================== -->
    <div class="chapter-bottom-actions">
      <button
        v-if="!completed"
        @click="$emit('mark-complete')"
        class="btn-mark-complete"
        :disabled="markingComplete"
      >
        <i class="fa fa-check"></i>
        {{ markingComplete ? 'En cours...' : 'Marquer comme terminé' }}
      </button>
      <div v-else class="completed-badge">
        <i class="fa fa-check-circle"></i> Chapitre terminé
      </div>

      <div class="nav-buttons">
        <button
          @click="$emit('prev')"
          :disabled="activeChapterIndex === 0"
          class="btn-nav prev"
        >
          <i class="fa fa-arrow-left"></i> Précédent
        </button>
        <button
          @click="$emit('next')"
          :disabled="activeChapterIndex >= chaptersLength - 1"
          class="btn-nav next"
        >
          Suivant <i class="fa fa-arrow-right"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Contenu du chapitre actif (#H4 ≤300) : en-tête (breadcrumb/titre/badge type), rendu
 * par type (texte/word, média, diaporama, quiz, fallback vide) et actions bas de page
 * (terminer + navigation). Présentationnel ; actions relayées via emit.
 */
import SlidesViewer from '@/components/lessons/SlidesViewer.vue'
import ChapterTextRenderer from '@/components/lessons/ChapterTextRenderer.vue'
import ChapterMediaRenderer from '@/components/lessons/ChapterMediaRenderer.vue'
import ChapterQuizRenderer from '@/components/lessons/ChapterQuizRenderer.vue'
import {
  getContentTypeLabel as contentTypeLabel,
  getContentTypeIcon as contentTypeIcon,
  isChapterContentEmpty
} from '@/utils/lessonContent'

const props = defineProps({
  chapter: { type: Object, required: true },
  quiz: { type: Object, default: null },
  activeChapterIndex: { type: Number, default: 0 },
  chaptersLength: { type: Number, default: 0 },
  markingComplete: { type: Boolean, default: false },
  completed: { type: Boolean, default: false }
})

defineEmits(['mark-complete', 'prev', 'next', 'quiz-completed', 'quiz-close'])

const getContentTypeLabel = (type) => contentTypeLabel(type)
const getContentTypeIcon = (type) => contentTypeIcon(type)
const isContentEmpty = (chapter) => isChapterContentEmpty(chapter, !!props.quiz)
</script>

<style scoped>
/* ==================== CHAPTER CONTENT ==================== */
.chapter-content-wrapper {
  max-width: 900px;
  margin: 0 auto;
}

.chapter-header {
  margin-bottom: 2rem;
}

.chapter-breadcrumb {
  font-size: 0.8rem;
  color: var(--text-secondary);
  margin-bottom: 0.5rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.chapter-title {
  font-size: 1.75rem;
  font-weight: 800;
  margin: 0 0 0.75rem 0;
  line-height: 1.3;
}

.chapter-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.3rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(59, 130, 246, 0.1);
  color: var(--blue-400);
}

.chapter-type-badge.video { background: rgba(239, 68, 68, 0.1); color: #f87171; }
.chapter-type-badge.powerpoint { background: rgba(249, 115, 22, 0.1); color: #fb923c; }
.chapter-type-badge.word { background: rgba(59, 130, 246, 0.1); color: var(--blue-400); }
.chapter-type-badge.pdf { background: rgba(220, 38, 38, 0.1); color: #f87171; }
.chapter-type-badge.link { background: rgba(139, 92, 246, 0.1); color: #a78bfa; }
.chapter-type-badge.quiz { background: rgba(16, 185, 129, 0.1); color: #34d399; }

/* Content blocks */
.content-block {
  margin-bottom: 2rem;
}

/* Empty chapter content */
.content-empty-chapter {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.content-empty-chapter i {
  font-size: 2.5rem;
  opacity: 0.5;
  margin-bottom: 0.5rem;
}

/* ==================== BOTTOM ACTIONS ==================== */
.chapter-bottom-actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 0;
  border-top: 1px solid var(--border-primary);
  margin-top: 2rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn-mark-complete {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-mark-complete:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-mark-complete:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.completed-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: rgba(16, 185, 129, 0.1);
  color: #10b981;
  border-radius: 0.5rem;
  font-weight: 700;
}

.nav-buttons {
  display: flex;
  gap: 0.75rem;
}

.btn-nav {
  padding: 0.625rem 1.25rem;
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  color: var(--text-primary);
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-nav:hover:not(:disabled) {
  background: var(--blue-500);
  border-color: var(--blue-500);
  color: white;
}

.btn-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-nav.next {
  background: var(--blue-500);
  border-color: var(--blue-500);
  color: white;
}

.btn-nav.next:hover:not(:disabled) {
  background: #2563eb;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .chapter-title {
    font-size: 1.35rem;
  }

  .chapter-bottom-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .nav-buttons {
    justify-content: space-between;
  }
}
</style>
