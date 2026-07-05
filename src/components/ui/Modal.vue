<template>
  <Teleport :to="teleportTo" :disabled="!teleport">
    <transition :name="transitionName">
      <div
        v-if="visible"
        class="modal-overlay"
        :class="overlayClass"
        @click.self="handleOverlayClick"
      >
        <!-- $attrs sur le conteneur visible (inheritAttrs:false) : class/id/aria-*/data-* traversent -->
        <div
          class="modal-container"
          :class="[`modal-${normalizedSize}`, containerClass]"
          v-bind="$attrs"
        >
          <div
            v-if="$slots.header || title || showClose"
            class="modal-header"
            :class="headerClass"
          >
            <!-- Slot header custom ; sinon title optionnelle. Le ✕ reste TOUJOURS rendu (hors slot). -->
            <slot name="header">
              <h3 v-if="title" class="modal-title">{{ title }}</h3>
            </slot>
            <button v-if="showClose" class="modal-close-btn" aria-label="Fermer" @click="close">✕</button>
          </div>
          <div class="modal-body" :class="bodyClass">
            <slot></slot>
          </div>
          <div class="modal-footer" :class="footerClass" v-if="$slots.footer">
            <slot name="footer"></slot>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { computed, onBeforeUnmount, watch } from 'vue'

defineOptions({
  name: 'Modal',
  // Les attributs non déclarés (class, aria-*, data-*) vont sur .modal-container, pas la racine transition.
  inheritAttrs: false
})

const emit = defineEmits(['update:modelValue', 'close'])

const props = defineProps({
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
  },
  showClose: {
    type: Boolean,
    default: true
  },
  closeOnOverlay: {
    type: Boolean,
    default: true
  },
  closeOnEsc: {
    type: Boolean,
    default: true
  },
  teleport: {
    type: Boolean,
    default: false
  },
  teleportTo: {
    type: String,
    default: 'body'
  },
  transitionName: {
    type: String,
    default: 'modal-fade'
  },
  overlayClass: {
    type: [String, Array, Object],
    default: ''
  },
  containerClass: {
    type: [String, Array, Object],
    default: ''
  },
  headerClass: {
    type: [String, Array, Object],
    default: ''
  },
  bodyClass: {
    type: [String, Array, Object],
    default: ''
  },
  footerClass: {
    type: [String, Array, Object],
    default: ''
  }
})

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Normalise l'alias 'medium' -> 'md' et retombe sur 'md' si valeur inattendue.
const normalizedSize = computed(() => {
  if (props.size === 'medium') return 'md'
  return ['sm', 'md', 'lg', 'xl'].includes(props.size) ? props.size : 'md'
})

function close() {
  if (!visible.value) return
  visible.value = false
  emit('close')
}

function handleOverlayClick() {
  if (props.closeOnOverlay) {
    close()
  }
}

function onKeydown(e) {
  if (props.closeOnEsc && e.key === 'Escape' && visible.value) {
    close()
  }
}

watch(
  visible,
  (newVal) => {
    if (typeof document === 'undefined') return
    if (newVal) {
      document.body.style.overflow = 'hidden'
      document.addEventListener('keydown', onKeydown)
    } else {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', onKeydown)
    }
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  document.removeEventListener('keydown', onKeydown)
})
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

.modal-sm {
  max-width: 400px;
}

.modal-md {
  max-width: 500px;
}

.modal-lg {
  max-width: 720px;
}

.modal-xl {
  max-width: 960px;
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
