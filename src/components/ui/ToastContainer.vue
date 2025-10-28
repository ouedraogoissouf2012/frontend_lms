<template>
  <div class="toast-container">
    <Toast
      v-for="toast in toasts"
      :key="toast.id"
      :message="toast.message"
      :title="toast.title"
      :type="toast.type"
      :duration="toast.duration"
      @close="removeToast(toast.id)"
    />
  </div>
</template>

<script>
import { ref } from 'vue'
import Toast from './Toast.vue'

export default {
  name: 'ToastContainer',
  components: {
    Toast
  },
  setup() {
    const toasts = ref([])

    const addToast = (options) => {
      const id = Date.now() + Math.random()
      toasts.value.push({
        id,
        message: options.message || '',
        title: options.title || '',
        type: options.type || 'info',
        duration: options.duration || 5000
      })
      return id
    }

    const removeToast = (id) => {
      const index = toasts.value.findIndex(t => t.id === id)
      if (index > -1) {
        toasts.value.splice(index, 1)
      }
    }

    // Exposer la fonction globalement
    if (typeof window !== 'undefined') {
      window.$toast = addToast
    }

    return {
      toasts,
      removeToast
    }
  }
}
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
