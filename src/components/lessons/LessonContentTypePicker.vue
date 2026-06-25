<template>
  <div class="form-section">
    <h2 class="section-title"><i class="fa fa-th-large"></i> Type de contenu principal</h2>

    <div class="content-type-grid">
      <label
        v-for="type in contentTypes"
        :key="type.value"
        :class="['content-type-card', { 'active': contentType === type.value }]"
      >
        <input
          v-model="contentType"
          type="radio"
          :value="type.value"
          class="content-type-radio"
        />
        <div class="content-type-icon">{{ type.icon }}</div>
        <div class="content-type-label">{{ type.label }}</div>
      </label>
    </div>
  </div>
</template>

<script setup>
/**
 * Sélecteur du type de contenu principal de LessonEditor (#H4 ≤300) : grille de cartes
 * radio. Type sélectionné en v-model (defineModel), liste via la prop `contentTypes`.
 * Chrome de formulaire dupliqué VERBATIM.
 */
const contentType = defineModel({ type: String, default: 'text' })

defineProps({
  contentTypes: { type: Array, default: () => [] }
})
</script>

<style scoped>
.form-section {
  background: var(--card-bg);
  border-radius: 0.75rem;
  padding: 2rem;
  box-shadow: var(--card-shadow);
}

.section-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 1.5rem 0;
}

/* Content Type Grid */
.content-type-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.content-type-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
}

.content-type-card:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}

.content-type-card.active {
  background: rgba(59, 130, 246, 0.1);
  border-color: #3b82f6;
}

.content-type-radio {
  position: absolute;
  opacity: 0;
}

.content-type-icon {
  font-size: 2rem;
}

.content-type-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--text-primary);
  text-align: center;
}

/* Responsive */
@media (max-width: 768px) {
  .content-type-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
