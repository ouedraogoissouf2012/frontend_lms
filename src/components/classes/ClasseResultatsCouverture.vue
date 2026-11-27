<template>
  <section class="couverture" aria-labelledby="couverture-titre">
    <h3 id="couverture-titre" class="couverture-titre">Couverture des notes</h3>
    <p v-if="!sansEvaluation.length && !sansNote.length" class="couverture-vide">
      Toutes les matières sont évaluées, et chaque évaluation a au moins une note.
    </p>
    <template v-else>
      <div v-if="sansEvaluation.length">
        <p>Matières au programme sans évaluation :</p>
        <ul>
          <li v-for="matiere in sansEvaluation" :key="matiere.matiere_id">{{ matiere.libelle ?? 'Matière' }}</li>
        </ul>
      </div>
      <div v-if="sansNote.length">
        <p>Évaluations sans aucune note :</p>
        <ul>
          <li v-for="evaluation in sansNote" :key="evaluation.id">
            <router-link v-if="evaluation.route" :to="evaluation.route">{{ evaluation.titre }}</router-link>
            <span v-else>{{ evaluation.titre }}</span>
          </li>
        </ul>
      </div>
    </template>
  </section>
</template>

<script setup>
/**
 * #683 : la couverture des notes d'une classe. Une évaluation sans note mène à sa fiche, par la
 * route de la fiche de classe (`routeEvaluationDeClasse`) : la prévisualisation pour l'enseignant,
 * le détail pour le coordinateur et l'admin.
 */
import { computed } from 'vue'
import { auth } from '@/services/api'
import { routeEvaluationDeClasse } from '@/utils/classeDetails'

const props = defineProps({
  couverture: { type: Object, required: true },
  evaluations: { type: Array, required: true },
})

const sansEvaluation = computed(() => props.couverture.matieres_sans_evaluation ?? [])

const sansNote = computed(() => {
  const role = auth.getUser()?.role
  return (props.couverture.evaluations_sans_note ?? []).map((id) => {
    const evaluation = props.evaluations.find((e) => e.id === id)
    const action = routeEvaluationDeClasse({ has_online: true, online_version: { id } }, role)
    return { id, titre: evaluation?.titre ?? `Évaluation ${id}`, route: action.route ?? null }
  })
})
</script>

<style scoped>
.couverture {
  padding: 1rem 1.25rem;
  border: 1px solid var(--card-border);
  border-radius: 0.75rem;
  background: var(--card-bg);
  color: var(--text-primary);
}

.couverture-titre {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  font-weight: 600;
}

.couverture-vide,
.couverture p {
  margin: 0.25rem 0;
  color: var(--text-secondary);
}

.couverture ul {
  margin: 0.25rem 0 0.75rem 1.25rem;
  list-style: disc;
}

.couverture a {
  color: var(--primary-color);
  text-decoration: underline;
}
</style>
