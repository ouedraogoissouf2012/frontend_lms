<template>
  <section class="heures-carte" aria-labelledby="heures-carte-titre">
    <h2 id="heures-carte-titre" class="heures-titre">Heures du mois</h2>
    <p v-if="erreur" class="heures-note">{{ erreur }}</p>
    <template v-else>
      <p class="heures-total">{{ dureeLisible(totaux.minutes) }}</p>
      <p class="heures-note">
        {{ totaux.comptees }} séance(s) comptée(s), {{ totaux.non_comptees }} non comptée(s)
        <template v-if="depuis"> — heures comptées depuis le {{ jourLisible(depuis) }}</template>
      </p>
      <router-link to="/teacher/heures" class="heures-lien">Voir le détail</router-link>
    </template>
  </section>
</template>

<script setup>
/**
 * Le bloc « Heures du mois » du tableau de bord enseignant (lms_backend#1682, #688) : le total, le nombre de séances
 * comptées et non comptées, et depuis quand les heures sont comptées. Monté seulement dans une école qui tient sa
 * propre liste (le tableau de bord le décide par la capacité). Logique dans `useMesHeures`.
 */
import { onMounted } from 'vue'
import { useMesHeures } from '@/composables/useMesHeures'
import { dureeLisible, jourLisible } from '@/constants/heures'

const { totaux, depuis, erreur, charger } = useMesHeures()

onMounted(charger)
</script>

<style scoped>
.heures-carte {
  margin: 1rem 0;
  padding: 1.25rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
  background: var(--card-bg);
  color: var(--text-primary);
}

.heures-titre {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
}

.heures-total {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
}

.heures-note {
  margin: 0.25rem 0 0.75rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.heures-lien {
  color: var(--primary-color);
  font-weight: 600;
}
</style>
