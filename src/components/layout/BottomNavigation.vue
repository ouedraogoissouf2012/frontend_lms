<template>
  <nav class="bottom-nav" v-if="isMobile">
    <router-link
      v-for="item in navItems"
      :key="item.name"
      :to="item.path"
      class="nav-item"
      :class="{ active: isActive(item.path) }"
    >
      <span class="nav-icon" v-html="item.icon"></span>
      <span class="nav-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { auth } from '@/services/api'

const route = useRoute()

const isMobile = ref(window.innerWidth < 768)

// Detect window resize
const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

// Navigation items based on user role
const navItems = computed(() => {
  const user = auth.getUser()
  const role = user?.role

  if (role === 'etudiant') {
    return [
      { name: 'dashboard', path: '/student/dashboard', icon: '⌂', label: 'Accueil' },
      { name: 'courses', path: '/student/courses', icon: '◉', label: 'Cours' },
      { name: 'evaluations', path: '/student/evaluations', icon: '✎', label: 'Évaluations' },
      { name: 'seances', path: '/student/seances', icon: '▶', label: 'Visio' },
      { name: 'profile', path: '/student/profile', icon: '●', label: 'Profil' }
    ]
  } else if (role === 'enseignant' || role === 'teacher') {
    return [
      { name: 'dashboard', path: '/teacher/dashboard', icon: '⌂', label: 'Accueil' },
      { name: 'seances', path: '/teacher/seances', icon: '▶', label: 'Séances' },
      { name: 'evaluations', path: '/teacher/evaluations', icon: '✎', label: 'Évaluations' },
      { name: 'classes', path: '/teacher/classes', icon: '◉', label: 'Classes' },
      { name: 'profile', path: '/teacher/profile', icon: '●', label: 'Profil' }
    ]
  } else if (role === 'coordinateur') {
    return [
      { name: 'dashboard', path: '/coordinateur/dashboard', icon: '⌂', label: 'Accueil' },
      { name: 'seances', path: '/coordinateur/seances', icon: '▶', label: 'Séances' },
      { name: 'evaluations', path: '/coordinateur/evaluations', icon: '✎', label: 'Évaluations' },
      { name: 'matieres', path: '/admin/matieres', icon: '◉', label: 'Matières' },
      { name: 'profile', path: '/coordinateur/profile', icon: '●', label: 'Profil' }
    ]
  }

  return []
})

// Check if current route is active
function isActive(path) {
  return route.path.startsWith(path)
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--card-bg);
  border-top: 1px solid var(--border-color);
  display: flex;
  justify-content: space-around;
  align-items: center;
  z-index: 1000;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  height: 100%;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  position: relative;
  min-width: 44px;
}

.nav-item:active {
  background: var(--bg-hover);
}

.nav-icon {
  font-size: 1.25rem;
  line-height: 1;
  margin-bottom: 0.25rem;
  transition: all 0.2s;
}

.nav-label {
  font-size: 0.625rem;
  font-weight: 500;
  text-align: center;
  line-height: 1;
}

.nav-item.active {
  color: var(--primary-color);
}

.nav-item.active .nav-icon {
  transform: scale(1.1);
}

.nav-item.active::before {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 2px;
  background: var(--primary-color);
  border-radius: 0 0 2px 2px;
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  .bottom-nav {
    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
  }
}
</style>
