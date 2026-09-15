<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-500 to-primary-700">
    <div class="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md">
      <h1 class="text-2xl font-bold text-primary-600 mb-2">Ouvrir une école</h1>
      <p class="text-gray-600 mb-6">
        Votre demande sera examinée. Aucun compte n'est créé à cette étape.
      </p>

      <p v-if="error" class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        {{ error }}
      </p>
      <p v-if="notice" class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
        {{ notice }}
      </p>

      <form v-if="!notice" @submit.prevent="onSubmit">
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="nom_demandeur">Votre nom</label>
          <input
            id="nom_demandeur"
            v-model="form.nom_demandeur"
            type="text"
            required
            maxlength="191"
            class="w-full px-4 py-2 border rounded-lg text-gray-900 bg-white"
          >
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="email_demandeur">Courriel</label>
          <input
            id="email_demandeur"
            v-model="form.email_demandeur"
            type="email"
            required
            maxlength="191"
            class="w-full px-4 py-2 border rounded-lg text-gray-900 bg-white"
          >
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="telephone_demandeur">Téléphone (optionnel)</label>
          <input
            id="telephone_demandeur"
            v-model="form.telephone_demandeur"
            type="tel"
            maxlength="40"
            class="w-full px-4 py-2 border rounded-lg text-gray-900 bg-white"
          >
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="nom_ecole">Nom de l'école</label>
          <input
            id="nom_ecole"
            v-model="form.nom_ecole"
            type="text"
            required
            maxlength="191"
            class="w-full px-4 py-2 border rounded-lg text-gray-900 bg-white"
          >
        </div>
        <div class="mb-4">
          <label class="block text-gray-700 mb-2" for="slug_souhaite">Identifiant souhaité (optionnel)</label>
          <input
            id="slug_souhaite"
            v-model="form.slug_souhaite"
            type="text"
            maxlength="50"
            pattern="[a-z0-9\-]*"
            title="Lettres minuscules, chiffres et tirets"
            class="w-full px-4 py-2 border rounded-lg text-gray-900 bg-white"
            placeholder="mon-ecole"
          >
          <p class="text-gray-500 text-sm mt-1">Ce n'est qu'un souhait : il n'est pas réservé.</p>
        </div>
        <div class="mb-6">
          <label class="block text-gray-700 mb-2" for="usage_prevu">Formations prévues</label>
          <textarea
            id="usage_prevu"
            v-model="form.usage_prevu"
            required
            minlength="10"
            maxlength="2000"
            rows="4"
            class="w-full px-4 py-2 border rounded-lg text-gray-900 bg-white"
          />
        </div>
        <button
          type="submit"
          :disabled="loading"
          class="w-full bg-primary-600 text-white font-bold py-3 rounded-lg disabled:opacity-50"
        >
          {{ loading ? 'Envoi...' : 'Envoyer la demande' }}
        </button>
      </form>
      <p class="mt-4 text-center">
        <router-link to="/login" class="text-primary-600">Retour à la connexion</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { reactive } from 'vue'
import { useSchoolRequest } from '@/composables/useSchoolRequest'

const { loading, error, notice, submit } = useSchoolRequest()

const form = reactive({
  nom_demandeur: '',
  email_demandeur: '',
  telephone_demandeur: '',
  nom_ecole: '',
  slug_souhaite: '',
  usage_prevu: '',
})

async function onSubmit() {
  const payload = {
    nom_demandeur: form.nom_demandeur,
    email_demandeur: form.email_demandeur,
    nom_ecole: form.nom_ecole,
    usage_prevu: form.usage_prevu,
  }
  if (form.telephone_demandeur) payload.telephone_demandeur = form.telephone_demandeur
  if (form.slug_souhaite) payload.slug_souhaite = form.slug_souhaite
  await submit(payload)
}
</script>
