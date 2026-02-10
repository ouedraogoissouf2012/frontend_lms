<template>
  <button
    class="theme-toggle"
    @click="toggleTheme"
    :title="theme === 'light' ? 'Passer en mode sombre' : 'Passer en mode clair'"
  >
    <transition name="rotate" mode="out-in">
      <i v-if="theme === 'light'" key="light" class="fa fa-sun-o icon"></i>
      <i v-else key="dark" class="fa fa-moon-o icon"></i>
    </transition>
  </button>
</template>

<script>
import { useTheme } from '@/composables/useTheme'

export default {
  name: 'ThemeToggle',

  setup() {
    const { theme, toggleTheme } = useTheme()

    return {
      theme,
      toggleTheme
    }
  }
}
</script>

<style scoped>
.theme-toggle {
  background: transparent;
  border: none;
  padding: var(--spacing-sm);
  cursor: pointer;
  border-radius: var(--radius-md);
  transition: background-color var(--transition-fast);
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
}

.theme-toggle:hover {
  background: var(--bg-hover);
}

.icon {
  display: block;
  line-height: 1;
}

/* Rotation transition */
.rotate-enter-active,
.rotate-leave-active {
  transition: all var(--transition-base);
}

.rotate-enter-from {
  opacity: 0;
  transform: rotate(-180deg) scale(0.5);
}

.rotate-leave-to {
  opacity: 0;
  transform: rotate(180deg) scale(0.5);
}
</style>
