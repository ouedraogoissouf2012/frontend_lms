<template>
  <!-- Erreur -->
  <div class="error-overlay">
    <div class="error-content">
      <p class="text-red-600 font-semibold">{{ error }}</p>
      <button @click="$emit('close')" class="mt-4 px-4 py-2 bg-red-600 text-white rounded">
        Fermer
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * Overlay d'erreur de JitsiMeet (#h13 ≤300) — présentationnel pur.
 * Affiche le message d'erreur + un bouton Fermer qui relaie l'événement
 * `close` au parent. Le message est reçu en prop ; aucun état interne.
 */
defineProps({
  error: { type: String, default: null }
})

defineEmits(['close'])
</script>

<style scoped>
.error-overlay {
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

.error-content {
  background: white;
  padding: 2rem;
  border-radius: 0.5rem;
  text-align: center;
}
</style>
