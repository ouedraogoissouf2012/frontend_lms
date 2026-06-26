<template>
  <!-- Toolbar flottante (bubble menu) de l'éditeur riche (#G1 ≤300, décompo TipTapEditor).
       Extraite VERBATIM de TipTapEditor.vue : boutons de formatage inline
       (gras/italique/souligné/barré), lien (via addLink émis vers le parent) et
       sélecteurs de couleur (texte / surlignage). Markup et CSS conservés à
       l'identique pour parité stricte.
       TipTap v3 : `BubbleMenu` est importé depuis `@tiptap/vue-3/menus` (déplacé
       hors de @tiptap/vue-3 en v3) et `:tippy-options` (tippy, supprimé) est
       remplacé par `:options` (floating-ui). Le composant s'auto-enregistre. -->
  <bubble-menu
    v-if="editor"
    :editor="editor"
    :options="{ placement: 'top' }"
    class="bubble-menu-custom"
  >
    <button
      @click="editor.chain().focus().toggleBold().run()"
      :class="{ 'is-active': editor.isActive('bold') }"
      class="bubble-btn"
      title="Gras"
    >
      <strong>B</strong>
    </button>
    <button
      @click="editor.chain().focus().toggleItalic().run()"
      :class="{ 'is-active': editor.isActive('italic') }"
      class="bubble-btn"
      title="Italique"
    >
      <em>I</em>
    </button>
    <button
      @click="editor.chain().focus().toggleUnderline().run()"
      :class="{ 'is-active': editor.isActive('underline') }"
      class="bubble-btn"
      title="Souligné"
    >
      <u>U</u>
    </button>
    <button
      @click="editor.chain().focus().toggleStrike().run()"
      :class="{ 'is-active': editor.isActive('strike') }"
      class="bubble-btn"
      title="Barré"
    >
      <s>S</s>
    </button>
    <div class="bubble-divider"></div>
    <button
      @click="$emit('add-link')"
      :class="{ 'is-active': editor.isActive('link') }"
      class="bubble-btn"
      title="Lien"
    >
      🔗
    </button>
    <input
      type="color"
      @input="editor.chain().focus().setColor($event.target.value).run()"
      class="bubble-color-picker"
      title="Couleur"
    />
    <input
      type="color"
      @input="editor.chain().focus().toggleHighlight({ color: $event.target.value }).run()"
      class="bubble-color-picker"
      title="Surligner"
    />
  </bubble-menu>
</template>

<script setup>
import { BubbleMenu } from '@tiptap/vue-3/menus' // v3 : BubbleMenu déplacé hors de @tiptap/vue-3

/**
 * Bubble menu (toolbar flottante) de l'éditeur riche (#G1 ≤300).
 * Extrait de TipTapEditor.vue. Reçoit l'instance `editor` ; les commandes inline
 * (gras/italique/…/couleur) restent appelées directement sur la chaîne TipTap pour
 * parité stricte avec l'original. L'ajout de lien (qui ouvre un prompt) est délégué
 * au parent via l'évènement `add-link`, comme dans la vue d'origine (addLink).
 */
defineProps({
  editor: {
    type: Object,
    default: null
  }
})

defineEmits(['add-link'])
</script>

<style scoped>
/* ===========================
   BUBBLE MENU (Toolbar Flottante)
   =========================== */
.bubble-menu-custom {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  background: var(--card-bg);
  border: 2px solid var(--color-primary, #10b981);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(16, 185, 129, 0.3);
  z-index: 9999;
  backdrop-filter: blur(8px);
  animation: bubbleFadeIn 0.2s ease-out;
}

@keyframes bubbleFadeIn {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.bubble-btn {
  padding: 6px 10px;
  font-size: 0.9rem;
  font-weight: 600;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: var(--text-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  min-width: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bubble-btn:hover {
  background: var(--hover-bg);
  border-color: var(--border-color);
  transform: scale(1.05);
}

.bubble-btn.is-active {
  background: var(--color-primary, #10b981);
  color: white;
  border-color: var(--color-primary, #10b981);
}

.bubble-divider {
  width: 1px;
  height: 20px;
  background: var(--border-color);
  margin: 0 4px;
}

.bubble-color-picker {
  width: 28px;
  height: 28px;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  padding: 2px;
  transition: all 0.2s ease;
}

.bubble-color-picker:hover {
  border-color: var(--color-primary, #10b981);
  transform: scale(1.1);
}
</style>
