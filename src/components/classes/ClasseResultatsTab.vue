<template>
  <section class="resultats" aria-labelledby="resultats-titre">
    <h2 id="resultats-titre" class="resultats-titre">Résultats de la classe</h2>

    <form class="resultats-periode" @submit.prevent="charger">
      <label class="resultats-champ">
        <span>Du</span>
        <input v-model="periode.du" type="date" name="du" :max="periode.au || undefined" :disabled="chargement">
      </label>
      <label class="resultats-champ">
        <span>Au</span>
        <input v-model="periode.au" type="date" name="au" :min="periode.du || undefined" :disabled="chargement">
      </label>
      <button type="submit" class="resultats-bouton" :disabled="chargement">Appliquer la période</button>
      <button v-if="vuePersonnel" type="button" class="resultats-bouton" data-test="exporter" @click="exporter">
        Exporter en CSV
      </button>
    </form>
    <p class="resultats-note">Sans période, toute l’année. Seules les notes publiées comptent.</p>

    <ContentLoader v-if="chargement" text="Chargement du classement..." />

    <div v-else-if="erreur" class="resultats-erreur" role="alert">
      <p>{{ erreur }}</p>
      <button v-if="peutReessayer" type="button" class="resultats-bouton" @click="charger">Réessayer</button>
    </div>

    <template v-else-if="bilan">
      <template v-if="vuePersonnel">
        <ClasseResultatsStatistiques :statistiques="bilan.statistiques" :seuil="bilan.seuil_reussite" />
        <ClasseResultatsClassement :bilan="bilan" />
        <ClasseResultatsCouverture :couverture="bilan.couverture" :evaluations="bilan.evaluations" />
      </template>
      <ClasseResultatsEleve v-else-if="maLigne" :ligne="maLigne" :matieres="bilan.matieres" />
      <p v-if="noteDeSource" class="resultats-source">{{ noteDeSource }}</p>
    </template>
  </section>
</template>

<script setup>
/**
 * #683 : l'onglet « Résultats » de la fiche de classe (lms_backend#1676).
 *
 * Monté à la PREMIÈRE ouverture de l'onglet (la fiche le garde ensuite) : le bilan n'est chargé
 * qu'à la demande. `classeId` est l'identifiant de l'espace source de l'école, fourni par la fiche.
 * La vue suit la réponse du serveur : la classe entière pour le personnel, la seule ligne de
 * l'élève sinon (son rang seulement si le serveur le rend).
 */
import { onMounted, toRef } from 'vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import ClasseResultatsStatistiques from '@/components/classes/ClasseResultatsStatistiques.vue'
import ClasseResultatsClassement from '@/components/classes/ClasseResultatsClassement.vue'
import ClasseResultatsCouverture from '@/components/classes/ClasseResultatsCouverture.vue'
import ClasseResultatsEleve from '@/components/classes/ClasseResultatsEleve.vue'
import { useBilanDeClasse } from '@/composables/useBilanDeClasse'

const props = defineProps({
  classeId: { type: Number, required: true },
})

const { bilan, chargement, erreur, peutReessayer, periode, vuePersonnel, maLigne, noteDeSource, charger, exporter } =
  useBilanDeClasse(toRef(props, 'classeId'))

onMounted(charger)
</script>

<style scoped>
.resultats {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.resultats-titre {
  margin: 0;
  color: var(--text-primary);
  font-size: 1.25rem;
  font-weight: 600;
}

.resultats-periode {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
}

.resultats-champ {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.resultats-champ input {
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--card-bg);
  color: var(--text-primary);
}

.resultats-bouton {
  padding: 0.5rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
  cursor: pointer;
}

.resultats-bouton:hover:not(:disabled) {
  background: var(--btn-secondary-hover);
}

.resultats-bouton:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.resultats-bouton:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

.resultats-note,
.resultats-source {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.resultats-erreur {
  padding: 0.75rem 1rem;
  border: 1px solid var(--error-border);
  border-radius: 0.5rem;
  background: var(--error-bg);
  color: var(--error-text);
}
</style>
