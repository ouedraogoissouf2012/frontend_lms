<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <div class="mb-8 flex items-center gap-4">
        <UserIcon class="w-10 h-10 text-green-600" />
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            Tableau de bord Enseignant
          </h1>
          <p class="text-gray-600 mt-1">
            Bienvenue, <strong>{{ user?.name }}</strong>
          </p>
        </div>
      </div>

      <!-- Loading state -->
      <div v-if="loading" class="text-center py-12">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
        <p class="text-gray-600 mt-4">Chargement de vos données...</p>
      </div>

      <!-- Error state -->
      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        {{ error }}
      </div>

      <!-- Dashboard Content -->
      <div v-if="!loading && dashboardData">
        <!-- Statistiques -->
        <div v-if="dashboardData.statistiques" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center gap-2 mb-2">
              <BookOpenIcon class="w-5 h-5 text-blue-600" />
              <p class="text-gray-500 text-sm">Matières Enseignées</p>
            </div>
            <p class="text-3xl font-bold text-blue-600">
              {{ dashboardData.matieres?.length || 0 }}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center gap-2 mb-2">
              <UserGroupIcon class="w-5 h-5 text-green-600" />
              <p class="text-gray-500 text-sm">Classes</p>
            </div>
            <p class="text-3xl font-bold text-green-600">
              {{ dashboardData.classes?.length || 0 }}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center gap-2 mb-2">
              <DocumentTextIcon class="w-5 h-5 text-orange-600" />
              <p class="text-gray-500 text-sm">Évaluations</p>
            </div>
            <p class="text-3xl font-bold text-orange-600">
              {{ dashboardData.evaluations?.length || 0 }}
            </p>
          </div>

          <div class="bg-white rounded-lg shadow p-6">
            <div class="flex items-center gap-2 mb-2">
              <CalendarIcon class="w-5 h-5 text-purple-600" />
              <p class="text-gray-500 text-sm">Cours à venir</p>
            </div>
            <p class="text-3xl font-bold text-purple-600">
              {{ dashboardData.seances?.length || 0 }}
            </p>
          </div>
        </div>

        <!-- Mes Matières -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="flex items-center gap-2 mb-4">
            <BookOpenIcon class="w-6 h-6 text-blue-600" />
            <h2 class="text-xl font-bold">Mes Matières</h2>
          </div>
          <div v-if="dashboardData.matieres && dashboardData.matieres.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="matiere in dashboardData.matieres"
              :key="matiere.id || matiere.matiere_id"
              class="border rounded-lg p-4 hover:shadow-md transition cursor-pointer"
              @click="navigateToMatiere(matiere)"
            >
              <h3 class="font-semibold text-lg mb-2">
                {{ matiere.name || matiere.nom || matiere.libelle || 'Matière sans nom' }}
              </h3>
              <p v-if="matiere.coefficient" class="text-sm text-gray-600 mb-3">Coefficient: {{ matiere.coefficient }}</p>

              <button
                @click.stop="navigateToMatiere(matiere)"
                class="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition"
              >
                <BookOpenIcon class="w-5 h-5" />
                Gérer la matière
              </button>
            </div>
          </div>
          <p v-else class="text-gray-500">Aucune matière assignée</p>
        </div>

        <!-- Mes Classes -->
        <div class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="flex items-center gap-2 mb-4">
            <UserGroupIcon class="w-6 h-6 text-green-600" />
            <h2 class="text-xl font-bold">Mes Classes</h2>
          </div>
          <div v-if="dashboardData.classes && dashboardData.classes.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="classe in dashboardData.classes"
              :key="classe.id"
              class="border rounded-lg p-4 hover:shadow-md transition"
            >
              <h3 class="font-semibold text-lg mb-2">{{ classe.name || classe.libelle }}</h3>
              <p v-if="classe.filiere" class="text-sm text-gray-600 mb-1">
                Filière: {{ classe.filiere.name || classe.filiere.nom }}
              </p>
              <p v-if="classe.niveau" class="text-sm text-gray-600">
                Niveau: {{ classe.niveau.name || classe.niveau.nom }}
              </p>
            </div>
          </div>
          <p v-else class="text-gray-500">Aucune classe assignée</p>
        </div>

        <!-- Évaluations à venir -->
        <div v-if="dashboardData.evaluations && dashboardData.evaluations.length > 0" class="bg-white rounded-lg shadow p-6 mb-6">
          <div class="flex items-center gap-2 mb-4">
            <DocumentTextIcon class="w-6 h-6 text-orange-600" />
            <h2 class="text-xl font-bold">Évaluations à venir</h2>
          </div>
          <div class="space-y-4">
            <div
              v-for="evaluation in dashboardData.evaluations"
              :key="evaluation.id"
              class="border rounded-lg p-4 hover:shadow-md transition"
            >
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="font-semibold text-lg">{{ evaluation.titre || evaluation.name }}</h3>
                  <p class="text-sm text-gray-600 mt-1">{{ evaluation.matiere?.name || evaluation.classe?.name }}</p>
                  <p class="text-sm text-gray-500 mt-1">Date: {{ formatDate(evaluation.date) }}</p>
                </div>
                <span
                  :class="{
                    'bg-green-100 text-green-800': evaluation.statut === 'planifie',
                    'bg-blue-100 text-blue-800': evaluation.statut === 'en_cours',
                    'bg-gray-100 text-gray-800': evaluation.statut === 'termine'
                  }"
                  class="px-3 py-1 rounded-full text-xs font-semibold"
                >
                  {{ evaluation.statut }}
                </span>
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
            <h3 class="font-bold text-lg mb-2">Gérer mes Leçons</h3>
            <p class="text-gray-600 text-sm">Créer et modifier les cours</p>
          </router-link>

          <router-link
            to="/teacher/evaluations"
            class="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <DocumentTextIcon class="w-12 h-12 text-orange-600 mb-3" />
            <h3 class="font-bold text-lg mb-2">Mes Évaluations</h3>
            <p class="text-gray-600 text-sm">Gérer les évaluations en ligne</p>
          </router-link>

          <router-link
            to="/quizzes"
            class="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <DocumentTextIcon class="w-12 h-12 text-green-600 mb-3" />
            <h3 class="font-bold text-lg mb-2">Créer des Quiz</h3>
            <p class="text-gray-600 text-sm">Quiz interactifs</p>
          </router-link>

          <router-link
            to="/forum"
            class="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
          >
            <ChatBubbleLeftRightIcon class="w-12 h-12 text-purple-600 mb-3" />
            <h3 class="font-bold text-lg mb-2">Répondre au Forum</h3>
            <p class="text-gray-600 text-sm">Aider les étudiants</p>
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
  UserIcon,
  BookOpenIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  CalendarIcon,
  VideoCameraIcon
} from '@heroicons/vue/24/outline'

export default {
  name: 'TeacherDashboard',
  components: {
    Navbar,
    UserIcon,
    BookOpenIcon,
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    UserGroupIcon,
    CalendarIcon,
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
        console.log('📊 Chargement dashboard enseignant depuis KLASSCI...')
        this.dashboardData = await klassciService.getTeacherDashboard()
        console.log('✅ Dashboard chargé:', this.dashboardData)

        // Logs détaillés pour debug
        if (this.dashboardData) {
          console.log('📚 Matières:', this.dashboardData.matieres)
          console.log('🏫 Classes:', this.dashboardData.classes)
          console.log('📝 Évaluations:', this.dashboardData.evaluations)
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

    navigateToMatiere(matiere) {
      // Naviguer vers la page de détails de la matière
      console.log('🔍 Structure matière reçue:', matiere)
      console.log('🔍 matiere.id:', matiere.id)
      console.log('🔍 matiere.matiere_id:', matiere.matiere_id)
      console.log('🔍 matiere.matiere?.id:', matiere.matiere?.id)

      // Essayer différentes propriétés
      const matiereId = matiere.matiere_id || matiere.id || matiere.matiere?.id

      if (matiereId) {
        console.log('📚 Navigation vers matière:', matiereId)
        this.$router.push({
          name: 'matiere-details',
          params: { id: matiereId }
        })
      } else {
        console.error('❌ ID matière non trouvé:', matiere)
        alert('Impossible de naviguer vers cette matière. Vérifiez la console.')
      }
    },

    startCourse(matiere, classe = null) {
      // Générer un nom de salle unique
      const matiereName = (matiere.name || matiere.nom || 'matiere').toLowerCase().replace(/\s+/g, '-')
      const classeName = classe ? (classe.name || classe.nom || 'classe').toLowerCase().replace(/\s+/g, '-') : 'general'
      const roomName = `${matiereName}-${classeName}-${matiere.id}`

      const courseTitle = `${matiere.name || matiere.nom}${classe ? ' - ' + (classe.name || classe.nom) : ''}`

      console.log('🎥 Démarrage cours:', roomName)

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
    console.log('👤 Teacher User:', this.user)

    // Charger le dashboard KLASSCI
    this.loadDashboard()
  }
}
</script>
