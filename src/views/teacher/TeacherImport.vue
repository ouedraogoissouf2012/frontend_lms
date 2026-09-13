<template>
  <DashboardLayout>
    <div class="import-page">
      <h1>Import d'apprenants</h1>
      <p v-if="error" role="alert">{{ error }}</p>
      <ol class="import-steps">
        <li :class="{ active: step === 1 }">Dépôt</li>
        <li :class="{ active: step === 2 }">Cartographie</li>
        <li :class="{ active: step === 3 }">Prévisualisation</li>
      </ol>
      <ImportDeposit
        v-if="step === 1"
        :file-name="file?.name || ''"
        @file="onFile"
        @next="readHeaders"
      />
      <ImportMapping
        v-else-if="step === 2"
        :headers="headers"
        :mapping="mapping"
        :ready="mappingComplete"
        :loading="loading"
        @update:mapping="mapping = $event"
        @back="step = 1"
        @preview="runPreview"
      />
      <ImportPreviewReport
        v-else-if="step === 3 && report"
        :report="report"
        @back="step = 2"
      />
    </div>
  </DashboardLayout>
</template>

<script setup>
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ImportDeposit from '@/components/import/ImportDeposit.vue'
import ImportMapping from '@/components/import/ImportMapping.vue'
import ImportPreviewReport from '@/components/import/ImportPreviewReport.vue'
import { useImportWizard } from '@/composables/useImportWizard'

const {
  step,
  file,
  headers,
  mapping,
  report,
  loading,
  error,
  mappingComplete,
  chooseFile,
  readHeaders,
  runPreview,
} = useImportWizard()

function onFile(next) {
  chooseFile(next)
}
</script>

<style scoped>
.import-page { max-width: 52rem; }
.import-steps { display: flex; gap: 1rem; list-style: none; padding: 0; }
.import-steps li { opacity: 0.5; }
.import-steps li.active { opacity: 1; font-weight: 600; }
</style>
