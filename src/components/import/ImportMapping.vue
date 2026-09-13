<template>
  <section class="import-step">
    <p>
      Associez chaque colonne. Une correspondance exacte (même nom) est préremplie ;
      vous devez confirmer. L'email n'est pas obligatoire.
    </p>
    <table>
      <thead>
        <tr><th>Champ LMS</th><th>Colonne du fichier</th></tr>
      </thead>
      <tbody>
        <tr v-for="field in fields" :key="field.key">
          <td>{{ field.label }}</td>
          <td>
            <select
              :value="mapping[field.key] || ''"
              @change="onChange(field.key, $event.target.value)"
            >
              <option value="">—</option>
              <option v-for="header in headers" :key="header" :value="header">{{ header }}</option>
            </select>
          </td>
        </tr>
      </tbody>
    </table>
    <button type="button" @click="$emit('back')">Retour</button>
    <button type="button" :disabled="!ready || loading" @click="$emit('preview')">
      {{ loading ? 'Analyse...' : 'Analyser sans écrire' }}
    </button>
  </section>
</template>

<script setup>
import { IMPORT_FIELDS } from '@/constants/importFields'

const props = defineProps({
  headers: { type: Array, required: true },
  mapping: { type: Object, required: true },
  ready: { type: Boolean, required: true },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:mapping', 'back', 'preview'])
const fields = IMPORT_FIELDS

function onChange(key, value) {
  emit('update:mapping', { ...props.mapping, [key]: value })
}
</script>
