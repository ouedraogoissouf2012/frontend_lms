<template>
  <div class="corrige-statut" role="status">
    <svg class="corrige-icone" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <div>
      <h3 class="corrige-titre">Corrigé pas encore disponible</h3>
      <p class="corrige-message">{{ etat.message }}</p>
      <p class="corrige-note">Vous pouvez déjà relire vos réponses.</p>
    </div>
  </div>
</template>

<script setup>
/**
 * front#693 : l'état du corrigé pour l'élève, un message par mode (contrat back #1773). Remplace
 * l'ancien compte à rebours de 7 jours, qui inventait une date quand le serveur n'en donnait pas.
 */
import { computed } from 'vue'
import { etatDuCorrige } from '@/utils/diffusionDesResultats'

const props = defineProps({
  submission: { type: Object, required: true },
})

const etat = computed(() => etatDuCorrige(props.submission))
</script>

<style scoped>
.corrige-statut {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  margin-bottom: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.corrige-icone {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
  color: var(--primary-color);
}

.corrige-titre {
  font-size: 1rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
}

.corrige-message {
  margin: 0 0 0.25rem 0;
}

.corrige-note {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0;
}
</style>
