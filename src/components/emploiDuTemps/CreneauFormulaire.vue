<template>
  <section class="edt-carte" aria-labelledby="creneau-titre" data-creneau>
    <h3 id="creneau-titre">{{ creneau.cle ? 'Modifier le créneau' : 'Nouveau créneau' }} — {{ JOURS[creneau.jour] }}</h3>
    <fieldset class="creneau-nature">
      <legend>Nature</legend>
      <label><input v-model="creneau.nature" type="radio" value="cours" data-champ="nature-cours"> Cours</label>
      <label><input v-model="creneau.nature" type="radio" value="pause" data-champ="nature-pause"> Pause</label>
    </fieldset>
    <div class="edt-champs">
      <template v-if="creneau.nature === 'cours'">
        <div class="edt-champ">
          <label for="creneau-matiere">Matière du programme</label>
          <select id="creneau-matiere" v-model="creneau.matiere" data-champ="matiere" aria-describedby="creneau-matiere-erreur" :aria-invalid="erreurs.matiere ? 'true' : 'false'">
            <option value="" disabled>Choisir une matière</option>
            <option v-for="m in matieres" :key="m.id" :value="String(m.id)">{{ m.nom }}</option>
          </select>
          <p id="creneau-matiere-erreur" class="edt-champ-erreur">{{ erreurs.matiere }}</p>
        </div>
        <div class="edt-champ">
          <label for="creneau-enseignant">Enseignant</label>
          <select id="creneau-enseignant" v-model="creneau.enseignant" data-champ="enseignant">
            <option value="">Celui du programme</option>
            <option v-for="e in enseignants" :key="e.id" :value="String(e.id)">{{ e.nom }}</option>
          </select>
        </div>
        <div class="edt-champ">
          <label for="creneau-type">Type de séance</label>
          <select id="creneau-type" v-model="creneau.type" data-champ="type">
            <option value="">Non précisé</option>
            <option v-for="(libelle, cle) in TYPES_DE_SEANCE" :key="cle" :value="cle">{{ libelle }}</option>
          </select>
        </div>
      </template>
      <div v-else class="edt-champ">
        <label for="creneau-libelle">Nom de la pause</label>
        <input id="creneau-libelle" v-model="creneau.libelle" data-champ="libelle" maxlength="100" aria-describedby="creneau-libelle-erreur" :aria-invalid="erreurs.libelle ? 'true' : 'false'">
        <p id="creneau-libelle-erreur" class="edt-champ-erreur">{{ erreurs.libelle }}</p>
      </div>
      <div class="edt-champ">
        <label for="creneau-debut">Début</label>
        <input id="creneau-debut" v-model="creneau.debut" type="time" data-champ="debut" aria-describedby="creneau-horaire-erreur">
      </div>
      <div class="edt-champ">
        <label for="creneau-fin">Fin</label>
        <input id="creneau-fin" v-model="creneau.fin" type="time" data-champ="fin" aria-describedby="creneau-horaire-erreur">
      </div>
    </div>
    <p id="creneau-horaire-erreur" class="edt-champ-erreur">{{ erreurs.horaire }}</p>
    <div class="edt-actions">
      <button type="button" class="edt-btn edt-btn--principal" data-action="valider-ligne" @click="emit('valider')">Garder ce créneau</button>
      <button v-if="creneau.cle" type="button" class="edt-btn" data-action="retirer-ligne" @click="emit('retirer')">Retirer ce créneau</button>
      <button type="button" class="edt-btn" data-action="annuler-ligne" @click="emit('annuler')">Annuler</button>
    </div>
    <p class="edt-aide">Les créneaux gardés partent au serveur avec « Enregistrer la grille ».</p>
  </section>
</template>

<script setup>
/**
 * #676 — la saisie d'un créneau : un cours (matière du programme ; enseignant « celui du programme » par défaut ;
 * type) ou une pause nommée ; début et fin. L'état et la vérification vivent dans useCreneau : ce composant affiche
 * et émet.
 */
import { JOURS, TYPES_DE_SEANCE } from '@/utils/emploiDuTemps'

defineProps({
  creneau: { type: Object, required: true },
  erreurs: { type: Object, required: true },
  matieres: { type: Array, required: true },
  enseignants: { type: Array, required: true },
})
const emit = defineEmits(['valider', 'retirer', 'annuler'])
</script>

<style scoped>
.creneau-nature {
  display: flex;
  gap: var(--spacing-md);
  margin: 0;
  padding: 0;
  border: 0;
  color: var(--text-primary);
}
</style>
