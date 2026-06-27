<template>
  <div class="modal-footer">
    <button
      @click="$emit('export-pdf')"
      :disabled="exporting"
      class="btn-export-pdf"
      title="Exporter en PDF"
    >
      <i class="fa fa-file-pdf-o"></i>
      {{ exporting ? 'Export...' : 'Exporter PDF' }}
    </button>
    <button
      @click="$emit('export-excel')"
      :disabled="exporting"
      class="btn-export-excel"
      title="Exporter en Excel"
    >
      <i class="fa fa-file-excel-o"></i>
      {{ exporting ? 'Export...' : 'Exporter Excel' }}
    </button>
    <button @click="$emit('close')" class="btn-modal-close">Fermer</button>
  </div>
</template>

<script setup>
/**
 * Pied de la modale de présences (H7) — sous-composant présentationnel extrait
 * d'AttendanceDetailModal.vue. Boutons d'export (PDF/Excel) et fermeture ; émet
 * les intentions, le téléchargement reste piloté par le parent.
 */
defineProps({
  exporting: { type: Boolean, default: false }
})

defineEmits(['export-pdf', 'export-excel', 'close'])
</script>

<style scoped>
.modal-footer {
  padding: 1.5rem 2rem;
  border-top: 1px solid var(--border-color);
  background: var(--bg-secondary);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.btn-export-pdf {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
}

.btn-export-pdf:hover:not(:disabled) {
  background: linear-gradient(135deg, #b91c1c 0%, var(--error-text) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(220, 38, 38, 0.4);
}

.btn-export-pdf:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-export-excel {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

.btn-export-excel:hover:not(:disabled) {
  background: linear-gradient(135deg, #059669 0%, #047857 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

.btn-export-excel:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.btn-modal-close {
  padding: 0.75rem 2rem;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  transition: all 0.15s;
}

.btn-modal-close:hover {
  background: var(--bg-hover);
  border-color: var(--text-tertiary);
}
</style>
