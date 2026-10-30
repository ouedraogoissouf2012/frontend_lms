<template>
  <div class="toast-container">
    <!-- Deux régions vivantes, présentes dès le montage : un lecteur d'écran n'annonce que
         ce qui change dans une région qui existait déjà. Les erreurs (assertives) en tête ;
         dans chaque région, l'ordre d'apparition est conservé. Le rôle suffit : pas
         d'aria-live redondant, ni d'aria-atomic (chaque toast ajouté est annoncé seul). -->
    <div
      role="alert"
      data-test="toasts-erreurs"
      :class="['toast-region', { 'toast-region--suivie': erreurs.length && autres.length }]"
    >
      <Toast v-for="t in erreurs" :key="t.id" v-bind="champs(t)" @close="remove(t.id)" />
    </div>
    <div role="status" data-test="toasts-infos" class="toast-region">
      <Toast v-for="t in autres" :key="t.id" v-bind="champs(t)" @close="remove(t.id)" />
    </div>
  </div>
</template>

<script setup>
// Rend la file de toasts pilotée par le composable useToast (source unique).
// Monté UNE seule fois au niveau App → les toasts s'affichent sur TOUTE page
// (fin du hack `window.$toast`, jusqu'ici muet hors DashboardLayout).
import { computed } from 'vue'
import Toast from './Toast.vue'
import { useToast } from '@/composables/useToast'

const { toasts, remove } = useToast()

const erreurs = computed(() => toasts.value.filter((t) => t.type === 'error'))
const autres = computed(() => toasts.value.filter((t) => t.type !== 'error'))

const champs = ({ message, title, type, duration, action }) => ({ message, title, type, duration, action })
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 10000;
  display: flex;
  flex-direction: column;
  pointer-events: none;
  max-width: 420px;
}

.toast-region {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* L'espace entre les deux groupes n'existe que si les deux sont occupés. */
.toast-region--suivie {
  margin-bottom: 12px;
}

.toast-region > * {
  pointer-events: auto;
}

@media (max-width: 640px) {
  .toast-container {
    top: 70px;
    right: 10px;
    left: 10px;
    max-width: none;
  }
}
</style>
