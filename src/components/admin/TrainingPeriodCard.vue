<template>
  <!-- tabindex -1 : focalisable par script quand plus aucun bouton n'est permis (revue #441, A3). -->
  <article class="card period-card" tabindex="-1">
    <h2>{{ periode.libelle }}</h2>
    <!-- #658 : la période en cours de l'école (une seule, publiée), dite en TEXTE, pas par une couleur. -->
    <p v-if="periode.en_cours === true" class="period-en-cours">Période en cours</p>
    <p>{{ libelleStatut(periode.status) }} · {{ libellePhase(periode.phase) }}</p>
    <!-- #606 : où en est la session, et ce qu'on peut en faire (le graphe des transitions). -->
    <p v-if="cycle" class="period-cycle">{{ cycle }}</p>
    <!-- #606 : la formation par son titre (TrainingSessionView.program), jamais par un numéro. -->
    <p class="period-programme">Formation : {{ periode.program?.titre || '—' }}</p>
    <p v-if="periode.starts_on || periode.ends_on">{{ periode.starts_on || '—' }} → {{ periode.ends_on || '—' }}</p>

    <div v-if="actions.length" class="period-actions">
      <span v-for="action in actions" :key="action" class="period-action">
        <button
          type="button"
          class="transition-btn"
          :class="{ 'is-irreversible': IRREVERSIBLES.includes(action) }"
          :disabled="busy || !!raisonBlocage(periode, action)"
          @click="$emit('transition', action)"
        >{{ LIBELLES_TRANSITION[action] }}</button>
        <small v-if="raisonBlocage(periode, action)" class="period-blocage">{{ raisonBlocage(periode, action) }}</small>
      </span>
    </div>

    <!-- #658 : modifier (brouillon ou publiée), supprimer un brouillon, désigner la période en cours. -->
    <PeriodeModification v-if="MODIFIABLES.includes(periode.status)" :periode="periode" @modifiee="$emit('modifiee', $event)" />
    <div v-if="periode.status === 'brouillon' || peutDevenirEnCours" class="period-actions">
      <button v-if="peutDevenirEnCours" type="button" class="transition-btn" :disabled="busy" @click="$emit('en-cours')">
        Définir comme période en cours
      </button>
      <button v-if="periode.status === 'brouillon'" type="button" class="transition-btn is-irreversible" :disabled="busy" @click="$emit('supprimer')">
        Supprimer le brouillon
      </button>
    </div>
  </article>
</template>

<script setup>
/**
 * Une période de formation et ses seules transitions possibles (#391). Présentation
 * pure : reçoit la période, émet `transition` avec l'action. La table vient de
 * `constants/trainingSessionTransitions` (copie de l'ADR-845-01, dette nommée) ; le
 * serveur reste l'autorité. « Publier » sans date de début est désactivé avec sa
 * raison, si bien que le 422 du serveur n'est pas atteignable depuis l'écran.
 * #658 : la carte porte aussi la modification (PeriodeModification), la suppression d'un brouillon et
 * la désignation de la période en cours ; elle émet `modifiee`, `supprimer` et `en-cours`.
 */
import { computed } from 'vue'
import PeriodeModification from '@/components/admin/PeriodeModification.vue'
import { descriptionStatut, libellePhase, libelleStatut } from '@/composables/useAdminTrainingSessions'
import { MODIFIABLES } from '@/composables/useModificationDePeriode'
import {
  IRREVERSIBLES,
  LIBELLES_TRANSITION,
  raisonBlocage,
  transitionsPermises,
} from '@/constants/trainingSessionTransitions'

const props = defineProps({
  periode: { type: Object, required: true },
  // Une transition de cette période est en cours : aucun double envoi.
  busy: { type: Boolean, default: false },
})

defineEmits(['transition', 'modifiee', 'supprimer', 'en-cours'])

const actions = computed(() => transitionsPermises(props.periode))
const cycle = computed(() => descriptionStatut(props.periode.status))
// #658 : seule une période PUBLIÉE devient la période en cours ; celle qui l'est déjà n'offre plus le geste.
const peutDevenirEnCours = computed(() => props.periode.status === 'publiee' && props.periode.en_cours !== true)
</script>

<style scoped>
.period-card {
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.period-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-md);
  margin-top: var(--spacing-md);
}

.period-action {
  display: inline-flex;
  flex-direction: column;
  gap: var(--spacing-xs, 0.25rem);
}

.transition-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.transition-btn.is-irreversible {
  border-color: var(--color-danger, var(--border-primary));
}

.transition-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.period-blocage,
.period-cycle {
  color: var(--text-secondary);
}

.period-en-cours {
  display: inline-block;
  margin: 0 0 var(--spacing-sm);
  padding: var(--spacing-xs, 0.25rem) var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-weight: 600;
}
</style>
