<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
    <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
      <h1 class="text-2xl font-bold text-primary-600 mb-2">Mot de passe oublié</h1>
      <p class="text-gray-600 mb-6">Choisissez votre établissement, puis votre adresse.</p>

      <p v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {{ error }}
      </p>
      <p v-if="notice" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        {{ notice }}
      </p>

      <form @submit.prevent="submit">
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="institution">Établissement</label>
          <select
            id="institution"
            v-model="slug"
            required
            class="w-full px-4 py-2 border rounded-lg text-gray-900 bg-white"
          >
            <option disabled value="">Sélectionner</option>
            <option v-for="item in institutions" :key="item.slug" :value="item.slug">
              {{ item.name || item.slug }}
            </option>
          </select>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 mb-2" for="email">Courriel</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2 border rounded-lg text-gray-900 bg-white"
          >
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-primary-600 text-white font-bold py-3 rounded-lg disabled:opacity-50"
        >
          {{ loading ? 'Envoi...' : 'Envoyer le lien' }}
        </button>
      </form>
      <p class="mt-4 text-center">
        <router-link to="/login" class="text-primary-600">Retour à la connexion</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { usePasswordReset } from '@/composables/usePasswordReset'

const slug = ref('')
const email = ref('')
const { loading, error, notice, institutions, loadInstitutions, requestLink } = usePasswordReset()

onMounted(() => {
  loadInstitutions().catch(() => {
    error.value = 'Impossible de charger les établissements.'
  })
})

async function submit() {
  await requestLink(slug.value, email.value)
}
</script>
