<template>
  <transition name="toast-slide">
    <div v-if="visible" :class="['toast', `toast-${type}`]">
      <div class="toast-icon">
        <!-- Success Icon -->
        <svg v-if="type === 'success'" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
        </svg>
        <!-- Error Icon -->
        <svg v-else-if="type === 'error'" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
        <!-- Warning Icon -->
        <svg v-else-if="type === 'warning'" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <!-- Info Icon -->
        <svg v-else class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div class="toast-content">
        <p class="toast-title" v-if="title">{{ title }}</p>
        <p class="toast-message">{{ message }}</p>
      </div>
      <button class="toast-close" @click="close">
        <svg class="icon-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'Toast',
  props: {
    message: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: ''
    },
    type: {
      type: String,
      default: 'info',
      validator: (value) => ['success', 'error', 'warning', 'info'].includes(value)
    },
    duration: {
      type: Number,
      default: 3000
    }
  },
  data() {
    return {
      visible: false,
      timer: null
    }
  },
  mounted() {
    this.show()
  },
  methods: {
    show() {
      this.visible = true
      if (this.duration > 0) {
        this.timer = setTimeout(() => {
          this.close()
        }, this.duration)
      }
    },
    close() {
      this.visible = false
      clearTimeout(this.timer)
      setTimeout(() => {
        this.$emit('close')
      }, 300)
    }
  },
  beforeUnmount() {
    clearTimeout(this.timer)
  }
}
</script>

<style scoped>
.toast {
  display: flex;
  align-items: center;
  gap: 1rem;
  min-width: 300px;
  max-width: 500px;
  padding: 1rem 1.25rem;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 4px 10px rgba(0, 0, 0, 0.05);
  background: white;
  border-left: 4px solid;
  width: 100%;
}

.toast-icon {
  flex-shrink: 0;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.icon {
  width: 1.5rem;
  height: 1.5rem;
}

.icon-sm {
  width: 1rem;
  height: 1rem;
}

.toast-content {
  flex: 1;
}

.toast-title {
  font-weight: 700;
  font-size: 0.95rem;
  margin: 0 0 0.25rem 0;
}

.toast-message {
  font-size: 0.875rem;
  margin: 0;
  opacity: 0.9;
}

.toast-close {
  background: transparent;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  opacity: 0.5;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.toast-close:hover {
  opacity: 1;
}

/* Success Toast */
.toast-success {
  border-left-color: var(--emerald-500);
  background: #F0FDF4;
}

.toast-success .toast-icon {
  color: var(--emerald-500);
  background: var(--emerald-100);
}

.toast-success .toast-title {
  color: var(--emerald-800);
}

.toast-success .toast-message {
  color: var(--emerald-700);
}

/* Error Toast */
.toast-error {
  border-left-color: var(--red-500);
  background: var(--red-50);
}

.toast-error .toast-icon {
  color: var(--red-500);
  background: var(--error-bg);
}

.toast-error .toast-title {
  color: var(--error-text);
}

.toast-error .toast-message {
  color: var(--red-700);
}

/* Warning Toast */
.toast-warning {
  border-left-color: var(--amber-500);
  background: var(--amber-50);
}

.toast-warning .toast-icon {
  color: var(--amber-500);
  background: var(--warning-bg);
}

.toast-warning .toast-title {
  color: var(--amber-800);
}

.toast-warning .toast-message {
  color: var(--amber-700);
}

/* Info Toast */
.toast-info {
  border-left-color: var(--blue-500);
  background: var(--blue-50);
}

.toast-info .toast-icon {
  color: var(--blue-500);
  background: var(--info-bg);
}

.toast-info .toast-title {
  color: var(--info-text);
}

.toast-info .toast-message {
  color: var(--color-info-strong);
}

/* Animation */
.toast-slide-enter-active,
.toast-slide-leave-active {
  transition: all 0.3s ease;
}

.toast-slide-enter-from {
  transform: translateX(100%);
  opacity: 0;
}

.toast-slide-leave-to {
  transform: translateX(100%);
  opacity: 0;
}
</style>
