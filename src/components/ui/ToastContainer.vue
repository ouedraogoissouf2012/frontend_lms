<template>
  <div class="toast-container">
    <Toast
      v-for="toast in toasts"
      :key="toast.id"
      :message="toast.message"
      :title="toast.title"
      :type="toast.type"
      :duration="toast.duration"
      @close="remove(toast.id)"
    />
  </div>
</template>

<script setup>
// Rend la file de toasts pilotée par le composable useToast (source unique).
// Monté UNE seule fois au niveau App → les toasts s'affichent sur TOUTE page
// (fin du hack `window.$toast`, jusqu'ici muet hors DashboardLayout).
import Toast from './Toast.vue'
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 12px;
  pointer-events: none;
  max-width: 420px;
}

.toast-container > * {
  pointer-events: auto;
}

@media (max-width: 640px) {
  .toast-container {
    top: 70px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>
