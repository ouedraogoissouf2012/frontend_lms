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
.import-page { max-width: 52rem; }
.import-steps { display: flex; gap: 1rem; list-style: none; padding: 0; }
.import-steps li { opacity: 0.5; }
.import-steps li.active { opacity: 1; font-weight: 600; }
</style>
