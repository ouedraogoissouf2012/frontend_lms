<template>
  <DashboardLayout>
    <div class="import-page">
      <h1>Import d'apprenants</h1>
      <p v-if="error" class="import-error" role="alert">{{ error }}</p>
      <ol class="import-steps">
        <li :class="{ active: step === 1 }">Dépôt</li>
        <li :class="{ active: step === 2 }">Cartographie</li>
        <li :class="{ active: step === 3 }">Analyse</li>
        <li :class="{ active: step === 4 }">Rapport</li>
      </ol>
      <ImportDeposit
        v-if="step === 1"
        :file-name="file?.name || ''"
        @file="chooseFile"
        @next="readHeaders"
      />
      <ImportMapping
        v-else-if="step === 2"
        :headers="headers"
        :mapping="mapping"
        :issues="mappingIssues"
        :loading="loading"
        @update:mapping="mapping = $event"
        @back="backToDeposit"
        @preview="runPreview"
      />
      <ImportPreviewReport
        v-else-if="step === 3 && report"
        :report="report"
        :loading="loading"
        @back="backToMapping"
        @confirm="confirmJob"
      />
      <ImportJobReport
        v-else-if="step === 4"
        :status="jobStatus"
        :counts="jobReport?.counts ?? null"
        :rows="jobReport?.rows ?? []"
        :polling="jobPolling"
        @export="exportJobCsv"
        @fresh="startFresh"
      />
    </div>
  </DashboardLayout>
</template>

<script setup>
import { onMounted } from 'vue'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ImportDeposit from '@/components/import/ImportDeposit.vue'
import ImportMapping from '@/components/import/ImportMapping.vue'
import ImportPreviewReport from '@/components/import/ImportPreviewReport.vue'
import ImportJobReport from '@/components/import/ImportJobReport.vue'
import { useImportWizard } from '@/composables/useImportWizard'

const {
  step,
  file,
  headers,
  mapping,
  report,
  loading,
  error,
  mappingIssues,
  chooseFile,
  readHeaders,
  runPreview,
  backToMapping,
  backToDeposit,
  confirmJob,
  restoreJob,
  startFresh,
  jobStatus,
  jobReport,
  jobPolling,
  exportJobCsv,
} = useImportWizard()

onMounted(() => {
  void restoreJob()
})
</script>

<style scoped>
/* Chrome de l'assistant d'import (#334).
 *
 * Les classes partagées par plusieurs étapes sont définies ICI, via `:deep()`,
 * plutôt que recopiées dans chaque enfant : c'est la convention du dépôt, et
 * deux copies d'une même règle finissent toujours par diverger. Ce qui n'est
 * utilisé que par une étape reste dans son composant.
 *
 * Uniquement des tokens : la garde `lint:css` refuse toute couleur en dur, et
 * les thèmes clair et sombre portent exactement les mêmes clés — le mode sombre
 * suit donc sans une seule règle en plus.
 */

.import-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  max-width: 52rem;
}

.import-error {
  margin: 0;
  padding: 0.75rem 1rem;
  border: 1px solid var(--error-border);
  border-radius: 0.5rem;
  background: var(--error-bg);
  color: var(--error-text);
}

/* Fil des étapes. Le numéro vient d'un compteur CSS : l'ordre reste porté par
   le balisage, et ajouter une étape ne demande pas de renuméroter à la main. */
.import-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.5rem;
  margin: 0;
  padding: 0;
  list-style: none;
  counter-reset: etape;
}

.import-steps li {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-tertiary);
  counter-increment: etape;
}

.import-steps li::before {
  content: counter(etape);
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border: 1px solid var(--border-primary);
  border-radius: 50%;
  font-size: 0.875rem;
}

.import-steps li.active {
  color: var(--text-primary);
  font-weight: 600;
}

.import-steps li.active::before {
  border-color: var(--primary-color);
  background: rgba(var(--primary-color-rgb), 0.12);
  color: var(--primary-color);
}

/* ---- chrome partagé par les étapes ---- */

:deep(.import-step) {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.5rem;
  border: 1px solid var(--card-border);
  border-radius: 0.75rem;
  background: var(--card-bg);
}

:deep(.import-note) {
  margin: 0;
  color: var(--text-secondary);
  font-size: 0.9375rem;
}

:deep(.import-verdict) {
  margin: 0;
  padding: 0.75rem 1rem;
  border-left: 3px solid var(--primary-color);
  border-radius: 0.25rem;
  background: rgba(var(--primary-color-rgb), 0.08);
}

:deep(.import-actions) {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

:deep(.import-button) {
  padding: 0.75rem 1.25rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
  font: inherit;
  cursor: pointer;
}

:deep(.import-button:hover:not(:disabled)) {
  background: var(--btn-secondary-hover);
}

:deep(.import-button--primary) {
  border-color: transparent;
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

:deep(.import-button--primary:hover:not(:disabled)) {
  background: var(--btn-primary-hover);
}

:deep(.import-button:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
}

:deep(.import-button:focus-visible) {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

/* `align-items: flex-start` réduirait sinon le tableau à la largeur de son
   contenu ; il doit occuper toute l'étape. */
:deep(.import-table) {
  align-self: stretch;
  width: 100%;
  border-collapse: collapse;
}

:deep(.import-caption) {
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  text-align: left;
}

:deep(.import-table th),
:deep(.import-table td) {
  padding: 0.5rem 0.75rem;
  border-bottom: 1px solid var(--table-border);
  text-align: left;
  vertical-align: top;
}

:deep(.import-table th) {
  background: var(--table-header-bg);
  font-weight: 600;
}

:deep(.import-table tbody tr:hover) {
  background: var(--table-row-hover);
}
</style>
