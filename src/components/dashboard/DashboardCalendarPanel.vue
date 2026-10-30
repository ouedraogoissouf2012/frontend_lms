<template>
  <div class="calendar-panel">
    <!-- Région d'état présente dans TOUS les états : seul son texte change. -->
    <p data-test="etat-calendrier" role="status" class="calendar-state"
       :class="{ 'calendar-state--visible': texte, 'calendar-state--erreur': etat === 'erreur' }">{{ texte }}</p>

    <CalendarWidget v-if="etat === 'pret'" :events="events" height="500px" />

    <button v-if="etat === 'non-charge' || etat === 'erreur'" type="button"
            class="calendar-load" @click="$emit('charger')">
      {{ etat === 'erreur' ? 'Réessayer' : 'Afficher le calendrier' }}
    </button>
  </div>
</template>

<script setup>
/**
 * Calendrier du tableau de bord admin, chargé À LA DEMANDE. Présentation pure : l'état
 * vient de useAdminDashboard. Aucun calendrier vide n'est montré tant que les séances
 * n'ont pas été chargées : il affirmerait « aucune séance ».
 */
import { computed } from 'vue'
import CalendarWidget from '@/components/widgets/CalendarWidget.vue'

const props = defineProps({
  etat: { type: String, required: true },
  events: { type: Array, default: () => [] },
  message: { type: String, default: '' },
})

defineEmits(['charger'])

const texte = computed(() => {
  if (props.etat === 'non-charge') return 'Calendrier non chargé.'
  if (props.etat === 'chargement') return 'Chargement du calendrier…'
  if (props.etat === 'erreur') return props.message
  return ''
})
</script>

<style scoped>
.calendar-state {
  margin: 0;
}

.calendar-state--visible {
  margin-bottom: 0.75rem;
  color: var(--text-secondary);
}

.calendar-state--erreur {
  color: var(--error-text);
}

.calendar-load {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--border-primary);
  background: var(--bg-primary);
  color: var(--text-primary);
  cursor: pointer;
}
</style>
