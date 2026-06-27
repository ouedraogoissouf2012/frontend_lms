<template>
  <div class="class-card">
          <!-- Header -->
          <div class="class-header">
            <div class="class-info">
              <h3 class="class-name">{{ classe.name || classe.libelle }}</h3>
              <div class="class-badges">
                <span v-if="classe.filiere" class="badge badge-filiere">
                  {{ classe.filiere.code || classe.filiere.nom }}
                </span>
                <span v-if="classe.niveau" class="badge badge-niveau">
                  {{ classe.niveau.code || classe.niveau.nom }}
                </span>
              </div>
            </div>
            <span v-if="classe.is_active" class="active-badge" title="Classe active cette année">
              <span class="pulse-dot"></span>
              Active
            </span>
          </div>

          <!-- Filiere Section -->
          <div v-if="classe.filiere" class="class-section">
            <i class="fa fa-home section-icon"></i>
            <div>
              <p class="section-label">Filière</p>
              <p class="section-value">{{ classe.filiere.name || classe.filiere.nom }}</p>
            </div>
          </div>

          <!-- Stats -->
          <div class="class-stats">
            <div class="stat-item">
              <i class="fa fa-user stat-icon"></i>
              <div>
                <p class="stat-label">Étudiants</p>
                <p class="stat-value">{{ classe.places_occupees || 0 }}/{{ classe.places_totales || 0 }}</p>
              </div>
            </div>

            <div class="stat-item">
              <span class="stat-icon">☷</span>
              <div>
                <p class="stat-label">Matières</p>
                <p class="stat-value">{{ classe.nb_matieres || 0 }}</p>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="class-actions">
            <button
              @click="$emit('view', classe)"
              class="btn-action btn-primary"
              title="Voir les détails de la classe"
            >
              <span class="btn-icon">→</span>
              Détails
            </button>
          </div>
        </div>
</template>

<script setup>
/**
 * Carte d'une classe (#G1 décompo — extraite d'AdminClasses, grille de classes).
 * Présentation : reçoit la classe, émet view au clic sur « Détails ».
 */
defineProps({ classe: { type: Object, required: true } })
defineEmits(['view'])
</script>

<style scoped lang="scss">
.class-card {
  background: var(--bg-primary);
  border-radius: 1rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}
.class-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}
.class-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color);
}
.class-info {
  flex: 1;
}
.class-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 0.75rem 0;
}
.class-badges {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}
.badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
}
.badge-filiere {
  background: var(--indigo-100);
  color: var(--violet-800);
}
.badge-niveau {
  background: var(--warning-bg);
  color: var(--amber-800);
}
.active-badge {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.375rem 0.75rem;
  background: var(--success-bg);
  color: var(--emerald-700);
  border-radius: 0.5rem;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
}
.pulse-dot {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--emerald-500);
  border-radius: 50%;
  animation: pulse 2s infinite;
}
.class-section {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--bg-secondary);
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}
.section-icon {
  font-size: 2rem;
  line-height: 1;
  flex-shrink: 0;
}
.section-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}
.section-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
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
.stat-item .stat-icon {
  font-size: 1.5rem;
  line-height: 1;
  flex-shrink: 0;
}
.stat-item .stat-label {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin: 0 0 0.25rem 0;
}
.stat-item .stat-value {
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
.btn-action {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.btn-primary {
  background: linear-gradient(135deg, var(--blue-500) 0%, var(--color-info-strong) 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}
.btn-primary:hover {
  background: linear-gradient(135deg, var(--color-info-strong) 0%, #1d4ed8 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
}

/* Règles partagées avec le bloc stats du parent (copie locale assumée : scoping enfant) */
.stat-icon {
  font-size: 1.25rem;
  line-height: 1;
}
.stat-label {
  font-size: 0.875rem;
  color: var(--text-secondary);
}
.stat-value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.btn-icon {
  font-size: 1.25rem;
  line-height: 1;
}
</style>
