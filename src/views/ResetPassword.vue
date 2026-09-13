<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
    <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
      <h1 class="text-2xl font-bold text-primary-600 mb-6">Nouveau mot de passe</h1>

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
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="email">Courriel</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            class="w-full px-4 py-2 border rounded-lg text-gray-900 bg-white"
          >
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="password">Mot de passe</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            minlength="8"
            class="w-full px-4 py-2 border rounded-lg text-gray-900 bg-white"
          >
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 mb-2" for="password_confirmation">Confirmation</label>
          <input
            id="password_confirmation"
            v-model="passwordConfirmation"
            type="password"
            required
            minlength="8"
            class="w-full px-4 py-2 border rounded-lg text-gray-900 bg-white"
          >
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-primary-600 text-white font-bold py-3 rounded-lg disabled:opacity-50"
        >
          {{ loading ? 'Enregistrement...' : 'Enregistrer' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { usePasswordReset } from '@/composables/usePasswordReset'

const route = useRoute()
const router = useRouter()
const slug = ref(typeof route.query.institution === 'string' ? route.query.institution : '')
const email = ref(typeof route.query.email === 'string' ? route.query.email : '')
const token = ref(typeof route.query.token === 'string' ? route.query.token : '')
const password = ref('')
const passwordConfirmation = ref('')
const { loading, error, notice, institutions, loadInstitutions, resetPassword } = usePasswordReset()

onMounted(() => {
  loadInstitutions().catch(() => {
    error.value = 'Impossible de charger les établissements.'
  })
})

async function submit() {
  const ok = await resetPassword(slug.value, {
    email: email.value,
    token: token.value,
    password: password.value,
    password_confirmation: passwordConfirmation.value,
  })
  if (ok) {
    setTimeout(() => router.push('/login'), 1200)
  }
}
</script>
