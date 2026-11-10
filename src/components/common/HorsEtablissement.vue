<template>
  <div data-test="hors-etablissement" class="p-8 text-center text-gray-600 dark:text-gray-300">
    <p>{{ sujet }} relève d'un établissement. Votre compte gère la plateforme, pas un établissement.</p>
    <p class="mt-2">
      Votre espace :
      <router-link :to="espace.chemin" class="font-semibold text-primary-600 hover:underline">{{ espace.libelle }}</router-link>.
    </p>
  </div>
</template>

<script setup>
/**
 * Orientation du supradmin sur un écran d'ÉCOLE (R3).
 *
 * Le garde du routeur le laisse passer partout ; le serveur lui refuse le contenu d'une école
 * (D56). Au lieu d'afficher le refus (« Contactez votre administrateur », un conseil faux pour
 * l'exploitant de la plateforme), l'écran dit ce qu'il est et où est son espace.
 */
import { getDashboardRoute, ROLES } from '@/constants/roles'

defineProps({
  /** Ce que l'écran présente, en début de phrase : « Ce forum », « Ce contenu »… */
  sujet: { type: String, required: true },
})

// Le libellé suit la cible : l'espace du supradmin est sa page d'accueil (DASHBOARD_ROUTES).
const LIBELLES = { '/admin/institutions': 'Institutions' }
const chemin = getDashboardRoute(ROLES.SUPRADMIN)
const espace = { chemin, libelle: LIBELLES[chemin] ?? 'votre tableau de bord' }
</script>
