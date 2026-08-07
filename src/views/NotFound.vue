<template>
  <main class="notfound">
    <section class="notfound__card">
      <p class="notfound__code">404</p>
      <h1 class="notfound__title">Page introuvable</h1>
      <p class="notfound__text">
        L'adresse demandée ne correspond à aucune page de la plateforme.
        Le lien est peut-être erroné ou la page a été déplacée.
      </p>
      <p class="notfound__path">{{ requestedPath }}</p>

      <div class="notfound__actions">
        <router-link :to="homeTarget" class="notfound__btn notfound__btn--primary">
          {{ homeLabel }}
        </router-link>
        <button type="button" class="notfound__btn notfound__btn--secondary" @click="goBack">
          Page précédente
        </button>
      </div>
    </section>
  </main>
</template>

<script setup>
/**
 * Page 404 (route catch-all `/:pathMatch(.*)*`).
 *
 * Volontairement PUBLIQUE (pas de `requiresAuth`) : sinon le guard global
 * renverrait tout visiteur non authentifié vers /login (guards.js:23-25), qui
 * subirait une redirection silencieuse au lieu d'un message clair. La vue
 * n'affiche aucune donnée métier, seulement le chemin saisi (interpolé, donc
 * échappé par Vue — pas de v-html).
 *
 * Le bouton principal cible le dashboard du rôle via la source unique
 * `getDashboardRoute` (#18) quand la session existe, /login sinon.
 */
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { auth } from '@/services/api'
import { getDashboardRoute } from '@/constants/roles'

const route = useRoute()
const router = useRouter()

const isAuthenticated = computed(() => auth.isAuthenticated())
const requestedPath = computed(() => route.fullPath)

const homeTarget = computed(() =>
  isAuthenticated.value ? getDashboardRoute(auth.getUser()) : '/login'
)

const homeLabel = computed(() =>
  isAuthenticated.value ? 'Retour au tableau de bord' : 'Aller à la connexion'
)

/** Retour arrière si l'historique le permet, sinon repli sur la cible d'accueil. */
function goBack() {
  if (window.history.length > 1) {
    router.back()
    return
  }
  router.push(homeTarget.value)
}
</script>

<style scoped>
.notfound {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  background: var(--bg-secondary);
}

.notfound__card {
  width: 100%;
  max-width: 32rem;
  text-align: center;
  padding: var(--spacing-2xl) var(--spacing-xl);
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  box-shadow: var(--card-shadow);
}

.notfound__code {
  margin: 0;
  font-size: var(--font-size-4xl);
  font-weight: 800;
  letter-spacing: 0.05em;
  color: var(--primary-color);
}

.notfound__title {
  margin: var(--spacing-sm) 0 0;
  font-size: var(--font-size-2xl);
  font-weight: 700;
  color: var(--text-primary);
}

.notfound__text {
  margin: var(--spacing-md) 0 0;
  font-size: var(--font-size-base);
  line-height: 1.6;
  color: var(--text-secondary);
}

.notfound__path {
  margin: var(--spacing-md) 0 0;
  padding: var(--spacing-sm) var(--spacing-md);
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-primary);
  border-radius: var(--radius-md);
  overflow-wrap: anywhere;
}

.notfound__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
  justify-content: center;
  margin-top: var(--spacing-xl);
}

.notfound__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-sm) var(--spacing-lg);
  font-size: var(--font-size-sm);
  font-weight: 600;
  text-decoration: none;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-base);
}

.notfound__btn--primary {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
}

.notfound__btn--primary:hover {
  background: var(--btn-primary-hover);
}

.notfound__btn--secondary {
  background: var(--btn-secondary-bg);
  color: var(--btn-secondary-text);
  border-color: var(--border-primary);
}

.notfound__btn--secondary:hover {
  background: var(--btn-secondary-hover);
}

.notfound__btn:focus-visible {
  outline: 2px solid var(--border-focus);
  outline-offset: 2px;
}

@media (max-width: 480px) {
  .notfound__card {
    padding: var(--spacing-xl) var(--spacing-md);
  }

  .notfound__btn {
    width: 100%;
  }
}
</style>
