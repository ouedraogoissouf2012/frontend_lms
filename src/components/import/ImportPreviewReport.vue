<template>
  <section class="import-step">
    <p><strong>Rien n'a été écrit</strong> dans la base. {{ counts.ok }} ligne(s) acceptée(s), {{ counts.error }} refusée(s).</p>
    <table>
      <thead>
        <tr><th>Ligne</th><th>Statut</th><th>Motif</th></tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.line">
          <td>{{ row.line }}</td>
          <td>{{ row.status }}</td>
          <td>{{ row.message || '—' }}</td>
        </tr>
      </tbody>
    </table>
    <button type="button" @click="$emit('back')">Corriger la cartographie</button>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  report: { type: Object, required: true },
})
defineEmits(['back'])

const rows = computed(() => props.report.rows || [])
const counts = computed(() => props.report.counts || { ok: 0, error: 0, total: 0 })
</script>
