<template>
  <div>
    <PageLoader :show="isInitialLoading" />
    <router-view />
    <!-- Montés UNE fois au niveau applicatif : toasts et confirmations
         fonctionnent sur TOUTE page (y compris hors DashboardLayout : login,
         écrans legacy…), et non plus seulement sous le layout du tableau de bord. -->
    <ToastContainer />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PageLoader from './components/common/PageLoader.vue'
import ToastContainer from './components/ui/ToastContainer.vue'
import ConfirmDialog from './components/ui/ConfirmDialog.vue'

// Loader seulement au démarrage initial de l'application
const isInitialLoading = ref(true)

onMounted(() => {
  // Cacher le loader après le premier chargement (500ms pour voir l'animation)
  setTimeout(() => {
    isInitialLoading.value = false
  }, 500)
})
</script>
