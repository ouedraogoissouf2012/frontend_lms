<template>
  <DashboardLayout>
    <div class="hub-container">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Mon Espace</h1>
          <p class="page-subtitle">Accedez rapidement a vos classes, matieres et lecons</p>
        </div>
      </div>

      <!-- Chargement FROID uniquement : quand des compteurs sont deja connus,
           ils restent affiches pendant la revalidation. -->
      <ContentLoader v-if="loading" text="Chargement de votre espace..." />

      <template v-else>
        <p v-if="error" class="hub-alerte" role="status">
          <span>{{ messageAlerte }}</span>
          <button type="button" class="hub-reessayer" :disabled="revalidating" @click="loadStats">
            {{ revalidating ? 'Actualisation...' : 'Reessayer' }}
          </button>
        </p>

        <HubNavCards :stats="stats" />
        <HubQuickStats :stats="stats" />
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Espace enseignant — orchestrateur (#H11 ≤300). La donnée/logique vit dans
 * useTeacherHub ; l'UI est composée de HubNavCards (raccourcis) + HubQuickStats
 * (aperçu rapide).
 *
 * Un échec de rafraîchissement est DIT, jamais traduit en chiffres : les
 * compteurs déjà mesurés restent à l'écran, les autres affichent « — ».
 */
import { computed } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import HubNavCards from '@/components/teacher/HubNavCards.vue'
import HubQuickStats from '@/components/teacher/HubQuickStats.vue'
import { useTeacherHub } from '@/composables/useTeacherHub'

const { loading, revalidating, error, stats, loadStats } = useTeacherHub()

const aDesChiffres = computed(() =>
  Object.values(stats.value).some((valeur) => typeof valeur === 'number')
)

// Deux situations bien differentes : des chiffres perimes valent mieux que
// rien et meritent d'etre dates ; un ecran sans aucune mesure doit le dire.
const messageAlerte = computed(() =>
  aDesChiffres.value
    ? 'Compteurs non actualises : affichage de la derniere synchronisation reussie.'
    : error.value
)
</script>

<style scoped>
.hub-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.page-subtitle {
  color: var(--text-secondary);
  font-size: 1rem;
}

.hub-alerte {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin: 0 0 1.5rem 0;
  padding: 0.75rem 1rem;
  border: 1px solid var(--warning-border);
  border-radius: 0.5rem;
  background: var(--warning-bg);
  color: var(--warning-text);
  font-size: 0.9rem;
}

.hub-reessayer {
  padding: 0.35rem 0.9rem;
  border: 1px solid var(--warning-border);
  border-radius: 0.375rem;
  background: transparent;
  color: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}

.hub-reessayer:disabled {
  opacity: 0.6;
  cursor: progress;
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }
}
</style>
