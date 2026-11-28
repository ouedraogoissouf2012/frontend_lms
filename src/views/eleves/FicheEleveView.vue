<template>
  <DashboardLayout>
    <FicheEleve :key="eleveId" :eleve-id="eleveId" />
  </DashboardLayout>
</template>

<script setup>
/**
 * front#664 : la page de la fiche d'un élève (`/eleves/:id`, id LOCAL, chiffres seulement par la route). La fiche
 * elle-même vit dans FicheEleve ; changer d'élève remonte le composant (`:key`).
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import FicheEleve from '@/components/eleves/FicheEleve.vue'

const route = useRoute()
const eleveId = computed(() => Number(route.params.id))
</script>
