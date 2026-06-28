<template>
  <div class="eval-actions">
    <button
      v-if="!evaluation.has_online"
      @click="$emit('create', evaluation)"
      class="btn-action btn-create"
      title="Créer une version interactive avec QCM pour cette évaluation KLASSCI"
    >
      <PlusIcon class="w-5 h-5" />
      Créer version en ligne
    </button>
    <button
      v-else
      @click="$emit('edit', evaluation)"
      class="btn-action btn-edit"
      title="Modifier les questions de la version en ligne"
    >
      <PencilIcon class="w-5 h-5" />
      Modifier les questions
    </button>
    <button
      v-if="evaluation.has_online && evaluation.online_version?.submissions_count > 0"
      @click="$emit('view-results', evaluation)"
      class="btn-action btn-view-results"
      title="Voir les notes et résultats des étudiants"
    >
      <ChartBarIcon class="w-5 h-5" />
      Voir les notes
    </button>
    <button
      v-if="evaluation.has_online && !evaluation.online_version?.is_published"
      @click="$emit('publish', evaluation)"
      class="btn-action btn-publish"
      title="Publier l'évaluation pour la rendre visible aux étudiants"
    >
      <MegaphoneIcon class="w-5 h-5" />
      Publier
    </button>
    <button
      v-if="evaluation.has_online"
      @click="$emit('preview', evaluation)"
      class="btn-action btn-preview"
      title="Prévisualiser l'évaluation"
    >
      <EyeIcon class="w-5 h-5" />
      Prévisualiser
    </button>
    <button
      v-if="evaluation.has_online && evaluation.online_version?.submissions_count > 0"
      @click="$emit('sync', evaluation)"
      :disabled="syncing === evaluation.id"
      class="btn-action btn-sync"
      title="Synchroniser les notes vers KLASSCI"
    >
      <ArrowPathIcon class="w-5 h-5" :class="{ 'animate-spin': syncing === evaluation.id }" />
      {{ syncing === evaluation.id ? 'Synchronisation...' : 'Synchroniser les notes' }}
    </button>
    <button
      v-if="evaluation.has_online && !evaluation.online_version?.is_locked && !(evaluation.online_version?.submissions_count > 0)"
      @click="$emit('delete', evaluation)"
      class="btn-action btn-delete"
      title="Supprimer la version en ligne"
    >
      <TrashIcon class="w-5 h-5" />
      Supprimer
    </button>
  </div>
</template>

<script setup>
/**
 * Barre d'actions d'EvaluationCard (H2 ≤300). Section présentationnelle extraite
 * verbatim : émet les intentions (create/edit/view-results/publish/preview/sync/
 * delete) ; la logique métier reste dans la vue parente. `syncing` = id en cours.
 */
import {
  PlusIcon,
  PencilIcon,
  ArrowPathIcon,
  ChartBarIcon,
  EyeIcon,
  MegaphoneIcon,
  TrashIcon
} from '@heroicons/vue/24/outline'

defineProps({
  evaluation: { type: Object, required: true },
  // id de l'évaluation en cours de synchronisation (ou null)
  syncing: { type: [Number, String, null], default: null }
})

defineEmits(['create', 'edit', 'view-results', 'publish', 'preview', 'sync', 'delete'])
</script>

<style scoped>
.eval-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.btn-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-create {
  background: linear-gradient(135deg, var(--blue-500) 0%, var(--color-info-strong) 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.btn-create:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--color-info-strong) 0%, var(--color-info-stronger) 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

.btn-edit {
  background: var(--amber-500);
  color: white;
}

.btn-edit:hover:not(:disabled) {
  background: var(--amber-600);
}

.btn-view-results {
  background: var(--violet-500);
  color: white;
}

.btn-view-results:hover:not(:disabled) {
  background: var(--violet-600);
}

.btn-sync {
  background: var(--emerald-500);
  color: white;
}

.btn-sync:hover:not(:disabled) {
  background: var(--emerald-600);
}

.btn-publish {
  background: var(--violet-500);
  color: white;
}

.btn-publish:hover:not(:disabled) {
  background: var(--violet-600);
}

.btn-preview {
  background: var(--indigo-500);
  color: white;
}

.btn-preview:hover:not(:disabled) {
  background: var(--indigo-600);
}

.btn-delete {
  background: var(--red-500);
  color: white;
}

.btn-delete:hover:not(:disabled) {
  background: var(--red-600);
}

.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
