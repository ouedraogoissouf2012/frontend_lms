<template>
  <dl class="statistiques">
    <div class="statistique">
      <dt>Élèves</dt>
      <dd>{{ statistiques.effectif }}</dd>
    </div>
    <div class="statistique">
      <dt>Classés</dt>
      <dd>{{ statistiques.classes }}</dd>
    </div>
    <div class="statistique">
      <dt>Moyenne de la classe</dt>
      <dd>{{ afficherNote(statistiques.moyenne_classe) }}</dd>
    </div>
    <div class="statistique">
      <dt>Réussite (≥ {{ seuil }}/20)</dt>
      <dd>{{ pourcentage(statistiques.taux_reussite) }}</dd>
    </div>
  </dl>
</template>

<script setup>
/**
 * #683 : les statistiques d'une classe. Une mesure absente (personne n'est classé) s'affiche
 * « — », jamais 0 : la règle des agrégats sans mesure.
 */
import { afficherNote } from '@/utils/studentGrades'

defineProps({
  statistiques: { type: Object, required: true },
  seuil: { type: Number, required: true },
})

function pourcentage(valeur) {
  return typeof valeur === 'number' ? `${valeur.toLocaleString('fr-FR')} %` : '—'
}
</script>

<style scoped>
.statistiques {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.75rem;
  margin: 0;
}

.statistique {
  padding: 1rem;
  border: 1px solid var(--card-border);
  border-radius: 0.75rem;
  background: var(--card-bg);
}

.statistique dt {
  color: var(--text-secondary);
  font-size: 0.875rem;
}

.statistique dd {
  margin: 0.25rem 0 0;
  color: var(--text-primary);
  font-size: 1.5rem;
  font-weight: 600;
}
</style>
