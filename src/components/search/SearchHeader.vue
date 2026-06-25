<template>
  <div class="search-header">
    <MagnifyingGlassIcon class="search-icon" />
    <input
      ref="inputEl"
      v-model="query"
      type="text"
      class="search-input"
      placeholder="Rechercher des utilisateurs, cours, évaluations..."
      @input="$emit('input')"
      @keydown.down.prevent="$emit('navigate-down')"
      @keydown.up.prevent="$emit('navigate-up')"
      @keydown.enter="$emit('select-highlighted')"
      @keydown.esc="$emit('close')"
    />
    <kbd class="shortcut-badge">ESC</kbd>
  </div>
</template>

<script setup>
/**
 * Champ de recherche de GlobalSearchModal (#G1 ≤300). Présentationnel : query en
 * v-model (defineModel), événements clavier/input relayés au composable parent.
 * Expose focus() pour que le composable puisse focaliser l'input à l'ouverture.
 */
import { ref } from 'vue'
import { MagnifyingGlassIcon } from '@heroicons/vue/24/outline'

const query = defineModel('query', { type: String, default: '' })

defineEmits(['input', 'navigate-down', 'navigate-up', 'select-highlighted', 'close'])

const inputEl = ref(null)

defineExpose({
  focus: () => inputEl.value?.focus(),
})
</script>

<style scoped>
/* Search Header */
.search-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1.25rem;
  border-bottom: 1px solid var(--border-color);
}

.search-icon {
  width: 1.5rem;
  height: 1.5rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  font-size: 1rem;
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;
}

.search-input::placeholder {
  color: var(--text-tertiary);
}

.shortcut-badge {
  padding: 0.25rem 0.5rem;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-family: monospace;
  color: var(--text-secondary);
}
</style>
