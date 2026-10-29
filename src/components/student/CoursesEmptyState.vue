<template>
  <div class="empty-state">
    <div class="empty-icon-wrapper">
      <i class="fa fa-book empty-icon"></i>
    </div>
    <h3 class="empty-title">Aucun cours disponible</h3>
    <p class="empty-description">
      <template v-if="filtered">
        Aucun cours ne correspond à vos filtres.<br>
        Essayez de modifier vos critères de recherche.
      </template>
      <template v-else>
        Vos enseignants n'ont pas encore publié de cours.<br>
        Revenez plus tard pour consulter les nouveaux cours.
      </template>
    </p>
    <div class="empty-actions">
      <button v-if="filtered" @click="$emit('reset')" class="btn-reload">
        Effacer les filtres
      </button>
      <button @click="$emit('reload')" class="btn-reload" aria-label="Actualiser la liste des cours">
        Actualiser
      </button>
      <router-link to="/student/dashboard" class="btn-secondary-link" aria-label="Retourner au tableau de bord">
        Retour au dashboard
      </router-link>
    </div>
  </div>
</template>

<script setup>
/**
 * État vide de StudentCourses (extrait pour rester sous 300 lignes, #434).
 * Présentation pure : `filtered` choisit le message (aucun résultat pour les
 * filtres, ou rien de publié) ; émet `reset` et `reload`.
 */
defineProps({
  filtered: { type: Boolean, default: false },
})

defineEmits(['reset', 'reload'])
</script>

<style scoped>
/* Empty state */
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  max-width: 600px;
  margin: 0 auto;
}

.empty-icon-wrapper {
  display: inline-flex;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border-radius: 50%;
  margin-bottom: 1.5rem;
}

.empty-icon {
  font-size: 3rem;
  color: var(--text-secondary);
}

.empty-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.empty-description {
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 2rem;
}

.empty-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.btn-reload, .btn-secondary-link {
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  font-size: 1rem;
  text-decoration: none;
  display: inline-block;
}

.btn-reload {
  background: linear-gradient(135deg, var(--blue-500) 0%, var(--color-info-strong) 100%);
  color: white;
}

.btn-reload:hover {
  background: linear-gradient(135deg, var(--color-info-strong) 0%, var(--color-info-stronger) 100%);
  transform: translateY(-2px);
}

.btn-secondary-link {
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.btn-secondary-link:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}

</style>
