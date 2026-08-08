// Route de repli (catch-all) — DOIT rester le dernier bloc concaténé dans
// router/index.js. Elle capture toute URL inconnue et rend une page 404 lisible
// au lieu d'un écran vide (vue-router n'affiche rien quand aucune route ne
// correspond).
//
// Volontairement PUBLIQUE (aucun `requiresAuth`) : avec `requiresAuth: true`,
// le guard global (router/guards.js:23-25) redirigerait tout visiteur non
// authentifié vers /login, qui subirait une redirection silencieuse au lieu du
// message d'erreur. La vue NotFound n'expose aucune donnée métier (uniquement
// le chemin saisi, interpolé donc échappé par Vue) : aucune fuite d'information.
//
// Lazy loading systématique (#27), comme toutes les autres routes.
export const fallbackRoutes = [
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue'),
    meta: { title: 'Page introuvable' }
  }
]
