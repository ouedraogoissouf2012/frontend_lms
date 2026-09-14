<template>
  <section class="import-step">
    <p>
      Le courriel n'est pas obligatoire : un numéro WhatsApp suffit. Il faut
      cependant l'un des deux pour chaque apprenant.
    </p>
    <p class="import-note">
      Votre fichier est envoyé tel quel et analysé sans inscrire personne : vous
      pourrez le corriger et le renvoyer entièrement.
    </p>
    <button type="button" class="import-link" @click="downloadTemplate">
      Télécharger le modèle CSV
    </button>
    <label
      class="import-drop"
      :class="{ 'import-drop--survol': survol }"
      @dragenter.prevent="survol = true"
      @dragover.prevent="survol = true"
      @dragleave="survol = false"
      @drop.prevent="onDrop"
    >
      <input
        id="import-file"
        type="file"
        accept=".csv,text/csv,text/plain"
        @change="onFile"
      >
      <span>{{ fileName || 'Glissez un fichier CSV ici, ou cliquez pour le choisir' }}</span>
    </label>
    <div class="import-actions">
      <button
        type="button"
        class="import-button import-button--primary"
        data-test="next"
        :disabled="!fileName"
        @click="$emit('next')"
      >
        Continuer vers la cartographie
      </button>
    </div>
  </section>
</template>

<script setup>
import { ref } from 'vue'
import { IMPORT_TEMPLATE } from '@/constants/importFields'
import { downloadBlob } from '@/utils/downloadBlob'

/** Dépôt du fichier (#334). Le fichier choisi n'est ni lu ni transformé ici :
 *  il est simplement remonté au composable, qui le transmettra intact. */
defineProps({
  fileName: { type: String, default: '' },
})
const emit = defineEmits(['file', 'next'])

const survol = ref(false)

function onFile(event) {
  const chosen = event.target.files?.[0]
  if (chosen) emit('file', chosen)
}

/** L'input est masqué visuellement : un fichier lâché ne l'atteint jamais de
 *  lui-même. Sans ce gestionnaire, le « glissez ici » annoncé à l'écran serait
 *  purement décoratif. */
function onDrop(event) {
  survol.value = false
  const chosen = event.dataTransfer?.files?.[0]
  if (chosen) emit('file', chosen)
}

function downloadTemplate() {
  downloadBlob(new Blob([IMPORT_TEMPLATE], { type: 'text/csv;charset=utf-8' }), 'modele-import-apprenants.csv')
}
</script>

<style scoped>
/* Seul ce qui n'appartient qu'à l'étape de dépôt. Le chrome partagé
   (`.import-step`, `.import-button`, `.import-actions`, `.import-note`) vit
   dans TeacherImport.vue, via `:deep()`. */

.import-drop {
  display: flex;
  align-items: center;
  justify-content: center;
  align-self: stretch;
  min-height: 6rem;
  padding: 1rem;
  border: 2px dashed var(--border-primary);
  border-radius: 0.75rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  text-align: center;
  cursor: pointer;
}

.import-drop:hover,
.import-drop:focus-within {
  border-color: var(--primary-color);
}

.import-drop--survol {
  border-color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.08);
  color: var(--text-primary);
}

/* Masqué à l'oeil, PAS au clavier ni aux lecteurs d'écran : le label reste
   cliquable et l'input focusable. */
.import-drop input {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  white-space: nowrap;
  border: 0;
  clip-path: inset(50%);
}

.import-link {
  padding: 0;
  border: 0;
  background: none;
  color: var(--primary-color);
  font: inherit;
  text-decoration: underline;
  cursor: pointer;
}

.import-link:hover {
  text-decoration: none;
}
</style>
