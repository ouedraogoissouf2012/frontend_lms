# Contribuer — conventions front (lms-frontend)

Ce document fixe les conventions de paradigme Vue du projet. Les règles de
qualité générales (architecture, tests, pas d'exposition d'erreur brute, limite
de taille de fichier) sont dans `PRODUCTION_STANDARDS.md` du dépôt backend.

## 1. Composants : `<script setup>` (Composition API) par défaut

**Tout nouveau composant DOIT utiliser `<script setup>`** (Composition API).
C'est le style recommandé par la doc officielle Vue pour les applications
complètes : moins de boilerplate, meilleure inférence, et surtout les
**composables** s'y intègrent naturellement (réutilisation de logique).

```vue
<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ /* ... */ })
const emit = defineEmits(['update'])
const count = ref(0)
const double = computed(() => count.value * 2)
</script>
```

- Ne pas créer de nouveaux composants en Options API (`export default {}`) ni en
  `setup()` explicite.
- **Migration de l'existant : opportuniste, pas big-bang** (#27). Un fichier
  Options API encore présent est migré vers `<script setup>` quand une autre
  tâche le touche déjà — on ne convertit pas tout en une fois (risque/bruit de
  revue). Des god-components restent en Options API en attendant #28.
- Logique partagée → **composable** (`src/composables/`, préfixe `use*`) ;
  fonctions pures → `src/utils/` ; valeurs figées → `src/constants/`.

Réfs : [Composition API FAQ](https://vuejs.org/guide/extras/composition-api-faq.html)
· [`<script setup>`](https://vuejs.org/api/sfc-script-setup.html).

## 2. Router : lazy loading systématique

**Toute route DOIT charger son composant en dynamic import** pour le code
splitting (un chunk par route, bundle initial minimal) :

```js
{
  path: '/exemple',
  name: 'Exemple',
  component: () => import('@/views/Exemple.vue'), // ✅ lazy
}
```

- Ne pas importer les vues en tête de `src/router/index.js` puis les référencer
  en `component: Vue` (eager) — cela les fait entrer dans le bundle initial.
- Gain mesuré (#27) : bundle initial `index` **1124.93 kB → 221.58 kB**
  (gzip 338 → 83 kB) après conversion des 30 routes eager restantes.

Réf : [Vue Router — Lazy Loading](https://router.vuejs.org/guide/advanced/lazy-loading.html).

## 3. Vérifications avant PR

```bash
npm run test          # tests unitaires (Vitest)
npm run test:contract # contrat API (chemins backend figés)
npm run lint:css      # garde anti-régression couleurs en dur (#161)
npm run lint:size     # garde anti-régression fichiers > 300 lignes (#195)
npm run lint:dewrap   # garde anti-régression dé-wrap d'enveloppe ad hoc (#296)
npm run build         # build prod (vérifie le code splitting)
```

> Note : un chunk reste > 500 kB (`LessonChapters`, éditeur riche embarqué).
> Il est désormais **isolé dans son propre chunk lazy** ; son allègement
> (import dynamique de l'éditeur / `manualChunks`) est une optimisation séparée.

## 4. Couleurs : tokens uniquement, jamais en dur (#161)

**Toute couleur DOIT passer par un token CSS** défini via le barrel
`src/assets/styles/themes.css` et ses partials `src/assets/styles/theme/*.css`.
Une couleur hex en dur (`color: #1e6fd9`) est
**interdite** : elle casse le theming clair/sombre et la cohérence de marque.

```css
.btn { color: var(--color-primary); }            /* ✅ token */
.btn { color: var(--color-primary, #1e6fd9); }   /* ✅ fallback toléré */
.btn { color: #1e6fd9; }                          /* ❌ refusé par lint:css */
```

**Garde automatique** — `npm run lint:css` (Stylelint `color-no-hex`, exécuté en
CI sur chaque PR vers `dev`/`main`) fait **échouer** toute couleur hex en dur
introduite. Mécanisme :

- **Ratchet sur baseline figée.** Les couleurs en dur déjà présentes (résidus
  sans token, suivis dans #136) sont gelées dans `.stylelint-color-baseline.json`
  et n'échouent pas. **Tout nouvel** hex (absent de la baseline, ou occurrence
  surnuméraire dans un fichier) échoue. La baseline ne fait que se resserrer.
- **Exceptions** : le fallback `var(--token, #hex)` est autorisé (y compris en
  code neuf) ; les hex hors CSS (`:style` JS, `placeholder="#..."`, `value` d'un
  input couleur, blocs `<template>`/`<script>`) ne sont pas analysés.
- **`$scss-var: #hex` n'est PAS exempté** : ce sont des couleurs en dur comme les
  autres (le système de tokens repose sur les custom properties CSS, pas sur les
  variables SCSS). Préférer un token CSS.
- **Source des tokens** : `themes.css` et `src/assets/styles/theme/*.css` sont
  exclus (`ignoreFiles`) — c'est là que les couleurs hex *doivent* vivre.

**Si une couleur n'a vraiment aucun token** (cas rare, gap #136) : justifie-le en
PR puis exécute `npm run lint:css:baseline` pour l'inscrire explicitement dans la
baseline. Ne jamais désactiver la règle globalement ni ignorer un fichier entier.

## 5. Taille des fichiers : 300 lignes maximum (#195)

Les fichiers source sous `src/**` (`.vue`, `.js`, `.ts`, `.scss`, `.css`) doivent
rester à **300 lignes maximum**. Le but est d'éviter le retour des god-files et
de forcer les découpages par composant, composable, helper ou partial CSS.

**Garde automatique** — `npm run lint:size` échoue si :

- un fichier source non listé dans `.file-size-baseline.json` dépasse 300 lignes ;
- un fichier legacy déjà listé dans la baseline grossit encore.

La baseline est un ratchet : réduire ou supprimer un fichier legacy est accepté,
mais la CI ne l'élargit jamais automatiquement. Pour une exception temporaire et
justifiée en PR, exécuter `npm run lint:size:baseline` puis expliquer pourquoi le
découpage ne peut pas être fait dans la même tâche.

## 6. Enveloppe API : dé-wrapper les listes via `extractList`, jamais à la main (#296)

Le backend KLASSCI emballe les listes dans une enveloppe
(`{ success, data: [...] }`, parfois paginée `{ data: { data: [...] } }`). Le
seul point de dé-wrap autorisé est le helper canonique **`extractList`**
(`src/utils/apiList.js`), qui absorbe ces trois formes de manière cohérente.

```js
import { extractList } from '@/utils/apiList'
const rows = extractList(response, ['classes'])   // ✅ tableau, {data:[]}, {data:{data:[]}}

const rows = response.data || []                   // ❌ refusé par lint:dewrap
const rows = response.data.data                    // ❌ refusé par lint:dewrap
```

**Garde automatique** — `npm run lint:dewrap` (exécuté en CI sur chaque PR vers
`dev`/`main`) fait **échouer** tout dé-wrap ad hoc introduit. Mécanisme :

- **Ratchet sur baseline figée.** Les quelques dé-wraps manuels legacy sont gelés
  dans `.dewrap-baseline.json` et n'échouent pas. **Tout nouveau** dé-wrap (ou
  occurrence surnuméraire dans un fichier) échoue. La baseline ne fait que se
  resserrer.
- **Formes refusées** : `.data || []`, `.data ?? []`, `.data.data`, `.data?.data`
  — le `[]` prouve l'intention « liste », que `extractList` remplace.
- **Exceptions** (non refusées, car légitimes) : la lecture d'un corps d'**erreur**
  axios (`error.response.data...`), le repli **objet** `.data || {}` /
  `.data ?? {}` (ex. `MessageEvent.data`, `extendedProps.data` de FullCalendar),
  les occurrences en commentaire `//`, et le helper `src/utils/apiList.js` lui-même.

**Si un dé-wrap manuel est vraiment inévitable** (rare) : justifie-le en PR puis
exécute `npm run lint:dewrap:baseline` pour l'inscrire explicitement dans la
baseline. Ne jamais contourner la garde en renommant la variable pour masquer le
motif.
