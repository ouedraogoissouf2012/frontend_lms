<template>
  <transition name="slide-down">
    <div v-if="show" class="user-menu-panel">
      <div class="panel-header">
        <div class="user-info">
          <div class="user-avatar-large">{{ userInitials }}</div>
          <div>
            <p class="user-name">{{ userName }}</p>
            <p class="user-role">{{ userRoleLabel }}</p>
          </div>
        </div>
        <button @click="$emit('close')" class="close-btn">✕</button>
      </div>
      <div class="panel-content">
        <router-link :to="profilePath" @click="$emit('close')" class="menu-item">
          <i class="fa fa-circle menu-icon"></i>
          <span>Mon Profil</span>
        </router-link>
        <router-link to="/settings" @click="$emit('close')" class="menu-item">
          <i class="fa fa-cog menu-icon"></i>
          <span>Paramètres</span>
        </router-link>
        <button @click="$emit('logout')" class="menu-item logout-item">
          <span class="menu-icon">→</span>
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  </transition>
</template>

<script setup>
/**
 * Menu utilisateur du header mobile (#H12). Présentationnel : visible selon `show`,
 * affiche profil/nom/rôle et liens Profil/Paramètres/Déconnexion. Émet `close`
 * (clic sur fermer ou sur un lien — parité avec toggleUserMenu) et `logout`.
 */
defineProps({
  show: { type: Boolean, default: false },
  userInitials: { type: String, default: '' },
  userName: { type: String, default: 'Utilisateur' },
  userRoleLabel: { type: String, default: '' },
  profilePath: { type: String, default: '/profile' }
})

defineEmits(['close', 'logout'])
</script>

<style scoped>
/* Panel (chrome dupliqué verbatim depuis MobileHeader, scoped à ce composant) */
.user-menu-panel {
  position: fixed;
  top: 56px;
  right: 0;
  width: 100%;
  max-width: 320px;
  background: var(--card-bg);
  border-left: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 1002;
  max-height: calc(100vh - 56px - 56px);
  overflow-y: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  border-bottom: 1px solid var(--border-color);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

/* user-avatar-large : base partagée (.user-avatar/.user-avatar-large) + spécifique,
   fusionnées verbatim car le sélecteur combiné couvrait header + menu. */
.user-avatar-large {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--primary-color);
  color: white;
  border-radius: 50%;
  font-weight: 600;
  width: 48px;
  height: 48px;
  font-size: 1rem;
  flex-shrink: 0;
}

.user-name {
  font-size: 0.9375rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.user-role {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  font-size: 1.25rem;
  border-radius: 0.25rem;
  transition: background 0.2s;
}

.close-btn:active {
  background: var(--bg-hover);
}

.panel-content {
  padding: 0.5rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  color: var(--text-primary);
  text-decoration: none;
  border-radius: 0.5rem;
  transition: background 0.2s;
  border: none;
  background: none;
  width: 100%;
  font-size: 0.9375rem;
  cursor: pointer;
  text-align: left;
}

.menu-item:active {
  background: var(--bg-hover);
}

.menu-icon {
  font-size: 1.125rem;
  width: 1.5rem;
  text-align: center;
}

.logout-item {
  color: var(--red-500);
  margin-top: 0.5rem;
  border-top: 1px solid var(--border-color);
  border-radius: 0;
  padding-top: 1rem;
}

/* Animations */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from {
  transform: translateY(-100%);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}

/* Dark mode */
@media (prefers-color-scheme: dark) {
  .user-menu-panel {
    box-shadow: -2px 2px 8px rgba(0, 0, 0, 0.5);
  }
}
</style>
