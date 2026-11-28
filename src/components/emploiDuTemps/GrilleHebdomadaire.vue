<template>
  <div class="grille" role="list" aria-label="La semaine type">
    <section v-for="jour in jours" :key="jour" class="grille-jour" role="listitem" :data-jour="jour" :aria-labelledby="`grille-jour-${jour}`">
      <h3 :id="`grille-jour-${jour}`">{{ JOURS[jour] }}</h3>
      <button
        v-for="l in lignesDuJour(lignes, jour)"
        :key="l.cle"
        type="button"
        class="grille-creneau"
        :class="{ 'grille-creneau--pause': l.matiereId == null }"
        data-ligne
        @click="emit('editer', l)"
      >
        <span class="grille-heure">{{ l.debut }}–{{ l.fin }}</span>
        <template v-if="l.matiereId != null">
          <strong>{{ nomMatiere(l.matiereId) }}</strong>
          <span>{{ nomEnseignant(l.enseignantId) }}</span>
          <span v-if="l.typeSeance">{{ TYPES_DE_SEANCE[l.typeSeance] ?? l.typeSeance }}</span>
        </template>
        <strong v-else>{{ l.libelle }}</strong>
      </button>
      <button type="button" class="edt-btn grille-ajouter" :data-ajouter="jour" @click="emit('ajouter', jour)">
        Ajouter un créneau <span class="sr-only">le {{ JOURS[jour].toLowerCase() }}</span>
      </button>
    </section>
  </div>
</template>

<script setup>
/**
 * #676 — la semaine type, un jour par colonne (du lundi au samedi ; le dimanche s'il porte une ligne). Chaque créneau
 * se clique pour être modifié ; « Ajouter un créneau » ouvre la saisie sur son jour. Sur téléphone, les jours
 * s'empilent. Aucune donnée n'est lue ici : le parent fournit les lignes et les noms.
 */
import { JOURS, TYPES_DE_SEANCE, lignesDuJour } from '@/utils/emploiDuTemps'

defineProps({
  lignes: { type: Array, required: true },
  jours: { type: Array, required: true },
  nomMatiere: { type: Function, required: true },
  nomEnseignant: { type: Function, required: true },
})
const emit = defineEmits(['editer', 'ajouter'])
</script>

<style scoped>
.grille {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: var(--spacing-sm);
}

.grille-jour {
  display: grid;
  align-content: start;
  gap: var(--spacing-xs, 0.25rem);
  padding: var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
}

.grille-jour h3 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-primary);
}

.grille-creneau {
  display: grid;
  gap: 0.125rem;
  text-align: left;
  padding: var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--card-bg);
  color: var(--text-primary);
  cursor: pointer;
}

.grille-creneau--pause {
  border-style: dashed;
  color: var(--text-secondary);
}

.grille-heure {
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
</style>
