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
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
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

      <!-- Info de test -->
      <div class="mt-6 p-4 bg-blue-50 rounded-lg">
        <p class="text-sm text-blue-800 font-semibold mb-2">Compte de test KLASSCI :</p>
        <p class="text-xs text-blue-600">Username: <strong>superadmin</strong></p>
        <p class="text-xs text-blue-600">Mot de passe: <strong>password123</strong></p>
        <p class="text-xs text-gray-500 mt-2">Authentification via KLASSCI</p>
      </div>
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
      error: null
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.error = null

      try {
        console.log('🔐 Tentative de connexion avec:', this.username)
        const response = await auth.login(this.username, this.password)
        console.log('📦 Réponse login:', response)

        // Vérifier la réponse
        if (response.success) {
          // Récupérer le rôle de l'utilisateur
          const user = response.data.user
          console.log('👤 Utilisateur connecté:', user.name, 'Rôle:', user.role)
          console.log('🔑 Token stocké:', localStorage.getItem('token'))

          // Rediriger selon le rôle
          if (['superAdmin', 'coordinateur', 'secretaire'].includes(user.role)) {
            console.log('➡️ Redirection vers /admin/dashboard')
            this.$router.push('/admin/dashboard')
          } else if (['enseignant', 'teacher'].includes(user.role)) {
            console.log('➡️ Redirection vers /teacher/dashboard')
            this.$router.push('/teacher/dashboard')
          } else if (user.role === 'etudiant') {
            console.log('➡️ Redirection vers /student/dashboard')
            this.$router.push('/student/dashboard')
          } else {
            console.log('➡️ Redirection vers /')
            this.$router.push('/')
          }
        } else {
          this.error = response.message || 'Échec de la connexion'
        }
      } catch (err) {
        console.error('❌ Erreur login:', err)
        this.error = err.response?.data?.message || 'Erreur de connexion. Vérifiez vos identifiants.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
