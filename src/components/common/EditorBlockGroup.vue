<template>
  <!-- Headings -->
  <div class="toolbar-group">
    <button
      @click="editor.chain().focus().toggleHeading({ level: 1 }).run()"
      :class="{ 'is-active': editor.isActive('heading', { level: 1 }) }"
      class="toolbar-btn"
      type="button"
      title="Titre 1"
    >
      H1
    </button>
    <button
      @click="editor.chain().focus().toggleHeading({ level: 2 }).run()"
      :class="{ 'is-active': editor.isActive('heading', { level: 2 }) }"
      class="toolbar-btn"
      type="button"
      title="Titre 2"
    >
      H2
    </button>
    <button
      @click="editor.chain().focus().toggleHeading({ level: 3 }).run()"
      :class="{ 'is-active': editor.isActive('heading', { level: 3 }) }"
      class="toolbar-btn"
      type="button"
      title="Titre 3"
    >
      H3
    </button>
  </div>

  <div class="toolbar-divider"></div>

  <!-- Lists -->
  <div class="toolbar-group">
    <button
      @click="editor.chain().focus().toggleBulletList().run()"
      :class="{ 'is-active': editor.isActive('bulletList') }"
      class="toolbar-btn"
      type="button"
      title="Liste à puces"
    >
      •
    </button>
    <button
      @click="editor.chain().focus().toggleOrderedList().run()"
      :class="{ 'is-active': editor.isActive('orderedList') }"
      class="toolbar-btn"
      type="button"
      title="Liste numérotée"
    >
      1.
    </button>
    <button
      @click="editor.chain().focus().toggleTaskList().run()"
      :class="{ 'is-active': editor.isActive('taskList') }"
      class="toolbar-btn"
      type="button"
      title="Liste de tâches"
    >
      ☑
    </button>
  </div>

  <div class="toolbar-divider"></div>

  <!-- Table -->
  <div class="toolbar-group">
    <button @click="$emit('insert-table')" class="toolbar-btn" type="button" title="Insérer tableau">⊞</button>
    <button
      v-if="editor.isActive('table')"
      @click="editor.chain().focus().addColumnAfter().run()"
      class="toolbar-btn"
      type="button"
      title="Ajouter colonne"
    >
      |+
    </button>
    <button
      v-if="editor.isActive('table')"
      @click="editor.chain().focus().addRowAfter().run()"
      class="toolbar-btn"
      type="button"
      title="Ajouter ligne"
    >
      —+
    </button>
    <button
      v-if="editor.isActive('table')"
      @click="editor.chain().focus().deleteTable().run()"
      class="toolbar-btn"
      type="button"
      title="Supprimer tableau"
    >
      ⊠
    </button>
  </div>

  <div class="toolbar-divider"></div>

  <!-- Blocks -->
  <div class="toolbar-group">
    <button
      @click="editor.chain().focus().toggleBlockquote().run()"
      :class="{ 'is-active': editor.isActive('blockquote') }"
      class="toolbar-btn"
      type="button"
      title="Citation"
    >
      "
    </button>
    <button
      @click="editor.chain().focus().toggleCodeBlock().run()"
      :class="{ 'is-active': editor.isActive('codeBlock') }"
      class="toolbar-btn"
      type="button"
      title="Bloc de code"
    >
      { }
    </button>
    <button
      @click="editor.chain().focus().setHorizontalRule().run()"
      class="toolbar-btn"
      type="button"
      title="Ligne horizontale"
    >
      —
    </button>
  </div>
</template>

<script setup>
/**
 * Groupe « blocs » de la barre d'outils (#28, décompo ≤300) : titres, listes,
 * tableau, citation/code/séparateur. Présentationnel : `editor` en prop ;
 * l'insertion de tableau (prompt côté composable parent) est émise via
 * `insert-table`.
 */
defineProps({
  editor: { type: Object, required: true }
})

defineEmits(['insert-table'])
</script>

<style scoped lang="scss">
@use '../../assets/styles/editor-toolbar';
</style>
