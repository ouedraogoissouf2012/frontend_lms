<template>
  <section class="import-step">
    <p class="import-verdict">
      <strong>Rien n'a été écrit</strong> dans la base.
      {{ okLabel }} ligne(s) acceptée(s), {{ errorLabel }} refusée(s).
    </p>
    <p v-if="!counts" class="import-note">
      Les compteurs n'ont pas été renvoyés par le serveur : ils ne sont pas affichés
      plutôt que d'être présentés comme nuls.
    </p>
    <table class="import-table">
      <caption class="import-caption">Détail ligne par ligne</caption>
      <thead>
        <tr><th scope="col">Ligne</th><th scope="col">Statut</th><th scope="col">Motif</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.line">
          <td>{{ row.line }}</td>
          <td>{{ statusLabel(row.status) }}</td>
          <td>{{ row.message || '—' }}</td>
        </tr>
      </tbody>
    </table>
    <p class="import-note">
      Vous pourrez corriger les lignes refusées et renvoyer le fichier entier.
    </p>
    <div class="import-actions">
      <button type="button" class="import-button" @click="$emit('back')">Corriger la cartographie</button>
      <button
        type="button"
        class="import-button import-button--primary"
        data-test="confirm"
        :disabled="!report.import_id || loading"
        @click="$emit('confirm')"
      >
        {{ loading ? 'Mise en file…' : 'Importer les lignes acceptées' }}
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

/** Rapport d'analyse à blanc (#334). Aucune valeur n'est fabriquée ici :
 *  un compteur absent s'affiche « — », jamais « 0 », parce qu'un zéro se
 *  lirait comme « aucune erreur » alors qu'il signale une mesure manquante. */
const props = defineProps({
  report: { type: Object, required: true },
  loading: { type: Boolean, default: false },
})
defineEmits(['back', 'confirm'])

const STATUS_LABELS = { ok: 'Acceptée', error: 'Refusée' }

const rows = computed(() => props.report?.rows ?? [])
const counts = computed(() => props.report?.counts ?? null)
const okLabel = computed(() => counts.value?.ok ?? '—')
const errorLabel = computed(() => counts.value?.error ?? '—')

function statusLabel(status) {
  return STATUS_LABELS[status] ?? status
}
</script>
