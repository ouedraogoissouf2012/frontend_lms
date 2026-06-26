<template>
  <div class="legend-card card">
    <h3>
      <i class="material-icons">info</i>
      Légende
    </h3>
    <div class="legend-items">
      <div class="legend-item">
        <div class="color-dot" style="background: #2563eb; /* LMS blue (séances) */"></div>
        <span>Séances</span>
      </div>
      <div class="legend-item">
        <div class="color-dot" style="background: #10b981"></div>
        <span>Visio active</span>
      </div>
      <div class="legend-item">
        <div class="color-dot" style="background: #ea580c; /* LMS orange (évaluations) */"></div>
        <span>Évaluations</span>
      </div>
      <div class="legend-item">
        <div class="color-dot" style="background: #ef4444"></div>
        <span>Urgent (&lt; 24h)</span>
      </div>
    </div>
  </div>
</template>

<script setup>
/**
 * Légende des couleurs du calendrier unifié (#107 — décomposition UniversalCalendar).
 * Sous-composant purement présentationnel : aucune prop, aucun état, aucun émetteur.
 */
</script>

<style lang="scss" scoped>
// Sous-ensemble local des variables LMS (couleurs « système » via var(--…) globales).
$lms-blue: #2563eb;
$gray-lightest: #F9FAFB;
$gray-border: #E5E7EB;
$gray-dark: #374151;
$border-radius-lg: 8px;

.legend-card {
  h3 {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0 0 1rem 0;
    font-size: 1.1rem;
    font-weight: 600;
    color: $lms-blue;

    .material-icons {
      color: $lms-blue;
      font-size: 1.5rem;
    }
  }

  .legend-items {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem;
    background: var(--bg-tertiary, $gray-lightest);
    border-radius: $border-radius-lg;
    border: 1px solid var(--border-primary, $gray-border);

    .color-dot {
      width: 16px;
      height: 16px;
      border-radius: 50%;
    }

    span {
      font-size: 0.875rem;
      color: var(--text-primary, $gray-dark);
      font-weight: 500;
    }
  }
}
</style>

<!-- Mode sombre : non-scoped pour cibler html[data-theme="dark"] (#107) -->
<style lang="scss">
$lms-blue-light: #3b82f6;
$white: #ffffff;

html[data-theme="dark"] {
  .legend-card {
    h3 {
      color: $white;

      .material-icons {
        color: $lms-blue-light;
      }
    }

    .legend-item {
      background: var(--bg-tertiary);
      border-color: var(--border-primary);

      span {
        color: var(--text-primary);
      }
    }
  }
}
</style>
