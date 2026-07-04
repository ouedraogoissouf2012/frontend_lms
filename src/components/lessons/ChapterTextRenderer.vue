<template>
  <div>
    <!-- TEXT / MARKDOWN -->
    <div v-if="chapter.content_type === 'text' && chapter.content" class="content-block content-text">
      <div class="rendered-html" v-html="safeContent"></div>
    </div>

    <!-- WORD (HTML content) -->
    <div v-if="chapter.content_type === 'word' && chapter.content" class="content-block content-word">
      <div class="rendered-html word-document" v-html="safeContent"></div>
    </div>
  </div>
</template>

<script setup>
import { useSanitizedHtml } from '@/composables/useSanitizedHtml'
/**
 * Rendu des chapitres texte / Word (#H4 ≤300) : HTML enrichi via v-html. Présentationnel,
 * données via la prop `chapter`. CSS rendered-html (:deep) déplacé verbatim.
 */
const props = defineProps({
  chapter: { type: Object, required: true }
})

const safeContent = useSanitizedHtml(() => props.chapter?.content)
</script>

<style scoped>
/* Content blocks */
.content-block {
  margin-bottom: 2rem;
}

/* TEXT CONTENT */
.rendered-html {
  line-height: 1.8;
  font-size: 1.05rem;
  color: var(--text-primary);
}

.rendered-html :deep(h1),
.rendered-html :deep(h2),
.rendered-html :deep(h3) {
  margin-top: 1.5rem;
  margin-bottom: 0.75rem;
  color: var(--text-primary);
}

.rendered-html :deep(p) {
  margin-bottom: 1rem;
}

.rendered-html :deep(ul),
.rendered-html :deep(ol) {
  padding-left: 1.5rem;
  margin-bottom: 1rem;
}

.rendered-html :deep(li) {
  margin-bottom: 0.5rem;
}

.rendered-html :deep(blockquote) {
  border-left: 4px solid var(--blue-500);
  padding: 1rem 1.25rem;
  margin: 1.5rem 0;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 0 0.5rem 0.5rem 0;
}

.rendered-html :deep(code) {
  background: var(--bg-secondary);
  padding: 0.15rem 0.4rem;
  border-radius: 0.25rem;
  font-size: 0.9em;
}

.rendered-html :deep(pre) {
  background: var(--bg-secondary);
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin: 1rem 0;
}

.rendered-html :deep(img) {
  max-width: 100%;
  border-radius: 0.5rem;
  margin: 1rem 0;
}

.rendered-html :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 1rem 0;
}

.rendered-html :deep(th),
.rendered-html :deep(td) {
  padding: 0.75rem;
  border: 1px solid var(--border-primary);
  text-align: left;
}

.rendered-html :deep(th) {
  background: var(--bg-secondary);
  font-weight: 700;
}

/* Word documents specific */
.word-document {
  background: var(--card-bg);
  padding: 2rem;
  border-radius: 0.75rem;
  border: 1px solid var(--border-primary);
}
</style>
