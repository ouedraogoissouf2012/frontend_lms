<template>
  <nav class="sidebar-nav">
    <div class="nav-section">
      <h3 class="section-title">Navigation</h3>

      <router-link
        v-for="item in secondaryNavItems"
        :key="item.path"
        :to="item.path"
        @click="$emit('close')"
        class="nav-link"
        :class="{ active: isActive(item.path) }"
      >
        <i :class="`fa ${item.icon} nav-icon`"></i>
        <span class="nav-text">{{ item.label }}</span>
        <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
      </router-link>
    </div>

    <div class="nav-section" v-if="adminNavItems.length > 0">
      <h3 class="section-title">Administration</h3>

      <router-link
        v-for="item in adminNavItems"
        :key="item.path"
        :to="item.path"
        @click="$emit('close')"
        class="nav-link"
        :class="{ active: isActive(item.path) }"
      >
        <i :class="`fa ${item.icon} nav-icon`"></i>
        <span class="nav-text">{{ item.label }}</span>
      </router-link>
    </div>

    <div class="nav-section">
      <h3 class="section-title">Compte</h3>

      <button @click="$emit('logout')" class="nav-link logout-link">
        <span class="nav-icon">→</span>
        <span class="nav-text">Déconnexion</span>
      </button>
    </div>
  </nav>
</template>

<script setup>
/**
 * Navigation du drawer mobile (#H12) : sections Navigation / Administration /
 * Compte. Présentationnel : reçoit les items et le chemin actif, émet
 * `close` (clic sur un lien) et `logout`.
 */
const props = defineProps({
  secondaryNavItems: { type: Array, default: () => [] },
  adminNavItems: { type: Array, default: () => [] },
  activePath: { type: String, default: '' }
})

defineEmits(['close', 'logout'])

// Chemin actif (parité avec l'isActive d'origine : préfixe du path courant)
function isActive(path) {
  return props.activePath.startsWith(path)
}
</script>

<style scoped>
/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 1rem 0;
  overflow-y: auto;
}

.nav-section {
  margin-bottom: 1.5rem;
}

.section-title {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-tertiary);
  padding: 0 1rem;
  margin: 0 0 0.5rem 0;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  border: none;
  background: none;
  width: 100%;
  font-size: 0.9375rem;
  cursor: pointer;
  text-align: left;
  min-height: 44px;
}

.nav-link:active {
  background: var(--bg-hover);
}

.nav-link.active {
  background: var(--bg-hover);
  color: var(--primary-color);
  border-left: 3px solid var(--primary-color);
  padding-left: calc(1rem - 3px);
}

.nav-icon {
  font-size: 1.125rem;
  width: 1.5rem;
  text-align: center;
  flex-shrink: 0;
}

.nav-text {
  flex: 1;
}

.nav-badge {
  background: var(--primary-color);
  color: white;
  font-size: 0.6875rem;
  font-weight: 600;
  padding: 0.125rem 0.375rem;
  border-radius: 9999px;
  min-width: 1.25rem;
  text-align: center;
}

.logout-link {
  color: var(--red-500);
  margin-top: 0.5rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1rem;
}
</style>
