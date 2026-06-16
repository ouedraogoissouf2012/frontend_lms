# Requirements Document — Réutilisabilité des composants UI (ui-components)

## Introduction

Le frontend Vue 3 (`lms-frontend`) souffre d'une duplication massive de markup d'interface : chaque modale est réécrite « à la main » dans la vue qui en a besoin, et les boutons sont recopiés avec leurs classes Tailwind/CSS d'un fichier à l'autre. Cette feature pose les mécanismes officiels de réutilisation de Vue 3 (slots, fallthrough attributes `$attrs`, base components) pour remplacer le copier-coller, en s'appuyant sur le composant `src/components/ui/Modal.vue` qui existe déjà mais reste sous-utilisé.

Issue GitHub #25, TIER 1 de la roadmap d'audit (épique #16).

### État vérifié du code (grep + lecture, 2026-06-16)

- `src/components/ui/Modal.vue` existe (Options API). API actuelle : `v-model:modelValue`, prop `title` **REQUISE** (`type: String, required: true`), slot par défaut = body, slot nommé `footer` (rendu uniquement si `$slots.footer`), fermeture sur clic overlay (`@click.self`) et bouton ✕, lock du scroll body via `watch(visible)` + `beforeUnmount`, animation `transition name="modal-fade"`, responsive `@media (max-width: 768px)`.
- **Absences confirmées dans `Modal.vue`** : pas de slot `header`, pas de prop `size`, **pas de fermeture au clavier (Échap)**, pas de `$attrs`/`inheritAttrs`.
- **6 fichiers** importent `ui/Modal.vue` : `views/student/StudentSettings.vue`, `views/teacher/TeacherSettings.vue`, `views/admin/AdminSettings.vue`, `components/modals/QuickAddTeacherModal.vue`, `components/modals/GenerateReportModal.vue`, `components/modals/QuickCreateClasseModal.vue`.
- **Régression latente détectée** : `QuickAddTeacherModal.vue` et `GenerateReportModal.vue` passent déjà `size="medium"` à `<Modal>`, mais `Modal.vue` ne déclare pas cette prop → l'attribut est ignoré silencieusement (aujourd'hui sans `inheritAttrs:false`, il tombe sur le `<transition>` racine et n'a aucun effet visuel). Toute évolution doit lever cette incohérence sans casser ces deux consommateurs.
- **19 fichiers** réinventent une modale inline (markup `modal-overlay` OU `fixed inset-0 ... flex` + `bg-opacity-50`) au lieu d'utiliser `ui/Modal.vue` (20 occurrences du motif, dont `Modal.vue` lui-même). Exemples lus : `components/visio/ParticipantsModal.vue` (header dégradé custom, tableau, auto-refresh — modale complexe), `components/calendar/EventDetailModal.vue` (modale de détail standard avec header/body custom).
- **0 occurrence** de `$attrs` / `useAttrs` / `inheritAttrs` dans tout `src/`.
- **0 composant `Base*`** : aucune couche de composants de présentation réutilisables ; les boutons sont dupliqués (ex. `.btn-cancel` / `.btn-primary` redéfinis localement dans `QuickAddTeacherModal.vue`).
- Outillage de test présent : Vitest 4.1.8, `@vue/test-utils` 2.4.11, jsdom 29 (`package.json`), config `vitest.config.js`. Convention de test : `tests/unit/*.test.js`, import via alias `@`, docstring française d'en-tête, usage de `it.each` (réf. `tests/unit/roles.test.js`). **Aucun test de montage de composant n'existe encore** (`mount`/`shallowMount` absents du dossier `tests/`).

### Paradigme de référence (sourcé)

- Vue 3 a abandonné l'héritage de classe : la réutilisation se fait par **composition** — base components + props/slots + wrapper `v-bind="$attrs"` + composables (vuejs.org/guide/reusability).
- **Slots / named slots / scoped slots** pour la composition de rendu (vuejs.org/guide/components/slots).
- **Fallthrough attributes** : `$attrs` + `inheritAttrs:false` pour qu'un wrapper transmette classes/listeners/attributs vers son élément interne (vuejs.org/guide/components/attrs).
- **Base components** : préfixe `Base`/`App`/`V`, purement présentationnels, sans état global (Style Guide vuejs.org/style-guide).
- **Anti-pattern** : copier-coller un composant pour le modifier (violation DRY).

### Périmètre

- **Dans le périmètre** : enrichissement de `ui/Modal.vue` sans régression ; création d'au moins `BaseButton.vue` démontrant le pattern `$attrs` ; migration d'un sous-ensemble représentatif de modales inline simples ; documentation des patterns ; tests Vitest pour `Modal` et `BaseButton`.
- **Hors périmètre** : refonte des god components (#28) ; remplacement de **tous** les boutons par `BaseButton` (on pose le pattern + 1 à 2 adoptions démonstratives seulement) ; i18n ; toute modification backend.
- **Dette autorisée et tracée (#25-FE-1)** : les modales complexes (ex. `ParticipantsModal.vue`, `JitsiModal.vue`) dont la migration est risquée peuvent rester inline si elles sont déclarées explicitement comme dette. La migration est incrémentale.
- **Standards applicables** : PRODUCTION_STANDARDS §1.1 (tailles de fichier, Zero God Code), §1.3 (tests obligatoires), §1.6 (citer la règle / sourcer la best practice) ; CONTRIBUTING (workflow spec-driven, accord explicite avant commit/push). « Une seule solution, jamais A ou B » : le **design** tranchera les choix ouverts ci-dessous.

### Décisions laissées au design

1. Liste exacte des enrichissements de `Modal.vue` (valeurs de `size`, contrat du slot `header` vs `title`, comportement Échap).
2. Quels base components créer au-delà du `BaseButton` obligatoire.
3. Le périmètre précis de migration (quelles modales inline parmi les 19, lesquelles restent en dette tracée).
4. L'emplacement de la documentation des patterns (fichier dédié court OU section dans `design.md`).

---

## Requirements

### Requirement 1 — Modal canonique enrichie, sans régression

**User Story:** En tant que développeur frontend, je veux que `ui/Modal.vue` soit la seule modale canonique, enrichie pour couvrir les besoins des modales inline existantes, afin de pouvoir composer toute modale par slots sans recopier de markup.

#### Acceptance Criteria

1. WHERE le composant `src/components/ui/Modal.vue` est concerné, le système SHALL conserver sans régression l'API publique existante : `v-model:modelValue`, slot par défaut (body), slot nommé `footer` rendu seulement s'il est fourni, fermeture sur clic overlay (`@click.self`), fermeture sur le bouton ✕, lock du scroll body à l'ouverture et restauration à la fermeture/`beforeUnmount`.
2. WHEN un consommateur ne fournit aucun contenu pour le slot `footer`, THEN le système SHALL ne rendre aucune zone de pied de modale (parité avec le comportement actuel `v-if="$slots.footer"`).
3. The system SHALL rendre la prop `title` **OPTIONNELLE** (suppression de `required: true`) tout en préservant le rendu du titre lorsque `title` est fournie, afin de ne pas casser les 6 consommateurs actuels qui passent `title`.
4. The system SHALL exposer un slot nommé `header` qui, lorsqu'il est fourni, remplace le rendu par défaut de l'en-tête (le `title` + bouton ✕), permettant un en-tête custom (cas du header dégradé des modales inline) tout en conservant un moyen de fermeture accessible.
5. WHEN ni le slot `header` ni la prop `title` ne sont fournis, THEN le système SHALL néanmoins afficher une commande de fermeture (bouton ✕) accessible, sans planter le rendu.
6. The system SHALL exposer une prop `size` à valeurs contraintes (ensemble fini, p. ex. `sm` / `md` / `lg` / `xl`, valeurs exactes tranchées par le design) avec une valeur par défaut, et appliquer une largeur maximale correspondante au conteneur de la modale.
7. IF un consommateur fournit une valeur de `size` hors de l'ensemble autorisé, THEN le système SHALL la rejeter via un `validator` de prop (avertissement Vue en développement) et retomber sur la taille par défaut.
8. WHERE les consommateurs `QuickAddTeacherModal.vue` et `GenerateReportModal.vue` passent aujourd'hui `size="medium"`, THEN le système SHALL résoudre l'incohérence de nommage de façon explicite (alignement de la valeur attendue OU mapping documenté), de sorte qu'après la feature ces deux modales rendent une taille intentionnelle et non un attribut ignoré.
9. The system SHALL déclarer `inheritAttrs: false` et appliquer `v-bind="$attrs"` sur le conteneur de contenu de la modale (et non sur l'élément `<transition>` racine), afin que les `class`, `id` et attributs non déclarés passés par un consommateur atteignent le conteneur visible de la modale.
10. WHEN l'utilisateur appuie sur la touche Échap alors que la modale est ouverte, THEN le système SHALL fermer la modale (émission de `update:modelValue=false`), et SHALL retirer l'écouteur clavier à la fermeture et dans `beforeUnmount` (pas de fuite d'écouteur).
11. WHEN la modale se ferme par overlay, par ✕ ou par Échap, THEN le système SHALL passer par le même mécanisme `close()` unique (source de fermeture unique, pas de logique dupliquée).
12. The system SHALL maintenir `Modal.vue` sous la limite de taille de fichier des PRODUCTION_STANDARDS (§1.1) ; si l'enrichissement risque de dépasser la limite, le design SHALL prévoir une extraction (composable/sous-composant).

### Requirement 2 — Base component démontrant le pattern wrapper `$attrs`

**User Story:** En tant que développeur frontend, je veux au moins un composant de base réutilisable et purement présentationnel (`BaseButton.vue`) illustrant le pattern fallthrough `$attrs`, afin de standardiser les boutons et de servir de gabarit pour les futurs base components.

#### Acceptance Criteria

1. The system SHALL créer un composant `BaseButton.vue` (préfixe `Base`, sous `src/components/ui/` ou un dossier base tranché par le design) purement présentationnel, **sans accès à un store Pinia ni à un état global**.
2. The system SHALL exposer une prop `variant` à valeurs contraintes couvrant au minimum `primary`, `secondary`, `danger`, `ghost`, avec validation de prop et variante par défaut.
3. The system SHALL exposer des états `loading` et `disabled` ; WHEN `loading` est vrai OU `disabled` est vrai, THEN le rendu `<button>` interne SHALL avoir l'attribut `disabled` actif (état désactivé non contournable côté client).
4. WHEN `loading` est vrai, THEN le système SHALL afficher un indicateur de chargement et SHALL empêcher l'émission d'un clic effectif (le bouton est désactivé).
5. The system SHALL déclarer `inheritAttrs: false` et appliquer `v-bind="$attrs"` sur le `<button>` interne, de sorte qu'un attribut/listener non déclaré passé par le parent (`type`, `@click`, `aria-*`, `class` supplémentaire, etc.) **traverse** jusqu'au `<button>` réel.
6. WHEN un parent attache `@click` à `<BaseButton>` et que le bouton n'est ni `disabled` ni `loading`, THEN le clic sur le `<button>` interne SHALL déclencher le handler du parent.
7. WHEN un parent passe `type="submit"` à `<BaseButton>`, THEN le `<button>` interne rendu SHALL porter `type="submit"`.
8. The system SHALL accepter le contenu du libellé via le slot par défaut (composition de rendu), sans prop de texte obligatoire.
9. The system SHALL adopter `BaseButton` dans 1 à 2 emplacements démonstratifs (périmètre exact tranché par le design), à titre de preuve d'usage, sans imposer une refonte de tous les boutons (hors périmètre).

### Requirement 3 — Migration d'un sous-ensemble représentatif de modales inline

**User Story:** En tant que mainteneur, je veux migrer les modales inline « simples » vers `ui/Modal.vue` en préservant comportement et rendu, afin de réduire la duplication de markup de façon incrémentale et sûre.

#### Acceptance Criteria

1. The system SHALL migrer vers `ui/Modal.vue` un sous-ensemble représentatif de modales inline de type confirmation/formulaire simple (liste précise tranchée par le design parmi les 19 fichiers identifiés).
2. WHEN une modale est migrée, THEN le système SHALL préserver son comportement observable : ouverture/fermeture, fermeture overlay/✕/Échap, soumission de formulaire, émissions d'événements existantes, et rendu visuel équivalent.
3. WHERE une modale inline complexe présente un risque de régression élevé à la migration (ex. header dégradé custom, tableau, auto-refresh comme `ParticipantsModal.vue`, ou intégration tierce comme `JitsiModal.vue`), THEN le système SHALL la laisser en l'état et l'inscrire explicitement comme **dette tracée `#25-FE-1`** (fichier + raison) plutôt que de forcer une migration risquée.
4. WHEN une modale migrée nécessite un en-tête non standard, THEN le système SHALL utiliser le slot `header` de `Modal.vue` (Requirement 1.4) plutôt que de réintroduire du markup d'overlay inline.
5. The system SHALL NOT introduire de nouvelle modale construite avec le markup inline (`modal-overlay` / `fixed inset-0 ... flex` + `bg-opacity-50`) dans les fichiers concernés par la migration ; toute nouvelle modale SHALL passer par `ui/Modal.vue`.
6. WHEN la migration d'une modale est terminée, THEN le système SHALL supprimer le markup d'overlay et les styles de modale désormais inutiles dans le fichier migré (pas de code mort).

### Requirement 4 — Documentation des patterns de réutilisation

**User Story:** En tant que contributeur, je veux une documentation courte des patterns retenus (slots, wrapper `$attrs`, base components), afin que toute nouvelle UI réutilise ces mécanismes au lieu de dupliquer du markup.

#### Acceptance Criteria

1. The system SHALL produire une documentation (fichier court dédié OU section dans `design.md`, emplacement tranché par le design) décrivant les patterns retenus : composition par slots, wrapper transparent via `inheritAttrs:false` + `v-bind="$attrs"`, et convention des base components (préfixe, purement présentationnel, sans store).
2. The system SHALL documenter l'API publique enrichie de `ui/Modal.vue` (props `modelValue`, `title`, `size` ; slots `header`/défaut/`footer` ; événements ; fermeture Échap/overlay/✕).
3. The system SHALL documenter l'API publique de `BaseButton.vue` (props `variant`, `loading`, `disabled` ; slot par défaut ; transmission des attributs via `$attrs`).
4. The system SHALL référencer la dette tracée `#25-FE-1` (modales restées inline et raison) dans la documentation.
5. The system SHALL inclure une règle explicite « ne pas copier-coller un composant ni du markup d'overlay ; réutiliser `Modal`/`BaseButton` par slots et `$attrs` » sourcée sur la doc Vue.

### Requirement 5 — Couverture de tests Vitest

**User Story:** En tant qu'équipe, je veux des tests unitaires de composant (Vitest + @vue/test-utils) pour `Modal` et `BaseButton`, afin de garantir le contrat des slots et la traversée des attributs et d'éviter les régressions futures.

#### Acceptance Criteria

1. The system SHALL ajouter des tests sous `tests/unit/` suivant la convention existante (import via alias `@`, docstring d'en-tête, `vitest`, montage via `@vue/test-utils`), exécutables par `npm run test`.
2. WHEN la modale est ouverte et que l'utilisateur déclenche la fermeture (overlay, ✕, ou Échap), THEN le test SHALL vérifier que `Modal` émet `update:modelValue` avec `false`.
3. The system SHALL tester le rendu conditionnel des slots de `Modal` : slot par défaut (body) rendu, slot `footer` rendu seulement s'il est fourni, slot `header` remplaçant l'en-tête par défaut quand fourni.
4. The system SHALL tester le scroll-lock de `Modal` : `document.body` est verrouillé à l'ouverture et restauré à la fermeture/démontage.
5. The system SHALL tester la prop `size` de `Modal` : une valeur valide applique la largeur attendue ; une valeur invalide déclenche la validation et retombe sur le défaut.
6. WHEN un `@click` non déclaré est attaché à `BaseButton` et que le bouton est actif, THEN le test SHALL vérifier que le `<button>` interne reçoit l'événement (preuve que `$attrs` traverse).
7. WHEN `type="submit"` (attribut non déclaré) est passé à `BaseButton`, THEN le test SHALL vérifier que le `<button>` interne porte `type="submit"`.
8. The system SHALL tester les `variant` de `BaseButton` (classe/rendu attendu par variante) et l'état `disabled`/`loading` (bouton désactivé + aucun clic effectif émis).
9. The system SHALL faire échouer la suite (`npm run test`) si l'un de ces contrats est violé (les tests sont des assertions de régression, écrits avant l'implémentation conformément à PRODUCTION_STANDARDS §1.3 / TDD).

### Requirement 6 — Conformité au paradigme Vue et non-régression globale

**User Story:** En tant que gardien de la qualité, je veux que la solution respecte le paradigme officiel de réutilisation Vue 3 et n'introduise aucune régression sur les consommateurs existants, afin que l'amélioration soit durable et conforme aux standards.

#### Acceptance Criteria

1. The system SHALL réaliser la réutilisation exclusivement par composition de rendu (slots) et extension par attributs (`$attrs`), SANS duplication de markup ni héritage de classe simulé.
2. The system SHALL NOT introduire d'état global (store, données partagées) dans les composants de présentation `Base*`.
3. WHERE un base component enveloppe un élément natif, THEN le système SHALL utiliser `inheritAttrs:false` + `v-bind="$attrs"` plutôt que de re-déclarer chaque attribut natif en prop.
4. The system SHALL préserver le fonctionnement des 6 consommateurs actuels de `ui/Modal.vue` après enrichissement (aucune erreur de console, rendu et fermeture inchangés ou améliorés).
5. The system SHALL NOT modifier le backend ni aucun contrat d'API.
6. The system SHALL respecter les limites de taille de fichier des PRODUCTION_STANDARDS (§1.1) pour tout fichier créé ou modifié ; tout dépassement inévitable SHALL être déclaré comme dette tracée plutôt que masqué.
7. The system SHALL permettre une livraison incrémentale : Modal enrichie + BaseButton + tests peuvent être livrés indépendamment de la migration complète des modales inline, le reste étant tracé en dette `#25-FE-1`.
