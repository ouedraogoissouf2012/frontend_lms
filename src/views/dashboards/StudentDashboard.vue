<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="mb-8 flex items-center gap-4">
        <AcademicCapIcon class="w-10 h-10 text-blue-600" />
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            Tableau de bord Étudiant
          </h1>
          <p class="text-gray-600 mt-1">
            Bienvenue, <strong>{{ user?.name }}</strong>
          </p>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p class="text-gray-600 mt-4">Chargement de vos données...</p>
      </div>

      <!-- Error state -->
      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        {{ error }}
      </div>

      <!-- Dashboard Content -->
      <div v-if="!loading && dashboardData">
        <!-- Ma Classe -->
        <div v-if="dashboardData.classe" class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="flex items-center gap-2 mb-4">
            <BuildingLibraryIcon class="w-6 h-6 text-blue-600" />
            <h2 class="text-xl font-bold">Ma Classe</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p class="text-gray-500 text-sm">Classe</p>
              <p class="font-semibold">{{ dashboardData.classe.name || dashboardData.classe.libelle || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-gray-500 text-sm">Filière</p>
              <p class="font-semibold">{{ dashboardData.classe.filiere?.name || dashboardData.classe.filiere?.nom || dashboardData.classe.filiere?.libelle || 'N/A' }}</p>
            </div>
            <div>
              <p class="text-gray-500 text-sm">Niveau</p>
              <p class="font-semibold">{{ dashboardData.classe.niveau?.name || dashboardData.classe.niveau?.nom || dashboardData.classe.niveau?.libelle || 'N/A' }}</p>
            </div>
          </div>
        </div>

        <!-- Statistiques -->
        <div v-if="dashboardData.statistiques" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center gap-2 mb-2">
              <ChartBarIcon class="w-5 h-5 text-blue-600" />
              <p class="text-gray-500 text-sm">Moyenne Générale</p>
            </div>
            <p class="text-3xl font-bold text-blue-600">
              {{ dashboardData.statistiques.moyenne_generale || 'N/A' }}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center gap-2 mb-2">
              <CheckCircleIcon class="w-5 h-5 text-green-600" />
              <p class="text-gray-500 text-sm">Taux de Présence</p>
            </div>
            <p class="text-3xl font-bold text-green-600">
              {{ dashboardData.statistiques.taux_presence || '0' }}%
            </p>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center gap-2 mb-2">
              <BookOpenIcon class="w-5 h-5 text-purple-600" />
              <p class="text-gray-500 text-sm">Cours Suivis</p>
            </div>
            <p class="text-3xl font-bold text-purple-600">
              {{ dashboardData.cours?.length || 0 }}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center gap-2 mb-2">
              <DocumentTextIcon class="w-5 h-5 text-orange-600" />
              <p class="text-gray-500 text-sm">Quiz à Venir</p>
            </div>
            <p class="text-3xl font-bold text-orange-600">
              {{ dashboardData.quiz?.length || 0 }}
            </p>
          </div>
        </div>

        <!-- Mes Cours (Matières) -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="flex items-center gap-2 mb-4">
            <BookOpenIcon class="w-6 h-6 text-purple-600" />
            <h2 class="text-xl font-bold">Mes Cours</h2>
          </div>
          <div v-if="dashboardData.cours && dashboardData.cours.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="cours in dashboardData.cours"
              :key="cours.id || cours.matiere_id"
              class="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
              @click="navigateToMatiere(cours)"
            >
              <h3 class="font-semibold text-lg mb-2">
                {{ cours.name || cours.nom || cours.libelle || cours.matiere?.name || cours.matiere?.nom || 'Cours sans nom' }}
              </h3>
              <p v-if="cours.coefficient || cours.matiere?.coefficient" class="text-sm text-gray-600 mb-3">
                Coefficient: {{ cours.coefficient || cours.matiere?.coefficient || 'N/A' }}
              </p>

              <div class="flex gap-2">
                <button
                  @click.stop="navigateToMatiere(cours)"
                  class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
                >
                  <BookOpenIcon class="w-5 h-5" />
                  Voir détails
                </button>
              </div>
            </div>
          </div>
          <p v-else class="text-gray-500">Aucun cours disponible</p>
        </div>

        <!-- Quiz à Venir (Évaluations) -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="flex items-center gap-2 mb-4">
            <DocumentTextIcon class="w-6 h-6 text-orange-600" />
            <h2 class="text-xl font-bold">Quiz à Venir</h2>
          </div>
          <div v-if="dashboardData.quiz && dashboardData.quiz.length > 0" class="space-y-4">
            <div
              v-for="quiz in dashboardData.quiz"
              :key="quiz.id"
              class="border rounded-lg p-4 hover:shadow-md transition"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-semibold text-lg">{{ quiz.titre }}</h3>
                  <p class="text-sm text-gray-600 mt-1">{{ quiz.matiere?.name }}</p>
                  <p class="text-sm text-gray-500 mt-1">Date: {{ formatDate(quiz.date) }}</p>
                </div>
                <span
                  :class="{
                    'bg-green-100 text-green-800': quiz.statut === 'planifie',
                    'bg-blue-100 text-blue-800': quiz.statut === 'en_cours',
                    'bg-gray-100 text-gray-800': quiz.statut === 'termine'
                  }"
                  class="px-3 py-1 rounded-full text-xs font-semibold"
                >
                  {{ quiz.statut }}
                </span>
              </div>
            </div>
          </div>
          <p v-else class="text-gray-500">Aucun quiz à venir</p>
        </div>

        <!-- Mes Notes -->
        <div v-if="dashboardData.notes && dashboardData.notes.length > 0" class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="flex items-center gap-2 mb-4">
            <ChartBarIcon class="w-6 h-6 text-blue-600" />
            <h2 class="text-xl font-bold">Mes Dernières Notes</h2>
          </div>
          <div class="space-y-3">
            <div
              v-for="note in dashboardData.notes"
              :key="note.id"
              class="flex justify-between items-center border-b pb-3"
            >
              <div>
                <p class="font-semibold">{{ note.evaluation?.titre || 'Évaluation' }}</p>
                <p class="text-sm text-gray-600">{{ note.matiere?.name }}</p>
              </div>
              <div class="text-right">
                <p class="text-2xl font-bold text-blue-600">{{ note.note }}/20</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Menu actions rapides -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <router-link
            to="/lessons"
            class="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <BookOpenIcon class="w-12 h-12 text-blue-600 mb-3" />
            <h3 class="font-bold text-lg mb-2">Accéder aux Leçons</h3>
            <p class="text-gray-600 text-sm">Consulter les supports de cours</p>
          </router-link>

          <router-link
            to="/student/evaluations"
            class="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <DocumentTextIcon class="w-12 h-12 text-orange-600 mb-3" />
            <h3 class="font-bold text-lg mb-2">Mes Évaluations</h3>
            <p class="text-gray-600 text-sm">Passer les évaluations en ligne</p>
          </router-link>

          <router-link
            to="/quizzes"
            class="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <DocumentTextIcon class="w-12 h-12 text-green-600 mb-3" />
            <h3 class="font-bold text-lg mb-2">Passer les Quiz</h3>
            <p class="text-gray-600 text-sm">Quiz interactifs</p>
          </router-link>

          <router-link
            to="/forum"
            class="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <ChatBubbleLeftRightIcon class="w-12 h-12 text-purple-600 mb-3" />
            <h3 class="font-bold text-lg mb-2">Poser une Question</h3>
            <p class="text-gray-600 text-sm">Échanger avec la communauté</p>
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'
import { auth } from '@/services/api'
import { klassciService } from '@/services/klassci'
import {
  AcademicCapIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  BuildingLibraryIcon,
  ChartBarIcon,
  CheckCircleIcon,
  VideoCameraIcon
} from '@heroicons/vue/24/outline'

export default {
  name: 'StudentDashboard',
  components: {
    Navbar,
    AcademicCapIcon,
    BookOpenIcon,
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    BuildingLibraryIcon,
    ChartBarIcon,
    CheckCircleIcon,
    VideoCameraIcon
  },
  data() {
    return {
      user: null,
      dashboardData: null,
      loading: false,
      error: null
    }
  },
  methods: {
    async loadDashboard() {
      this.loading = true
      this.error = null

      try {
        console.log('📊 Chargement dashboard étudiant depuis KLASSCI...')
        this.dashboardData = await klassciService.getStudentDashboard()
        console.log('✅ Dashboard chargé:', this.dashboardData)

        // Logs détaillés pour debug
        if (this.dashboardData) {
          console.log('📚 Classe:', this.dashboardData.classe)
          console.log('📖 Cours:', this.dashboardData.cours)
          console.log('📝 Quiz:', this.dashboardData.quiz)
          console.log('📊 Stats:', this.dashboardData.statistiques)
        }
      } catch (err) {
        console.error('❌ Erreur chargement dashboard:', err)
        this.error = 'Impossible de charger vos données. Veuillez réessayer.'
      } finally {
        this.loading = false
      }
    },

    formatDate(dateString) {
      if (!dateString) return 'N/A'
      const date = new Date(dateString)
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    },

    navigateToMatiere(cours) {
      // Naviguer vers la page de détails de la matière
      const matiereId = cours.id || cours.matiere_id || cours.matiere?.id
      if (matiereId) {
        console.log('📚 Navigation vers matière:', matiereId)
        this.$router.push({
          name: 'matiere-details',
          params: { id: matiereId }
        })
      } else {
        console.error('❌ ID matière non trouvé:', cours)
        alert('Impossible de naviguer vers cette matière')
      }
    },

    joinCourse(cours) {
      // Générer le même nom de salle que l'enseignant
      const coursName = (cours.name || cours.nom || cours.libelle || 'cours').toLowerCase().replace(/\s+/g, '-')
      const className = this.dashboardData.classe ?
        (this.dashboardData.classe.name || this.dashboardData.classe.libelle || 'classe').toLowerCase().replace(/\s+/g, '-')
        : 'general'
      const roomName = `${coursName}-${className}-${cours.id || cours.matiere_id}`

      const courseTitle = cours.name || cours.nom || cours.libelle || 'Cours'

      console.log('🎥 Rejoindre cours:', roomName)

      // Rediriger vers la salle de visioconférence
      this.$router.push({
        name: 'VideoConference',
        params: { roomName },
        query: { title: courseTitle }
      })
    }
  },
  mounted() {
    this.user = auth.getUser()
    console.log('👤 Student User:', this.user)

    // Charger le dashboard KLASSCI
    this.loadDashboard()
  }
}
</script>
