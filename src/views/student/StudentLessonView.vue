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
      <main class="content-area">
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
        <div v-else-if="activeChapter" class="chapter-content-wrapper">
          <!-- Chapter Header -->
          <div class="chapter-header">
            <div class="chapter-breadcrumb">
              Chapitre {{ activeChapterIndex + 1 }} sur {{ chapters.length }}
            </div>
            <h2 class="chapter-title">{{ activeChapter.title }}</h2>
            <div class="chapter-type-badge" :class="activeChapter.content_type">
              <i :class="getContentTypeIcon(activeChapter.content_type)"></i>
              {{ getContentTypeLabel(activeChapter.content_type) }}
            </div>
          </div>

          <!-- ==================== CONTENT RENDERERS ==================== -->

          <!-- TEXT / MARKDOWN -->
          <div v-if="activeChapter.content_type === 'text' && activeChapter.content" class="content-block content-text">
            <div class="rendered-html" v-html="activeChapter.content"></div>
          </div>

          <!-- VIDEO -->
          <div v-if="activeChapter.content_type === 'video' && activeChapter.video_url" class="content-block content-video">
            <div class="video-container">
              <iframe
                v-if="getEmbedUrl(activeChapter.video_url)"
                :src="getEmbedUrl(activeChapter.video_url)"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
                class="video-iframe"
              ></iframe>
              <div v-else class="video-fallback">
                <i class="fa fa-play-circle"></i>
                <p>Vidéo non intégrable</p>
                <a :href="activeChapter.video_url" target="_blank" class="btn-external-video">
                  <i class="fa fa-external-link"></i> Ouvrir la vidéo
                </a>
              </div>
            </div>
          </div>

          <!-- POWERPOINT (slides images) — #28 : diaporama extrait en sous-composant -->
          <div v-if="activeChapter.content_type === 'powerpoint'" class="content-block content-slides">
            <SlidesViewer :slides="activeChapter.slides_images" />
          </div>

          <!-- WORD (HTML content) -->
          <div v-if="activeChapter.content_type === 'word' && activeChapter.content" class="content-block content-word">
            <div class="rendered-html word-document" v-html="activeChapter.content"></div>
          </div>

          <!-- PDF -->
          <div v-if="activeChapter.content_type === 'pdf'" class="content-block content-pdf">
            <div v-if="activeChapter.pdf_url || activeChapter.file_converted_path" class="pdf-viewer">
              <iframe
                :src="getPdfUrl(activeChapter)"
                class="pdf-iframe"
                frameborder="0"
              ></iframe>
              <a :href="getPdfUrl(activeChapter)" target="_blank" class="btn-open-pdf">
                <i class="fa fa-external-link"></i> Ouvrir le PDF en plein écran
              </a>
            </div>
            <div v-else class="pdf-empty">
              <i class="fa fa-file-pdf-o"></i>
              <p>Le document PDF n'est pas encore disponible.</p>
            </div>
          </div>

          <!-- LINK -->
          <div v-if="activeChapter.content_type === 'link' && activeChapter.external_link" class="content-block content-link">
            <div class="link-card">
              <i class="fa fa-external-link-square"></i>
              <div class="link-info">
                <h3>Ressource externe</h3>
                <p class="link-url">{{ activeChapter.external_link }}</p>
              </div>
              <a :href="activeChapter.external_link" target="_blank" rel="noopener" class="btn-open-link">
                Ouvrir <i class="fa fa-arrow-right"></i>
              </a>
            </div>
          </div>

          <!-- QUIZ -->
          <div v-if="activeChapter.content_type === 'quiz'" class="content-block content-quiz">
            <div v-if="chapterQuiz">
              <KnowledgeCheckPlayer
                :quiz="chapterQuiz"
                @completed="onQuizCompleted"
                @close="onQuizClose"
              />
            </div>
            <div v-else class="quiz-empty">
              <i class="fa fa-question-circle"></i>
              <p>Le quiz n'est pas encore disponible.</p>
            </div>
          </div>

          <!-- No content fallback (exclude types that have their own empty state) -->
          <div v-if="isContentEmpty(activeChapter) && !['quiz', 'powerpoint', 'pdf'].includes(activeChapter.content_type)" class="content-block content-empty-chapter">
            <i class="fa fa-info-circle"></i>
            <p>Le contenu de ce chapitre n'est pas encore disponible.</p>
          </div>

          <!-- ==================== BOTTOM ACTIONS ==================== -->
          <div class="chapter-bottom-actions">
            <button
              v-if="!isChapterCompleted(activeChapter.id)"
              @click="markChapterComplete"
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
                @click="prevChapter"
                :disabled="activeChapterIndex === 0"
                class="btn-nav prev"
              >
                <i class="fa fa-arrow-left"></i> Précédent
              </button>
              <button
                @click="nextChapter"
                :disabled="activeChapterIndex >= chapters.length - 1"
                class="btn-nav next"
              >
                Suivant <i class="fa fa-arrow-right"></i>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>

<script>
import lessonService from '@/services/lesson'
import chapterProgressService from '@/services/chapterProgress'
import api from '@/services/api'
import KnowledgeCheckPlayer from '@/components/lessons/KnowledgeCheckPlayer.vue'
import SlidesViewer from '@/components/lessons/SlidesViewer.vue'
import LessonChapterSidebar from '@/components/lessons/LessonChapterSidebar.vue'
// #28 : logique pure extraite (testée dans tests/unit/lessonContent.test.js)
// (getSlideUrl + navigation slides déplacés dans SlidesViewer)
import {
  getVideoEmbedUrl,
  getPdfUrl as pdfUrl,
  getContentTypeLabel as contentTypeLabel,
  getContentTypeIcon as contentTypeIcon,
  isChapterContentEmpty
} from '@/utils/lessonContent'

export default {
  name: 'StudentLessonView',
  components: { KnowledgeCheckPlayer, SlidesViewer, LessonChapterSidebar },

  data() {
    return {
      lesson: null,
      chapters: [],
      completedChapters: new Set(),
      activeChapterIndex: 0,
      sidebarCollapsed: false,
      loading: true,
      error: null,
      markingComplete: false,
      quizzes: {},
      chapterStartTime: null,
      showQuizPlayer: false
    }
  },

  computed: {
    lessonId() {
      return parseInt(this.$route.params.id)
    },
    activeChapter() {
      return this.chapters[this.activeChapterIndex] || null
    },
    chapterQuiz() {
      if (!this.activeChapter) return null
      return this.quizzes[this.activeChapter.id] || null
    },
    overallProgress() {
      if (this.chapters.length === 0) return 0
      return Math.round((this.completedChapters.size / this.chapters.length) * 100)
    }
  },

  watch: {
    activeChapterIndex() {
      this.showQuizPlayer = false
      this.trackTimeSpent()
      this.chapterStartTime = Date.now()
      // Scroll to top of content
      this.$nextTick(() => {
        const content = this.$el?.querySelector('.content-area')
        if (content) content.scrollTop = 0
      })
    }
  },

  mounted() {
    this.loadAll()
    this.chapterStartTime = Date.now()
    // Collapse sidebar on mobile
    if (window.innerWidth < 768) {
      this.sidebarCollapsed = true
    }
  },

  beforeUnmount() {
    this.trackTimeSpent()
  },

  methods: {
    async loadAll() {
      this.loading = true
      this.error = null
      try {
        // Load lesson details
        const lessonRes = await lessonService.getLesson(this.lessonId)
        if (lessonRes.success) {
          this.lesson = lessonRes.data
        }

        // Load chapters
        const chaptersRes = await api.get(`/lessons/${this.lessonId}/chapters`)
        if (chaptersRes.success) {
          this.chapters = chaptersRes.data || []
        }

        // Load chapter progress
        try {
          const progressRes = await api.get(`/lessons/${this.lessonId}/chapter-progress`)
          if (progressRes.success && progressRes.data) {
            const chapters = progressRes.data.chapters || []
            const completedIds = chapters
              .filter(c => c.is_completed)
              .map(c => c.chapter_id)
            this.completedChapters = new Set(completedIds)
          }
        } catch (e) {
          // Progress endpoint might not exist yet — graceful fallback
          console.warn('[StudentLesson] Progress endpoint not available:', e.message)
        }

        // Load quizzes for quiz-type chapters
        const quizPromises = this.chapters
          .filter(ch => ch.content_type === 'quiz')
          .map(async (chapter) => {
            try {
              const quizRes = await api.get(`/knowledge-checks/chapter/${chapter.id}`)
              if (quizRes.success && quizRes.data) {
                this.quizzes[chapter.id] = quizRes.data
              }
            } catch (e) {
              // Quiz may not exist yet for this chapter — silent
            }
          })
        await Promise.all(quizPromises)
      } catch (err) {
        console.error('[StudentLesson] Load error:', err)
        // #26 : messages spécifiques portés depuis l'ex-vue /lessons/:id.
        if (err.response?.status === 403) {
          this.error = "Cette leçon n'est pas encore disponible"
        } else if (err.response?.status === 404) {
          this.error = 'Leçon introuvable'
        } else {
          this.error = 'Impossible de charger le cours. Veuillez réessayer.'
        }
      } finally {
        this.loading = false
      }
    },

    setActiveChapter(index) {
      this.activeChapterIndex = index
      // On mobile, collapse sidebar after selection
      if (window.innerWidth < 768) {
        this.sidebarCollapsed = true
      }
    },

    prevChapter() {
      if (this.activeChapterIndex > 0) {
        this.activeChapterIndex--
      }
    },

    nextChapter() {
      if (this.activeChapterIndex < this.chapters.length - 1) {
        this.activeChapterIndex++
      }
    },

    isChapterCompleted(chapterId) {
      return this.completedChapters.has(chapterId)
    },

    async markChapterComplete() {
      if (!this.activeChapter) return
      this.markingComplete = true
      try {
        const timeSpent = Math.round((Date.now() - (this.chapterStartTime || Date.now())) / 1000)
        await chapterProgressService.markAsCompleted(this.activeChapter.id, timeSpent)
        this.completedChapters.add(this.activeChapter.id)
        // Force reactivity
        this.completedChapters = new Set(this.completedChapters)
        this.chapterStartTime = Date.now()

        // #26 : synchroniser la progression NIVEAU-LEÇON (table lesson_progress,
        // lue par la page matière / dashboard). Le backend a deux systèmes
        // distincts (chapter_progress vs lesson_progress) : l'ex-vue /lessons/:id
        // alimentait lesson_progress ; on préserve ce comportement ici.
        await this.syncLessonProgress()

        // Auto-advance to next chapter
        if (this.activeChapterIndex < this.chapters.length - 1) {
          setTimeout(() => {
            this.activeChapterIndex++
          }, 600)
        }
      } catch (err) {
        console.error('[StudentLesson] Mark complete error:', err)
        // Still mark locally even if API fails
        this.completedChapters.add(this.activeChapter.id)
        this.completedChapters = new Set(this.completedChapters)
      } finally {
        this.markingComplete = false
      }
    },

    /**
     * #26 : pont vers la progression niveau-leçon (table lesson_progress).
     * Le backend ne dérive PAS lesson_progress depuis chapter_progress ; cette
     * vue alimente donc les deux pour que la page matière/dashboard reste à jour.
     * Non bloquant : la progression chapitre reste la source fine de vérité.
     */
    async syncLessonProgress() {
      try {
        const percentage = this.overallProgress
        const durationMinutes = this.lesson?.duration_minutes || 0
        if (percentage >= 100) {
          await lessonService.markComplete(this.lessonId)
        } else {
          await lessonService.updateProgress(this.lessonId, percentage, durationMinutes)
        }
      } catch (e) {
        console.warn('[StudentLesson] Sync progression leçon échouée:', e?.message)
      }
    },

    async trackTimeSpent() {
      if (!this.activeChapter || !this.chapterStartTime) return
      const seconds = Math.round((Date.now() - this.chapterStartTime) / 1000)
      if (seconds > 5) {
        try {
          await chapterProgressService.updateTimeSpent(this.activeChapter.id, seconds)
        } catch (e) {
          // silent
        }
      }
    },

    // ==================== CONTENT HELPERS ====================

    // #28 : logique pure déléguée à utils/lessonContent
    getEmbedUrl(url) {
      return getVideoEmbedUrl(url)
    },

    getPdfUrl(chapter) {
      return pdfUrl(chapter)
    },

    getContentTypeLabel(type) {
      return contentTypeLabel(type)
    },

    getContentTypeIcon(type) {
      return contentTypeIcon(type)
    },

    isContentEmpty(chapter) {
      return isChapterContentEmpty(chapter, !!this.chapterQuiz)
    },

    async onQuizCompleted(resultData) {
      // Mark the chapter as completed if the quiz was passed
      if (resultData && resultData.passed) {
        this.completedChapters.add(this.activeChapter.id)
        this.completedChapters = new Set(this.completedChapters)
      }
      // Refresh quiz data to get updated scores
      if (this.activeChapter) {
        try {
          const quizRes = await api.get(`/knowledge-checks/chapter/${this.activeChapter.id}`)
          if (quizRes.success && quizRes.data) {
            this.quizzes[this.activeChapter.id] = quizRes.data
            // Force reactivity
            this.quizzes = { ...this.quizzes }
          }
        } catch (e) {
          // silent
        }
      }
    },

    onQuizClose() {
      // Nothing special needed — player resets to intro state internally
    },

    goBack() {
      this.$router.push({ name: 'student-courses' })
    }
  }
}
</script>

<style scoped>
/* ==================== LAYOUT ==================== */
.student-lesson-view {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: var(--bg-primary, #0f172a);
  color: var(--text-primary, #e2e8f0);
}

.top-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem 1.5rem;
  background: var(--card-bg, #1e293b);
  border-bottom: 1px solid var(--border-primary, #334155);
  z-index: 20;
  flex-shrink: 0;
}

.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px solid var(--border-primary, #334155);
  border-radius: 0.5rem;
  color: var(--text-secondary, #94a3b8);
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.btn-back:hover {
  background: var(--bg-secondary, #1e293b);
  color: var(--text-primary, #e2e8f0);
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
  background: var(--bg-secondary, #334155);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill-top {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #10b981);
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
  color: var(--text-secondary, #94a3b8);
}

.content-loading .spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-primary, #334155);
  border-top-color: #3b82f6;
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
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
}

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
  color: var(--text-secondary, #94a3b8);
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
  color: #60a5fa;
}

.chapter-type-badge.video { background: rgba(239, 68, 68, 0.1); color: #f87171; }
.chapter-type-badge.powerpoint { background: rgba(249, 115, 22, 0.1); color: #fb923c; }
.chapter-type-badge.word { background: rgba(59, 130, 246, 0.1); color: #60a5fa; }
.chapter-type-badge.pdf { background: rgba(220, 38, 38, 0.1); color: #f87171; }
.chapter-type-badge.link { background: rgba(139, 92, 246, 0.1); color: #a78bfa; }
.chapter-type-badge.quiz { background: rgba(16, 185, 129, 0.1); color: #34d399; }

/* Content blocks */
.content-block {
  margin-bottom: 2rem;
}

/* TEXT CONTENT */
.rendered-html {
  line-height: 1.8;
  font-size: 1.05rem;
  color: var(--text-primary, #e2e8f0);
}

.rendered-html :deep(h1),
.rendered-html :deep(h2),
.rendered-html :deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--text-primary, #e2e8f0);
}

.rendered-html :deep(p) {
  margin-bottom: 1rem;
}

.rendered-html :deep(ul),
.rendered-html :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.rendered-html :deep(li) {
  margin-bottom: 0.5rem;
}

.rendered-html :deep(blockquote) {
  border-left: 4px solid #3b82f6;
  padding: 1rem 1.25rem;
  margin: 1.5rem 0;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 0 0.5rem 0.5rem 0;
}

.rendered-html :deep(code) {
  background: var(--bg-secondary, #334155);
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.9em;
}

.rendered-html :deep(pre) {
  background: var(--bg-secondary, #334155);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.rendered-html :deep(img) {
  max-width: 100%;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.rendered-html :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.rendered-html :deep(th),
.rendered-html :deep(td) {
  padding: 0.75rem;
  border: 1px solid var(--border-primary, #334155);
  text-align: left;
}

.rendered-html :deep(th) {
  background: var(--bg-secondary, #334155);
  font-weight: 700;
}

/* Word documents specific */
.word-document {
  background: var(--card-bg, #1e293b);
  padding: 2rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-primary, #334155);
}

/* VIDEO CONTENT */
.video-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%;
  background: #000;
  border-radius: 0.75rem;
  overflow: hidden;
}

.video-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.video-fallback {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  color: #94a3b8;
}

.video-fallback i {
  font-size: 4rem;
  opacity: 0.5;
}

.btn-external-video {
  padding: 0.75rem 1.5rem;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 600;
}

/* SLIDES CONTENT : déplacé dans SlidesViewer.vue (#28) */

/* PDF CONTENT */
.pdf-viewer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.pdf-iframe {
  width: 100%;
  height: 75vh;
  border-radius: 0.75rem;
  border: 1px solid var(--border-primary, #334155);
}

.btn-open-pdf {
  align-self: flex-end;
  padding: 0.5rem 1rem;
  color: #60a5fa;
  text-decoration: none;
  font-size: 0.85rem;
}

.btn-open-pdf:hover {
  text-decoration: underline;
}

.pdf-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary, #94a3b8);
}

.pdf-empty i {
  font-size: 3rem;
  opacity: 0.5;
}

/* LINK CONTENT */
.link-card {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  padding: 1.5rem;
  background: var(--card-bg, #1e293b);
  border: 1px solid var(--border-primary, #334155);
  border-radius: 0.75rem;
}

.link-card > i {
  font-size: 2rem;
  color: #a78bfa;
}

.link-info {
  flex: 1;
  min-width: 0;
}

.link-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
}

.link-url {
  font-size: 0.85rem;
  color: var(--text-secondary, #94a3b8);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin: 0;
}

.btn-open-link {
  padding: 0.625rem 1.25rem;
  background: #7c3aed;
  color: white;
  text-decoration: none;
  border-radius: 0.5rem;
  font-weight: 600;
  white-space: nowrap;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.btn-open-link:hover {
  background: #6d28d9;
}

/* QUIZ CONTENT */
.quiz-card {
  text-align: center;
  padding: 3rem 2rem;
  background: var(--card-bg, #1e293b);
  border: 1px solid var(--border-primary, #334155);
  border-radius: 0.75rem;
}

.quiz-icon {
  font-size: 3rem;
  color: #34d399;
  margin-bottom: 1rem;
}

.quiz-card h3 {
  font-size: 1.25rem;
  margin: 0 0 0.5rem 0;
}

.quiz-meta {
  color: var(--text-secondary, #94a3b8);
  margin-bottom: 1.5rem;
}

.quiz-score {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.score-circle {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 0.95rem;
}

.score-circle.passed {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
  border: 2px solid #10b981;
}

.score-circle.failed {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
  border: 2px solid #ef4444;
}

.btn-start-quiz {
  padding: 0.75rem 2rem;
  background: linear-gradient(135deg, #10b981, #059669);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s;
}

.btn-start-quiz:hover {
  transform: translateY(-2px);
}

.quiz-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary, #94a3b8);
}

.quiz-empty i {
  font-size: 3rem;
  opacity: 0.5;
}

/* Empty chapter content */
.content-empty-chapter {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary, #94a3b8);
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
  border-top: 1px solid var(--border-primary, #334155);
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
  background: var(--card-bg, #1e293b);
  border: 1px solid var(--border-primary, #334155);
  color: var(--text-primary, #e2e8f0);
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-nav:hover:not(:disabled) {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.btn-nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-nav.next {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.btn-nav.next:hover:not(:disabled) {
  background: #2563eb;
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
  background: #3b82f6;
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
