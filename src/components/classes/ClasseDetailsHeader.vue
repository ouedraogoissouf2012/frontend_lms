<template>
  <div class="header-card">
    <div class="flex justify-between items-start">
      <div class="flex-1">
        <!-- Breadcrumb -->
        <div class="breadcrumb">
          <button @click="$emit('back')" class="breadcrumb-link">
            Dashboard
          </button>
          <span>›</span>
          <span class="breadcrumb-current">Gestion de la Classe</span>
        </div>

        <!-- Nom de la classe -->
        <h1 class="page-title">
          {{ titre }}
        </h1>

        <!-- Infos classe -->
        <div class="classe-info-line">
          <span v-if="classe?.filiere" class="info-item">
            <i class="fa fa-home info-icon"></i>
            Filière: <strong>{{ classe.filiere.nom }}</strong>
          </span>
          <span v-if="classe?.niveau" class="info-item">
            <i class="fa fa-bars info-icon"></i>
            Niveau: <strong>{{ classe.niveau.nom }}</strong>
          </span>
          <span v-if="classe?.code" class="info-item">
            <span class="info-icon">#</span>
            Code: <strong>{{ classe.code }}</strong>
          </span>
        </div>
      </div>

      <button @click="$emit('back')" class="btn-retour">
        ← Retour
      </button>
    </div>

    <!-- Stats -->
    <div class="stats-grid-header" v-if="!loading">
      <div class="stat-card-header">
        <div class="stat-header-inner">
          <i class="fa fa-user stat-icon-header"></i>
          <span class="stat-label-header">Étudiants</span>
        </div>
        <p class="stat-value-header">{{ etudiantsCount || 0 }}</p>
      </div>
      <div class="stat-card-header">
        <div class="stat-header-inner">
          <span class="stat-icon-header">☷</span>
          <span class="stat-label-header">Matières</span>
        </div>
        <p class="stat-value-header">{{ matieresCount || 0 }}</p>
      </div>
      <div class="stat-card-header">
        <div class="stat-header-inner">
          <i class="fa fa-check stat-icon-header"></i>
          <span class="stat-label-header">Évaluations</span>
        </div>
        <p class="stat-value-header">{{ evaluationsCount || 0 }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * En-tête de ClasseDetails (#H9 ≤300). Présentation pure : breadcrumb, titre,
 * infos classe et 3 stats. Émet `back` pour les boutons retour. CSS de l'en-tête
 * déplacé VERBATIM (spécifique à cette section).
 *
 * Le titre passe par `classeLabel` : `/lms/classes/{id}` → `data.classe` porte
 * `name`, jamais `nom`. Lire la clé absente laissait le titre bloqué sur
 * « Chargement… » même une fois la classe affichée, stats comprises.
 */
import { computed } from 'vue'
import { classeLabel } from '@/utils/classes'

const props = defineProps({
  classe: { type: Object, default: null },
  loading: { type: Boolean, default: false },
  etudiantsCount: { type: Number, default: 0 },
  matieresCount: { type: Number, default: 0 },
  evaluationsCount: { type: Number, default: 0 }
})
defineEmits(['back'])

/**
 * « Chargement… » n'est dit que pendant l'attente. Un chargement TERMINÉ sans
 * classe est un échec, pas une attente : le laisser afficher « Chargement… »
 * ferait patienter devant un écran mort. `classeLabel` rend alors « — ».
 */
const titre = computed(() => (props.loading && !props.classe ? 'Chargement...' : classeLabel(props.classe)))
</script>

<style scoped>
/* Header Card */
.header-card {
  background: var(--card-bg);
  color: var(--text-primary);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border-left: 4px solid var(--color-primary, #10b981);
}

/* Breadcrumb */
.breadcrumb {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  margin-bottom: 1rem;
  color: var(--text-secondary);
}

.breadcrumb-link {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  transition: color 0.2s;
}

.breadcrumb-link:hover {
  color: var(--text-primary);
}

.breadcrumb-current {
  font-weight: 500;
  color: var(--text-primary);
}

/* Page Title */
.page-title {
  font-size: 2rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: var(--text-primary);
}

/* Classe Info Line */
.classe-info-line {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  flex-wrap: wrap;
  color: var(--text-secondary);
}

.info-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.info-item strong {
  color: var(--text-primary);
}

.info-icon {
  font-size: 1rem;
  line-height: 1;
}

/* Button Retour */
.btn-retour {
  padding: 0.625rem 1.25rem;
  background: var(--bg-secondary);
  color: var(--text-primary);
  border: 1px solid var(--border-color);
  border-radius: 0.5rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-retour:hover {
  background: var(--bg-hover);
  transform: translateY(-1px);
}

/* Stats Grid Header */
.stats-grid-header {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
  margin-top: 1.5rem;
}

.stat-card-header {
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-color);
  transition: all 0.2s;
}

.stat-card-header:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.stat-header-inner {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
}

.stat-icon-header {
  font-size: 1.25rem;
  line-height: 1;
}

.stat-label-header {
  font-size: 0.875rem;
}

.stat-value-header {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: var(--text-primary);
}

/* Responsive */
@media (max-width: 768px) {
  .page-title {
    font-size: 1.5rem;
  }

  .stats-grid-header {
    grid-template-columns: 1fr;
  }

  .classe-info-line {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.75rem;
  }
}
</style>
