<template>
  <InstitutionFormModal
    :show-form="showForm"
    :form="form"
    :editing="editing"
    :form-errors="formErrors"
    :saving="saving"
    @close="$emit('close')"
    @save="$emit('save')"
  />
  <ConnectionResultModal
    :connection-result="connectionResult"
    @close="$emit('close-result')"
  />
</template>

<script setup>
/**
 * Modales d'AdminInstitutions (#G1 décompo) : wrapper mince relayant vers
 * InstitutionFormModal (formulaire create/edit — form passé en prop, édité par
 * référence partagée) et ConnectionResultModal (résultat de test de connexion
 * KLASSCI). API (props/events) inchangée → AdminInstitutions.vue non modifié.
 */
import InstitutionFormModal from './InstitutionFormModal.vue'
import ConnectionResultModal from './ConnectionResultModal.vue'

defineProps({
  showForm: { type: Boolean, default: false },
  form: { type: Object, required: true },
  editing: { type: Boolean, default: false },
  formErrors: { type: Object, default: null },
  saving: { type: Boolean, default: false },
  connectionResult: { type: Object, default: null }
})
defineEmits(['close', 'save', 'close-result'])
</script>
