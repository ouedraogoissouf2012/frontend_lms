<template>
  <div class="min-h-screen bg-gray-50 py-8">
    <div class="max-w-7xl mx-auto px-4">
      <!-- Header -->
      <div class="mb-8">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Mes Leçons</h1>
            <p class="text-gray-600 mt-2">Gérez vos leçons et suivez les progressions des étudiants</p>
          </div>
          <button
            @click="$router.push('/teacher/lessons/create')"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
            </svg>
            Nouvelle leçon
          </button>
        </div>

        <!-- Filtres -->
        <div class="bg-white rounded-lg shadow p-4">
          <div class="grid grid-cols-4 gap-4">
            <!-- Type -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Type</label>
              <select
                v-model="filters.type"
                @change="loadLessons"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les types</option>
                <option value="cours">📖 Cours</option>
                <option value="tp">💻 TP</option>
                <option value="td">✏️ TD</option>
                <option value="projet">🚀 Projet</option>
                <option value="autre">📄 Autre</option>
              </select>
            </div>

            <!-- Statut -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Statut</label>
              <select
                v-model="filters.status"
                @change="loadLessons"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="draft">🔒 Brouillon</option>
                <option value="published">✅ Publié</option>
                <option value="archived">📦 Archivé</option>
              </select>
            </div>

            <!-- Matière -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Matière (ID)</label>
              <input
                v-model.number="filters.matiere_id"
                type="number"
                @input="loadLessons"
                placeholder="ID matière"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <!-- Classe -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Classe (ID)</label>
              <input
                v-model.number="filters.classe_id"
                type="number"
                @input="loadLessons"
                placeholder="ID classe"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- Bouton reset filtres -->
          <div class="mt-4 flex justify-end">
            <button
              @click="resetFilters"
              class="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
            >
              Réinitialiser les filtres
            </button>
          </div>
        </div>
      </div>

      <!-- Statistiques -->
      <div class="grid grid-cols-4 gap-4 mb-8">
        <div class="bg-white rounded-lg shadow p-6">
          <div class="text-sm text-gray-600 mb-1">Total</div>
          <div class="text-3xl font-bold text-gray-900">{{ stats.total }}</div>
        </div>
        <div class="bg-green-50 rounded-lg shadow p-6">
          <div class="text-sm text-gray-600 mb-1">Publiées</div>
          <div class="text-3xl font-bold text-green-700">{{ stats.published }}</div>
        </div>
        <div class="bg-yellow-50 rounded-lg shadow p-6">
          <div class="text-sm text-gray-600 mb-1">Brouillons</div>
          <div class="text-3xl font-bold text-yellow-700">{{ stats.draft }}</div>
        </div>
        <div class="bg-gray-50 rounded-lg shadow p-6">
          <div class="text-sm text-gray-600 mb-1">Archivées</div>
          <div class="text-3xl font-bold text-gray-700">{{ stats.archived }}</div>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex justify-center items-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>

      <!-- Liste des leçons -->
      <div v-else-if="lessons.length > 0" class="space-y-4">
        <LessonCard
          v-for="lesson in lessons"
          :key="lesson.id"
          :lesson="lesson"
          :is-teacher="true"
          :show-stats="true"
          :show-status="true"
          @view="viewLesson"
          @edit="editLesson"
          @delete="confirmDelete"
          @publish="publishLesson"
          @unpublish="unpublishLesson"
        />

        <!-- Pagination -->
        <div v-if="pagination.last_page > 1" class="flex justify-center items-center gap-2 mt-8">
          <button
            @click="changePage(pagination.current_page - 1)"
            :disabled="pagination.current_page === 1"
            class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Précédent
          </button>

          <span class="text-sm text-gray-600">
            Page {{ pagination.current_page }} sur {{ pagination.last_page }}
          </span>

          <button
            @click="changePage(pagination.current_page + 1)"
            :disabled="pagination.current_page === pagination.last_page"
            class="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>

      <!-- État vide -->
      <div v-else class="bg-white rounded-lg shadow p-12 text-center">
        <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Aucune leçon trouvée</h3>
        <p class="text-gray-600 mb-6">
          {{ hasFilters ? 'Aucune leçon ne correspond à vos critères de recherche.' : 'Vous n\'avez pas encore créé de leçon.' }}
        </p>
        <button
          @click="hasFilters ? resetFilters() : $router.push('/teacher/lessons/create')"
          class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
        >
          {{ hasFilters ? 'Réinitialiser les filtres' : 'Créer ma première leçon' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { auth } from '@/services/api'
import lessonService from '@/services/lesson'
import LessonCard from '@/components/lessons/LessonCard.vue'

export default {
  name: 'TeacherLessons',
  components: {
    LessonCard
  },
  setup() {
    const router = useRouter()
    const user = auth.getUser()

    const lessons = ref([])
    const loading = ref(true)
    const filters = ref({
      type: '',
      status: '',
      matiere_id: null,
      classe_id: null,
      enseignant_id: user?.klassci_id || null
    })

    const pagination = ref({
      current_page: 1,
      last_page: 1,
      per_page: 15,
      total: 0
    })

    const stats = computed(() => {
      return {
        total: lessons.value.length,
        published: lessons.value.filter(l => l.status === 'published').length,
        draft: lessons.value.filter(l => l.status === 'draft').length,
        archived: lessons.value.filter(l => l.status === 'archived').length
      }
    })

    const hasFilters = computed(() => {
      return filters.value.type || filters.value.status || filters.value.matiere_id || filters.value.classe_id
    })

    const loadLessons = async () => {
      try {
        loading.value = true

        const params = {}
        if (filters.value.type) params.type = filters.value.type
        if (filters.value.status) params.status = filters.value.status
        if (filters.value.matiere_id) params.matiere_id = filters.value.matiere_id
        if (filters.value.classe_id) params.classe_id = filters.value.classe_id
        if (filters.value.enseignant_id) params.enseignant_id = filters.value.enseignant_id

        const response = await lessonService.getLessons(params)

        if (response.success) {
          lessons.value = response.data.data || response.data
          if (response.data.current_page) {
            pagination.value = {
              current_page: response.data.current_page,
              last_page: response.data.last_page,
              per_page: response.data.per_page,
              total: response.data.total
            }
          }
        }
      } catch (error) {
        console.error('[TeacherLessons] Erreur loadLessons:', error)
      } finally {
        loading.value = false
      }
    }

    const resetFilters = () => {
      filters.value = {
        type: '',
        status: '',
        matiere_id: null,
        classe_id: null,
        enseignant_id: user?.klassci_id || null
      }
      loadLessons()
    }

    const viewLesson = (lessonId) => {
      router.push(`/lessons/${lessonId}`)
    }

    const editLesson = (lessonId) => {
      router.push(`/teacher/lessons/${lessonId}/edit`)
    }

    const confirmDelete = async (lessonId) => {
      if (!confirm('Êtes-vous sûr de vouloir supprimer cette leçon ? Cette action est irréversible.')) {
        return
      }

      try {
        const response = await lessonService.deleteLesson(lessonId)
        if (response.success) {
          alert('Leçon supprimée avec succès')
          loadLessons()
        }
      } catch (error) {
        console.error('[TeacherLessons] Erreur deleteLesson:', error)
        alert('Erreur lors de la suppression: ' + (error.response?.data?.message || error.message))
      }
    }

    const publishLesson = async (lessonId) => {
      try {
        const response = await lessonService.publishLesson(lessonId)
        if (response.success) {
          loadLessons()
        }
      } catch (error) {
        console.error('[TeacherLessons] Erreur publishLesson:', error)
        alert('Erreur lors de la publication: ' + (error.response?.data?.message || error.message))
      }
    }

    const unpublishLesson = async (lessonId) => {
      try {
        const response = await lessonService.unpublishLesson(lessonId)
        if (response.success) {
          loadLessons()
        }
      } catch (error) {
        console.error('[TeacherLessons] Erreur unpublishLesson:', error)
        alert('Erreur lors de la dépublication: ' + (error.response?.data?.message || error.message))
      }
    }

    const changePage = (page) => {
      if (page >= 1 && page <= pagination.value.last_page) {
        pagination.value.current_page = page
        loadLessons()
      }
    }

    onMounted(() => {
      loadLessons()
    })

    return {
      lessons,
      loading,
      filters,
      pagination,
      stats,
      hasFilters,
      resetFilters,
      viewLesson,
      editLesson,
      confirmDelete,
      publishLesson,
      unpublishLesson,
      changePage
    }
  }
}
</script>
