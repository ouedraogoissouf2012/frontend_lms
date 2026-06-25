<template>
  <!-- QCM Simple -->
  <div v-if="question.type === 'qcm'" class="space-y-2">
    <div
      v-for="(option, optIndex) in question.options"
      :key="optIndex"
      :class="[
        'p-3 rounded-lg border-2 transition',
        getOptionClass(question, optIndex, answers, correctionAvailable)
      ]"
    >
      <div class="flex items-center gap-3">
        <div
          :class="[
            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
            getOptionBorderClass(question, optIndex, answers, correctionAvailable)
          ]"
        >
          <div
            v-if="isOptionSelected(question, optIndex, answers) || isOptionCorrect(question, optIndex)"
            :class="[
              'w-3 h-3 rounded-full',
              getOptionDotClass(question, optIndex, correctionAvailable)
            ]"
          ></div>
        </div>
        <span class="flex-1 option-text">{{ option }}</span>
        <template v-if="correctionAvailable">
          <span v-if="isOptionCorrect(question, optIndex)" class="text-green-600 text-sm font-medium">
            fa-check Bonne réponse
          </span>
          <span v-else-if="isOptionSelected(question, optIndex, answers)" class="text-red-600 text-sm font-medium">
            ✗ Votre réponse
          </span>
        </template>
        <template v-else>
          <span v-if="isOptionSelected(question, optIndex, answers)" class="text-blue-600 text-sm font-medium">
            ◆ Votre choix
          </span>
        </template>
      </div>
    </div>
  </div>

  <!-- QCM Multiple -->
  <div v-else-if="question.type === 'qcm_multiple'" class="space-y-2">
    <div
      v-for="(option, optIndex) in question.options"
      :key="optIndex"
      :class="[
        'p-3 rounded-lg border-2 transition',
        getOptionClass(question, optIndex, answers, correctionAvailable)
      ]"
    >
      <div class="flex items-center gap-3">
        <div
          :class="[
            'w-5 h-5 rounded border-2 flex items-center justify-center',
            getOptionBorderClass(question, optIndex, answers, correctionAvailable)
          ]"
        >
          <svg
            v-if="isOptionSelected(question, optIndex, answers) || isOptionCorrect(question, optIndex)"
            :class="[
              'w-4 h-4',
              getOptionCheckClass(question, optIndex, correctionAvailable)
            ]"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
          </svg>
        </div>
        <span class="flex-1 option-text">{{ option }}</span>
        <template v-if="correctionAvailable">
          <span v-if="isOptionCorrect(question, optIndex)" class="text-green-600 text-sm font-medium">
            fa-check Bonne réponse
          </span>
          <span v-else-if="isOptionSelected(question, optIndex, answers)" class="text-red-600 text-sm font-medium">
            ✗ Votre réponse
          </span>
        </template>
        <template v-else>
          <span v-if="isOptionSelected(question, optIndex, answers)" class="text-blue-600 text-sm font-medium">
            ◆ Votre choix
          </span>
        </template>
      </div>
    </div>
  </div>

  <!-- Vrai/Faux -->
  <div v-else-if="question.type === 'vrai_faux'" class="space-y-2">
    <div
      v-for="option in ['Vrai', 'Faux']"
      :key="option"
      :class="[
        'p-3 rounded-lg border-2 transition',
        getVraiFauxClass(question, option, answers, correctionAvailable)
      ]"
    >
      <div class="flex items-center gap-3">
        <div
          :class="[
            'w-5 h-5 rounded-full border-2 flex items-center justify-center',
            getVraiFauxBorderClass(question, option, answers, correctionAvailable)
          ]"
        >
          <div
            v-if="isVraiFauxSelected(question, option, answers) || isVraiFauxCorrect(question, option)"
            :class="[
              'w-3 h-3 rounded-full',
              getVraiFauxDotClass(question, option, correctionAvailable)
            ]"
          ></div>
        </div>
        <span class="flex-1 font-medium option-text">{{ option }}</span>
        <template v-if="correctionAvailable">
          <span v-if="isVraiFauxCorrect(question, option)" class="text-green-600 text-sm font-medium">
            fa-check Bonne réponse
          </span>
          <span v-else-if="isVraiFauxSelected(question, option, answers)" class="text-red-600 text-sm font-medium">
            ✗ Votre réponse
          </span>
        </template>
        <template v-else>
          <span v-if="isVraiFauxSelected(question, option, answers)" class="text-blue-600 text-sm font-medium">
            ◆ Votre choix
          </span>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Options de réponse corrigées (QCM / QCM multiple / Vrai-Faux) de EvaluationResults
 * (H2 ≤300). Section présentationnelle extraite verbatim ; la logique d'exactitude
 * et de classes vit dans utils/evaluationResultAnswers (pure). Reçoit la question,
 * les réponses étudiant et la disponibilité de correction en props.
 */
import {
  isOptionSelected,
  isOptionCorrect,
  getOptionClass,
  getOptionBorderClass,
  getOptionDotClass,
  getOptionCheckClass,
  isVraiFauxSelected,
  isVraiFauxCorrect,
  getVraiFauxClass,
  getVraiFauxBorderClass,
  getVraiFauxDotClass
} from '@/utils/evaluationResultAnswers'

defineProps({
  question: { type: Object, required: true },
  answers: { type: Object, default: () => ({}) },
  correctionAvailable: { type: Boolean, default: false }
})
</script>

<style scoped>
/* Classes personnalisées pour les options - période d'attente (pas de correction) */
.option-selected-waiting {
  background-color: var(--bg-tertiary) !important;
  border: 2px solid #60a5fa !important;
  border-radius: 0.5rem;
}

.option-not-selected-waiting {
  background-color: var(--bg-secondary) !important;
  border: 2px solid var(--border-primary) !important;
  border-radius: 0.5rem;
}

/* Classes personnalisées pour les options - avec correction */
.option-correct {
  background-color: rgba(34, 197, 94, 0.15) !important;
  border: 2px solid #22c55e !important;
  border-radius: 0.5rem;
}

.option-incorrect {
  background-color: rgba(239, 68, 68, 0.15) !important;
  border: 2px solid #ef4444 !important;
  border-radius: 0.5rem;
}

.option-neutral {
  background-color: var(--bg-secondary) !important;
  border: 2px solid var(--border-primary) !important;
  border-radius: 0.5rem;
}

/* Assurer que le texte des options est toujours visible */
.option-text {
  color: var(--text-primary) !important;
  font-size: 0.95rem;
  line-height: 1.5;
  font-weight: 500;
}

/* Texte dans option sélectionnée (attente) */
.option-selected-waiting .option-text {
  color: #60a5fa !important;
}

/* Texte dans option non sélectionnée */
.option-not-selected-waiting .option-text {
  color: var(--text-secondary) !important;
}

/* Texte dans bonnes réponses */
.option-correct .option-text {
  color: #22c55e !important;
}

/* Texte dans mauvaises réponses */
.option-incorrect .option-text {
  color: #ef4444 !important;
}

/* Texte dans options neutres */
.option-neutral .option-text {
  color: var(--text-secondary) !important;
}
</style>
