<template>
  <button
    :type="type"
    :disabled="isDisabled"
    :class="['base-btn', `base-btn--${variant}`, { 'is-loading': loading }]"
    v-bind="$attrs"
  >
    <span v-if="loading" class="base-btn__spinner" aria-hidden="true"></span>
    <span v-else-if="$slots.icon" class="base-btn__icon"><slot name="icon" /></span>
    <span class="base-btn__label"><slot /></span>
  </button>
</template>

<script setup>
/**
 * BaseButton — bouton de base réutilisable (#25).
 * Variantes visuelles + états loading/disabled + slots label/icon.
 * inheritAttrs:false : les attributs (data-*, aria-*, @click natif…) traversent sur le <button>.
 */
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  variant: {
    type: String,
    default: 'primary',
    validator: (v) => ['primary', 'secondary', 'danger', 'ghost'].includes(v)
  },
  loading: {
    type: Boolean,
    default: false
  },
  disabled: {
    type: Boolean,
    default: false
  },
  type: {
    type: String,
    default: 'button',
    validator: (v) => ['button', 'submit', 'reset'].includes(v)
  }
})

// Un bouton en chargement est désactivé pour éviter les doubles soumissions.
const isDisabled = computed(() => props.disabled || props.loading)
</script>

<style scoped>
.base-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1;
  border: 1px solid transparent;
  border-radius: 0.5rem;
  cursor: pointer;
  transition: background 0.2s, border-color 0.2s, opacity 0.2s, color 0.2s;
}

.base-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.base-btn--primary {
  background: var(--accent-primary, #4f46e5);
  color: var(--btn-primary-text);
}

.base-btn--primary:hover:not(:disabled) {
  background: var(--accent-primary-hover, #4338ca);
}

.base-btn--secondary {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #111827);
  border-color: var(--border-primary, #e5e7eb);
}

.base-btn--secondary:hover:not(:disabled) {
  background: var(--bg-tertiary, #e5e7eb);
}

.base-btn--danger {
  background: var(--danger, #dc2626);
  color: var(--btn-primary-text);
}

.base-btn--danger:hover:not(:disabled) {
  background: var(--danger-hover, #b91c1c);
}

.base-btn--ghost {
  background: transparent;
  color: var(--text-secondary, #6b7280);
}

.base-btn--ghost:hover:not(:disabled) {
  background: var(--bg-secondary, #f3f4f6);
  color: var(--text-primary, #111827);
}

.base-btn__icon {
  display: inline-flex;
  align-items: center;
}

.base-btn__spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: base-btn-spin 0.6s linear infinite;
}

@keyframes base-btn-spin {
  to { transform: rotate(360deg); }
}
</style>
