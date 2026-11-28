<template>
  <form class="cal-carte" data-evenement-form novalidate aria-labelledby="evenement-titre" @submit.prevent="emit('enregistrer')">
    <h2 id="evenement-titre">{{ saisie.id ? 'Modifier l’événement' : 'Publier un événement' }}</h2>
    <p v-if="erreur" class="cal-erreur" role="alert">{{ erreur }}</p>
    <div class="cal-champs">
      <div class="cal-champ">
        <label for="evenement-type">Type</label>
        <select id="evenement-type" v-model="saisie.type" data-champ="type" aria-describedby="evenement-type-erreur">
          <option v-for="(libelle, cle) in TYPES_D_EVENEMENT" :key="cle" :value="cle">{{ libelle }}</option>
        </select>
        <p id="evenement-type-erreur" class="cal-champ-erreur">{{ erreurs.type }}</p>
      </div>
      <div class="cal-champ">
        <label for="evenement-titre-champ">Titre</label>
        <input id="evenement-titre-champ" v-model="saisie.titre" data-champ="titre" maxlength="150" aria-describedby="evenement-titre-erreur" :aria-invalid="erreurs.titre ? 'true' : 'false'">
        <p id="evenement-titre-erreur" class="cal-champ-erreur">{{ erreurs.titre }}</p>
      </div>
      <div class="cal-champ">
        <label for="evenement-debut">Premier jour</label>
        <input id="evenement-debut" v-model="saisie.debut" type="date" data-champ="debut" aria-describedby="evenement-dates-erreur">
      </div>
      <div class="cal-champ">
        <label for="evenement-fin">Dernier jour</label>
        <input id="evenement-fin" v-model="saisie.fin" type="date" data-champ="fin" aria-describedby="evenement-dates-erreur">
      </div>
    </div>
    <p id="evenement-dates-erreur" class="cal-champ-erreur">{{ erreurs.dates }}</p>

    <fieldset class="cal-portee" aria-describedby="evenement-portee-erreur">
      <legend>Pour qui</legend>
      <label><input v-model="saisie.portee" type="radio" value="ecole" data-champ="portee-ecole"> Toute l’école</label>
      <label><input v-model="saisie.portee" type="radio" value="classes" data-champ="portee-classes"> Des classes choisies</label>
      <div v-if="saisie.portee === 'classes'" class="cal-classes">
        <label v-for="c in classes" :key="c.id">
          <input v-model="saisie.classeIds" type="checkbox" :value="c.id" :data-classe="c.id"> {{ c.libelle }}
        </label>
        <p v-if="!classes.length" class="cal-aide">Aucune classe à choisir.</p>
      </div>
    </fieldset>
    <p id="evenement-portee-erreur" class="cal-champ-erreur">{{ erreurs.portee }}</p>

    <div class="cal-actions">
      <button type="submit" class="cal-btn cal-btn--principal" :aria-disabled="occupe ? 'true' : 'false'">{{ saisie.id ? 'Enregistrer' : 'Publier' }}</button>
      <button type="button" class="cal-btn" @click="emit('annuler')">Annuler</button>
    </div>
  </form>
</template>

<script setup>
/**
 * #678 — la saisie d'un événement du calendrier (gestion) : type, titre, premier et dernier jour, portée (toute
 * l'école, ou des classes choisies par leur id LOCAL). L'état et la vérification vivent dans useEvenementDuCalendrier.
 */
import { TYPES_D_EVENEMENT } from '@/utils/calendrierDeLAnnee'

defineProps({
  saisie: { type: Object, required: true },
  erreurs: { type: Object, required: true },
  erreur: { type: String, default: '' },
  classes: { type: Array, required: true },
  occupe: { type: Boolean, default: false },
})
const emit = defineEmits(['enregistrer', 'annuler'])
</script>

<style scoped>
.cal-portee {
  display: grid;
  gap: var(--spacing-xs, 0.25rem);
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--text-primary);
}

.cal-classes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: var(--spacing-xs, 0.25rem);
}
</style>
