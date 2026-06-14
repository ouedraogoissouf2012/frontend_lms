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
            class="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-gray-900 bg-white"
            placeholder="Nom d'utilisateur ou email"
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
import { getDashboardRoute, isSupradmin, logRoleDecision } from '@/constants/roles'

export default {
  name: 'Login',
  data() {
    return {
      username: '',
      password: '',
      loading: false,
      error: null,
    }
  },
  methods: {
    async handleLogin() {
      this.loading = true
      this.error = null

      try {
        const response = await auth.login(this.username, this.password)

        if (response.success) {
          const user = response.data.user

          // Redirection centralisée via le rôle normalisé (#18) — corrige la
          // divergence supradmin (envoyait /admin/dashboard au lieu de /admin/institutions).
          const target = getDashboardRoute(user)

          // Vérification de cohérence SECONDAIRE non bloquante (#18 R7) : le booléen
          // serveur meta.is_supradmin (flux local) n'est qu'un signal de diagnostic ;
          // la décision suit toujours le rôle normalisé.
          const meta = auth.getMeta()
          if (meta && typeof meta.is_supradmin === 'boolean' && meta.is_supradmin !== isSupradmin(user)) {
            logRoleDecision('supradmin_flag_mismatch', { target })
          }

          this.$router.push(target)
        } else {
          this.error = response.message || 'Échec de la connexion'
        }
      } catch (err) {
        this.error = err.response?.data?.message || 'Identifiants incorrects.'
      } finally {
        this.loading = false
      }
    }
  }
}
</script>
