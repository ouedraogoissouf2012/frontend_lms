<template>
  <div
    class="course-card"
    @click="$emit('navigate')"
    @keydown.enter="$emit('navigate')"
    @keydown.space.prevent="$emit('navigate')"
    role="button"
    tabindex="0"
  >
    <!-- Nom matière -->
    <h3 class="course-title">
      {{ matiere.name || matiere.nom || matiere.libelle || 'Matière sans nom' }}
    </h3>

    <!-- Coefficient -->
    <p v-if="matiere.coefficient" class="course-info">
      Coefficient: {{ matiere.coefficient }}
    </p>

    <!-- Statistiques enrichies -->
    <div class="course-stats">
      <div class="stat-item">
        <i class="fa fa-diamond stat-icon"></i>
        <span class="stat-text">{{ matiere.statistiques?.nombre_lessons_publiees || 0 }} Leçon{{ (matiere.statistiques?.nombre_lessons_publiees || 0) > 1 ? 's' : '' }} publiée{{ (matiere.statistiques?.nombre_lessons_publiees || 0) > 1 ? 's' : '' }}</span>
      </div>
      <div v-if="matiere.statistiques?.nombre_lessons_brouillons > 0" class="stat-item">
        <span class="stat-icon">◇</span>
        <span class="stat-text">{{ matiere.statistiques.nombre_lessons_brouillons }} Brouillon{{ matiere.statistiques.nombre_lessons_brouillons > 1 ? 's' : '' }}</span>
      </div>
      <div class="stat-item">
        <i class="fa fa-adjust stat-icon"></i>
        <span class="stat-text">{{ matiere.statistiques?.nombre_seances || 0 }} Séance{{ (matiere.statistiques?.nombre_seances || 0) > 1 ? 's' : '' }}</span>
      </div>
      <div class="stat-item">
        <i class="fa fa-bars stat-icon"></i>
        <span class="stat-text">{{ matiere.statistiques?.nombre_evaluations || 0 }} Éval.</span>
      </div>
    </div>

    <!-- Classes -->
    <div v-if="matiere.classes && matiere.classes.length > 0" class="course-classes">
      <span
        v-for="classe in matiere.classes"
        :key="classe.id"
        class="class-badge"
      >
        {{ classe.nom || classe.name || classe.libelle }}
      </span>
    </div>

    <!-- Bouton -->
    <button @click.stop="$emit('navigate')" class="course-btn">
      <BookOpenIcon class="w-5 h-5" />
      Gérer la matière
    </button>
  </div>
</template>

<script setup>
/**
 * Carte de matiere enseignant (#H9 ≤300). Presentation pure : titre, coefficient,
 * stats, classes et bouton. Emet `navigate` (clic carte/bouton, clavier). CSS
 * deplace VERBATIM (specifique a la carte).
 */
import { BookOpenIcon } from '@heroicons/vue/24/outline'

defineProps({
  matiere: { type: Object, required: true }
})
defineEmits(['navigate'])
</script>

<style scoped>
/* Course card (MÊME DESIGN que TeacherDashboard) */
.course-card {
  background: var(--bg-primary);
  border: 1px solid var(--border-primary);
  border-radius: 0.75rem;
  padding: 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.course-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.course-card:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

.course-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 0.75rem;
}

.course-info {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin-bottom: 1rem;
}

/* Statistiques */
.course-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: var(--text-secondary);
}

.stat-icon {
  font-size: 1rem;
  color: var(--color-primary);
}

.stat-text {
  color: var(--text-secondary);
}

/* Classes */
.course-classes {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.class-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  background: rgba(59, 130, 246, 0.1);
  color: rgb(37, 99, 235);
  font-size: 0.75rem;
  border-radius: 9999px;
  font-weight: 500;
}

/* Bouton */
.course-btn {
  width: 100%;
  margin-top: 0;
  padding: 0.75rem 1rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 0.5rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.course-btn:hover {
  background: var(--color-primary-dark);
}
</style>
