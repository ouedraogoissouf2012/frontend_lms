<template>
  <section class="import-step">
    <p class="import-verdict">{{ verdict }}</p>
    <p class="import-note">
      Vous pouvez quitter et vous reconnecter : ce rapport restera ici.
      Vous pouvez aussi corriger le fichier et le renvoyer entièrement.
    </p>
    <p v-if="polling" class="import-note">Traitement en cours… l'avancement est relu sur le serveur.</p>
    <table v-if="rows.length" class="import-table">
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
    <div class="import-actions">
      <button
        type="button"
        class="import-button"
        data-test="export"
        :disabled="!rows.length"
        @click="$emit('export')"
      >
        Exporter le rapport CSV
      </button>
      <button type="button" class="import-button import-button--primary" data-test="fresh" @click="$emit('fresh')">
        Nouvel import
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { IMPORT_ROW_STATUS_LABELS } from '@/utils/importReportCsv'

const JOB_LABELS = {
  queued: 'Import en file d\'attente.',
  running: 'Import en cours de traitement.',
  done: 'Import terminé.',
  failed: 'Import échoué. Corrigez le fichier et renvoyez-le, ou signalez l\'incident.',
}

const props = defineProps({
  status: { type: String, default: '' },
  counts: { type: Object, default: null },
  rows: { type: Array, default: () => [] },
  polling: { type: Boolean, default: false },
})
defineEmits(['export', 'fresh'])

const verdict = computed(() => {
  const base = JOB_LABELS[props.status] ?? 'Rapport d\'import.'
  if (!props.counts) return base
  return `${base} ${props.counts.ok ?? '—'} ligne(s) acceptée(s), ${props.counts.error ?? '—'} refusée(s).`
})

function statusLabel(status) {
  return IMPORT_ROW_STATUS_LABELS[status] ?? status
}
</script>
