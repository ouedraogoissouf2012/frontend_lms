<template>
  <section class="import-step">
    <p>
      Le courriel n'est pas obligatoire : un numéro WhatsApp suffit. Il faut
      cependant l'un des deux pour chaque apprenant.
    </p>
    <p class="import-note">
      Votre fichier est envoyé tel quel et analysé sans rien écrire : vous pourrez
      le corriger et le renvoyer entièrement.
    </p>
    <button type="button" class="import-link" @click="downloadTemplate">
      Télécharger le modèle CSV
    </button>
    <label class="import-drop" for="import-file">
      <input
        id="import-file"
        type="file"
        accept=".csv,text/csv,text/plain"
        @change="onFile"
      >
      <span>{{ fileName || 'Choisir un fichier CSV' }}</span>
    </label>
    <button
      type="button"
      class="import-button import-button--primary"
      data-test="next"
      :disabled="!fileName"
      @click="$emit('next')"
    >
      Continuer vers la cartographie
    </button>
  </section>
</template>

<script setup>
import { IMPORT_TEMPLATE } from '@/constants/importFields'
import { downloadBlob } from '@/utils/downloadBlob'

/** Dépôt du fichier (#334). Le fichier choisi n'est ni lu ni transformé ici :
 *  il est simplement remonté au composable, qui le transmettra intact. */
defineProps({
  fileName: { type: String, default: '' },
})
const emit = defineEmits(['file', 'next'])

function onFile(event) {
  const chosen = event.target.files?.[0]
  if (chosen) emit('file', chosen)
}

function downloadTemplate() {
  downloadBlob(new Blob([IMPORT_TEMPLATE], { type: 'text/csv;charset=utf-8' }), 'modele-import-apprenants.csv')
}
</script>
