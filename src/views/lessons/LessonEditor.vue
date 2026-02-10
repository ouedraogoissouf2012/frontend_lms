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
        <div class="form-section">
          <h2 class="section-title"><i class="fa fa-info-circle"></i> Informations de base</h2>

          <div class="form-row">
            <div class="form-group full-width">
              <label class="form-label required">Titre</label>
              <input
                v-model="form.title"
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
                v-model="form.description"
                rows="3"
                class="form-textarea"
                placeholder="Résumé de la leçon (2-3 phrases)"
              ></textarea>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label required">Type de leçon</label>
              <select v-model="form.type" required class="form-select">
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
                v-model.number="form.duration_minutes"
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
              <select v-model.number="form.matiere_id" class="form-select" @change="loadChapters">
                <option :value="null">Sélectionnez une matière</option>
                <option v-for="matiere in matieres" :key="matiere.id" :value="matiere.id">
                  {{ matiere.nom || matiere.name }}
                </option>
              </select>
              <p class="form-hint">Optionnel - Matière associée à cette leçon</p>
            </div>

            <div class="form-group">
              <label class="form-label">Classe</label>
              <select v-model.number="form.classe_id" class="form-select">
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
              <select v-model="form.chapter_id" class="form-select" :disabled="loadingChapters">
                <option :value="null">Aucun chapitre (leçon indépendante)</option>
                <option v-for="chapter in chapters" :key="chapter.id" :value="chapter.id">
                  {{ chapter.title }}
                </option>
              </select>
              <p class="form-hint">Associer cette leçon à un chapitre pour mieux organiser votre cours</p>
            </div>
          </div>
        </div>

        <!-- Type de contenu principal -->
        <div class="form-section">
          <h2 class="section-title"><i class="fa fa-th-large"></i> Type de contenu principal</h2>

          <div class="content-type-grid">
            <label
              v-for="type in contentTypes"
              :key="type.value"
              :class="['content-type-card', { 'active': form.content_type === type.value }]"
            >
              <input
                v-model="form.content_type"
                type="radio"
                :value="type.value"
                class="content-type-radio"
              />
              <div class="content-type-icon">{{ type.icon }}</div>
              <div class="content-type-label">{{ type.label }}</div>
            </label>
          </div>
        </div>

        <!-- Contenu principal selon le type -->
        <div class="form-section">
          <h2 class="section-title"><i class="fa fa-file-text"></i> Contenu principal</h2>

          <!-- Contenu VIDÉO -->
          <div v-if="form.content_type === 'video'" class="content-fields">
            <div class="form-row">
              <div class="form-group full-width">
                <label class="form-label required">URL de la vidéo</label>
                <input
                  v-model="form.video_url"
                  type="url"
                  class="form-input"
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                <p class="form-hint">URL complète de la vidéo (YouTube, Vimeo, etc.)</p>
              </div>
            </div>

            <div class="form-row">
              <div class="form-group full-width">
                <label class="form-label">Plateforme vidéo</label>
                <div class="radio-group">
                  <label
                    v-for="provider in videoProviders"
                    :key="provider.value"
                    :class="['radio-card', { 'active': form.video_provider === provider.value }]"
                  >
                    <input
                      v-model="form.video_provider"
                      type="radio"
                      :value="provider.value"
                    />
                    <span>{{ provider.icon }} {{ provider.label }}</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          <!-- Contenu PDF -->
          <div v-else-if="form.content_type === 'pdf'" class="content-fields">
            <div class="form-row">
              <div class="form-group full-width">
                <label class="form-label required">URL du fichier PDF</label>
                <input
                  v-model="form.pdf_url"
                  type="url"
                  class="form-input"
                  placeholder="https://exemple.com/document.pdf"
                />
                <p class="form-hint">URL publique du document PDF à afficher</p>
              </div>
            </div>
          </div>

          <!-- Contenu AUDIO -->
          <div v-else-if="form.content_type === 'audio'" class="content-fields">
            <div class="form-row">
              <div class="form-group full-width">
                <label class="form-label required">URL du fichier audio</label>
                <input
                  v-model="form.audio_url"
                  type="url"
                  class="form-input"
                  placeholder="https://exemple.com/audio.mp3"
                />
                <p class="form-hint">URL du fichier audio (MP3, WAV, OGG, etc.)</p>
              </div>
            </div>
          </div>

          <!-- Contenu PRÉSENTATION -->
          <div v-else-if="form.content_type === 'presentation'" class="content-fields">
            <div class="form-row">
              <div class="form-group full-width">
                <label class="form-label required">URL de la présentation</label>
                <input
                  v-model="form.presentation_url"
                  type="url"
                  class="form-input"
                  placeholder="https://docs.google.com/presentation/d/..."
                />
                <p class="form-hint">URL de Google Slides, PowerPoint Online, ou autre plateforme</p>
              </div>
            </div>
          </div>

          <!-- Contenu LIEN EXTERNE -->
          <div v-else-if="form.content_type === 'link'" class="content-fields">
            <div class="form-row">
              <div class="form-group full-width">
                <label class="form-label required">Lien externe</label>
                <input
                  v-model="form.external_link"
                  type="url"
                  class="form-input"
                  placeholder="https://exemple.com/ressource-externe"
                />
                <p class="form-hint">Lien vers une page web, un article, ou une ressource externe</p>
              </div>
            </div>
          </div>

          <!-- Contenu TEXTE ou MIXTE -->
          <div v-else-if="form.content_type === 'text' || form.content_type === 'mixed'" class="content-fields">
            <div class="editor-tabs">
              <button
                type="button"
                @click="showPreview = false"
                :class="['tab-btn', { 'active': !showPreview }]"
              >
                Éditer
              </button>
              <button
                type="button"
                @click="showPreview = true"
                :class="['tab-btn', { 'active': showPreview }]"
              >
                Prévisualiser
              </button>
            </div>

            <div v-show="!showPreview" class="editor-panel">
              <textarea
                v-model="form.content"
                rows="20"
                class="form-textarea code-editor"
                placeholder="Contenu HTML de la leçon...

Exemples:
<h1>Titre principal</h1>
<h2>Sous-titre</h2>
<p>Paragraphe de texte...</p>
<ul>
  <li>Élément de liste</li>
</ul>"
              ></textarea>
              <p class="form-hint">Vous pouvez utiliser du HTML pour formater le contenu</p>
            </div>

            <div v-show="showPreview" class="preview-panel">
              <div v-if="form.content" v-html="form.content" class="preview-content"></div>
              <div v-else class="preview-empty">Aucun contenu à prévisualiser</div>
            </div>
          </div>
        </div>

        <!-- Ressources supplémentaires -->
        <div class="form-section">
          <div class="section-header">
            <h2 class="section-title"><i class="fa fa-paperclip"></i> Ressources supplémentaires</h2>
            <button type="button" @click="addResource" class="btn-add">
              + Ajouter une ressource
            </button>
          </div>

          <p class="section-description">
            Ajoutez des documents PDF, liens, vidéos complémentaires ou autres ressources pour enrichir votre leçon
          </p>

          <div v-if="form.resources && form.resources.length > 0" class="resources-list">
            <div
              v-for="(resource, index) in form.resources"
              :key="index"
              class="resource-card"
            >
              <div class="resource-header">
                <span class="resource-number">#{{ index + 1 }}</span>
                <button
                  type="button"
                  @click="removeResource(index)"
                  class="btn-remove"
                >
                  Supprimer
                </button>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Titre</label>
                  <input
                    v-model="resource.title"
                    type="text"
                    class="form-input"
                    placeholder="Nom de la ressource"
                  />
                </div>

                <div class="form-group">
                  <label class="form-label">Type</label>
                  <select v-model="resource.type" class="form-select">
                    <option value="pdf">PDF</option>
                    <option value="document">Document</option>
                    <option value="link">Lien</option>
                    <option value="video">Vidéo</option>
                    <option value="image">Image</option>
                    <option value="archive">Archive</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group full-width">
                  <label class="form-label">URL</label>
                  <input
                    v-model="resource.url"
                    type="url"
                    class="form-input"
                    placeholder="https://exemple.com/ressource.pdf"
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group full-width">
                  <label class="form-label">Description (optionnelle)</label>
                  <textarea
                    v-model="resource.description"
                    rows="2"
                    class="form-textarea"
                    placeholder="Description de la ressource..."
                  ></textarea>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="resources-empty">
            <p>Aucune ressource supplémentaire</p>
            <p class="text-hint">Cliquez sur "Ajouter une ressource" pour en ajouter</p>
          </div>
        </div>

        <!-- Statut de publication -->
        <div class="form-section">
          <h2 class="section-title"><i class="fa fa-toggle-on"></i> Statut de publication</h2>

          <div class="status-grid">
            <label :class="['status-card', { 'active': form.status === 'draft' }]">
              <input
                v-model="form.status"
                type="radio"
                value="draft"
              />
              <div class="status-icon">[D]</div>
              <div class="status-name">Brouillon</div>
              <div class="status-desc">La leçon ne sera pas visible par les étudiants</div>
            </label>

            <label :class="['status-card', { 'active': form.status === 'published' }]">
              <input
                v-model="form.status"
                type="radio"
                value="published"
              />
              <div class="status-icon">[√]</div>
              <div class="status-name">Publié</div>
              <div class="status-desc">La leçon sera visible et accessible aux étudiants</div>
            </label>

            <label :class="['status-card', { 'active': form.status === 'archived' }]">
              <input
                v-model="form.status"
                type="radio"
                value="archived"
              />
              <div class="status-icon">[A]</div>
              <div class="status-name">Archivé</div>
              <div class="status-desc">La leçon est conservée mais n'est plus accessible</div>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="form-actions">
          <button type="button" @click="$router.go(-1)" class="btn-cancel">
            Annuler
          </button>
          <button type="submit" :disabled="saving" class="btn-save">
            {{ saving ? 'Enregistrement...' : (isEditMode ? 'Mettre à jour' : 'Créer la leçon') }}
          </button>
          <button
            v-if="isEditMode"
            type="button"
            @click="deleteLesson"
            :disabled="saving"
            class="btn-delete"
          >
            Supprimer
          </button>
        </div>
      </form>
    </div>
  </DashboardLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import lessonService from '@/services/lesson'
import chapterService from '@/services/chapter'
import { klassciService } from '@/services/klassci'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const showPreview = ref(false)

const form = ref({
  title: '',
  description: '',
  content: '',
  type: 'cours',
  status: 'draft',
  matiere_id: null,
  classe_id: null,
  chapter_id: null,
  content_type: 'text',
  video_url: '',
  video_provider: 'youtube',
  pdf_url: '',
  audio_url: '',
  presentation_url: '',
  external_link: '',
  duration_minutes: null,
  resources: []
})

const chapters = ref([])
const loadingChapters = ref(false)
const matieres = ref([])
const classes = ref([])

const contentTypes = [
  { value: 'text', label: 'Texte', icon: '[T]' },
  { value: 'video', label: 'Vidéo', icon: '[V]' },
  { value: 'pdf', label: 'PDF', icon: '[P]' },
  { value: 'audio', label: 'Audio', icon: '(~)' },
  { value: 'presentation', label: 'Présentation', icon: '[S]' },
  { value: 'link', label: 'Lien', icon: '@' },
  { value: 'mixed', label: 'Mixte', icon: '[*]' }
]

const videoProviders = [
  { value: 'youtube', label: 'YouTube', icon: '►' },
  { value: 'vimeo', label: 'Vimeo', icon: '▷' },
  { value: 'local', label: 'Fichier local', icon: '◄' },
  { value: 'other', label: 'Autre', icon: '○' }
]

const isEditMode = computed(() => !!route.params.id)

const loadLesson = async () => {
  if (!isEditMode.value) return

  try {
    loading.value = true
    const response = await lessonService.getLesson(route.params.id)

    if (response.success) {
      const lesson = response.data
      form.value = {
        title: lesson.title,
        description: lesson.description || '',
        content: lesson.content || '',
        type: lesson.type,
        status: lesson.status,
        matiere_id: lesson.matiere_id,
        classe_id: lesson.classe_id,
        chapter_id: lesson.chapter_id,
        content_type: lesson.content_type || 'text',
        video_url: lesson.video_url || '',
        video_provider: lesson.video_provider || 'youtube',
        pdf_url: lesson.pdf_url || '',
        audio_url: lesson.audio_url || '',
        presentation_url: lesson.presentation_url || '',
        external_link: lesson.external_link || '',
        duration_minutes: lesson.duration_minutes,
        resources: lesson.resources || []
      }
    }
  } catch (error) {
    console.error('[LessonEditor] Erreur loadLesson:', error)
    alert('Erreur lors du chargement de la leçon')
    router.go(-1)
  } finally {
    loading.value = false
  }
}

const saveLesson = async () => {
  console.log('[LessonEditor] saveLesson() démarré')
  console.log('[LessonEditor] Form data:', JSON.stringify(form.value, null, 2))

  try {
    saving.value = true
    console.log('[LessonEditor] saving = true')

    let response
    if (isEditMode.value) {
      console.log('[LessonEditor] Mode édition - ID:', route.params.id)
      response = await lessonService.updateLesson(route.params.id, form.value)
    } else {
      console.log('[LessonEditor] Mode création')
      response = await lessonService.createLesson(form.value)
    }

    console.log('[LessonEditor] Réponse API:', response)
    console.log('[LessonEditor] response.success:', response.success)
    console.log('[LessonEditor] response.data:', response.data)

    // L'API peut retourner soit response.success, soit response.data.success
    const success = response.success || (response.data && response.data.success)

    if (success) {
      console.log('[LessonEditor] Succès! Redirection vers /teacher/lessons')
      alert(isEditMode.value ? 'Leçon mise à jour avec succès !' : 'Leçon créée avec succès !')
      router.push('/teacher/lessons')
    } else {
      console.warn('[LessonEditor] Aucune indication de succès dans la réponse')
      console.warn('[LessonEditor] Structure complète:', JSON.stringify(response, null, 2))
      alert('La réponse de l\'API n\'indique pas de succès')
    }
  } catch (error) {
    console.error('[LessonEditor] Erreur saveLesson:', error)
    console.error('[LessonEditor] error.response:', error.response)
    alert('Erreur: ' + (error.response?.data?.message || error.message))
  } finally {
    saving.value = false
    console.log('[LessonEditor] saving = false')
  }
}

const deleteLesson = async () => {
  if (!confirm('Êtes-vous sûr de vouloir supprimer cette leçon ? Cette action est irréversible.')) {
    return
  }

  try {
    saving.value = true
    const response = await lessonService.deleteLesson(route.params.id)

    if (response.success) {
      alert('Leçon supprimée avec succès')
      router.push('/teacher/lessons')
    }
  } catch (error) {
    console.error('[LessonEditor] Erreur deleteLesson:', error)
    alert('Erreur lors de la suppression: ' + (error.response?.data?.message || error.message))
  } finally {
    saving.value = false
  }
}

const loadChapters = async () => {
  try {
    loadingChapters.value = true
    const params = {}

    if (form.value.matiere_id) {
      params.matiere_id = form.value.matiere_id
    }

    const response = await chapterService.getChapters(params)

    if (response && response.success) {
      chapters.value = response.data || []
      console.log('[LessonEditor] Chapitres chargés:', chapters.value.length)
    }
  } catch (error) {
    console.error('[LessonEditor] Erreur loadChapters:', error)
  } finally {
    loadingChapters.value = false
  }
}

const addResource = () => {
  form.value.resources.push({
    title: '',
    description: '',
    type: 'pdf',
    url: '',
    order: form.value.resources.length
  })
}

const removeResource = (index) => {
  if (confirm('Êtes-vous sûr de vouloir supprimer cette ressource ?')) {
    form.value.resources.splice(index, 1)
    form.value.resources.forEach((resource, idx) => {
      resource.order = idx
    })
  }
}

const loadMatieres = async () => {
  try {
    const data = await klassciService.getMatieres()
    matieres.value = data || []
    console.log('[LessonEditor] Matières chargées:', matieres.value.length)
  } catch (error) {
    console.error('[LessonEditor] Erreur loadMatieres:', error)
  }
}

const loadClasses = async () => {
  try {
    const data = await klassciService.getClasses()
    classes.value = data || []
    console.log('[LessonEditor] Classes chargées:', classes.value.length)
  } catch (error) {
    console.error('[LessonEditor] Erreur loadClasses:', error)
  }
}

onMounted(() => {
  loadMatieres()
  loadClasses()
  loadLesson()
  loadChapters()
})
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
  border-top-color: #3b82f6;
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

.form-section {
  background: var(--card-bg);
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: var(--card-shadow);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
}

.section-description {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1.5rem;
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
  border-color: #3b82f6;
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

.form-textarea.code-editor {
  font-family: 'Courier New', monospace;
  font-size: 0.813rem;
}

.form-hint {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}

/* Content Type Grid */
.content-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.content-type-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.content-type-card:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}

.content-type-card.active {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.content-type-radio {
  position: absolute;
  opacity: 0;
}

.content-type-icon {
  font-size: 2rem;
}

.content-type-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

/* Radio Group */
.radio-group {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.radio-card {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}

.radio-card:hover {
  background: var(--bg-tertiary);
}

.radio-card.active {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.radio-card input[type="radio"] {
  margin: 0;
}

/* Editor Tabs */
.editor-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.tab-btn {
  padding: 0.75rem 1.5rem;
  background: transparent;
  border: none;
  border-bottom: 2px solid transparent;
  color: var(--text-secondary);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.tab-btn:hover {
  color: var(--text-primary);
  background: var(--bg-secondary);
}

.tab-btn.active {
  color: #3b82f6;
  border-bottom-color: #3b82f6;
}

/* Preview Panel */
.preview-panel {
  min-height: 300px;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
}

.preview-content {
  color: var(--text-primary);
  line-height: 1.75;
}

.preview-empty {
  text-align: center;
  padding: 4rem;
  color: var(--text-tertiary);
  font-style: italic;
}

/* Resources */
.resources-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.resource-card {
  padding: 1.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.resource-number {
  font-weight: 700;
  color: var(--text-primary);
}

.btn-remove {
  padding: 0.5rem 1rem;
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fca5a5;
  border-radius: 0.375rem;
  font-size: 0.813rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #fecaca;
}

.resources-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-tertiary);
}

.resources-empty p {
  margin: 0.5rem 0;
}

.text-hint {
  font-size: 0.875rem;
}

/* Status Grid */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.status-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.status-card:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}

.status-card.active {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.status-card input[type="radio"] {
  position: absolute;
  opacity: 0;
}

.status-icon {
  font-size: 2rem;
}

.status-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.status-desc {
  font-size: 0.813rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Actions */
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  padding: 1.5rem;
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
}

.btn-cancel,
.btn-save,
.btn-delete,
.btn-add {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.btn-cancel {
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-primary);
}

.btn-cancel:hover {
  background: var(--bg-tertiary);
}

.btn-save {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
  color: white;
}

.btn-save:hover:not(:disabled) {
  background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
  transform: translateY(-1px);
}

.btn-save:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-delete {
  background: #fee2e2;
  color: #dc2626;
  border: 1px solid #fca5a5;
}

.btn-delete:hover:not(:disabled) {
  background: #fecaca;
}

.btn-delete:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-add {
  padding: 0.75rem 1.5rem;
  background: #dbeafe;
  color: #1d4ed8;
  border: 1px solid #93c5fd;
}

.btn-add:hover {
  background: #bfdbfe;
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

  .form-row {
    grid-template-columns: 1fr;
  }

  .content-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .radio-group {
    flex-direction: column;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-cancel,
  .btn-save,
  .btn-delete {
    width: 100%;
  }
}
</style>
