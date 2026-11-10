<template>
  <DashboardLayout>
    <div class="admin-institutions-container">
      <div class="header-section">
        <div class="header-content">
          <h1 class="page-title">Journal d’audit</h1>
          <p class="page-subtitle">Qui a fait quoi, quand, dans toutes les écoles (lecture seule)</p>
        </div>
      </div>

      <div class="filtres">
        <label for="filtre-action">Action</label>
        <select id="filtre-action" :value="action" class="lien-input" @change="choisirAction($event.target.value)">
          <option value="">Toutes</option>
          <option v-for="[valeur, libelle] in AUDIT_FILTRE_ACTIONS" :key="valeur" :value="valeur">{{ libelle }}</option>
        </select>
        <p v-if="acteur" class="filtre-acteur">
          Actions de {{ acteur.name }}
          <button type="button" class="refresh-btn" @click="retirerActeur">Retirer le filtre</button>
        </p>
      </div>

      <!-- Région présente DÈS le montage : seule la présentation suit l'erreur. -->
      <p class="annonce" :class="{ 'error-banner': erreur }" role="alert">{{ erreur }}</p>
      <button v-if="erreur && peutReessayer" type="button" class="refresh-btn btn-reessayer" @click="charger()">Réessayer</button>

      <!-- Premier chargement : le chargeur. Rechargement (page, filtre) : les lignes restent, l'état est annoncé. -->
      <ContentLoader v-if="chargement && !entrees.length" text="Chargement du journal..." />
      <p v-if="chargement && entrees.length" class="annonce" role="status">Mise à jour…</p>
      <p v-if="!(chargement && !entrees.length) && etatVide" class="journal-vide">
        {{ etatVide === 'filtre' ? 'Aucune entrée pour ce filtre.' : 'Aucune entrée dans le journal.' }}
      </p>
      <template v-else-if="entrees.length && !etatVide">
        <div class="table-wrap">
          <table class="journal">
            <thead>
              <tr>
                <th scope="col">Date</th>
                <th scope="col">Acteur</th>
                <th scope="col">Action</th>
                <th scope="col">Élément</th>
                <th scope="col">École</th>
                <th scope="col">Détail</th>
              </tr>
            </thead>
            <tbody>
              <AuditLogRow v-for="e in entrees" :key="e.id" :entree="e" @filtrer-acteur="filtrerActeur" />
            </tbody>
          </table>
        </div>
        <nav class="pagination" aria-label="Pages du journal">
          <button type="button" class="refresh-btn page-precedente" :aria-disabled="page <= 1 ? 'true' : 'false'" @click="pagePrecedente">Précédent</button>
          <span>Page {{ page }} sur {{ dernierePage }} · {{ total }} entrées</span>
          <button type="button" class="refresh-btn page-suivante" :aria-disabled="page >= dernierePage ? 'true' : 'false'" @click="pageSuivante">Suivant</button>
        </nav>
      </template>
    </div>
  </DashboardLayout>
</template>

<script setup>
/**
 * Journal d'audit du supradmin (/admin/audit-log, route de plateforme, D51/D126/D127).
 * Orchestrateur : la donnée et ses états vivent dans useAdminAuditLog, chaque ligne dans
 * AuditLogRow. Le diff avant/après n'est pas affiché : report de périmètre (D127, Q3), pas un
 * interdit (A1 : le supradmin lit le journal tel quel).
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import ContentLoader from '@/components/common/ContentLoader.vue'
import AuditLogRow from '@/components/admin/AuditLogRow.vue'
import { useAdminAuditLog } from '@/composables/useAdminAuditLog'
import { AUDIT_FILTRE_ACTIONS } from '@/utils/auditLogLabels'

const {
  entrees, chargement, erreur, peutReessayer, etatVide,
  page, dernierePage, total, action, acteur,
  charger, pagePrecedente, pageSuivante, choisirAction, filtrerActeur, retirerActeur,
} = useAdminAuditLog()
</script>

<style scoped lang="scss">
@use '../../assets/styles/admin-shared';

.admin-institutions-container {
  padding: var(--spacing-xl);
  max-width: 72rem;
  margin: 0 auto;
}

.filtres {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-md);
}

.filtres .lien-input {
  width: auto;
  padding: var(--spacing-sm);
  color: var(--text-primary);
  background: var(--bg-secondary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
}

.annonce {
  margin: 0;
}

.error-banner {
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-md);
}

.table-wrap {
  overflow-x: auto;
}

.journal {
  width: 100%;
  border-collapse: collapse;
}

.journal :deep(th),
.journal :deep(td) {
  padding: var(--spacing-sm);
  border-bottom: 1px solid var(--border-primary);
  text-align: left;
  vertical-align: top;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-sm);
  margin-top: var(--spacing-md);
}

.refresh-btn[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
