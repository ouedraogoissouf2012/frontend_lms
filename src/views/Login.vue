<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
    <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
      <!-- Logo -->
      <div class="text-center mb-8">
        <h1 class="text-4xl font-bold text-primary-600 mb-2">LMS</h1>
        <p class="text-gray-600">Connectez-vous à votre compte</p>
      </div>

      <!-- Message d'erreur -->
      <div v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {{ error }}
      </div>

      <!-- Sélecteur d'institution -->
      <div class="mb-4">
        <label class="block text-gray-700 mb-2 text-sm font-semibold">Établissement</label>
        <select
          v-model="selectedInstitution"
          @change="onInstitutionChange"
          class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
        >
          <option value="">-- Sélectionnez votre établissement --</option>
          <option v-for="inst in institutions" :key="inst.slug" :value="inst.slug">
            {{ inst.name }}
          </option>
        </select>
      </div>

      <!-- Formulaire -->
      <form @submit.prevent="handleLogin">
        <!-- Username -->
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="username">
            Nom d'utilisateur
          </label>
          <input
            id="username"
            v-model="username"
            type="text"
            required
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            placeholder="superadmin ou votre email"
          />
        </div>

        <!-- Mot de passe -->
        <div class="mb-6">
          <label class="block text-gray-700 mb-2" for="password">
            Mot de passe
          </label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            placeholder="••••••••"
          />
        </div>

        <!-- Bouton de connexion -->
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-lg transition disabled:opacity-50"
        >
          {{ loading ? 'Connexion...' : 'Se connecter' }}
        </button>
      </form>

    </div>
  </div>
</template>

<script>
import { auth } from '@/services/api'

export default {
  name: 'Login',
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      error: null,
      institutions: [],
      selectedInstitution: localStorage.getItem('institution') || 'presentation'
    }
  },
  async mounted() {
    try {
      const response = await auth.getActiveInstitutions()
      if (response.success && response.data) {
        this.institutions = response.data
      }
    } catch (e) {
      this.institutions = [{ slug: 'presentation', name: 'KLASSCI Présentation' }]
    }
  },
  methods: {
    onInstitutionChange() {
      auth.setInstitution(this.selectedInstitution)
    },
    async handleLogin() {
      this.loading = true
      this.error = null

      if (!this.selectedInstitution) {
        this.error = 'Veuillez sélectionner votre établissement.'
        this.loading = false
        return
      }

      try {
        const response = await auth.login(this.username, this.password)

        if (response.success) {
          const user = response.data.user

          if (['supradmin', 'superAdmin', 'coordinateur', 'secretaire'].includes(user.role)) {
            this.$router.push('/admin/dashboard')
          } else if (['enseignant', 'teacher'].includes(user.role)) {
            this.$router.push('/teacher/dashboard')
          } else if (user.role === 'etudiant') {
            this.$router.push('/student/dashboard')
          } else {
            this.$router.push('/')
          }
        } else {
          this.error = response.message || 'Échec de la connexion'
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Identifiants incorrects ou établissement invalide.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
