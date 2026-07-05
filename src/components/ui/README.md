# Composants UI de base (`src/components/ui/`)

Briques d'interface réutilisables, sans logique métier. Elles encapsulent
l'apparence et le comportement transverses (overlay, focus, états) pour que les
vues n'aient plus à les réimplémenter. Objectif : **réutilisabilité + DRY**
(cf. `PRODUCTION_STANDARDS.md`).

Toutes adoptent le patron de composant englobant Vue 3 :
`inheritAttrs: false` + `v-bind="$attrs"` sur l'élément racine pertinent, pour
que les attributs non déclarés (`class`, `id`, `aria-*`, `data-*`, écouteurs
natifs) traversent jusqu'au bon nœud du DOM sans prop dédiée.

---

## `Modal.vue`

Fenêtre modale avec overlay, verrouillage du défilement et fermeture par ✕ /
clic extérieur / `Échap`.

### Props

| Prop         | Type    | Défaut | Description |
|--------------|---------|--------|-------------|
| `modelValue` | Boolean | `false`| Ouverture (`v-model`). |
| `title`      | String  | `''`   | Titre optionnel. Si vide et pas de slot `header`, aucun en-tête textuel n'est rendu (le ✕ reste). |
| `size`       | String  | `'md'` | `sm` \| `md` \| `lg` \| `xl`. L'alias historique `medium` est normalisé en `md`. |
| `showClose` | Boolean | `true` | Affiche la croix de fermeture. |
| `closeOnOverlay` | Boolean | `true` | Ferme la modale au clic sur l'overlay. |
| `closeOnEsc` | Boolean | `true` | Ferme la modale avec `Échap`. |
| `teleport` | Boolean | `false` | Rend la modale via `<Teleport>`, désactivé par défaut pour compatibilité. |
| `teleportTo` | String | `'body'` | Cible du Teleport. |
| `transitionName` | String | `'modal-fade'` | Nom de transition Vue. |
| `overlayClass` | String/Array/Object | `''` | Classe additionnelle sur l'overlay. |
| `containerClass` | String/Array/Object | `''` | Classe additionnelle sur le conteneur. |
| `headerClass` | String/Array/Object | `''` | Classe additionnelle sur l'en-tête. |
| `bodyClass` | String/Array/Object | `''` | Classe additionnelle sur le corps. |
| `footerClass` | String/Array/Object | `''` | Classe additionnelle sur le footer. |

### Événements

| Événement            | Charge   | Émis quand |
|----------------------|----------|------------|
| `update:modelValue`  | `false`  | Fermeture via ✕, clic sur l'overlay ou `Échap`. |
| `close`              | -        | Après une demande de fermeture. |

### Slots

| Slot      | Rôle |
|-----------|------|
| (défaut)  | Corps de la modale. |
| `header`  | Remplace l'en-tête par défaut. **Le bouton ✕ reste toujours rendu**, hors du slot. |
| `footer`  | Pied de modale (boutons d'action). Non rendu si absent. |

### `$attrs`

`inheritAttrs: false` : `class`, `id`, `data-*`, `aria-*` se posent sur
`.modal-container` (et non sur la racine `<transition>`).

### Exemple

```vue
<Modal v-model="open" title="Modifier" size="lg" class="modal-edition">
  <FormulaireEdition />
  <template #footer>
    <BaseButton variant="secondary" @click="open = false">Annuler</BaseButton>
    <BaseButton variant="primary" :loading="saving" @click="save">Enregistrer</BaseButton>
  </template>
</Modal>
```

---

## `BaseButton.vue`

Bouton de base avec variantes visuelles et états `loading` / `disabled`.
En `loading`, un spinner remplace l'icône et le bouton est automatiquement
désactivé (anti double-soumission).

### Props

| Prop       | Type    | Défaut      | Description |
|------------|---------|-------------|-------------|
| `variant`  | String  | `'primary'` | `primary` \| `secondary` \| `danger` \| `ghost`. |
| `loading`  | Boolean | `false`     | Affiche le spinner et désactive le bouton. |
| `disabled` | Boolean | `false`     | Désactive le bouton. |
| `type`     | String  | `'button'`  | `button` \| `submit` \| `reset` (lié explicitement, jamais via `$attrs`). |

### Slots

| Slot     | Rôle |
|----------|------|
| (défaut) | Libellé du bouton. |
| `icon`   | Icône affichée avant le libellé (masquée pendant `loading`). |

### `$attrs`

`inheritAttrs: false` : les écouteurs natifs (`@click`), `data-*`, `aria-*`
traversent jusqu'au `<button>`.

### Exemple

```vue
<BaseButton variant="danger" :loading="deleting" @click="remove">
  <template #icon><IconTrash /></template>
  Supprimer
</BaseButton>
```

---

## Tests

`tests/unit/Modal.test.js` et `tests/unit/BaseButton.test.js`
(`@vue/test-utils` + Vitest) : slots, événements, états, `size`, Teleport,
classes internes, traversée `$attrs`. Lancer : `npm run test`.

---

## Règles d'usage

Ne pas copier-coller une modale ni réintroduire un overlay inline
(`modal-overlay`, `modal-backdrop`, `fixed inset-0 ... bg-opacity-50`) pour un
nouveau besoin standard. Utiliser `Modal.vue` avec ses slots
`header` / défaut / `footer`, puis composer les actions avec `BaseButton.vue`.

Un composant de base reste présentationnel : pas de store, pas d'appel API, pas
de logique métier. Pour envelopper un élément natif, utiliser
`inheritAttrs: false` et transmettre les attributs au bon élément interne avec
`v-bind="$attrs"` au lieu de redéclarer tous les attributs natifs en props.

Sources Vue : slots (`vuejs.org/guide/components/slots.html`), fallthrough
attributes (`vuejs.org/guide/components/attrs.html`), composables et
réutilisation (`vuejs.org/guide/reusability/composables.html`), convention des
base components (`vuejs.org/style-guide/`).

## Dette tracée

`#25-FE-1` : soldé côté frontend. Les modales standard et les anciennes modales
spécialisées (`GlobalSearch`, `Participants`, `Jitsi`, `TipTap`, quiz,
création forum) passent par `Modal.vue`. Les variantes visuelles passent par les
props de classes internes au lieu de recréer un overlay complet.

La scène Jitsi plein écran est maintenant portée par le flux visio/Jitsi dédié,
pas par une modale interactive : elle reste hors dette `#25-FE-1`.

`#25-FE-2` : ne pas créer `BaseCard` ou `BaseInput` avant un besoin répété et
concret. `BaseButton` pose le pattern actuel ; les autres composants de base se
créent au moment où ils retirent une vraie duplication.
