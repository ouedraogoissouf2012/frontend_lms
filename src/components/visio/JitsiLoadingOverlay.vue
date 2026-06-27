<template>
  <!-- Overlay de chargement -->
  <div class="loading-overlay">
    <ContentLoader text="Connexion à la visioconférence..." />
  </div>
</template>

<script setup>
/**
 * Overlay de chargement de JitsiMeet (#h13 ≤300) — présentationnel pur.
 * Affiche le loader pendant la connexion à la visioconférence. Aucun état,
 * aucun appel : la visibilité est pilotée par le composant parent (v-if).
 */
import ContentLoader from '@/components/common/ContentLoader.vue'
</script>

<style scoped>
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  border-top: 4px solid var(--blue-500);
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
