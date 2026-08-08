<template>
  <p class="password-unavailable" role="status">
    {{ PASSWORD_CHANGE_UNAVAILABLE_MESSAGE }}
  </p>
</template>

<script setup>
/**
 * Bannière neutre affichée dans les 3 modales de changement de mot de passe :
 * la fonctionnalité n'existe pas côté backend (cf. `@/constants/passwordChange`).
 * Composant volontairement jetable : à supprimer avec le module de constantes
 * le jour où l'endpoint existe.
 */
import { PASSWORD_CHANGE_UNAVAILABLE_MESSAGE } from '@/constants/passwordChange'
</script>

<style scoped>
.password-unavailable {
  margin-bottom: 1.25rem;
  padding: 0.75rem 1rem;
  border: 1px solid var(--border-primary);
  border-radius: 0.5rem;
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 0.875rem;
  line-height: 1.4;
}
</style>
