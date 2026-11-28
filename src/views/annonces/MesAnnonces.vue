<template>
  <DashboardLayout>
    <section class="mes-annonces">
      <h1>Mes annonces</h1>
      <p class="mes-annonces-aide">Les annonces que votre établissement a faites à vos classes, les plus récentes d’abord.</p>

      <!-- Région présente dès le montage : une erreur ajoutée plus tard n'est pas annoncée. -->
      <div class="mes-annonces-erreur" role="alert">
        <template v-if="erreur">
          {{ erreur }}
          <button type="button" class="mes-annonces-btn" data-reessayer @click="charger()">Réessayer</button>
        </template>
      </div>

      <p v-if="chargement" class="mes-annonces-aide">Chargement des annonces…</p>
      <p v-else-if="!erreur && annonces.length === 0" class="mes-annonces-aide" data-etat="vide">Aucune annonce pour le moment.</p>

      <ul v-else-if="!erreur" class="mes-annonces-liste">
        <li v-for="a in annonces" :key="a.id" :data-annonce="a.id" class="mes-annonces-item" :class="{ 'non-lue': !a.read_at }">
          <button
            type="button"
            class="mes-annonces-titre"
            data-ouvrir
            :aria-expanded="ouvertes.has(a.id) ? 'true' : 'false'"
            @click="ouvrir(a)"
          >
            <span>{{ a.title }}</span>
            <span class="mes-annonces-date">{{ formatDate(a.created_at) }}</span>
            <span v-if="!a.read_at" class="mes-annonces-badge">Nouvelle</span>
          </button>
          <p v-if="ouvertes.has(a.id)" class="mes-annonces-message">{{ a.message }}</p>
        </li>
      </ul>

      <nav v-if="dernierePage > 1" class="mes-annonces-pages" aria-label="Pages des annonces">
        <button type="button" class="mes-annonces-btn" :aria-disabled="page <= 1 ? 'true' : 'false'" @click="pagePrecedente">Précédente</button>
        <span>Page {{ page }} sur {{ dernierePage }}</span>
        <button type="button" class="mes-annonces-btn" data-page-suivante :aria-disabled="page >= dernierePage ? 'true' : 'false'" @click="pageSuivante">
          Suivante
        </button>
      </nav>
    </section>
  </DashboardLayout>
</template>

<script setup>
/**
 * « Mes annonces » (#690) : le fil des annonces de l'appelant, pour tous les rôles d'une école. La donnée vit dans
 * `useMesAnnonces` (filtre du serveur, marque lue à l'ouverture, panne distincte d'une liste vide).
 */
import DashboardLayout from '@/components/layout/DashboardLayout.vue'
import { useMesAnnonces } from '@/composables/useMesAnnonces'

const { annonces, page, dernierePage, chargement, erreur, ouvertes, charger, ouvrir, pageSuivante, pagePrecedente } = useMesAnnonces()

const formatDate = (iso) => (iso ? new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }) : '')
</script>

<style scoped>
.mes-annonces {
  display: grid;
  gap: var(--spacing-md);
  max-width: 56rem;
  margin: 0 auto;
}

.mes-annonces h1 {
  margin: 0;
  color: var(--text-primary);
  /* Le reset de Tailwind ramène un titre à la taille du texte : elle se déclare ici. */
  font-size: var(--font-size-2xl);
  font-weight: 700;
}

.mes-annonces-aide,
.mes-annonces-message {
  margin: 0;
  color: var(--text-secondary);
}

.mes-annonces-erreur {
  color: var(--color-danger, var(--text-primary));
}

.mes-annonces-liste {
  display: grid;
  gap: var(--spacing-sm);
  list-style: none;
  margin: 0;
  padding: 0;
}

.mes-annonces-item {
  display: grid;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: var(--card-bg);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
}

.mes-annonces-item.non-lue {
  border-left-width: 4px;
}

.mes-annonces-titre {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: var(--spacing-sm);
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  color: var(--text-primary);
  font-weight: 600;
  cursor: pointer;
}

.mes-annonces-date {
  color: var(--text-secondary);
  font-weight: 400;
  font-size: 0.875rem;
}

.mes-annonces-badge {
  font-size: 0.75rem;
  padding: 0 var(--spacing-sm);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  color: var(--text-primary);
}

.mes-annonces-message {
  color: var(--text-primary);
  white-space: pre-line;
}

.mes-annonces-pages {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.mes-annonces-btn {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-primary);
  background: var(--bg-secondary);
  color: var(--text-primary);
  cursor: pointer;
}

.mes-annonces-btn[aria-disabled='true'] {
  cursor: not-allowed;
  opacity: 0.6;
}
</style>
