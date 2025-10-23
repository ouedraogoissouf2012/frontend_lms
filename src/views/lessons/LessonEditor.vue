<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900">
          {{ isEditMode ? 'Modifier la leçon' : 'Nouvelle leçon' }}
        </h1>
        <p class="text-gray-600 mt-2">
          {{ isEditMode ? 'Modifiez les informations de la leçon' : 'Créez une nouvelle leçon pour vos étudiants' }}
        </p>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Formulaire -->
      <form v-else @submit.prevent="saveLesson" class="space-y-6">
        <!-- Informations de base -->
        <div class="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Informations de base</h2>

          <!-- Titre -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Titre <span class="text-red-500">*</span>
            </label>
            <input
              v-model="form.title"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ex: Introduction à Laravel"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Description courte
            </label>
            <textarea
              v-model="form.description"
              rows="3"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Résumé de la leçon (2-3 phrases)"
            ></textarea>
          </div>

          <!-- Type et Durée -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Type de leçon <span class="text-red-500">*</span>
              </label>
              <select
                v-model="form.type"
                required
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="cours">📖 Cours magistral</option>
                <option value="tp">💻 Travaux Pratiques (TP)</option>
                <option value="td">✏️ Travaux Dirigés (TD)</option>
                <option value="projet">🚀 Projet</option>
                <option value="autre">📄 Autre</option>
              </select>
            </div>

            <!-- Durée -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Durée estimée (minutes)
              </label>
              <input
                v-model.number="form.duration_minutes"
                type="number"
                min="1"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 120"
              />
            </div>
          </div>

          <!-- Matière et Classe -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Matière -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Matière (ID KLASSCI)
              </label>
              <input
                v-model.number="form.matiere_id"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 1"
              />
              <p class="text-xs text-gray-500 mt-1">Optionnel - ID de la matière dans KLASSCI</p>
            </div>

            <!-- Classe -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">
                Classe (ID KLASSCI)
              </label>
              <input
                v-model.number="form.classe_id"
                type="number"
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: 12"
              />
              <p class="text-xs text-gray-500 mt-1">Optionnel - ID de la classe dans KLASSCI</p>
            </div>
          </div>
        </div>

        <!-- Contenu -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Contenu de la leçon</h2>

          <div class="mb-4">
            <div class="flex items-center gap-2 mb-2">
              <button
                type="button"
                @click="showPreview = false"
                :class="!showPreview ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
                class="px-4 py-2 rounded-lg font-medium"
              >
                ✏️ Éditer
              </button>
              <button
                type="button"
                @click="showPreview = true"
                :class="showPreview ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'"
                class="px-4 py-2 rounded-lg font-medium"
              >
                👁️ Prévisualiser
              </button>
            </div>
          </div>

          <!-- Éditeur -->
          <div v-show="!showPreview">
            <textarea
              v-model="form.content"
              rows="20"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="Contenu HTML de la leçon...

Exemples:
<h1>Titre principal</h1>
<h2>Sous-titre</h2>
<p>Paragraphe de texte...</p>
<ul>
  <li>Élément de liste</li>
</ul>
"
            ></textarea>
            <p class="text-xs text-gray-500 mt-2">
              Vous pouvez utiliser du HTML pour formater le contenu
            </p>
          </div>

          <!-- Prévisualisation -->
          <div v-show="showPreview" class="border border-gray-300 rounded-lg p-6 min-h-[300px]">
            <div v-if="form.content" v-html="form.content" class="prose max-w-none"></div>
            <div v-else class="text-gray-400 italic">Aucun contenu à prévisualiser</div>
          </div>
        </div>

        <!-- Statut de publication -->
        <div class="bg-white rounded-lg shadow p-6">
          <h2 class="text-xl font-semibold text-gray-900 mb-4">Statut de publication</h2>

          <div class="space-y-3">
            <label class="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                v-model="form.status"
                type="radio"
                value="draft"
                class="w-4 h-4 text-blue-600"
              />
              <div>
                <div class="font-medium text-gray-900">🔒 Brouillon</div>
                <div class="text-sm text-gray-600">La leçon ne sera pas visible par les étudiants</div>
              </div>
            </label>

            <label class="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                v-model="form.status"
                type="radio"
                value="published"
                class="w-4 h-4 text-blue-600"
              />
              <div>
                <div class="font-medium text-gray-900">✅ Publié</div>
                <div class="text-sm text-gray-600">La leçon sera visible et accessible aux étudiants</div>
              </div>
            </label>

            <label class="flex items-center gap-3 p-3 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <input
                v-model="form.status"
                type="radio"
                value="archived"
                class="w-4 h-4 text-blue-600"
              />
              <div>
                <div class="font-medium text-gray-900">📦 Archivé</div>
                <div class="text-sm text-gray-600">La leçon est conservée mais n'est plus accessible</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between bg-white rounded-lg shadow p-6">
          <button
            type="button"
            @click="$router.go(-1)"
            class="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
          >
            Annuler
          </button>

          <div class="flex items-center gap-3">
            <button
              v-if="isEditMode"
              type="button"
              @click="deleteLesson"
              :disabled="saving"
              class="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
            >
              Supprimer
            </button>
            <button
              type="submit"
              :disabled="saving"
              class="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium"
            >
              {{ saving ? 'Enregistrement...' : (isEditMode ? 'Mettre à jour' : 'Créer la leçon') }}
            </button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import lessonService from '@/services/lesson'

export default {
  name: 'LessonEditor',
  setup() {
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
      duration_minutes: null
    })

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
            duration_minutes: lesson.duration_minutes
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
      try {
        saving.value = true

        let response
        if (isEditMode.value) {
          response = await lessonService.updateLesson(route.params.id, form.value)
        } else {
          response = await lessonService.createLesson(form.value)
        }

        if (response.success) {
          alert(isEditMode.value ? 'Leçon mise à jour avec succès !' : 'Leçon créée avec succès !')
          router.push(`/lessons/${response.data.id}`)
        }
      } catch (error) {
        console.error('[LessonEditor] Erreur saveLesson:', error)
        alert('Erreur: ' + (error.response?.data?.message || error.message))
      } finally {
        saving.value = false
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

    onMounted(() => {
      loadLesson()
    })

    return {
      form,
      loading,
      saving,
      showPreview,
      isEditMode,
      saveLesson,
      deleteLesson
    }
  }
}
</script>

<style scoped>
.prose {
  color: #374151;
  line-height: 1.75;
}

.prose h1 {
  font-size: 2em;
  font-weight: 700;
  margin-top: 0;
  margin-bottom: 0.8em;
}

.prose h2 {
  font-size: 1.5em;
  font-weight: 600;
  margin-top: 2em;
  margin-bottom: 1em;
}

.prose p {
  margin-top: 1.25em;
  margin-bottom: 1.25em;
}

.prose ul, .prose ol {
  padding-left: 1.625em;
  margin-top: 1.25em;
  margin-bottom: 1.25em;
}
</style>
