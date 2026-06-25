<template>
  <nav class="sidebar-nav">
    <!-- Menu Sections -->
    <template v-for="(section, index) in menuSections" :key="index">
      <!-- Section with submenu -->
      <div v-if="section.children" class="nav-section">
        <div
          class="nav-item parent-item"
          @click="$emit('toggle-submenu', index)"
          :class="{ 'submenu-open': openSubmenus[index] }"
        >
          <i :class="`fa ${section.icon} nav-icon`"></i>
          <transition name="fade">
            <span v-if="!isCollapsed" class="nav-text">{{ section.label }}</span>
          </transition>
          <transition name="fade">
            <span v-if="!isCollapsed" class="submenu-arrow">
              {{ openSubmenus[index] ? '▾' : '▸' }}
            </span>
          </transition>
        </div>

        <!-- Submenu items -->
        <transition name="slide">
          <div v-if="openSubmenus[index] && !isCollapsed" class="submenu">
            <router-link
              v-for="item in section.children"
              :key="item.to"
              :to="item.to"
              class="nav-sub-item"
              exact-active-class="active"
            >
              <i :class="`fa ${item.icon} nav-icon`"></i>
              <span class="nav-text">{{ item.label }}</span>
            </router-link>
          </div>
        </transition>
      </div>

      <!-- Single item without submenu -->
      <router-link
        v-else
        :to="section.to"
        class="nav-item"
        exact-active-class="active"
        :title="isCollapsed ? section.label : ''"
      >
        <i :class="`fa ${section.icon} nav-icon`"></i>
        <transition name="fade">
          <span v-if="!isCollapsed" class="nav-text">{{ section.label }}</span>
        </transition>
      </router-link>
    </template>
  </nav>
</template>

<script setup>
/**
 * Navigation de la sidebar (#H12) : sections simples et sections à sous-menu,
 * dérivées du rôle. Présentationnel : reçoit `menuSections`/`isCollapsed`/
 * `openSubmenus`, émet `toggle-submenu(index)` (parité avec toggleSubmenu).
 */
defineProps({
  menuSections: { type: Array, default: () => [] },
  isCollapsed: { type: Boolean, default: false },
  openSubmenus: { type: Object, default: () => ({}) }
})

defineEmits(['toggle-submenu'])
</script>

<style scoped>
/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: var(--spacing-md);
  overflow-y: auto;
  overflow-x: hidden;
}

.nav-section {
  margin-bottom: var(--spacing-xs);
}

.nav-item,
.parent-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  color: var(--sidebar-text);
  text-decoration: none;
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  margin-bottom: var(--spacing-xs);
  font-weight: 500;
}

.nav-item:hover,
.parent-item:hover {
  background: var(--sidebar-hover);
  transform: translateX(2px);
}

.nav-item.active {
  background: var(--sidebar-active);
  font-weight: 600;
}

.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 20%;
  bottom: 20%;
  width: 3px;
  background: var(--sidebar-text);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.nav-icon {
  font-size: 1.25rem;
  min-width: 24px;
  text-align: center;
}

.nav-text {
  flex: 1;
  white-space: nowrap;
}

.submenu-arrow {
  margin-left: auto;
  font-size: 0.875rem;
  transition: transform var(--transition-fast);
}

.parent-item.submenu-open .submenu-arrow {
  transform: rotate(0deg);
}

/* Submenu */
.submenu {
  padding-left: calc(var(--spacing-md) + 24px + var(--spacing-md));
  margin-top: var(--spacing-xs);
  margin-bottom: var(--spacing-sm);
}

.nav-sub-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  color: var(--sidebar-text-secondary);
  text-decoration: none;
  border-radius: var(--radius-md);
  transition: all var(--transition-fast);
  font-size: var(--font-size-sm);
  margin-bottom: var(--spacing-xs);
}

.nav-sub-item:hover {
  background: var(--sidebar-hover);
  color: var(--sidebar-text);
  transform: translateX(2px);
}

.nav-sub-item.active {
  background: var(--sidebar-active);
  color: var(--sidebar-text);
  font-weight: 600;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-fast);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-enter-active,
.slide-leave-active {
  transition: all var(--transition-base);
  overflow: hidden;
}

.slide-enter-from,
.slide-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-10px);
}

.slide-enter-to,
.slide-leave-from {
  opacity: 1;
  max-height: 500px;
  transform: translateY(0);
}

/* Scrollbar for nav */
.sidebar-nav::-webkit-scrollbar {
  width: 4px;
}

.sidebar-nav::-webkit-scrollbar-track {
  background: transparent;
}

.sidebar-nav::-webkit-scrollbar-thumb {
  background: var(--sidebar-border);
  border-radius: var(--radius-full);
}

.sidebar-nav::-webkit-scrollbar-thumb:hover {
  background: var(--sidebar-hover);
}
</style>
