<template>
  <section class="copies-panel">
    <h2 class="copies-title">Copies</h2>

    <p v-if="copies.length === 0" class="copies-vide">Aucune copie remise pour le moment.</p>

    <table v-else class="copies-table">
      <thead>
        <tr><th>Élève</th><th>Tentative</th><th>Statut</th><th>Score</th><th></th></tr>
      </thead>
      <tbody>
        <tr v-for="c in copies" :key="c.id">
          <td>{{ c.nom }}</td>
          <td>{{ c.attempt ?? '—' }}</td>
          <td>
            <span class="status-badge" :class="getStatusClass(c.status)">{{ getStatusLabel(c.status) }}</span>
            <span v-if="aCorriger(c, evaluation)" class="a-corriger">À corriger</span>
          </td>
          <td>{{ c.score ?? '—' }}</td>
          <td>
            <button
              v-if="autorise && copieNotable(c) && dissertations.length > 0"
              type="button"
              class="btn-noter"
              data-test="noter"
              @click="ouvrir(c)"
            >
              Noter
            </button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Panneau de notation : les réponses de la copie, des points par dissertation. -->
    <form v-if="copie" class="notation" @submit.prevent="noter">
      <h3 class="notation-title">Copie de {{ copie.nom }}</h3>
      <div v-for="q in evaluation.questions" :key="q.id" class="notation-question">
        <p class="question-texte">{{ q.question }} <span class="question-points">({{ q.points }} pts)</span></p>
        <p class="question-reponse">{{ reponse(q) }}</p>
        <label v-if="q.type === 'dissertation'" class="points-label">
          Points
          <input
            v-model="points[q.id]"
            type="number"
            :name="`points-${q.id}`"
            min="0"
            :max="q.points"
            step="0.25"
            class="points-input"
          />
        </label>
        <p v-if="erreurs[q.id]" class="champ-erreur">{{ erreurs[q.id] }}</p>
      </div>
      <label class="feedback-label">
        Commentaire (facultatif)
        <textarea v-model="feedback" maxlength="1000" rows="3" class="feedback-input"></textarea>
      </label>
      <p v-if="erreur" role="alert" class="notation-erreur">{{ erreur }}</p>
      <div class="notation-actions">
        <button type="submit" class="btn-enregistrer" :disabled="envoi">Enregistrer la note</button>
        <button v-if="canRetry" type="button" class="btn-reessayer" @click="noter">Réessayer</button>
        <button type="button" class="btn-annuler" @click="fermer">Annuler</button>
      </div>
    </form>
  </section>
</template>

<script setup>
/**
 * Lot CORR : les copies d'une évaluation et leur notation, sur l'écran « Notes et résultats ». La
 * donnée vient de l'évaluation enrichie (results-by-class) ; la règle du bouton est celle du serveur
 * (utils/correctionCopies) ; l'envoi et les refus vivent dans useNotationCopie. Émet `notee`.
 */
import { computed, toRef } from 'vue'
import { useNotationCopie } from '@/composables/useNotationCopie'
import { copiesDeLEvaluation, aCorriger, peutNoter, copieNotable } from '@/utils/correctionCopies'
import { getStatusClass, getStatusLabel } from '@/utils/evaluationCorrectionsFormat'

const props = defineProps({
  evaluation: { type: Object, required: true },
  resultats: { type: Array, default: () => [] },
  user: { type: Object, default: null },
})
const emit = defineEmits(['notee'])

const copies = computed(() => copiesDeLEvaluation(props.evaluation, props.resultats))
const autorise = computed(() => peutNoter(props.user, props.evaluation))
const { copie, points, feedback, erreurs, erreur, canRetry, envoi, dissertations, ouvrir, fermer, noter } =
  useNotationCopie({ evaluation: toRef(props, 'evaluation'), onNotee: () => emit('notee') })

function reponse(question) {
  const valeur = copie.value?.answers?.[question.id]
  if (Array.isArray(valeur)) return valeur.length > 0 ? valeur.join(', ') : 'Aucune réponse'
  return valeur === undefined || valeur === null || valeur === '' ? 'Aucune réponse' : String(valeur)
}
</script>

<style scoped>
.copies-panel { margin-top: 2rem; background: var(--card-bg); border: 1px solid var(--border-primary); border-radius: 0.75rem; padding: 1.5rem; }
.copies-title { font-size: 1.125rem; font-weight: 600; color: var(--text-primary); margin-bottom: 1rem; }
.copies-vide { color: var(--text-secondary); }
.copies-table { width: 100%; border-collapse: collapse; }
.copies-table th, .copies-table td { padding: 0.5rem; text-align: left; border-bottom: 1px solid var(--border-primary); }
.a-corriger { margin-left: 0.5rem; font-size: 0.75rem; font-weight: 600; color: var(--warning-text); }
.btn-noter, .btn-enregistrer, .btn-reessayer, .btn-annuler { padding: 0.375rem 0.875rem; border-radius: 0.5rem; font-weight: 500; }
.btn-noter, .btn-enregistrer { background: var(--primary-color); color: white; }
.btn-annuler, .btn-reessayer { background: var(--bg-secondary); color: var(--text-primary); }
.notation { margin-top: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
.notation-title { font-weight: 600; color: var(--text-primary); }
.question-texte { font-weight: 500; color: var(--text-primary); }
.question-points { color: var(--text-secondary); font-weight: 400; }
.question-reponse { white-space: pre-wrap; color: var(--text-secondary); padding: 0.5rem; background: var(--bg-secondary); border-radius: 0.5rem; }
.points-input, .feedback-input { display: block; margin-top: 0.25rem; padding: 0.375rem 0.5rem; border: 1px solid var(--border-primary); border-radius: 0.375rem; background: var(--input-bg); color: var(--text-primary); }
.feedback-input { width: 100%; }
.champ-erreur, .notation-erreur { color: var(--error-text); font-size: 0.875rem; }
.notation-actions { display: flex; gap: 0.5rem; }
</style>
