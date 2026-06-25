<template>
  <div
    class="class-card"
    :title="`Classe: ${classe.name || classe.libelle}`"
  >
    <div class="class-header">
      <div class="class-info">
        <h3 class="class-name" :title="`Nom de la classe: ${classe.name || classe.libelle}`">
          {{ classe.name || classe.libelle }}
        </h3>
        <span
          v-if="classe.niveau"
          class="class-niveau"
          :title="`Niveau: ${classe.niveau.name || classe.niveau.nom || classe.niveau.libelle}`"
        >
          {{ classe.niveau.name || classe.niveau.nom || classe.niveau.libelle }}
        </span>
      </div>
      <span
        v-if="classe.is_active"
        class="active-badge"
        title="Classe active pour l'année en cours"
      >
        <span class="pulse-dot"></span>
        Active
      </span>
    </div>

    <div
      v-if="classe.filiere"
      class="class-filiere"
      :title="`Filière: ${classe.filiere.name || classe.filiere.nom} (${classe.filiere.code || 'N/A'})`"
    >
      <AcademicCapIcon class="filiere-icon" />
      <div>
        <p class="filiere-name">{{ classe.filiere.name || classe.filiere.nom }}</p>
        <p v-if="classe.filiere.code" class="filiere-code">Code: {{ classe.filiere.code }}</p>
      </div>
    </div>

    <div class="class-stats">
      <div
        class="stat-item"
        :title="`${classe.places_occupees || 0} étudiants inscrits sur ${classe.places_totales || 0} places disponibles`"
      >
        <UserGroupIcon class="stat-icon text-blue-600" />
        <div>
          <p class="stat-label">Étudiants</p>
          <p class="stat-value">{{ classe.places_occupees || 0 }}/{{ classe.places_totales || 0 }}</p>
        </div>
      </div>

      <div
        class="stat-item"
        :title="`${classe.nb_matieres || 0} matière(s) enseignée(s) dans cette classe`"
      >
        <BookOpenIcon class="stat-icon text-orange-600" />
        <div>
          <p class="stat-label">Matières</p>
          <p class="stat-value">{{ classe.nb_matieres || 0 }}</p>
        </div>
      </div>
    </div>

    <div class="class-actions">
      <div class="info-badge" :title="`Afficher les détails de ${classe.name || classe.libelle}`">
        <EyeIcon class="w-5 h-5" />
        <span>{{ classe.name || classe.libelle }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Carte de classe enseignant (#H9 ≤300). Presentation pure : en-tete, filiere,
 * stats (effectifs, matieres) et badge. CSS deplace VERBATIM (specifique a la carte).
 */
import {
  UserGroupIcon,
  BookOpenIcon,
  AcademicCapIcon,
  EyeIcon
} from '@heroicons/vue/24/outline'

defineProps({
  classe: { type: Object, required: true }
})
</script>

<style scoped>
.class-card {
  background: var(--card-bg);
  border-radius: 0.75rem;
  box-shadow: var(--card-shadow);
  padding: 1.5rem;
  transition: all 0.2s;
}

.class-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-2px);
}

.class-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-primary);
}

.class-info {
  flex: 1;
}

.class-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.5rem 0;
}

.class-niveau {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: #e0e7ff;
  color: #5b21b6;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}

.active-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: #dcfce7;
  color: #15803d;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}

.pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.class-filiere {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}

.filiere-icon {
  width: 2rem;
  height: 2rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.filiere-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0 0 0.25rem 0;
}

.filiere-code {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0;
}

.class-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.stat-icon {
  width: 1.5rem;
  height: 1.5rem;
  flex-shrink: 0;
}

.stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.class-actions {
  display: flex;
  justify-content: center;
  padding-top: 0.5rem;
}

.info-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
  font-weight: 500;
}
</style>
