<template>
  <div>
    <h2 class="text-xl font-semibold text-gray-900 mb-4">Informations générales</h2>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <!-- Matière -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Matière *
        </label>
        <select
          v-model="evaluation.klassci_matiere_id"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Sélectionner une matière</option>
          <option
            v-for="matiere in matieres"
            :key="matiere.id"
            :value="matiere.id"
          >
            {{ matiere.name || matiere.nom }}
          </option>
        </select>
      </div>

      <!-- Classe -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Classe *
        </label>
        <select
          v-model="evaluation.klassci_classe_id"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        >
          <option value="">Sélectionner une classe</option>
          <option
            v-for="classe in classes"
            :key="classe.id"
            :value="classe.id"
          >
            {{ classe.name || classe.libelle }}
          </option>
        </select>
      </div>

      <!-- Titre -->
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Titre de l'évaluation *
        </label>
        <input
          v-model="evaluation.titre"
          type="text"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Ex: Évaluation Chapitre 1 - Les bases"
          required
        />
      </div>

      <!-- Description -->
      <div class="md:col-span-2">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          v-model="evaluation.description"
          rows="3"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Description de l'évaluation..."
        ></textarea>
      </div>

      <!-- Date -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Date de l'évaluation
        </label>
        <input
          v-model="evaluation.date_evaluation"
          type="datetime-local"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Durée -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Durée (minutes) *
        </label>
        <input
          v-model.number="evaluation.duree_minutes"
          type="number"
          min="1"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <!-- Coefficient -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Coefficient
        </label>
        <input
          v-model.number="evaluation.coefficient"
          type="number"
          step="0.01"
          min="0"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <!-- Barème -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Barème
        </label>
        <input
          v-model.number="evaluation.bareme"
          type="number"
          step="0.01"
          min="0"
          class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
    </div>

    <!-- Options -->
    <div class="mt-4 space-y-2">
      <label class="flex items-center gap-2">
        <input
          v-model="evaluation.shuffle_questions"
          type="checkbox"
          class="rounded text-blue-600 focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700">Mélanger les questions</span>
      </label>
      <label class="flex items-center gap-2">
        <input
          v-model="evaluation.show_results"
          type="checkbox"
          class="rounded text-blue-600 focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700">Afficher les résultats immédiatement</span>
      </label>
      <label class="flex items-center gap-2">
        <input
          v-model="evaluation.allow_retake"
          type="checkbox"
          class="rounded text-blue-600 focus:ring-blue-500"
        />
        <span class="text-sm text-gray-700">Autoriser plusieurs tentatives</span>
      </label>
    </div>
  </div>
</template>

<script setup>
/**
 * Section « Informations générales » du formulaire de création d'évaluation
 * (H1). Présentation pure : lie le formulaire au modèle réactif `evaluation`
 * partagé (même référence d'objet) et liste matières/classes. CSS = Tailwind
 * inline, identique à l'original.
 */
defineProps({
  evaluation: { type: Object, required: true },
  matieres: { type: Array, default: () => [] },
  classes: { type: Array, default: () => [] }
})
</script>
