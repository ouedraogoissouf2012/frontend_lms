<template>
  <transition name="modal-fade">
    <div v-if="visible" class="modal-overlay" @click.self="close">
      <!-- $attrs sur le conteneur visible (inheritAttrs:false) : class/id/aria-*/data-* traversent -->
      <div class="modal-container" :class="`modal-${normalizedSize}`" v-bind="$attrs">
        <div class="modal-header">
          <!-- Slot header custom ; sinon title optionnelle. Le ✕ reste TOUJOURS rendu (hors slot). -->
          <slot name="header">
            <h3 v-if="title" class="modal-title">{{ title }}</h3>
          </slot>
          <button class="modal-close-btn" aria-label="Fermer" @click="close">✕</button>
        </div>
        <div class="modal-body">
          <slot></slot>
        </div>
        <div class="modal-footer" v-if="$slots.footer">
          <slot name="footer"></slot>
        </div>
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'Modal',
  // Les attributs non déclarés (class, aria-*, data-*) vont sur .modal-container, pas la racine transition.
  inheritAttrs: false,
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: ''
    },
    size: {
      type: String,
      default: 'md',
      validator: (v) => ['sm', 'md', 'lg', 'xl', 'medium'].includes(v)
    }
  },
  computed: {
    visible: {
      get() {
        return this.modelValue
      },
      set(value) {
        this.$emit('update:modelValue', value)
      }
    },
    // Normalise l'alias 'medium' → 'md' et retombe sur 'md' si valeur inattendue.
    normalizedSize() {
      if (this.size === 'medium') return 'md'
      return ['sm', 'md', 'lg', 'xl'].includes(this.size) ? this.size : 'md'
    }
  },
  methods: {
    close() {
      this.visible = false
    },
    onKeydown(e) {
      if (e.key === 'Escape' && this.visible) {
        this.close()
      }
    }
  },
  watch: {
    visible: {
      immediate: true,
      handler(newVal) {
        if (typeof document === 'undefined') return
        if (newVal) {
          document.body.style.overflow = 'hidden'
          document.addEventListener('keydown', this.onKeydown)
        } else {
          document.body.style.overflow = ''
          document.removeEventListener('keydown', this.onKeydown)
        }
      }
    }
  },
  beforeUnmount() {
    document.body.style.overflow = ''
    document.removeEventListener('keydown', this.onKeydown)
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  padding: 1rem;
}

.modal-container {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem;
  border-bottom: 1px solid var(--border-primary);
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.modal-close-btn {
  background: transparent;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0.25rem;
  line-height: 1;
  transition: color 0.2s;
}

.modal-close-btn:hover {
  color: var(--text-primary);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--border-primary);
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

/* Animation */
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-active .modal-container,
.modal-fade-leave-active .modal-container {
  transition: transform 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .modal-container,
.modal-fade-leave-to .modal-container {
  transform: scale(0.9);
}

/* Responsive */
@media (max-width: 768px) {
  .modal-container {
    max-width: 100%;
    border-radius: 0.75rem 0.75rem 0 0;
    margin-top: auto;
  }
}
</style>
