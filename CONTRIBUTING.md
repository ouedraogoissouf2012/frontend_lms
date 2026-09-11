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
npm run lint:ocp      # garde OCP présentation : pas de nouveau couplage (#325/#330)
npm run lint:klassci-fixtures  # garde : aucune charge KLASSCI écrite à la main (#367)
npm run lint:cles     # garde : aucune lecture d'une clé que l'API n'envoie pas (#376)
npm run build         # build prod (vérifie le code splitting)
npm run lint:fonts    # après build : aucune fonte non-woff2 émise dans dist (#340)
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

## 7. OCP présentation : pas de nouveau couplage dans un composant (#325 / #330)

**Aucun composant ni aucune vue n'apprend l'existence du mode d'établissement.**
Un composant reçoit des données déjà normalisées. Le point de résolution est le
composable (ou le service qu'il consomme).

Sous `src/components/**` et `src/views/**` sont refusés :

- le mot `klassci` sous toutes ses casses (y compris `klassci_*` comme clé) ;
- `isStandalone`, `institution.mode` ;
- le couplage de forme : `programmation`, `matiere_nom` / `classe_nom` /
  `enseignant_nom`, rôles bruts `'superAdmin'` / `'secretaire'`.

```vue
<option :value="enseignant.klassci_id">     <!-- ❌ -->
<option :value="enseignant.id">             <!-- ✅ id déjà résolu en amont -->
{{ seance.programmation?.date }}            <!-- ❌ enveloppe KLASSCI -->
{{ seance.date }}                           <!-- ✅ plat, normalisé à la frontière -->
```

**Garde automatique** — `npm run lint:ocp` (exécuté en CI sur chaque PR vers
`dev`/`main`) fait **échouer** tout nouveau couplage. Mécanisme :

- **Ratchet sur baseline figée.** Les hits legacy sont gelés dans
  `.ocp-baseline.json`. **Tout nouveau** hit (ou occurrence surnuméraire) échoue.
  La baseline ne fait que se resserrer.
- **Dénominateur imprimé** : `N files inspected`. Si N = 0, sortie **2** — ce
  n'est pas un vert.
- **Allow-list** : `InstitutionFormModal.vue` configure l'intégration elle-même ;
  ce n'est pas une dérogation art. 7, c'est le périmètre de la garde.
- Les commentaires `//` ne sont pas analysés.

**Si un couplage est vraiment inévitable** : trois demandes explicites et
distinctes au mainteneur (épique #325 art. 7), ADR daté, puis
`npm run lint:ocp:baseline`. Ne jamais élargir la baseline pour faire passer un
écran neuf.

## 8. Fontes d'icônes : woff2 uniquement dans `dist` (#340)

Les CSS d'icônes vendored (`font-awesome`, `material-icons`) déclarent leurs
`@font-face` en multi-format (`eot`/`ttf`/`svg`/`woff`/`woff2`). Le runtime ne
télécharge déjà que le woff2 (override `@font-face`, #341/#295), mais Vite
**émettait** tous les formats dans `dist/assets` (~962 Ko de poids mort).

**Correctif** — le plugin Vite `strip-dead-icon-fonts` (`enforce: 'pre'`,
`scripts/vite-strip-dead-fonts.mjs`) retire les sources non-woff2 des `@font-face`
de ces CSS **avant** que `vite:css` ne scanne/émette les `url()`. Un plugin PostCSS
classique ne suffit PAS : il s'exécute *après* le scan d'assets de Vite (le CSS
final était bien woff2-only, mais les fichiers morts étaient quand même émis).

**Garde automatique** — `npm run lint:fonts` (après `npm run build`, exécuté en CI
dans le job build) échoue si `dist/assets` contient une fonte non-woff2
(`eot`/`ttf`/`otf`/`woff`, ou un `.svg` de fonte d'icône connue). Cible : **0**.
Une police non-woff2 légitime (rare) suppose d'ajuster `scripts/check-dist-fonts.mjs`.

## 9. Charges KLASSCI : capturées, jamais écrites de mémoire (#367)

**Un test qui consomme KLASSCI importe ses charges de `tests/fixtures/klassci/`.**
Ce module ne contient que des réponses **réellement capturées**, chacune avec sa
provenance : date, compte, endpoint.

```js
import { TEACHER_DASHBOARD } from '../fixtures/klassci/teacherDashboard'  // ✅
const DASHBOARD = { statistiques: { heures: { total_seances: 12 } } }     // ❌ refusé
```

**Pourquoi cette règle existe.** Quinze fichiers de test décrivaient l'API amont
de mémoire — 42 occurrences mesurées. L'un d'eux inventait **six clés** que
KLASSCI n'envoie pas (`total_etudiants`, `total_lecons`, `corrections_effectuees`,
`visio_effectuees`, `messages_forum`, et `seances` au lieu de
`prochaines_seances`). Le test était **vert** ; l'écran `/teacher/stats` affichait
**six tuiles sur huit à zéro en production**, dont « Séances Données : 0 » alors
que KLASSCI en déclare 105.

Rien ne pouvait l'attraper : un test qui **écrit lui-même sa donnée d'entrée** ne
peut pas découvrir qu'elle est fausse. Ni ESLint, ni la suite, ni la revue ne
distinguent une charge capturée d'une charge inventée — les deux sont du
JavaScript valide décrivant un objet plausible. C'est un angle mort
**structurel**, pas une inattention.

**Garde automatique** — `npm run lint:klassci-fixtures` (exécutée en CI sur chaque
PR vers `dev`/`main`) fait **échouer** toute charge écrite à la main hors du
module. Mécanisme :

- **Ratchet sur baseline figée.** Les 41 occurrences héritées sont gelées dans
  `.klassci-fixture-baseline.json`. Toute occurrence **neuve** échoue. La baseline
  ne fait que se resserrer.
- **Dénominateur imprimé** : `N fichiers inspectés`. Si N = 0, sortie **2** — ce
  n'est pas un vert. Idem si la baseline est absente ou illisible.
- **Périmètre** : seuls les fichiers `*.test.js` qui référencent un service
  KLASSCI (`services/klassci`, `getTeacherDashboard`, `/proxy/`). Un test qui
  manipule par hasard une clé au nom voisin n'est pas concerné.
- Les commentaires `//` ne sont pas analysés — un commentaire décrit une charge,
  il n'en fabrique pas.
- Le cœur pur vit dans `scripts/lib/klassciFixtureRatchet.mjs`, et son **test de
  rougissement** dans `tests/unit/klassciFixtureRatchet.test.js` : une garde sans
  test de rougissement n'est pas une garde.

**Pour ajouter une charge** : appeler l'endpoint avec un vrai jeton, coller la
réponse, noter la provenance. **Ne pas l'abréger « pour la lisibilité »** — les
clés absentes d'un extrait sont indiscernables des clés absentes de l'API, et
c'est exactement la confusion que ce module supprime. Réduire le nombre
d'**éléments** d'une liste, jamais le nombre de **clés**.

## 10. Aucune lecture d'une clé que l'API n'envoie pas (#376)

**Un écran ne lit que des clés présentes dans la charge réellement mesurée.**

```js
{{ dashboardData.statistiques?.total_lecons || 0 }}   // ❌ la clé n'existe pas → 0 permanent
{{ user.nom }} {{ user.prenom }}                      // ❌ le login n'envoie que `name`
```

**Pourquoi cette règle existe.** Quatre fois en trois jours, du code a lu une clé
absente, et le repli l'a transformée en valeur plausible :

| Défaut | Ce que l'utilisateur voyait |
|---|---|
| `statistiques.total_lecons` (#371) | « Leçons Créées : 0 » alors que le LMS répondait **2** dans le même chargement |
| `user.nom` / `user.prenom` (#372) | nom **vide** dans la barre latérale, sur toutes les pages, tous rôles |
| `statistiques.total_etudiants` + 5 autres (#365) | **six tuiles sur huit** à zéro |

`payload.cle_qui_nexiste_pas` est du **JavaScript parfaitement valide** : ni
ESLint, ni la suite de tests, ni la revue ne peuvent le voir. Seule une
comparaison à la charge mesurée tranche.

**Garde automatique** — `npm run lint:cles` (exécutée en CI sur chaque PR vers
`dev`/`main`). Mécanisme :

- **La vérité vient des fixtures**, pas du script : les clés autorisées sont
  dérivées de `tests/fixtures/**`, qui sont des réponses **capturées** avec leur
  provenance. Ajouter un champ au backend puis à la fixture suffit à l'autoriser.
- **Le porteur décide, pas le nom de la clé.** `matiere.nom` est légitime,
  `user.nom` ne l'est pas. Chaque destinataire surveillé est déclaré
  explicitement dans `scripts/lib/clesInexistantes.mjs`, avec sa **portée** —
  un `user` n'est l'utilisateur connecté que si le fichier le tient de
  `auth.getUser()` / du store.
- **Cliquet sur baseline.** Les 8 lectures héritées sont gelées dans
  `.cles-inexistantes-baseline.json`. Toute lecture **neuve** échoue.
- **Dénominateur imprimé** : nombre de fichiers inspectés et de clés connues par
  destinataire. Si la garde ne peut pas travailler — fixture illisible, rien à
  inspecter, baseline absente — elle sort en **2**, pas en 0.
- **Exemptés** : les normaliseurs et helpers polymorphes (`utils/formatters.js`,
  `utils/teacherDashboard.js`, `utils/classStats.js`…). C'est chez eux que la
  traduction entre formes doit vivre.

**Étendre la couverture** = ajouter un destinataire et sa fixture mesurée. Le
tableau de bord **étudiant** (`me/dashboard`) est aujourd'hui hors portée : sa
charge n'a pas été capturée. La garde le déclare plutôt que de l'inventer.

**Si une clé existe vraiment** : mesure-la contre le vrai serveur, ajoute-la à la
fixture, et la garde suivra. **Ne jamais compléter une fixture de mémoire** —
c'est exactement le trou que cette garde ferme.
