<template>
  <div class="student-lesson-view" :class="{ 'sidebar-collapsed': sidebarCollapsed }">
    <!-- Top Progress Bar -->
    <div class="top-bar">
      <button @click="goBack" class="btn-back">
        <i class="fa fa-arrow-left"></i>
        <span class="back-text">Mes Cours</span>
      </button>

      <div class="lesson-title-bar" v-if="lesson">
        <h1 class="top-lesson-title">{{ lesson.title }}</h1>
      </div>

      <div class="progress-section" v-if="lesson">
        <div class="progress-bar-top">
          <div class="progress-fill-top" :style="{ width: overallProgress + '%' }"></div>
        </div>
        <span class="progress-label">{{ overallProgress }}%</span>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="lesson-body">
      <!-- Sidebar: Chapter Navigation (#28 : extrait en sous-composant) -->
      <LessonChapterSidebar
        :lesson="lesson"
        :chapters="chapters"
        :active-chapter-index="activeChapterIndex"
        :completed-chapters="completedChapters"
        :collapsed="sidebarCollapsed"
        @select="setActiveChapter"
        @toggle="sidebarCollapsed = !sidebarCollapsed"
      />

      <!-- Mobile sidebar toggle -->
      <button v-if="sidebarCollapsed" @click="sidebarCollapsed = false" class="btn-open-sidebar-mobile">
        <i class="fa fa-list"></i>
      </button>

      <!-- Main Content -->
      <main class="content-area" ref="contentAreaRef">
        <!-- Loading -->
        <div v-if="loading" class="content-loading">
          <div class="spinner"></div>
          <p>Chargement du cours...</p>
        </div>

        <!-- Error -->
        <div v-else-if="error" class="content-error">
          <i class="fa fa-exclamation-triangle"></i>
          <p>{{ error }}</p>
          <button @click="loadAll" class="btn-retry">Réessayer</button>
        </div>

        <!-- No chapters -->
        <div v-else-if="chapters.length === 0" class="content-empty">
          <i class="fa fa-book"></i>
          <h3>Aucun contenu disponible</h3>
          <p>L'enseignant n'a pas encore ajouté de contenu à ce cours.</p>
        </div>

        <!-- Active Chapter Content -->
        <ChapterContent
          v-else-if="activeChapter"
          :chapter="activeChapter"
          :quiz="chapterQuiz"
          :active-chapter-index="activeChapterIndex"
          :chapters-length="chapters.length"
          :marking-complete="markingComplete"
          :completed="isChapterCompleted(activeChapter.id)"
          @mark-complete="markChapterComplete"
          @prev="prevChapter"
          @next="nextChapter"
          @quiz-completed="onQuizCompleted"
          @quiz-close="onQuizClose"
        />
      </main>
    </div>
  </div>
</template>

<script setup>
/**
 * Vue de lecture d'un cours côté élève (#H4 ≤300) — orchestrateur. Données/logique
 * dans useStudentLessonView ; UI composée de LessonChapterSidebar + ChapterContent.
 * Barre supérieure (progression), états chargement/erreur/vide restent ici.
 */
import ChapterContent from '@/components/lessons/ChapterContent.vue'
import LessonChapterSidebar from '@/components/lessons/LessonChapterSidebar.vue'
import { useStudentLessonView } from '@/composables/useStudentLessonView'

const {
  lesson, chapters, completedChapters, activeChapterIndex, sidebarCollapsed,
  loading, error, markingComplete, contentAreaRef,
  activeChapter, chapterQuiz, overallProgress,
  loadAll, setActiveChapter, prevChapter, nextChapter, isChapterCompleted,
  markChapterComplete, onQuizCompleted, onQuizClose, goBack
} = useStudentLessonView()
</script>

<style scoped>
/* ==================== LAYOUT ==================== */
.student-lesson-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary);
  color: var(--text-primary);
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--card-bg);
  border-bottom: 1px solid var(--border-primary);
  z-index: 20;
  flex-shrink: 0;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-back:hover {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.lesson-title-bar {
  flex: 1;
  min-width: 0;
}

.top-lesson-title {
  font-size: 1.125rem;
  font-weight: 700;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

.progress-bar-top {
  width: 120px;
  height: 6px;
  background: var(--bg-secondary);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill-top {
  height: 100%;
  background: linear-gradient(90deg, var(--blue-500), #10b981);
  border-radius: 3px;
  transition: width 0.5s ease;
}

.progress-label {
  font-size: 0.8rem;
  font-weight: 700;
  color: #10b981;
  min-width: 2.5rem;
  text-align: right;
}

/* ==================== BODY LAYOUT ==================== */
.lesson-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* ==================== MAIN CONTENT ==================== */
.content-area {
  flex: 1;
  overflow-y: auto;
  padding: 2rem;
  min-width: 0;
}

/* Loading / Error / Empty states */
.content-loading, .content-error, .content-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 60vh;
  text-align: center;
  gap: 1rem;
  color: var(--text-secondary);
}

.content-loading .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-primary);
  border-top-color: var(--blue-500);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.content-error i, .content-empty i {
  font-size: 3rem;
  opacity: 0.5;
}

.btn-retry {
  padding: 0.5rem 1.5rem;
  background: var(--blue-500);
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

/* Mobile sidebar open button */
.btn-open-sidebar-mobile {
  display: none;
  position: fixed;
  bottom: 1.5rem;
  left: 1.5rem;
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: var(--blue-500);
  color: white;
  border: none;
  cursor: pointer;
  z-index: 30;
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  font-size: 1.25rem;
  align-items: center;
  justify-content: center;
}

/* ==================== RESPONSIVE ==================== */
@media (max-width: 768px) {
  .top-bar {
    padding: 0.5rem 1rem;
  }

  .back-text {
    display: none;
  }

  .top-lesson-title {
    font-size: 0.95rem;
  }

  .progress-bar-top {
    width: 60px;
  }

  .btn-open-sidebar-mobile {
    display: flex;
  }

  .content-area {
    padding: 1rem;
  }
}
</style>
