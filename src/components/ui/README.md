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

### Événements

| Événement            | Charge   | Émis quand |
|----------------------|----------|------------|
| `update:modelValue`  | `false`  | Fermeture via ✕, clic sur l'overlay ou `Échap`. |

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
(`@vue/test-utils` + Vitest) : slots, événements, états, `size`, traversée
`$attrs`. Lancer : `npm run test`.
