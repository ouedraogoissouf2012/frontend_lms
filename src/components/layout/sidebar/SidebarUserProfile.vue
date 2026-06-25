<template>
  <div class="sidebar-footer">
    <div class="user-profile" @click="$emit('go-to-profile')">
      <div class="avatar">
        <span>{{ userInitials }}</span>
      </div>
      <transition name="fade">
        <div v-if="!isCollapsed" class="user-info">
          <div class="user-name">{{ userName }}</div>
          <div class="user-role">{{ userRole }}</div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
/**
 * Pied de la sidebar (#H12) : profil utilisateur (avatar/nom/rôle).
 * Présentationnel : émet `go-to-profile` au clic (parité avec goToProfile).
 */
defineProps({
  userInitials: { type: String, default: 'U' },
  userName: { type: String, default: 'Utilisateur' },
  userRole: { type: String, default: 'Invité' },
  isCollapsed: { type: Boolean, default: false }
})

defineEmits(['go-to-profile'])
</script>

<style scoped>
/* Footer / User Profile */
.sidebar-footer {
  padding: var(--spacing-md);
  border-top: 1px solid var(--sidebar-border);
}

.user-profile {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: background-color var(--transition-fast);
}

.user-profile:hover {
  background: var(--sidebar-hover);
}

.avatar {
  width: 40px;
  height: 40px;
  min-width: 40px;
  border-radius: var(--radius-full);
  background: var(--sidebar-active);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--font-size-lg);
}

.user-info {
  flex: 1;
  overflow: hidden;
}

.user-name {
  font-weight: 600;
  font-size: var(--font-size-sm);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: var(--font-size-xs);
  color: var(--sidebar-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
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
</style>
