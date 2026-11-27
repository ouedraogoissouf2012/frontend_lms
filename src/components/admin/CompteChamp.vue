<template>
  <div class="compte-champ">
    <label :for="id">{{ etiquette }}</label>
    <select
      v-if="options"
      :id="id"
      :value="modelValue"
      :data-champ="nom"
      :aria-invalid="erreur ? 'true' : 'false'"
      :aria-describedby="decrit"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option v-for="o in options" :key="o.valeur" :value="o.valeur" :disabled="o.desactive">{{ o.libelle }}</option>
    </select>
    <input
      v-else
      :id="id"
      :value="modelValue"
      :data-champ="nom"
      :type="type"
      :maxlength="max"
      :autocomplete="autocomplete"
      :aria-invalid="erreur ? 'true' : 'false'"
      :aria-describedby="decrit"
      @input="$emit('update:modelValue', $event.target.value)"
    >
    <p v-if="aide" :id="`${id}-aide`" class="compte-aide">{{ aide }}</p>
    <!-- Région présente dès le montage, reliée au champ : l'erreur s'y écrit et se lit avec lui. -->
    <p :id="`${id}-erreur`" class="compte-champ-erreur">{{ erreur }}</p>
  </div>
</template>

<script setup>
/**
 * Un champ des formulaires d'acte sur un compte (#656 b) : libellé, saisie, aide et erreur RELIÉES au champ
 * (`aria-describedby`), comme la création (#648). Un `select` quand `options` est donné.
 */
import { computed, useId } from 'vue'

const props = defineProps({
  nom: { type: String, required: true },
  etiquette: { type: String, required: true },
  modelValue: { type: String, default: '' },
  erreur: { type: String, default: '' },
  aide: { type: String, default: '' },
  type: { type: String, default: 'text' },
  max: { type: Number, default: undefined },
  autocomplete: { type: String, default: 'off' },
  /** @type {Array<{ valeur: string, libelle: string, desactive?: boolean }>|null} */
  options: { type: Array, default: null },
})
defineEmits(['update:modelValue'])

// Un id utilisable en sélecteur CSS, quel que soit le préfixe de useId.
const id = `compte-${useId().replace(/[^\w-]/g, '-')}-${props.nom}`
const decrit = computed(() => [props.aide ? `${id}-aide` : null, `${id}-erreur`].filter(Boolean).join(' '))
</script>

<style scoped lang="scss">
@use '../../assets/styles/compte-formulaire';
</style>
