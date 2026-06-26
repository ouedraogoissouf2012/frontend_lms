<template>
  <nav v-if="isMobile" class="bottom-nav">
    <router-link
      v-for="item in sections"
      :key="item.to"
      :to="item.to"
      class="nav-item"
      :class="{ active: isActive(item.to) }"
    >
      <i :class="['fa', item.icon, 'nav-icon']"></i>
      <span class="nav-label">{{ item.label }}</span>
    </router-link>
  </nav>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useNavigation } from '@/composables/useNavigation'

const route = useRoute()

// Source UNIQUE du menu (#104), deja filtree par role par le composable.
// Aucune liste de liens en dur, aucune logique de role ici : la barre se contente
// de rendre ce que `useNavigation()` expose. On ne garde que les liens feuilles
// (ceux qui ont un `to`) car une barre du bas est plate et ne rend pas de groupe.
const { sections: navSections } = useNavigation()
const sections = computed(() => navSections.value.filter((item) => item.to))

// Affichage responsive : la barre du bas n'existe que sur mobile (presentation pure).
const isMobile = ref(window.innerWidth < 768)
const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}
onMounted(() => window.addEventListener('resize', handleResize))
onUnmounted(() => window.removeEventListener('resize', handleResize))

// Etat actif : responsabilite de presentation, derivee de la route courante.
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
  /* Plus de liens en dur : le menu est filtre par role et peut compter plus
     d'entrees que l'ancienne liste fixe. On degrade proprement en defilement
     horizontal plutot que d'ecraser les items ou d'en selectionner un sous-ensemble. */
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none; /* Firefox */
  -webkit-overflow-scrolling: touch;
}

.bottom-nav::-webkit-scrollbar {
  display: none; /* Chrome/Safari */
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  /* grow:1 pour remplir la barre quand peu d'items ; shrink:0 + min-width pour
     declencher le defilement (au lieu d'ecraser) quand il y en a beaucoup. */
  flex: 1 0 auto;
  min-width: 64px;
  height: 100%;
  color: var(--text-secondary);
  text-decoration: none;
  transition: all 0.2s;
  position: relative;
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
  white-space: nowrap;
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
