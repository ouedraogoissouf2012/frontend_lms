<template>
  <div class="page-header">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <button @click="$emit('back')" class="breadcrumb-link">
        Mes Cours
      </button>
      <span class="breadcrumb-separator">›</span>
      <span class="breadcrumb-current">{{ matiere?.nom || 'Chargement...' }}</span>
    </div>

    <!-- Title & Info -->
    <div class="header-content">
      <h1 class="page-title">{{ matiere?.nom || 'Chargement...' }}</h1>

      <!-- Info badges -->
      <div class="info-badges" v-if="matiere">
        <span v-if="matiere.code" class="info-badge">
          Code: {{ matiere.code }}
        </span>
        <span v-if="matiere.coefficient" class="info-badge">
          Coeff: {{ matiere.coefficient }}
        </span>
        <span v-if="matiere.heures?.total" class="info-badge">
          {{ matiere.heures.total }}h
        </span>
      </div>
    </div>

    <!-- Compact Stats -->
    <div class="compact-stats" v-if="statistiques">
      <div class="compact-stat">
        <span class="compact-stat-value">{{ statistiques.nombre_lessons || 0 }}</span>
        <span class="compact-stat-label">Leçons</span>
      </div>
      <div class="compact-stat">
        <span class="compact-stat-value">{{ statistiques.nombre_seances_programmees || 0 }}</span>
        <span class="compact-stat-label">Séances</span>
      </div>
      <div class="compact-stat">
        <span class="compact-stat-value">{{ statistiques.nombre_evaluations || 0 }}</span>
        <span class="compact-stat-label">Évaluations</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * En-tete de MatiereDetails (#H9 ≤300). Presentation pure : breadcrumb, titre,
 * badges et stats compactes. Emet back. CSS deplace VERBATIM.
 */
defineProps({
  matiere: { type: Object, default: null },
  statistiques: { type: Object, default: null }
})
defineEmits(['back'])
</script>

<style scoped>
/* Page Header Styles */
.page-header {
  margin-bottom: 2rem;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
}

.breadcrumb-link {
  color: var(--text-secondary);
  background: none;
  border: none;
  cursor: pointer;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--text-primary);
}

.breadcrumb-separator {
  color: var(--text-tertiary);
}

.breadcrumb-current {
  color: var(--text-primary);
  font-weight: 500;
}

.header-content {
  margin-bottom: 1.5rem;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1rem 0;
}

.info-badges {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.info-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.compact-stats {
  display: flex;
  gap: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-primary);
}

.compact-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.compact-stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--blue-600);
}

.compact-stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .compact-stats {
    gap: 1rem;
  }

  .compact-stat-value {
    font-size: 1.25rem;
  }
}
</style>
