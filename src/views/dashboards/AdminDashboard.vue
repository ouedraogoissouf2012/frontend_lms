<template>
  <div class="min-h-screen bg-gray-50">
    <Navbar />

    <div class="max-w-7xl mx-auto px-4 py-8">
      <!-- En-tête Admin -->
      <div class="mb-8 flex items-center gap-4">
        <ShieldCheckIcon class="w-10 h-10 text-blue-600" />
        <div>
          <h1 class="text-3xl font-bold text-gray-900">
            Tableau de bord Administrateur
          </h1>
          <p class="text-gray-600 mt-1">
            Bienvenue, <strong>{{ user?.name }}</strong> ({{ user?.role_display_name }})
          </p>
        </div>
      </div>

      <!-- Statistiques Admin depuis KLASSCI -->
      <div v-if="stats" class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm mb-1">Enseignants</p>
              <p class="text-3xl font-bold text-blue-600">
                {{ stats.nb_enseignants || 0 }}
              </p>
            </div>
            <UserGroupIcon class="w-12 h-12 text-blue-200" />
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm mb-1">Étudiants</p>
              <p class="text-3xl font-bold text-green-600">
                {{ stats.nb_etudiants || 0 }}
              </p>
            </div>
            <AcademicCapIcon class="w-12 h-12 text-green-200" />
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-purple-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm mb-1">Classes actives</p>
              <p class="text-3xl font-bold text-purple-600">
                {{ stats.nb_classes_actives || 0 }}
              </p>
            </div>
            <BuildingLibraryIcon class="w-12 h-12 text-purple-200" />
          </div>
        </div>

        <div class="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm mb-1">Matières</p>
              <p class="text-3xl font-bold text-orange-600">
                {{ stats.nb_matieres_actives || 0 }}
              </p>
            </div>
            <BookOpenIcon class="w-12 h-12 text-orange-200" />
          </div>
        </div>
      </div>

      <!-- Permissions -->
      <div v-if="user?.permissions" class="bg-white rounded-lg shadow p-6 mb-8">
        <div class="flex items-center gap-2 mb-4">
          <LockClosedIcon class="w-6 h-6 text-gray-700" />
          <h2 class="text-xl font-bold">Vos Permissions</h2>
        </div>
        <div class="flex flex-wrap gap-2">
          <span
            v-for="permission in user.permissions"
            :key="permission"
            class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-1"
          >
            <CheckCircleIcon class="w-4 h-4" />
            {{ permission }}
          </span>
        </div>
      </div>

      <!-- Menu d'actions admin -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <router-link
          to="/lessons"
          class="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
        >
          <BookOpenIcon class="w-12 h-12 text-blue-600 mb-3" />
          <h3 class="font-bold text-lg mb-2">Gestion Cours</h3>
          <p class="text-gray-600 text-sm">Créer et gérer les cours LMS</p>
        </router-link>

        <router-link
          to="/quizzes"
          class="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
        >
          <DocumentTextIcon class="w-12 h-12 text-green-600 mb-3" />
          <h3 class="font-bold text-lg mb-2">Quiz & Évaluations</h3>
          <p class="text-gray-600 text-sm">Gérer les évaluations</p>
        </router-link>

        <router-link
          to="/forum"
          class="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1"
        >
          <ChatBubbleLeftRightIcon class="w-12 h-12 text-purple-600 mb-3" />
          <h3 class="font-bold text-lg mb-2">Forum</h3>
          <p class="text-gray-600 text-sm">Modérer les discussions</p>
        </router-link>

        <!-- Gestion des séances (Coordinateurs uniquement) -->
        <router-link
          v-if="user?.role === 'coordinateur' || user?.role === 'superAdmin'"
          to="/coordinateur/seances"
          class="bg-white p-6 rounded-lg shadow-lg hover:shadow-xl transition transform hover:-translate-y-1 border-2 border-orange-400"
        >
          <CalendarIcon class="w-12 h-12 text-orange-600 mb-3" />
          <h3 class="font-bold text-lg mb-2">Gestion Séances & Visio</h3>
          <p class="text-gray-600 text-sm">Activer/désactiver les visioconférences</p>
        </router-link>
      </div>

      <!-- Classes KLASSCI -->
      <div class="mt-8">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <BuildingLibraryIcon class="w-6 h-6 text-purple-600" />
            <h2 class="text-2xl font-bold">Classes KLASSCI</h2>
          </div>
          <span v-if="loading.classes" class="text-sm text-gray-500">Chargement...</span>
        </div>

        <div v-if="classes.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="classe in classes"
            :key="classe.id"
            class="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
          >
            <div class="flex items-center justify-between mb-2">
              <h3 class="font-bold text-lg">{{ classe.name }}</h3>
              <span class="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                {{ classe.niveau?.name || 'N/A' }}
              </span>
            </div>
            <div v-if="classe.filiere" class="text-gray-600 text-sm mb-2">
              <span class="font-semibold">{{ classe.filiere.name }}</span> - {{ classe.filiere.code }}
            </div>
            <div class="mt-3 flex items-center justify-between text-sm">
              <div class="flex items-center gap-2 text-gray-500">
                <AcademicCapIcon class="w-4 h-4" />
                <span>{{ classe.places_occupees || 0 }}/{{ classe.places_totales || 0 }}</span>
              </div>
              <span v-if="classe.is_active" class="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                Active
              </span>
            </div>
          </div>
        </div>

        <div v-else-if="!loading.classes" class="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          <BuildingLibraryIcon class="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune classe disponible</p>
        </div>
      </div>

      <!-- Matières KLASSCI -->
      <div class="mt-8">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <BookOpenIcon class="w-6 h-6 text-orange-600" />
            <h2 class="text-2xl font-bold">Matières KLASSCI</h2>
          </div>
          <span v-if="loading.matieres" class="text-sm text-gray-500">Chargement...</span>
        </div>

        <div v-if="matieres.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div
            v-for="matiere in matieres"
            :key="matiere.id"
            class="bg-white p-4 rounded-lg shadow hover:shadow-lg transition"
          >
            <div class="flex items-center gap-2 mb-2">
              <BookOpenIcon class="w-5 h-5 text-orange-600" />
              <h3 class="font-bold">{{ matiere.nom }}</h3>
            </div>
            <p v-if="matiere.code" class="text-xs text-gray-500">Code: {{ matiere.code }}</p>
          </div>
        </div>

        <div v-else-if="!loading.matieres" class="bg-white p-8 rounded-lg shadow text-center text-gray-500">
          <BookOpenIcon class="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>Aucune matière disponible</p>
        </div>
      </div>

      <!-- Année universitaire -->
      <div v-if="meta?.annee_universitaire_courante" class="mt-8 bg-blue-50 p-4 rounded-lg flex items-center gap-3">
        <CalendarIcon class="w-6 h-6 text-blue-600" />
        <p class="text-sm text-blue-800">
          Année universitaire courante : <strong>{{ meta.annee_universitaire_courante.nom || 'Non définie' }}</strong>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '@/components/Navbar.vue'
import { auth } from '@/services/api'
import klassciService from '@/services/klassci'
import {
  ShieldCheckIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BuildingLibraryIcon,
  BookOpenIcon,
  LockClosedIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon
} from '@heroicons/vue/24/outline'

export default {
  name: 'AdminDashboard',
  components: {
    Navbar,
    ShieldCheckIcon,
    UserGroupIcon,
    AcademicCapIcon,
    BuildingLibraryIcon,
    BookOpenIcon,
    LockClosedIcon,
    CheckCircleIcon,
    DocumentTextIcon,
    ChatBubbleLeftRightIcon,
    CalendarIcon
  },
  data() {
    return {
      user: null,
      meta: null,
      stats: null,
      classes: [],
      matieres: [],
      loading: {
        classes: false,
        matieres: false
      }
    }
  },
  async mounted() {
    this.user = auth.getUser()
    this.meta = auth.getMeta()
    this.stats = this.user?.admin_data?.statistics || {}

    console.log('📊 AdminDashboard mounted')
    console.log('👤 Admin User:', this.user)
    console.log('📈 Admin Stats:', this.stats)
    console.log('🔑 Token disponible:', localStorage.getItem('token')?.substring(0, 20) + '...')

    // Charger les données KLASSCI
    console.log('🔄 Début chargement données KLASSCI...')
    await this.loadKlassciData()
  },
  methods: {
    async loadKlassciData() {
      // Charger les classes
      this.loading.classes = true
      try {
        this.classes = await klassciService.getClasses()
        console.log('Classes chargées:', this.classes)
      } catch (error) {
        console.error('Erreur chargement classes:', error)
        this.classes = []
      } finally {
        this.loading.classes = false
      }

      // Charger les matières
      this.loading.matieres = true
      try {
        this.matieres = await klassciService.getMatieres()
        console.log('Matières chargées:', this.matieres)
      } catch (error) {
        console.error('Erreur chargement matières:', error)
        this.matieres = []
      } finally {
        this.loading.matieres = false
      }
    }
  }
}
</script>
