<template>
  <DashboardLayout>
    <div class="emarge-container">
      <h1 class="page-title">Signer ma présence</h1>
      <p class="page-subtitle">Entrez le code d’émargement affiché par votre formateur pendant la séance.</p>

      <form class="emarge-card" @submit.prevent="signer">
        <label for="code-emargement">Code d’émargement</label>
        <input
          id="code-emargement"
          v-model="code"
          class="emarge-field"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          maxlength="16"
          required
          :aria-describedby="erreur ? 'emarge-erreur' : undefined"
        >
        <!-- aria-disabled, pas disabled : un bouton désactivé perd le focus clavier. -->
        <button type="submit" class="emarge-btn" :aria-disabled="envoi ? 'true' : 'false'">
          {{ envoi ? 'Envoi…' : 'Signer' }}
        </button>
      </form>

      <!-- Régions présentes DÈS le montage et jamais masquées : seule la présentation suit le contenu. -->
      <p id="emarge-erreur" class="emarge-region" :class="{ 'emarge-message is-error': erreur }" role="alert">{{ erreur }}</p>
      <p class="emarge-region" :class="{ 'emarge-message': resultat }" role="status" aria-live="polite">{{ resultat }}</p>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Signer sa présence par le code d'émargement (lms_backend#1680, #335), sur le patron de « Rejoindre une classe ».
 * Le QR du code y mène avec `?code=` : le champ est pré-rempli, l'élève n'a plus qu'à signer. Route gardée par
 * `peutInscrireLocalement`. La logique vit dans `useEmargementEleve` ; le serveur reste juge du code et des essais.
 */
import { useRoute } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { useEmargementEleve } from '@/composables/useEmargementEleve'

defineOptions({ name: 'StudentEmargement' })

const { code, envoi, erreur, resultat, signer } = useEmargementEleve(useRoute().query.code)
</script>

<style scoped>
.emarge-container {
  max-width: 32rem;
  margin: 0 auto;
}

.page-title {
  margin: 0 0 0.5rem;
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
}

.page-subtitle {
  color: var(--text-secondary);
}

.emarge-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
}

.emarge-field {
  padding: 0.75rem;
  font-family: monospace;
  font-size: 1.25rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
}

.emarge-btn {
  padding: 0.75rem 1.5rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.emarge-btn[aria-disabled='true'] {
  cursor: wait;
  opacity: 0.7;
}

.emarge-region {
  margin: 0;
}

.emarge-message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--card-bg);
  color: var(--text-primary);
}
</style>
