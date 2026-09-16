<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
    <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
      <h1 class="text-2xl font-bold text-primary-600 mb-2">Choisir un mot de passe</h1>
      <p class="text-gray-600 mb-6">
        Ce lien ne sert qu'une fois. Aucun mot de passe ne vous a été envoyé.
      </p>

      <p v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {{ error }}
      </p>
      <p v-if="notice" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        {{ notice }}
      </p>
      <p v-if="!token" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        Ce lien est incomplet. Demandez-en un nouveau à votre administrateur.
      </p>

      <form v-if="token && !notice" @submit.prevent="onSubmit">
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
      <p class="mt-4 text-center">
        <router-link to="/login" class="text-primary-600">Aller à la connexion</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRoute } from 'vue-router'
import { useActivation } from '@/composables/useActivation'

const route = useRoute()
const token = typeof route.params.token === 'string' ? route.params.token : ''
const password = ref('')
const passwordConfirmation = ref('')
const { loading, error, notice, submit } = useActivation()

async function onSubmit() {
  await submit({
    token,
    password: password.value,
    password_confirmation: passwordConfirmation.value,
  })
}
</script>
