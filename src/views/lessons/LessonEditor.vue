<template>
  <DashboardLayout>
    <div class="lesson-editor-container">
      <!-- Header -->
      <div class="editor-header">
        <div>
          <h1 class="editor-title">
            {{ isEditMode ? 'Modifier la leçon' : 'Nouvelle leçon' }}
          </h1>
          <p class="editor-subtitle">
            {{ isEditMode ? 'Modifiez les informations de votre leçon' : 'Créez une nouvelle leçon pour vos étudiants' }}
          </p>
        </div>
        <button type="button" @click="$router.go(-1)" class="btn-back">
          ← Retour
        </button>
      </div>

      <!-- Loading -->
      <ContentLoader v-if="loading" text="Chargement de la leçon..." />

      <!-- Formulaire -->
      <form v-else @submit.prevent="saveLesson" class="editor-form">
        <!-- Informations de base -->
        <LessonBasicInfoFields
          v-model:title="form.title"
          v-model:description="form.description"
          v-model:type="form.type"
          v-model:duration-minutes="form.duration_minutes"
          v-model:matiere-id="form.matiere_id"
          v-model:classe-id="form.classe_id"
          v-model:chapter-id="form.chapter_id"
          :matieres="matieres"
          :classes="classes"
          :chapters="chapters"
          :loading-chapters="loadingChapters"
          @load-chapters="loadChapters"
        />

        <!-- Type de contenu principal -->
        <LessonContentTypePicker v-model="form.content_type" :content-types="contentTypes" />

        <!-- Contenu principal selon le type -->
        <LessonContentFields
          :content-type="form.content_type"
          :video-providers="videoProviders"
          v-model:video-url="form.video_url"
          v-model:video-provider="form.video_provider"
          v-model:pdf-url="form.pdf_url"
          v-model:audio-url="form.audio_url"
          v-model:presentation-url="form.presentation_url"
          v-model:external-link="form.external_link"
          v-model:content="form.content"
        />

        <!-- Ressources supplémentaires -->
        <LessonResourcesFields
          :resources="form.resources"
          @add="addResource"
          @remove="removeResource"
        />

        <!-- Statut de publication -->
        <LessonStatusPicker v-model="form.status" />

        <!-- Actions -->
        <LessonEditorActions
          :saving="saving"
          :is-edit-mode="isEditMode"
          @cancel="$router.go(-1)"
          @delete="deleteLesson"
        />
      </form>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Éditeur de leçon (#H4 ≤300) — orchestrateur. Donnée/logique dans useLessonEditor ;
 * UI composée des sections LessonBasicInfoFields, LessonContentTypePicker,
 * LessonContentFields, LessonResourcesFields, LessonStatusPicker et
 * LessonEditorActions. `$router.go(-1)` via la propriété globale du routeur.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import LessonBasicInfoFields from '@/components/lessons/LessonBasicInfoFields.vue'
import LessonContentTypePicker from '@/components/lessons/LessonContentTypePicker.vue'
import LessonContentFields from '@/components/lessons/LessonContentFields.vue'
import LessonResourcesFields from '@/components/lessons/LessonResourcesFields.vue'
import LessonStatusPicker from '@/components/lessons/LessonStatusPicker.vue'
import LessonEditorActions from '@/components/lessons/LessonEditorActions.vue'
import { useLessonEditor } from '@/composables/useLessonEditor'

const {
  loading,
  saving,
  form,
  chapters,
  loadingChapters,
  matieres,
  classes,
  contentTypes,
  videoProviders,
  isEditMode,
  saveLesson,
  deleteLesson,
  loadChapters,
  addResource,
  removeResource
} = useLessonEditor()
</script>

<style scoped>
.lesson-editor-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

/* Header */
.editor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
}

.editor-title {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.editor-subtitle {
  font-size: 1rem;
  color: var(--text-secondary);
  margin: 0;
}

.btn-back {
  padding: 0.75rem 1.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back:hover {
  background: var(--bg-tertiary);
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4rem;
  gap: 1rem;
  color: var(--text-secondary);
}

.spinner {
  width: 3rem;
  height: 3rem;
  border: 4px solid var(--border-primary);
  border-top-color: var(--blue-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Form */
.editor-form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Responsive */
@media (max-width: 768px) {
  .lesson-editor-container {
    padding: 1rem;
  }

  .editor-header {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
