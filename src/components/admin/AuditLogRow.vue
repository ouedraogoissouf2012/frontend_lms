<template>
  <tr class="entree">
    <td class="date">{{ formatDateTime(entree.created_at, { fallback: AUCUNE_VALEUR }) }}</td>
    <td>
      <template v-if="entree.user">
        <button type="button" class="acteur-filtre" :title="`Voir les actions de ${entree.user.name}`" @click="$emit('filtrer-acteur', entree.user)">
          {{ entree.user.name }}
        </button>
        <span class="role">{{ getRoleDisplayName(entree.user.role) || AUCUNE_VALEUR }}</span>
      </template>
      <span v-else>{{ AUCUNE_VALEUR }}</span>
    </td>
    <td>{{ auditActionLabel(entree.action) }}</td>
    <td>{{ auditElementLabel(entree.auditable_type, entree.auditable_id) }}</td>
    <td>{{ auditEcoleLabel(entree) }}</td>
    <td>
      <!-- Q2 (D127) : l'IP et le navigateur, repliés ; l'e-mail de l'acteur n'est jamais affiché. -->
      <details class="entree-detail">
        <summary>Provenance</summary>
        <dl>
          <dt>Adresse IP</dt>
          <dd>{{ entree.ip_address || AUCUNE_VALEUR }}</dd>
          <dt>Navigateur</dt>
          <dd>{{ entree.user_agent || AUCUNE_VALEUR }}</dd>
        </dl>
      </details>
    </td>
  </tr>
</template>

<script setup>
/**
 * Une ligne du journal d'audit (D126/D127). Présentation pure : libellés par les tables fermées
 * d'`utils/auditLogLabels` (« — » hors table) ; le clic sur l'acteur demande de filtrer sur lui.
 */
import { getRoleDisplayName } from '@/constants/roles'
import { formatDateTime } from '@/utils/formatters'
import { AUCUNE_VALEUR, auditActionLabel, auditElementLabel, auditEcoleLabel } from '@/utils/auditLogLabels'

defineProps({
  entree: { type: Object, required: true },
})
defineEmits(['filtrer-acteur'])
</script>

<style scoped>
.acteur-filtre {
  display: block;
  padding: 0;
  color: var(--primary-color);
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  text-decoration: underline;
}

.role,
.date {
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
}

.entree-detail dl {
  margin: var(--spacing-sm) 0 0;
}

.entree-detail dd {
  margin: 0 0 var(--spacing-xs);
  word-break: break-all;
}
</style>
