<template>
  <div class="tabs-header">
    <nav class="tabs-nav">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        @click="$emit('select', tab.id)"
        :class="[
          'px-6 py-4 font-medium text-sm border-b-2 transition',
          activeTab === tab.id
            ? 'border-green-600 text-green-600'
            : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
        ]"
      >
        {{ tab.label }}
        <span
          v-if="tab.count !== undefined"
          :class="[
            'ml-2 px-2 py-1 rounded-full text-xs',
            activeTab === tab.id ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
          ]"
        >
          {{ tab.count }}
        </span>
      </button>
    </nav>
  </div>
</template>

<script setup>
/**
 * Barre d'onglets de ClasseDetails (#H9 ≤300). Présentation pure : émet `select`
 * avec l'id de l'onglet. CSS de la nav déplacé VERBATIM (spécifique à cette nav).
 */
defineProps({
  tabs: { type: Array, default: () => [] },
  activeTab: { type: String, default: '' }
})
defineEmits(['select'])
</script>

<style scoped>
.tabs-header {
  border-bottom: 1px solid var(--border-color);
}

.tabs-nav {
  display: flex;
  margin: 0;
  padding: 0;
}

.tab-button,
button[class*="px-6 py-4"] {
  padding: 1rem 1.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  color: var(--text-secondary) !important;
  cursor: pointer;
  transition: none;
}

/* Active tab - VERY specific to override Tailwind */
.tab-button-active,
button[class*="px-6"][class*="py-4"][class*="border-green-600"],
button.px-6.py-4.font-medium.text-sm.border-b-2.transition.border-green-600.text-green-600 {
  border-bottom-color: var(--emerald-500) !important;
  color: var(--emerald-500) !important;
}

/* Disable hover effect */
button[class*="px-6 py-4"]:hover {
  /* No hover effect */
}

/* Badge in tabs */
button[class*="px-6 py-4"] span[class*="bg-green-100"] {
  background: var(--emerald-500) !important;
  color: white !important;
}

button[class*="px-6 py-4"] span[class*="bg-gray-100"] {
  background: var(--bg-secondary) !important;
  color: var(--text-secondary) !important;
}
</style>
