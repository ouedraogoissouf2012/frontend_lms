<template>
  <div class="border border-gray-200 rounded-lg p-4">
    <div class="flex justify-between items-start mb-4">
      <h3 class="font-medium text-gray-900">Question {{ index + 1 }}</h3>
      <button
        @click="$emit('remove')"
        type="button"
        class="text-red-600 hover:text-red-700"
      >
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
        </svg>
      </button>
    </div>

    <!-- Énoncé -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Énoncé de la question *
      </label>
      <textarea
        v-model="question.question"
        rows="2"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Écrivez votre question..."
        required
      ></textarea>
    </div>

    <!-- Type de question -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Type de question
      </label>
      <select
        v-model="question.type"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        <option value="qcm">QCM (Choix unique)</option>
        <option value="qcm_multiple">QCM (Choix multiples)</option>
        <option value="vrai_faux">Vrai/Faux</option>
        <option value="reponse_courte">Réponse courte</option>
      </select>
    </div>

    <!-- Points -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Points
      </label>
      <input
        v-model.number="question.points"
        type="number"
        step="0.01"
        min="0"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
    </div>

    <!-- Options pour QCM -->
    <div v-if="question.type === 'qcm' || question.type === 'qcm_multiple' || question.type === 'vrai_faux'">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Options de réponse
      </label>
      <div class="space-y-2">
        <div
          v-for="(option, optIndex) in question.options"
          :key="optIndex"
          class="flex items-center gap-2"
        >
          <input
            v-if="question.type === 'qcm'"
            type="radio"
            :name="'correct-' + index"
            :checked="question.correct_answers && question.correct_answers[0] === option"
            @change="$emit('set-correct', option)"
            class="text-blue-600 focus:ring-blue-500"
          />
          <input
            v-else-if="question.type === 'qcm_multiple'"
            type="checkbox"
            :checked="question.correct_answers && question.correct_answers.includes(option)"
            @change="$emit('toggle-correct', option)"
            class="rounded text-blue-600 focus:ring-blue-500"
          />
          <input
            v-model="question.options[optIndex]"
            type="text"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            :placeholder="'Option ' + (optIndex + 1)"
          />
          <button
            v-if="question.options.length > 2"
            @click="$emit('remove-option', optIndex)"
            type="button"
            class="text-red-600 hover:text-red-700"
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
        class="mt-2 text-blue-600 hover:text-blue-700 text-sm"
      >
        + Ajouter une option
      </button>
    </div>

    <!-- Réponses courtes -->
    <div v-else-if="question.type === 'reponse_courte'">
      <label class="block text-sm font-medium text-gray-700 mb-2">
        Réponse(s) acceptée(s)
      </label>
      <input
        v-model="question.correct_answers_text"
        type="text"
        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        placeholder="Séparez les réponses par des virgules"
      />
      <p class="text-xs text-gray-500 mt-1">
        Ex: Paris, paris, PARIS (la casse est ignorée)
      </p>
    </div>
  </div>
</template>

<script setup>
/**
 * Éditeur d'UNE question (H1). Présentation pure : lie les champs au modèle
 * `question` partagé (même référence) ; émet les actions structurelles
 * (remove, add/remove option, set/toggle correct) que la liste relaie au
 * composable avec l'index. CSS = Tailwind inline, identique à l'original.
 */
defineProps({
  question: { type: Object, required: true },
  index: { type: Number, required: true }
})

defineEmits(['remove', 'add-option', 'remove-option', 'set-correct', 'toggle-correct'])
</script>
