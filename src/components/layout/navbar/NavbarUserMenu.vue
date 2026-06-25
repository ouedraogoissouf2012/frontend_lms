<template>
  <div class="user-menu" @click="$emit('toggle')">
    <div class="user-avatar">
      <span>{{ userInitials }}</span>
    </div>
    <transition name="dropdown">
      <div v-if="show" class="dropdown-menu">
        <router-link :to="profileUrl" class="dropdown-item">
          <i class="fa fa-user icon"></i>
          <span>Mon Profil</span>
        </router-link>
        <router-link :to="settingsUrl" class="dropdown-item">
          <i class="fa fa-cog icon"></i>
          <span>Paramètres</span>
        </router-link>
        <hr class="dropdown-divider" />
        <button @click="$emit('logout')" class="dropdown-item">
          <i class="fa fa-sign-out icon"></i>
          <span>Déconnexion</span>
        </button>
      </div>
    </transition>
  </div>
</template>

<script setup>
/**
 * Menu utilisateur de la navbar (#H12) : avatar (initiales) + dropdown
 * Profil/Paramètres/Déconnexion. Présentationnel : émet `toggle`/`logout`.
 */
defineProps({
  userInitials: { type: String, default: 'U' },
  show: { type: Boolean, default: false },
  profileUrl: { type: String, default: '/dashboard' },
  settingsUrl: { type: String, default: '/dashboard' }
})

defineEmits(['toggle', 'logout'])
</script>

<style scoped>
/* User Menu */
.user-menu {
  position: relative;
  cursor: pointer;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--blue-600) 0%, var(--blue-400) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-sm);
  transition: transform var(--transition-fast);
}

.user-avatar:hover {
  transform: scale(1.05);
}

/* Dropdown Menu */
.dropdown-menu {
  position: absolute;
  top: calc(100% + var(--spacing-sm));
  right: 0;
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-xl);
  min-width: 200px;
  padding: var(--spacing-sm);
  z-index: var(--z-dropdown);
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
  color: var(--text-primary);
  text-decoration: none;
  transition: background-color var(--transition-fast);
  cursor: pointer;
  border: none;
  background: transparent;
  width: 100%;
  text-align: left;
  font-size: var(--font-size-sm);
}

.dropdown-item:hover {
  background: var(--bg-hover);
}

.dropdown-divider {
  margin: var(--spacing-sm) 0;
  border: none;
  border-top: 1px solid var(--border-primary);
}

/* Transitions */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all var(--transition-fast);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
