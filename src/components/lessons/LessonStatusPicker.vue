<template>
  <div class="form-section">
    <h2 class="section-title"><i class="fa fa-toggle-on"></i> Statut de publication</h2>

    <div class="status-grid">
      <label :class="['status-card', { 'active': status === 'draft' }]">
        <input
          v-model="status"
          type="radio"
          value="draft"
        />
        <div class="status-icon">[D]</div>
        <div class="status-name">Brouillon</div>
        <div class="status-desc">La leçon ne sera pas visible par les étudiants</div>
      </label>

      <label :class="['status-card', { 'active': status === 'published' }]">
        <input
          v-model="status"
          type="radio"
          value="published"
        />
        <div class="status-icon">[√]</div>
        <div class="status-name">Publié</div>
        <div class="status-desc">La leçon sera visible et accessible aux étudiants</div>
      </label>

      <label :class="['status-card', { 'active': status === 'archived' }]">
        <input
          v-model="status"
          type="radio"
          value="archived"
        />
        <div class="status-icon">[A]</div>
        <div class="status-name">Archivé</div>
        <div class="status-desc">La leçon est conservée mais n'est plus accessible</div>
      </label>
    </div>
  </div>
</template>

<script setup>
/**
 * Section « Statut de publication » de LessonEditor (#H4 ≤300) : cartes radio
 * brouillon/publié/archivé. Statut en v-model (defineModel). Chrome dupliqué VERBATIM.
 */
const status = defineModel({ type: String, default: 'draft' })
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

/* Status Grid */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.status-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: var(--bg-secondary);
  border: 2px solid var(--border-primary);
  border-radius: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  text-align: center;
}

.status-card:hover {
  background: var(--bg-tertiary);
  transform: translateY(-2px);
}

.status-card.active {
  background: rgba(59, 130, 246, 0.1);
  border-color: var(--blue-500);
}

.status-card input[type="radio"] {
  position: absolute;
  opacity: 0;
}

.status-icon {
  font-size: 2rem;
}

.status-name {
  font-size: 1rem;
  font-weight: 700;
  color: var(--text-primary);
}

.status-desc {
  font-size: 0.813rem;
  color: var(--text-secondary);
  line-height: 1.4;
}

/* Responsive */
@media (max-width: 768px) {
  .status-grid {
    grid-template-columns: 1fr;
  }
}
</style>
