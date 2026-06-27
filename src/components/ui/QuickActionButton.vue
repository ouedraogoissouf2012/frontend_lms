<template>
  <button
    class="quick-action-btn"
    :class="variant"
    @click="handleClick"
    :disabled="disabled"
  >
    <component :is="icon" class="action-icon" />
    <span class="action-label">{{ label }}</span>
  </button>
</template>

<script setup>
const props = defineProps({
  label: {
    type: String,
    required: true
  },
  icon: {
    type: [Object, Function],
    required: true
  },
  variant: {
    type: String,
    default: 'primary', // primary, secondary, success, warning, danger
    validator: (value) => ['primary', 'secondary', 'success', 'warning', 'danger'].includes(value)
  },
  disabled: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['click'])

function handleClick() {
  if (!props.disabled) {
    emit('click')
  }
}
</script>

<style scoped>
.quick-action-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem 1rem;
  background: var(--card-bg);
  border: 2px solid var(--border-primary);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  min-width: 140px;
}

.quick-action-btn:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-color: var(--color-primary);
}

.quick-action-btn:active:not(:disabled) {
  transform: translateY(-2px);
}

.quick-action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  width: 2rem;
  height: 2rem;
  transition: all 0.2s;
}

.action-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

/* Variants */
.quick-action-btn.primary:hover:not(:disabled) {
  border-color: var(--blue-500);
  background: var(--blue-500);
}

.quick-action-btn.primary:hover:not(:disabled) .action-icon {
  color: white;
}

.quick-action-btn.primary:hover:not(:disabled) .action-label {
  color: white;
}

.quick-action-btn.secondary:hover:not(:disabled) {
  border-color: #6b7280;
  background: #6b7280;
}

.quick-action-btn.secondary:hover:not(:disabled) .action-icon {
  color: white;
}

.quick-action-btn.secondary:hover:not(:disabled) .action-label {
  color: white;
}

.quick-action-btn.success:hover:not(:disabled) {
  border-color: var(--emerald-500);
  background: var(--emerald-500);
}

.quick-action-btn.success:hover:not(:disabled) .action-icon {
  color: white;
}

.quick-action-btn.success:hover:not(:disabled) .action-label {
  color: white;
}

.quick-action-btn.warning:hover:not(:disabled) {
  border-color: var(--amber-500);
  background: var(--amber-500);
}

.quick-action-btn.warning:hover:not(:disabled) .action-icon {
  color: white;
}

.quick-action-btn.warning:hover:not(:disabled) .action-label {
  color: white;
}

.quick-action-btn.danger:hover:not(:disabled) {
  border-color: var(--red-500);
  background: var(--red-500);
}

.quick-action-btn.danger:hover:not(:disabled) .action-icon {
  color: white;
}

.quick-action-btn.danger:hover:not(:disabled) .action-label {
  color: white;
}

@media (max-width: 768px) {
  .quick-action-btn {
    min-width: 120px;
    padding: 1rem 0.75rem;
  }

  .action-icon {
    width: 1.5rem;
    height: 1.5rem;
  }

  .action-label {
    font-size: 0.75rem;
  }
}
</style>
