<template>
  <div>
    <PageLoader :show="isInitialLoading" />
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import PageLoader from './components/common/PageLoader.vue'

// Loader seulement au démarrage initial de l'application
const isInitialLoading = ref(true)

onMounted(() => {
  // Cacher le loader après le premier chargement (500ms pour voir l'animation)
  setTimeout(() => {
    isInitialLoading.value = false
  }, 500)
})
</script>
