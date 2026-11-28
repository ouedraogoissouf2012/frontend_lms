<template>
  <DashboardLayout>
    <div class="mes-dispos">
      <h1>Mes disponibilités</h1>
      <p class="mes-dispos-aide">Indiquez quand vous pouvez enseigner : votre coordinateur les relit pour composer les emplois du temps.</p>
      <DisponibilitesEditeur v-if="monId" :enseignant-id="monId" />
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * #673 — « Mes disponibilités » : l'enseignant remplit SA semaine type et SES exceptions (décision du 28/11). Il agit sur
 * l'id LOCAL de son propre compte, celui de la session, dans les deux volets : aucun rapprochement d'id.
 */
import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import DisponibilitesEditeur from '@/components/enseignants/DisponibilitesEditeur.vue'
import { useAuthStore } from '@/stores/auth'

const { user } = storeToRefs(useAuthStore())
const monId = computed(() => (Number.isInteger(user.value?.id) ? user.value.id : null))
</script>

<style scoped>
.mes-dispos { display: grid; gap: var(--spacing-md); padding: var(--spacing-xl); max-width: 64rem; margin: 0 auto; color: var(--text-primary); }
.mes-dispos h1 { margin: 0; }
.mes-dispos-aide { margin: 0; color: var(--text-secondary); }
</style>
