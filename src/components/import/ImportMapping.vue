<template>
  <section class="import-step">
    <p>
      Associez chaque champ à une colonne de votre fichier. Les correspondances
      évidentes sont préremplies ; vérifiez-les avant de continuer.
    </p>
    <ul v-if="issues.length" class="import-issues" role="alert">
      <li v-for="issue in issues" :key="issue">{{ issue }}</li>
    </ul>
    <table class="import-table">
      <caption class="import-caption">Correspondance des colonnes</caption>
      <thead>
        <tr><th scope="col">Champ LMS</th><th scope="col">Colonne du fichier</th></tr>
      </thead>
      <tbody>
        <tr v-for="field in fields" :key="field.key">
          <td><label :for="`map-${field.key}`">{{ field.label }}</label></td>
          <td>
            <select
              :id="`map-${field.key}`"
              class="import-select"
              :disabled="loading"
              :value="mapping[field.key] || ''"
              @change="onChange(field.key, $event.target.value)"
            >
              <option value="">—</option>
              <option v-for="(header, index) in headers" :key="index" :value="header">
                {{ header }}
              </option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
    <div class="import-actions">
      <button type="button" class="import-button" @click="$emit('back')">Retour</button>
      <button
        type="button"
        class="import-button import-button--primary"
        data-test="preview"
        :disabled="issues.length > 0 || loading"
        @click="$emit('preview')"
      >
        {{ loading ? 'Analyse en cours...' : 'Analyser sans rien écrire' }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { IMPORT_FIELDS } from '@/constants/importFields'

/** Cartographie colonne -> champ (#334). Les règles sont calculées en amont
 *  (utils/importMapping.js) et reçues via `issues` : ce composant présente,
 *  il ne décide pas. */
const props = defineProps({
  headers: { type: Array, required: true },
  mapping: { type: Object, required: true },
  issues: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:mapping', 'back', 'preview'])
const fields = IMPORT_FIELDS

function onChange(key, value) {
  emit('update:mapping', { ...props.mapping, [key]: value })
}
</script>

<style scoped>
/* Seul ce qui n'appartient qu'à l'étape de cartographie. Le chrome partagé
   (tableau, boutons, actions) vit dans TeacherImport.vue via `:deep()`. */

.import-issues {
  align-self: stretch;
  margin: 0;
  padding: 0.75rem 1rem 0.75rem 2rem;
  border: 1px solid var(--warning-border);
  border-radius: 0.5rem;
  background: var(--warning-bg);
  color: var(--warning-text);
}

.import-issues li + li {
  margin-top: 0.25rem;
}

.import-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid var(--input-border);
  border-radius: 0.375rem;
  background: var(--input-bg);
  color: var(--input-text);
  font: inherit;
}

.import-select:focus {
  border-color: var(--input-border-focus);
  outline: 2px solid var(--border-focus);
  outline-offset: 1px;
}

.import-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
