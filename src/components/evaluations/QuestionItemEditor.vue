<template>
  <div class="border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
    <div class="flex justify-between items-start mb-4">
      <h3 class="font-medium text-gray-900 dark:text-white">Question {{ index + 1 }}</h3>
      <button
        @click="$emit('remove')"
        type="button"
        class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>

    <!-- Énoncé -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Énoncé de la question *
      </label>
      <textarea
        v-model="question.question"
        rows="2"
        class="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
        placeholder="Écrivez votre question..."
        required
      ></textarea>
    </div>

    <!-- Type de question -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Type de question
      </label>
      <select
        v-model="question.type"
        class="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="qcm">QCM (Choix unique)</option>
        <option value="qcm_multiple">QCM (Choix multiples)</option>
        <option value="vrai_faux">Vrai/Faux</option>
        <option value="reponse_courte">Réponse courte</option>
      </select>
    </div>

    <!-- Points -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Points
      </label>
      <input
        v-model.number="question.points"
        type="number"
        step="0.5"
        min="0"
        class="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
      />
    </div>

    <!-- Options pour QCM -->
    <div v-if="question.type === 'qcm' || question.type === 'qcm_multiple' || question.type === 'vrai_faux'">
      <div class="mb-3">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Options de réponse
        </label>
        <p class="text-xs text-blue-600 dark:text-blue-400 font-medium">
          <span v-if="question.type === 'qcm'">
            ⓘ Cochez UNE seule bonne réponse (choix unique)
          </span>
          <span v-else-if="question.type === 'qcm_multiple'">
            ⓘ Cochez TOUTES les bonnes réponses (choix multiples)
          </span>
          <span v-else>
            ⓘ Cochez la bonne réponse (Vrai ou Faux)
          </span>
        </p>
      </div>
      <div class="space-y-3">
        <div
          v-for="(option, optIndex) in question.options"
          :key="optIndex"
          :class="[
            'flex items-center gap-3 p-3 rounded-lg border-2 transition-all',
            (question.type === 'qcm' && question.correct_answers && question.correct_answers[0] === option) ||
            (question.type === 'qcm_multiple' && question.correct_answers && question.correct_answers.includes(option))
              ? 'bg-green-50 dark:bg-green-900/30 border-green-500 dark:border-green-600'
              : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
          ]"
        >
          <!-- Radio/Checkbox pour marquer la bonne réponse -->
          <div class="flex items-center">
            <input
              v-if="question.type === 'qcm'"
              type="radio"
              :name="'correct-' + index"
              :checked="question.correct_answers && question.correct_answers[0] === option"
              @change="$emit('set-correct', option)"
              class="w-5 h-5 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500"
              :title="'Marquer comme bonne réponse'"
            />
            <input
              v-else-if="question.type === 'qcm_multiple'"
              type="checkbox"
              :checked="question.correct_answers && question.correct_answers.includes(option)"
              @change="$emit('toggle-correct', option)"
              class="w-5 h-5 rounded bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-green-600 focus:ring-green-500"
              :title="'Marquer comme bonne réponse'"
            />
          </div>

          <!-- Icône de validation si c'est la bonne réponse -->
          <div class="flex-shrink-0">
            <svg
              v-if="(question.type === 'qcm' && question.correct_answers && question.correct_answers[0] === option) ||
                    (question.type === 'qcm_multiple' && question.correct_answers && question.correct_answers.includes(option))"
              class="w-6 h-6 text-green-600 dark:text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span v-else class="w-6 h-6 flex items-center justify-center text-gray-500 dark:text-gray-400 font-bold">
              {{ String.fromCharCode(65 + optIndex) }}
            </span>
          </div>

          <!-- Champ de texte pour l'option -->
          <input
            v-model="question.options[optIndex]"
            type="text"
            class="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
            :placeholder="'Option ' + String.fromCharCode(65 + optIndex)"
          />

          <!-- Bouton supprimer -->
          <button
            v-if="question.options.length > 2"
            @click="$emit('remove-option', optIndex)"
            type="button"
            class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0 transition-colors"
            title="Supprimer cette option"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      </div>
      <button
        @click="$emit('add-option')"
        type="button"
        class="mt-3 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium flex items-center gap-1 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
        </svg>
        Ajouter une option
      </button>
    </div>

    <!-- Réponses courtes -->
    <div v-else-if="question.type === 'reponse_courte'">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Réponse(s) acceptée(s)
      </label>
      <input
        v-model="question.correct_answers_text"
        type="text"
        class="w-full px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-gray-400"
        placeholder="Séparez les réponses par des virgules"
      />
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Ex: Paris, paris, PARIS (la casse est ignorée)
      </p>
    </div>
  </div>
</template>

<script setup>
/**
 * Éditeur d'UNE question QCM riche (H1, CreateQuestions) : surlignage de la bonne
 * réponse, icône de validation, repères A/B/C. Présentation pure liée au modèle
 * `question` partagé ; émet les actions structurelles relayées avec l'index par
 * la liste. CSS = Tailwind inline (dark mode), identique à l'original.
 */
defineProps({
  question: { type: Object, required: true },
  index: { type: Number, required: true }
})

defineEmits(['remove', 'add-option', 'remove-option', 'set-correct', 'toggle-correct'])
</script>
