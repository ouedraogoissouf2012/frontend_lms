<template>
  <nav class="bg-white shadow-lg">
    <div class="max-w-7xl mx-auto px-4">
      <div class="flex justify-between h-16">
        <!-- Logo et navigation -->
        <div class="flex">
          <div class="flex items-center">
            <h1 class="text-2xl font-bold text-primary-600">LMS</h1>
          </div>

          <!-- Menu principal -->
          <div class="hidden md:ml-10 md:flex md:space-x-8">
            <router-link
              to="/"
              class="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-primary-600"
            >
              Tableau de bord
            </router-link>

            <!-- Lien Mes Séances (enseignants uniquement) -->
            <router-link
              v-if="isTeacher"
              to="/teacher/seances"
              class="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-primary-600 gap-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              Mes Séances
            </router-link>

            <!-- Lien Mes Cours (étudiants uniquement) -->
            <router-link
              v-if="isStudent"
              to="/student/seances"
              class="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-primary-600 gap-1"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
              Mes Cours
            </router-link>

            <router-link
              to="/lessons"
              class="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-primary-600"
            >
              Leçons
            </router-link>

            <router-link
              to="/quizzes"
              class="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-primary-600"
            >
              Quiz
            </router-link>

            <router-link
              to="/forum"
              class="inline-flex items-center px-1 pt-1 text-gray-900 hover:text-primary-600"
            >
              Forum
            </router-link>
          </div>
        </div>

        <!-- Menu utilisateur -->
        <div class="flex items-center space-x-4">
          <span class="text-gray-700">{{ user?.name }}</span>
          <button
            @click="handleLogout"
            class="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </div>
  </nav>
</template>

<script>
import { auth } from '@/services/api'

export default {
  name: 'Navbar',
  data() {
    return {
      user: null
    }
  },
  computed: {
    isTeacher() {
      return this.user && ['enseignant', 'teacher'].includes(this.user.role)
    },
    isStudent() {
      return this.user && this.user.role === 'etudiant'
    }
  },
  mounted() {
    this.user = auth.getUser()
  },
  methods: {
    handleLogout() {
      console.log('🚪 Déconnexion en cours...')
      auth.logout()

      // Forcer un rechargement complet de la page pour réinitialiser l'état
      window.location.href = '/login'
    }
  }
}
</script>

<style scoped>
.router-link-active {
  border-bottom: 2px solid var(--color-info-strong);
  color: var(--color-info-strong);
}
</style>
