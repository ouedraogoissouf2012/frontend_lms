<template>
  <DashboardLayout>
    <div class="enrolment-codes-container">
      <div class="header-section">
        <div class="header-content">
          <h1 class="page-title">Codes d'inscription</h1>
          <p class="page-subtitle">Dictez le code d'une classe : l'élève le saisit pour la rejoindre.</p>
        </div>
        <button type="button" class="refresh-btn" :disabled="loading" @click="load()">Actualiser</button>
      </div>

      <!-- Régions présentes DÈS le montage et JAMAIS masquées (une région hors de l'arbre
           d'accessibilité n'est pas annoncée) : seule la classe « banner » suit le contenu. -->
      <p class="annonce" :class="{ banner: error }" role="alert">{{ error }}</p>
      <p class="annonce" :class="{ banner: notice }" role="status" aria-live="polite">{{ notice }}</p>

      <ContentLoader v-if="loading" text="Chargement des classes..." />
      <p v-else-if="classes.length === 0 && !error">Aucune classe locale pour le moment.</p>

      <EnrolmentCodeCard
        v-for="c in classes"
        :key="c.id"
        :classe="c"
        :busy="estOccupee(c.id)"
        @emettre="emettre(c)"
        @retirer="retirer(c)"
      />

      <p v-if="lastPage > 1">
        <button type="button" class="refresh-btn" :disabled="page <= 1" @click="load(page - 1)">Précédent</button>
        Page {{ page }} / {{ lastPage }}
        <button type="button" class="refresh-btn" :disabled="page >= lastPage" @click="load(page + 1)">Suivant</button>
      </p>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Codes d'inscription des classes locales (#391). Réservé au personnel ET à un
 * établissement qui tient sa propre liste (route gardée par `peutInscrireLocalement`).
 * La logique vit dans useEnrolmentCodes ; chaque classe est rendue par EnrolmentCodeCard.
 */
import { onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import EnrolmentCodeCard from '@/components/admin/EnrolmentCodeCard.vue'
import { useEnrolmentCodes } from '@/composables/useEnrolmentCodes'

defineOptions({ name: 'AdminEnrolmentCodes' })

const { classes, loading, error, notice, page, lastPage, estOccupee, load, emettre, retirer } = useEnrolmentCodes()

onMounted(() => load())
</script>

<style scoped lang="scss">
@use '../../assets/styles/admin-shared';

.enrolment-codes-container {
  padding: var(--spacing-xl);
  max-width: 52rem;
  margin: 0 auto;
}

.annonce {
  margin: 0;
}

.banner {
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}
</style>
