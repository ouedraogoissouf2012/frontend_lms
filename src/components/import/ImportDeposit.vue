<template>
  <section class="import-step">
    <p>
      L'email est facultatif : le téléphone WhatsApp suffit.
      Vous pourrez renvoyer le fichier entier après correction (import idempotent).
    </p>
    <button type="button" class="import-link" @click="downloadTemplate">Télécharger le modèle CSV</button>
    <label class="import-drop">
      <input type="file" accept=".csv,text/csv,text/plain" @change="onFile">
      <span>{{ fileName || 'Glisser-déposer ou choisir un fichier CSV' }}</span>
    </label>
    <button type="button" :disabled="!fileName" @click="$emit('next')">Continuer vers la cartographie</button>
  </section>
</template>

<script setup>
import { IMPORT_TEMPLATE } from '@/constants/importFields'

defineProps({
  fileName: { type: String, default: '' },
})
const emit = defineEmits(['file', 'next'])

function onFile(event) {
  const chosen = event.target.files?.[0]
  if (chosen) emit('file', chosen)
}

function downloadTemplate() {
  const blob = new Blob([IMPORT_TEMPLATE], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'modele-import-apprenants.csv'
  link.click()
  URL.revokeObjectURL(url)
}
</script>
