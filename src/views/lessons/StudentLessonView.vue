<template>
  <DashboardLayout>
    <div class="lesson-view-container">
      <!-- Loading State -->
      <ContentLoader v-if="loading" text="Chargement de la leçon..." />

      <!-- Error State -->
      <div v-else-if="error" class="error-state">
        <div class="error-icon">[!]</div>
        <h2>Erreur</h2>
        <p>{{ error }}</p>
        <button @click="$router.push('/student/courses')" class="btn-back">
          Retour aux cours
        </button>
      </div>

      <!-- Lesson Content -->
      <div v-else-if="lesson" class="lesson-content">
        <!-- Header -->
        <div class="lesson-header">
          <button @click="goBack" class="btn-back-link">
            ← Retour
          </button>

          <div class="lesson-title-section">
            <div class="lesson-meta">
              <span class="lesson-type-badge" :class="`type-${lesson.type}`">
                {{ getTypeLabel(lesson.type) }}
              </span>
              <span v-if="lesson.matiere_name" class="lesson-matiere">
                {{ lesson.matiere_name }}
              </span>
              <span v-if="lesson.duration_minutes" class="lesson-duration">
                ⏱ {{ lesson.duration_minutes }} min
              </span>
            </div>

            <h1 class="lesson-title">{{ lesson.title }}</h1>

            <p v-if="lesson.description" class="lesson-description">
              {{ lesson.description }}
            </p>

            <!-- Chapter Progress Bar -->
            <div v-if="chapterProgress && chapters.length > 0" class="chapter-progress-section">
              <div class="chapter-progress-header">
                <span class="chapter-progress-label">Progression des chapitres</span>
                <span class="chapter-progress-count">{{ chapterProgress.completed_chapters }} / {{ chapterProgress.total_chapters }}</span>
              </div>
              <div class="chapter-progress-bar-container">
                <div class="chapter-progress-bar" :style="{ width: chapterProgress.percentage + '%' }"></div>
              </div>
              <div class="chapter-progress-dots">
                <div
                  v-for="(ch, idx) in chapterProgress.chapters"
                  :key="ch.chapter_id"
                  class="chapter-dot"
                  :class="{
                    completed: ch.is_completed,
                    current: !ch.is_completed && (idx === 0 || chapterProgress.chapters[idx - 1]?.is_completed),
                    locked: !ch.is_completed && idx > 0 && !chapterProgress.chapters[idx - 1]?.is_completed
                  }"
                  :title="ch.title"
                >
                  <i v-if="ch.is_completed" class="material-icons">check</i>
                  <i v-else-if="ch.content_type === 'quiz'" class="material-icons">quiz</i>
                  <span v-else>{{ idx + 1 }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Main Content -->
        <div class="lesson-main">
          <!-- Chapitres -->
          <div v-if="chapters.length > 0" class="chapters-section">
            <div
              v-for="(chapter, index) in chapters"
              :key="chapter.id"
              class="chapter-block-view"
            >
              <!-- Chapter Header -->
              <div class="chapter-header-view" :class="{ completed: isChapterCompleted(chapter.id) }">
                <h2 class="chapter-title-view">
                  <span class="chapter-number">Chapitre {{ index + 1 }}:</span>
                  {{ chapter.title }}
                </h2>
                <div v-if="isChapterCompleted(chapter.id)" class="chapter-completed-badge">
                  <i class="material-icons">check_circle</i>
                  Termine
                </div>
              </div>

              <!-- Chapter Content based on type -->
              <div class="chapter-content-view">
                <!-- Text/Markdown -->
                <div v-if="chapter.content_type === 'text' && chapter.content" class="text-content">
                  <div v-html="formatContent(chapter.content)"></div>
                </div>

                <!-- Video -->
                <div v-if="chapter.content_type === 'video' && (chapter.video_url || chapter.content)" class="video-container">
                  <iframe
                    v-if="getVideoUrl(chapter).includes('youtube.com') || getVideoUrl(chapter).includes('youtu.be')"
                    :src="getYoutubeEmbedUrl(getVideoUrl(chapter))"
                    frameborder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                  <iframe
                    v-else-if="getVideoUrl(chapter).includes('vimeo.com')"
                    :src="getVimeoEmbedUrl(getVideoUrl(chapter))"
                    frameborder="0"
                    allow="autoplay; fullscreen; picture-in-picture"
                    allowfullscreen
                  ></iframe>
                  <video
                    v-else-if="getVideoUrl(chapter).startsWith('/storage/') || getVideoUrl(chapter).includes('/storage/')"
                    :src="getVideoUrl(chapter)"
                    controls
                    class="local-video"
                  ></video>
                  <div v-else class="video-link">
                    <a :href="getVideoUrl(chapter)" target="_blank" class="btn-external">
                      Ouvrir la vidéo dans un nouvel onglet →
                    </a>
                  </div>
                </div>

                <!-- PDF (converti en images) et PowerPoint -->
                <div v-if="(['pdf', 'powerpoint'].includes(chapter.content_type)) && chapter.slides_images && chapter.slides_images.length > 0" class="document-viewer-images">
                  <div class="pages-container">
                    <div v-for="(image, imageIndex) in chapter.slides_images" :key="imageIndex" class="page-image">
                      <img :src="getImageUrl(image)" :alt="`Page ${imageIndex + 1}`" loading="lazy" />
                      <p class="page-number">Page {{ imageIndex + 1 }} / {{ chapter.slides_images.length }}</p>
                    </div>
                  </div>
                </div>

                <!-- Word (converti en HTML) -->
                <div v-if="chapter.content_type === 'word' && chapter.content" class="word-content">
                  <div v-html="chapter.content"></div>
                </div>

                <!-- Link -->
                <div v-if="chapter.content_type === 'link' && chapter.content" class="link-content">
                  <a :href="chapter.content" target="_blank" class="btn-external-large">
                    Accéder au lien externe →
                  </a>
                </div>

                <!-- Quiz (Testez vos connaissances) -->
                <div v-if="chapter.content_type === 'quiz'" class="quiz-content">
                  <KnowledgeCheckPlayer
                    v-if="chapterQuizzes[chapter.id]"
                    :quiz="chapterQuizzes[chapter.id]"
                    @completed="onQuizCompleted(chapter.id, $event)"
                  />
                  <div v-else-if="loadingQuizzes[chapter.id]" class="quiz-loading">
                    <div class="spinner"></div>
                    <p>Chargement du quiz...</p>
                  </div>
                  <div v-else class="quiz-empty">
                    <i class="material-icons">quiz</i>
                    <p>Aucun quiz disponible pour ce chapitre.</p>
                  </div>
                </div>

                <!-- Bouton Marquer comme lu (pour tous sauf quiz) -->
                <div v-if="chapter.content_type !== 'quiz'" class="chapter-actions">
                  <button
                    v-if="!isChapterCompleted(chapter.id)"
                    @click="markChapterAsCompleted(chapter.id)"
                    :disabled="markingChapter === chapter.id"
                    class="btn-mark-complete"
                  >
                    <i class="material-icons" :class="{ spinning: markingChapter === chapter.id }">
                      {{ markingChapter === chapter.id ? 'sync' : 'check_circle' }}
                    </i>
                    {{ markingChapter === chapter.id ? 'Enregistrement...' : 'Marquer comme lu' }}
                  </button>
                  <div v-else class="chapter-completed-message">
                    <i class="material-icons">check_circle</i>
                    Chapitre termine
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Ancien contenu de la leçon (si pas de chapitres) -->
          <div v-else class="legacy-content">
            <!-- Video Content -->
            <div v-if="lesson.content_type === 'video' && lesson.video_url" class="content-block">
              <h2 class="content-title">[V] Contenu Vidéo</h2>
              <div class="video-container">
                <iframe
                  v-if="lesson.video_provider === 'youtube'"
                  :src="getYoutubeEmbedUrl(lesson.video_url)"
                  frameborder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowfullscreen
                ></iframe>
                <iframe
                  v-else-if="lesson.video_provider === 'vimeo'"
                  :src="getVimeoEmbedUrl(lesson.video_url)"
                  frameborder="0"
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowfullscreen
                ></iframe>
                <video
                  v-else-if="lesson.video_provider === 'local'"
                  :src="lesson.video_url"
                  controls
                  class="local-video"
                ></video>
                <div v-else class="video-link">
                  <a :href="lesson.video_url" target="_blank" class="btn-external">
                    Ouvrir la vidéo dans un nouvel onglet →
                  </a>
                </div>
              </div>
            </div>

            <!-- Text Content -->
            <div v-if="lesson.content" class="content-block">
              <h2 class="content-title">[T] Contenu du Cours</h2>
              <div class="text-content" v-html="formatContent(lesson.content)"></div>
            </div>

            <!-- PDF Content -->
            <div v-if="lesson.content_type === 'pdf' && lesson.pdf_url" class="content-block">
              <h2 class="content-title">[P] Document PDF</h2>
              <div class="pdf-container">
                <iframe :src="lesson.pdf_url" frameborder="0"></iframe>
              </div>
              <a :href="lesson.pdf_url" target="_blank" class="btn-download">
                Télécharger le PDF
              </a>
            </div>

            <!-- Audio Content -->
            <div v-if="lesson.content_type === 'audio' && lesson.audio_url" class="content-block">
              <h2 class="content-title">(~) Contenu Audio</h2>
              <audio :src="lesson.audio_url" controls class="audio-player"></audio>
            </div>

            <!-- Presentation Content -->
            <div v-if="lesson.content_type === 'presentation' && lesson.presentation_url" class="content-block">
              <h2 class="content-title">[S] Présentation</h2>
              <div class="presentation-container">
                <iframe :src="lesson.presentation_url" frameborder="0"></iframe>
              </div>
            </div>

            <!-- External Link -->
            <div v-if="lesson.content_type === 'link' && lesson.external_link" class="content-block">
              <h2 class="content-title">@ Lien Externe</h2>
              <a :href="lesson.external_link" target="_blank" class="btn-external-large">
                Accéder au contenu externe →
              </a>
            </div>

            <!-- Resources -->
            <div v-if="lesson.resources && lesson.resources.length > 0" class="content-block">
              <h2 class="content-title">[*] Ressources Complémentaires</h2>
              <div class="resources-list">
                <div v-for="resource in lesson.resources" :key="resource.id" class="resource-item">
                  <div class="resource-icon">
                    {{ getResourceIcon(resource.type) }}
                  </div>
                  <div class="resource-info">
                    <h3>{{ resource.title }}</h3>
                    <p v-if="resource.description">{{ resource.description }}</p>
                  </div>
                  <a :href="resource.url" target="_blank" class="btn-resource">
                    Ouvrir
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Actions Footer -->
        <div class="lesson-footer">
          <button
            v-if="!isCompleted"
            @click="markAsComplete"
            :disabled="marking"
            class="btn-complete"
          >
            {{ marking ? 'Marquage en cours...' : '✓ Marquer comme terminé' }}
          </button>
          <div v-else class="completed-badge">
            ✓ Leçon terminée
          </div>

          <button @click="updateProgress" :disabled="updating" class="btn-progress">
            {{ updating ? 'Mise à jour...' : 'Mettre à jour ma progression' }}
          </button>
        </div>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import KnowledgeCheckPlayer from '@/components/lessons/KnowledgeCheckPlayer.vue'
import lessonService from '@/services/lesson'
import knowledgeCheckService from '@/services/knowledgeCheck'
import chapterProgressService from '@/services/chapterProgress'
import api from '@/services/api'

const route = useRoute()
const router = useRouter()

const lesson = ref(null)
const chapters = ref([])
const loading = ref(true)
const error = ref(null)
const marking = ref(false)
const updating = ref(false)
const chapterQuizzes = ref({})
const loadingQuizzes = ref({})
const chapterProgress = ref(null)
const markingChapter = ref(null)

const userProgress = computed(() => lesson.value?.user_progress || null)
const isCompleted = computed(() => userProgress.value?.progress_percentage === 100)

const getTypeLabel = (type) => {
  const labels = {
    cours: 'Cours',
    tp: 'TP',
    td: 'TD',
    projet: 'Projet',
    autre: 'Autre'
  }
  return labels[type] || type
}

const getResourceIcon = (type) => {
  const icons = {
    pdf: '[P]',
    video: '[V]',
    audio: '(~)',
    presentation: '[S]',
    link: '@',
    document: '[D]'
  }
  return icons[type] || '[*]'
}

const getYoutubeEmbedUrl = (url) => {
  const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&]+)/)?.[1]
  return videoId ? `https://www.youtube.com/embed/${videoId}` : url
}

const getVimeoEmbedUrl = (url) => {
  const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1]
  return videoId ? `https://player.vimeo.com/video/${videoId}` : url
}

const formatContent = (content) => {
  // Simple formatting: convert newlines to <br> and preserve paragraphs
  return content
    .split('\n\n')
    .map(paragraph => `<p>${paragraph.replace(/\n/g, '<br>')}</p>`)
    .join('')
}

const getImageUrl = (imagePath) => {
  // Si c'est déjà une URL complète, la retourner
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath
  }
  // Sinon, construire l'URL avec le backend
  const backendUrl = import.meta.env.VITE_API_URL.replace('/api', '')
  return `${backendUrl}/storage/${imagePath}`
}

const getVideoUrl = (chapter) => {
  // Prioriser video_url, sinon utiliser content
  const url = chapter.video_url || chapter.content || ''

  // Si c'est un chemin relatif (vidéo uploadée), construire l'URL complète
  if (url.startsWith('/storage/') || (url && !url.startsWith('http'))) {
    const backendUrl = import.meta.env.VITE_API_URL.replace('/api', '')
    return `${backendUrl}${url}`
  }

  return url
}

const loadLesson = async () => {
  try {
    loading.value = true
    error.value = null

    // Charger la leçon
    const response = await lessonService.getLesson(route.params.id)

    if (response.success && response.data) {
      lesson.value = response.data
      console.log('[StudentLessonView] Leçon chargée:', lesson.value)

      // Charger les chapitres
      try {
        const chaptersResponse = await api.get(`/lessons/${route.params.id}/chapters`)
        if (chaptersResponse.success) {
          chapters.value = chaptersResponse.data
          console.log('[StudentLessonView] Chapitres chargés:', chapters.value)

          // Charger les quiz pour les chapitres de type 'quiz'
          await loadQuizzesForChapters()

          // Charger la progression des chapitres
          await loadChapterProgress()
        }
      } catch (chapErr) {
        console.warn('[StudentLessonView] Pas de chapitres pour cette leçon:', chapErr)
        chapters.value = []
      }
    } else {
      error.value = 'Impossible de charger la leçon'
    }
  } catch (err) {
    console.error('[StudentLessonView] Erreur:', err)
    if (err.response?.status === 403) {
      error.value = 'Cette leçon n\'est pas encore disponible'
    } else if (err.response?.status === 404) {
      error.value = 'Leçon introuvable'
    } else {
      error.value = 'Une erreur est survenue lors du chargement'
    }
  } finally {
    loading.value = false
  }
}

const loadQuizzesForChapters = async () => {
  const quizChapters = chapters.value.filter(ch => ch.content_type === 'quiz')
  console.log('[StudentLessonView] Chapitres quiz à charger:', quizChapters.length)

  for (const chapter of quizChapters) {
    loadingQuizzes.value[chapter.id] = true
    try {
      const response = await knowledgeCheckService.getByChapter(chapter.id)
      const quizzes = response.success ? response.data : response
      if (quizzes && quizzes.length > 0) {
        chapterQuizzes.value[chapter.id] = quizzes[0]
        console.log('[StudentLessonView] Quiz chargé pour chapitre', chapter.id, ':', quizzes[0])
      }
    } catch (err) {
      console.error('[StudentLessonView] Erreur chargement quiz chapitre', chapter.id, ':', err)
    } finally {
      loadingQuizzes.value[chapter.id] = false
    }
  }
}

const loadChapterProgress = async () => {
  try {
    const response = await chapterProgressService.getLessonProgress(route.params.id)
    if (response.success) {
      chapterProgress.value = response.data
      console.log('[StudentLessonView] Progression chargée:', chapterProgress.value)
    }
  } catch (err) {
    console.warn('[StudentLessonView] Erreur chargement progression:', err)
  }
}

const isChapterCompleted = (chapterId) => {
  if (!chapterProgress.value?.chapters) return false
  const ch = chapterProgress.value.chapters.find(c => c.chapter_id === chapterId)
  return ch?.is_completed || false
}

const markChapterAsCompleted = async (chapterId) => {
  markingChapter.value = chapterId
  try {
    const response = await chapterProgressService.markAsCompleted(chapterId)
    if (response.success) {
      // Recharger la progression
      await loadChapterProgress()
    }
  } catch (err) {
    console.error('[StudentLessonView] Erreur marquage chapitre:', err)
    alert(err.response?.data?.message || 'Erreur lors du marquage du chapitre')
  } finally {
    markingChapter.value = null
  }
}

const onQuizCompleted = async (chapterId, result) => {
  console.log('[StudentLessonView] Quiz complete:', chapterId, result)
  // Recharger la progression après un quiz
  await loadChapterProgress()
}

const markAsComplete = async () => {
  try {
    marking.value = true

    const response = await lessonService.markComplete(lesson.value.id)

    if (response.success) {
      // Rediriger vers la page de la matière pour voir la progression
      if (lesson.value.matiere_id) {
        router.push({
          name: 'matiere-details',
          params: { id: lesson.value.matiere_id }
        })
      } else {
        // Si pas de matiere_id, recharger la leçon et afficher un message
        await loadLesson()
        alert('✓ Leçon marquée comme terminée !')
      }
    }
  } catch (err) {
    console.error('[StudentLessonView] Erreur markAsComplete:', err)
    alert('Erreur lors du marquage de la leçon')
  } finally {
    marking.value = false
  }
}

const updateProgress = async () => {
  try {
    updating.value = true

    // Calculer la progression basée sur les chapitres consultés
    let progress = 0

    if (isCompleted.value) {
      // Si déjà marqué comme complété, progression = 100%
      progress = 100
    } else if (chapters.value && chapters.value.length > 0) {
      // Calculer le pourcentage basé sur le défilement de la page
      // Si l'utilisateur a scrollé jusqu'en bas, on considère qu'il a consulté tout le contenu
      const scrollPercentage = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight

      // Progression = pourcentage de scroll * 100, avec un minimum de 10% (pour avoir commencé)
      progress = Math.min(95, Math.max(10, Math.round(scrollPercentage * 100)))
    } else {
      // Pas de chapitres = au moins 10% pour avoir ouvert la leçon
      progress = 10
    }

    const response = await lessonService.updateProgress(
      lesson.value.id,
      progress,
      lesson.value.duration_minutes || 0
    )

    if (response.success) {
      // Rediriger vers la page de la matière pour voir la progression
      if (lesson.value.matiere_id) {
        router.push({
          name: 'matiere-details',
          params: { id: lesson.value.matiere_id }
        })
      } else {
        // Si pas de matiere_id, recharger la leçon et afficher un message
        await loadLesson()
        alert('Progression mise à jour !')
      }
    }
  } catch (err) {
    console.error('[StudentLessonView] Erreur updateProgress:', err)
    alert('Erreur lors de la mise à jour de la progression')
  } finally {
    updating.value = false
  }
}

const goBack = () => {
  // Try to go back, or fallback to courses page
  if (window.history.length > 1) {
    router.go(-1)
  } else {
    router.push('/student/courses')
  }
}

onMounted(() => {
  loadLesson()
})
</script>

<style scoped>
.lesson-view-container {
  width: 100%;
  margin: 0;
  padding: 2rem;
}

/* Loading & Error States */
.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  text-align: center;
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid var(--border-primary);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-state {
  color: var(--text-primary);
}

.error-icon {
  font-size: 4rem;
  color: #ef4444;
  margin-bottom: 1rem;
}

.error-state h2 {
  font-size: 1.5rem;
  margin-bottom: 0.5rem;
}

.error-state p {
  color: var(--text-secondary);
  margin-bottom: 2rem;
}

/* Header */
.lesson-header {
  margin-bottom: 2rem;
}

.btn-back-link {
  display: inline-block;
  color: #3b82f6;
  text-decoration: none;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem 0;
}

.btn-back-link:hover {
  text-decoration: underline;
}

.lesson-title-section {
  background: var(--card-bg);
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
}

.lesson-meta {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.lesson-type-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.type-cours {
  background: #dbeafe;
  color: #1e40af;
}

.type-tp {
  background: #e9d5ff;
  color: #7c3aed;
}

.type-td {
  background: #ddd6fe;
  color: #6366f1;
}

.type-projet {
  background: #fce7f3;
  color: #be123c;
}

.type-autre {
  background: var(--border-primary);
  color: var(--text-secondary);
}

.lesson-matiere,
.lesson-duration {
  padding: 0.25rem 0.75rem;
  background: var(--bg-primary);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.lesson-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.lesson-description {
  color: var(--text-secondary);
  font-size: 1rem;
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

/* Progress Bar */
.progress-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.progress-bar-container {
  flex: 1;
  height: 0.5rem;
  background: var(--border-primary);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 9999px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 80px;
}

/* Main Content */
.lesson-main {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.content-block {
  background: var(--card-bg);
  padding: 2rem;
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
}

.content-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
}

/* Video */
.video-container {
  position: relative;
  width: 100%;
  padding-bottom: 56.25%; /* 16:9 */
  background: #000;
  border-radius: 0.5rem;
  overflow: hidden;
}

.video-container iframe,
.local-video {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.local-video {
  position: relative;
  padding-bottom: 0;
}

.video-link {
  padding: 2rem;
  text-align: center;
}

/* Text Content */
.text-content {
  color: var(--text-primary);
  line-height: 1.8;
  font-size: 1rem;
}

.text-content :deep(p) {
  margin-bottom: 1rem;
}

/* PDF */
.pdf-container {
  width: 100%;
  height: 600px;
  background: #f5f5f5;
  border-radius: 0.5rem;
  overflow: hidden;
  margin-bottom: 1rem;
}

.pdf-container iframe {
  width: 100%;
  height: 100%;
}

/* Audio */
.audio-player {
  width: 100%;
}

/* Presentation */
.presentation-container {
  width: 100%;
  height: 600px;
  background: #f5f5f5;
  border-radius: 0.5rem;
  overflow: hidden;
}

.presentation-container iframe {
  width: 100%;
  height: 100%;
}

/* Resources */
.resources-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.resource-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: var(--bg-primary);
  border-radius: 0.5rem;
  border: 1px solid var(--border-primary);
}

.resource-icon {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.resource-info {
  flex: 1;
}

.resource-info h3 {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.resource-info p {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}

/* Buttons */
.btn-back,
.btn-external,
.btn-external-large,
.btn-download,
.btn-resource,
.btn-complete,
.btn-progress {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  text-decoration: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  display: inline-block;
}

.btn-back {
  background: var(--border-primary);
  color: var(--text-primary);
}

.btn-back:hover {
  opacity: 0.8;
}

.btn-external,
.btn-external-large,
.btn-download {
  background: #3b82f6;
  color: white;
}

.btn-external:hover,
.btn-external-large:hover,
.btn-download:hover {
  background: #2563eb;
}

.btn-external-large {
  padding: 1.5rem 2rem;
  font-size: 1.125rem;
  width: 100%;
  text-align: center;
}

.btn-resource {
  background: var(--bg-primary);
  color: #3b82f6;
  border: 1px solid #3b82f6;
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
}

.btn-resource:hover {
  background: #3b82f6;
  color: white;
}

/* Footer */
.lesson-footer {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
}

.btn-complete {
  flex: 1;
  background: #10b981;
  color: white;
  font-size: 1rem;
}

.btn-complete:hover:not(:disabled) {
  background: #059669;
}

.btn-complete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-progress {
  background: #3b82f6;
  color: white;
}

.btn-progress:hover:not(:disabled) {
  background: #2563eb;
}

.btn-progress:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.completed-badge {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem;
  background: #d1fae5;
  color: #065f46;
  border-radius: 0.5rem;
  font-weight: 600;
}

/* Chapters Section */
.chapters-section {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.chapter-block-view {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  overflow: hidden;
}

.chapter-header-view {
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  padding: 1.5rem 2rem;
}

.chapter-title-view {
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin: 0;
}

.chapter-content-view {
  padding: 2rem;
}

/* Document Viewer (PDF et PowerPoint convertis en images) */
.document-viewer-images {
  width: 100%;
}

.pages-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.page-image {
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  border: 1px solid var(--border-primary);
}

.page-image img {
  width: 100%;
  height: auto;
  display: block;
}

.page-number {
  padding: 0.75rem;
  text-align: center;
  background: #f9fafb;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 600;
  margin: 0;
  border-top: 1px solid var(--border-primary);
}

.link-content {
  padding: 1rem 0;
}

/* Quiz Content */
.quiz-content {
  min-height: 200px;
}

.quiz-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-secondary);
}

.quiz-loading .spinner {
  width: 2.5rem;
  height: 2.5rem;
  border: 3px solid var(--border-primary);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

.quiz-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: var(--text-secondary);
  text-align: center;
}

.quiz-empty i {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}

/* Chapter Progress Section */
.chapter-progress-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: var(--bg-secondary, #f9fafb);
  border-radius: 0.75rem;
}

.chapter-progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.chapter-progress-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
}

.chapter-progress-count {
  font-size: 0.875rem;
  font-weight: 700;
  color: #3b82f6;
}

.chapter-progress-bar-container {
  height: 0.5rem;
  background: var(--border-primary, #e5e7eb);
  border-radius: 9999px;
  overflow: hidden;
  margin-bottom: 1rem;
}

.chapter-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #10b981, #3b82f6);
  border-radius: 9999px;
  transition: width 0.5s ease;
}

.chapter-progress-dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.chapter-dot {
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
  transition: all 0.2s;
  border: 2px solid var(--border-primary, #e5e7eb);
  background: var(--card-bg, white);
  color: var(--text-secondary);
}

.chapter-dot.completed {
  background: #10b981;
  border-color: #10b981;
  color: white;
}

.chapter-dot.completed i {
  font-size: 1rem;
}

.chapter-dot.current {
  border-color: #3b82f6;
  color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

.chapter-dot.locked {
  opacity: 0.5;
  cursor: not-allowed;
}

.chapter-dot i {
  font-size: 0.875rem;
}

/* Chapter Header Completed */
.chapter-header-view.completed {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.chapter-completed-badge {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 9999px;
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
}

.chapter-completed-badge i {
  font-size: 1rem;
}

.chapter-number {
  opacity: 0.9;
}

/* Chapter Actions */
.chapter-actions {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-primary, #e5e7eb);
  display: flex;
  justify-content: center;
}

.btn-mark-complete {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-mark-complete:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-mark-complete:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-mark-complete i.spinning {
  animation: spin 1s linear infinite;
}

.chapter-completed-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: #d1fae5;
  color: #065f46;
  border-radius: 0.5rem;
  font-weight: 600;
}

.chapter-completed-message i {
  color: #10b981;
}

/* Word Content */
.word-content {
  line-height: 1.8;
  color: var(--text-primary);
}

.word-content :deep(p) {
  margin-bottom: 1rem;
}

.word-content :deep(h1),
.word-content :deep(h2),
.word-content :deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 1rem;
  color: var(--text-primary);
}

.word-content :deep(ul),
.word-content :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .lesson-view-container {
    padding: 1rem;
  }

  .lesson-title {
    font-size: 1.5rem;
  }

  .lesson-footer {
    flex-direction: column;
  }

  .pdf-container,
  .presentation-container {
    height: 400px;
  }

  .pages-container {
    gap: 1.5rem;
  }

  .chapter-title-view {
    font-size: 1.25rem;
  }

  .chapter-content-view {
    padding: 1.5rem;
  }
}
</style>
