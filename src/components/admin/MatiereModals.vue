<template>
  <NiveauDetailModal
    :niveau="niveau"
    @close="$emit('close-niveau')"
    @view-matiere="(m) => $emit('view-matiere', m)"
  />
  <MatiereDetailModal
    :matiere="matiere"
    @close="$emit('close-matiere')"
  />
</template>

<script setup>
/**
 * Wrapper mince des modales détail d'AdminMatieres (#G1 décompo). Relaie props et
 * events vers NiveauDetailModal (table des matières du niveau) et MatiereDetailModal
 * (détails matière), en conservant l'API publique attendue par AdminMatieres.vue.
 */
import NiveauDetailModal from '@/components/admin/NiveauDetailModal.vue'
import MatiereDetailModal from '@/components/admin/MatiereDetailModal.vue'

defineProps({
  niveau: { type: Object, default: null },
  matiere: { type: Object, default: null }
})
defineEmits(['close-niveau', 'close-matiere', 'view-matiere'])
</script>
