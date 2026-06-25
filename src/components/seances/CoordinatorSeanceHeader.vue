<template>
  <div>
    <!-- Header -->
    <div class="page-header">
      <div class="header-content">
        <i class="fa fa-dot-circle-o page-icon"></i>
        <div>
          <h1 class="page-title">Gestion des Séances & Visioconférence</h1>
          <p class="page-subtitle">Activez ou désactivez la visioconférence pour chaque séance</p>
        </div>
      </div>
    </div>

    <!-- View Toggle -->
    <div class="view-toggle">
      <button
        :class="['toggle-btn', viewMode === 'list' ? 'active' : '']"
        @click="viewMode = 'list'"
      >
        <i class="fa fa-list"></i>
        Liste
      </button>
      <button
        :class="['toggle-btn', viewMode === 'calendar' ? 'active' : '']"
        @click="viewMode = 'calendar'"
      >
        <i class="fa fa-calendar"></i>
        Calendrier
      </button>
    </div>
  </div>
</template>

<script setup>
/**
 * En-tête + bascule de vue (liste/calendrier) de SeanceManagement (#H6 ≤300).
 * Présentation pure extraite VERBATIM ; le mode courant est piloté via
 * v-model (`viewMode`).
 */
const viewMode = defineModel('viewMode', { default: 'list' })
</script>

<style scoped>
/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.page-icon {
  font-size: 3rem;
  line-height: 1;
  color: var(--primary-color, #6366f1);
  flex-shrink: 0;
}

.page-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.page-subtitle {
  font-size: 0.875rem;
  color: var(--text-secondary);
  margin: 0.25rem 0 0 0;
}

/* View Toggle */
.view-toggle {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  background: var(--card-bg);
  padding: 0.5rem;
  border-radius: 0.75rem;
  width: fit-content;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.toggle-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: transparent;
  border: none;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
}

.toggle-btn:hover {
  background: var(--hover-bg);
  color: var(--text-primary);
}

.toggle-btn.active {
  background: var(--primary-color, #6366f1);
  color: white;
}

.toggle-btn i {
  font-size: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
