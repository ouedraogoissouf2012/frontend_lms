<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
    <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
      <h1 class="text-2xl font-bold text-primary-600 mb-2">Choisir un mot de passe</h1>
      <p class="text-gray-600 mb-6">
        Ce lien ne sert qu'une fois. Aucun mot de passe ne vous a été envoyé.
      </p>

      <div
        v-if="compteCourant"
        class="bg-yellow-100 border border-yellow-400 text-yellow-800 px-4 py-3 rounded mb-4"
        role="status"
      >
        <p>
          Vous êtes connecté en tant que <strong>{{ compteCourant }}</strong>.
          Ce lien concerne un autre compte.
        </p>
        <button type="button" class="underline font-semibold mt-1" @click="seDeconnecter">
          Se déconnecter
        </button>
      </div>

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
      <!--
        Masqué tant qu'une session est ouverte (#409) : `/login` porte
        `guest: true`, donc le garde y renverrait l'utilisateur vers SON
        tableau de bord (guards.js:33) — un lien qui ne tient pas sa promesse.
        L'état est nouveau : avant #409 un utilisateur authentifié ne voyait
        jamais cet écran. Le bandeau ci-dessus porte la seule sortie utile, et
        ce lien réapparaît dès la déconnexion.
      -->
      <p v-if="!compteCourant" class="mt-4 text-center">
        <router-link to="/login" class="text-primary-600">Aller à la connexion</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { auth } from '@/services/api'
import { getFullName } from '@/utils/formatters'
import { useActivation } from '@/composables/useActivation'

const route = useRoute()
const token = typeof route.params.token === 'string' ? route.params.token : ''
const password = ref('')
const passwordConfirmation = ref('')
const { loading, error, notice, submit } = useActivation()

/**
 * Nom du compte DÉJÀ connecté dans ce navigateur, s'il y en a un (#409).
 *
 * Cette page s'ouvre désormais même sous une session existante : le jeton est
 * l'autorisation, pas la session. Mais alors deux identités cohabitent à
 * l'écran, et le silence est trompeur — celui qui pose son mot de passe croit
 * agir sur le compte affiché par le reste de l'application.
 *
 * Le repli nomme la situation plutôt que la personne : un compte sans nom
 * lisible reste un compte tiers, et c'est cela qu'il faut dire.
 */
const compteCourant = computed(() =>
  auth.isAuthenticated() ? getFullName(auth.getUser(), { fallback: 'un autre compte' }) : ''
)

/**
 * `logout()` purge la session SANS naviguer (stores/auth.js:127-146) : la page
 * reste ouverte et le jeton demeure dans l'URL. Rediriger ici le perdrait — il
 * n'est affiché qu'une fois et ne peut pas être réémis.
 */
function seDeconnecter() {
  auth.logout()
}

async function onSubmit() {
  await submit({
    token,
    password: password.value,
    password_confirmation: passwordConfirmation.value,
  })
}
</script>
