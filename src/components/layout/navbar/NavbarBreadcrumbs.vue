<template>
  <div class="navbar-left">
    <h1 class="page-title">{{ pageTitle }}</h1>
    <div v-if="breadcrumbs.length" class="breadcrumbs">
      <span v-for="(crumb, index) in breadcrumbs" :key="index" class="breadcrumb-item">
        <span v-if="index > 0" class="separator">/</span>
        <router-link v-if="crumb.to" :to="crumb.to" class="breadcrumb-link">
          {{ crumb.label }}
        </router-link>
        <span v-else class="breadcrumb-text">{{ crumb.label }}</span>
      </span>
    </div>
  </div>
</template>

<script setup>
/**
 * Section gauche de la navbar (#H12) : titre de page + fil d'Ariane.
 * Présentationnel : reçoit `pageTitle` et `breadcrumbs` calculés par useNavbar.
 */
defineProps({
  pageTitle: { type: String, default: '' },
  breadcrumbs: { type: Array, default: () => [] }
})
</script>

<style scoped>
/* Left Section */
.navbar-left {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.page-title {
  font-size: var(--font-size-xl);
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.breadcrumbs {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
}

.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
}

.separator {
  color: var(--text-tertiary);
}

.breadcrumb-link {
  color: var(--text-secondary);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.breadcrumb-link:hover {
  color: var(--blue-600);
}

.breadcrumb-text {
  color: var(--text-primary);
  font-weight: 500;
}

/* Responsive */
@media (max-width: 768px) {
  .breadcrumbs {
    display: none;
  }
}
</style>
