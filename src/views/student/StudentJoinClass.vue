<template>
  <DashboardLayout>
    <div class="join-container">
      <h1 class="page-title">Rejoindre une classe</h1>
      <p class="page-subtitle">Saisissez le code que votre formateur vous a donné.</p>

      <form class="join-card" @submit.prevent="rejoindre">
        <label for="code-inscription">Code d'inscription</label>
        <input
          id="code-inscription"
          v-model="code"
          class="join-field"
          autocomplete="off"
          autocapitalize="characters"
          spellcheck="false"
          maxlength="16"
          required
          :aria-invalid="saisieInvalide ? 'true' : 'false'"
          :aria-describedby="error ? 'join-erreur' : undefined"
        >
        <!-- aria-disabled, pas disabled : un bouton désactivé perd le focus clavier. -->
        <button type="submit" class="join-btn" :aria-disabled="submitting ? 'true' : 'false'">
          {{ submitting ? 'Envoi…' : 'Rejoindre' }}
        </button>
      </form>

      <!-- Régions présentes DÈS le montage et JAMAIS masquées (une région hors de l'arbre
           d'accessibilité n'est pas annoncée) : seule la présentation suit le contenu. -->
      <p id="join-erreur" class="join-region" :class="{ 'join-message is-error': error }" role="alert">{{ error }}</p>
      <div class="join-region" :class="{ 'join-message': result }" role="status" aria-live="polite">
        <template v-if="result">
          <p>{{ result.message }}<template v-if="result.classe"> — {{ result.classe.libelle }}</template></p>
          <router-link to="/student/courses">Voir mes cours</router-link>
        </template>
      </div>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Rejoindre une classe par son code (#391). Route gardée par `peutInscrireLocalement`
 * (sans liste d'élèves propre à l'établissement, aucun code n'existe). La logique vit dans
 * useJoinClass ; le serveur reste juge du code et des limites d'essais.
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { useJoinClass } from '@/composables/useJoinClass'

defineOptions({ name: 'StudentJoinClass' })

const { code, submitting, error, saisieInvalide, result, rejoindre } = useJoinClass()
</script>

<style scoped>
.join-container {
  max-width: 32rem;
  margin: 0 auto;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  color: var(--text-secondary);
}

.join-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin: 1.5rem 0;
  padding: 1.5rem;
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
}

.join-field {
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

.join-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.join-btn[aria-disabled='true'] {
  cursor: wait;
  opacity: 0.7;
}

.join-region {
  margin: 0;
}

.join-message {
  margin-top: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  background: var(--card-bg);
  color: var(--text-primary);
}

.join-message.is-error {
  border: 1px solid var(--color-danger, var(--border-primary));
}
</style>
