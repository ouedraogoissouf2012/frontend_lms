<template>
  <div v-if="slides && slides.length > 0" class="slides-viewer">
    <div class="slide-display">
      <img
        :src="getSlideUrl(slides[currentSlide])"
        :alt="`Slide ${currentSlide + 1}`"
        class="slide-image"
        @click="nextSlide"
      />
    </div>
    <div class="slides-controls">
      <button @click="prevSlide" :disabled="currentSlide === 0" class="btn-slide">
        <i class="fa fa-chevron-left"></i>
      </button>
      <span class="slide-counter">
        {{ currentSlide + 1 }} / {{ slides.length }}
      </span>
      <button @click="nextSlide" :disabled="currentSlide >= slides.length - 1" class="btn-slide">
        <i class="fa fa-chevron-right"></i>
      </button>
    </div>
    <!-- Slide thumbnails -->
    <div class="slides-thumbnails">
      <button
        v-for="(slide, idx) in slides"
        :key="idx"
        @click="currentSlide = idx"
        class="slide-thumb"
        :class="{ active: currentSlide === idx }"
      >
        <img :src="getSlideUrl(slide)" :alt="`Miniature ${idx + 1}`" />
        <span class="thumb-number">{{ idx + 1 }}</span>
      </button>
    </div>
  </div>
  <div v-else class="slides-empty">
    <i class="fa fa-file-powerpoint-o"></i>
    <p>Présentation en cours de conversion...</p>
  </div>
</template>

<script setup>
/**
 * Visionneuse de diaporama (#28, tranche 2).
 * Sous-composant extrait de StudentLessonView.vue : encapsule l'état de
 * navigation des slides (currentSlide) + l'affichage/contrôles/miniatures.
 * Réinitialise sur changement de jeu de slides (changement de chapitre).
 */
import { ref, watch } from 'vue'
import { getSlideUrl } from '@/utils/lessonContent'

const props = defineProps({
  slides: { type: Array, default: () => [] }
})

const currentSlide = ref(0)

// Réinitialise au changement de chapitre (nouveau jeu de slides).
watch(() => props.slides, () => { currentSlide.value = 0 })

function prevSlide() {
  if (currentSlide.value > 0) currentSlide.value--
}

function nextSlide() {
  if (props.slides && currentSlide.value < props.slides.length - 1) {
    currentSlide.value++
  }
}
</script>

<style scoped>
.slides-viewer {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.slide-display {
  background: #000;
  border-radius: 0.75rem;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  cursor: pointer;
}

.slide-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.slides-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
}

.btn-slide {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: var(--card-bg, #1e293b);
  border: 1px solid var(--border-primary, #334155);
  color: var(--text-primary, #e2e8f0);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-slide:hover:not(:disabled) {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

.btn-slide:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.slide-counter {
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--text-secondary, #94a3b8);
}

.slides-thumbnails {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 0.5rem 0;
}

.slide-thumb {
  flex-shrink: 0;
  width: 80px;
  height: 50px;
  border-radius: 0.375rem;
  overflow: hidden;
  border: 2px solid transparent;
  cursor: pointer;
  position: relative;
  background: var(--bg-secondary, #334155);
  padding: 0;
}

.slide-thumb.active {
  border-color: #3b82f6;
}

.slide-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-number {
  position: absolute;
  bottom: 2px;
  right: 4px;
  font-size: 0.6rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.slides-empty {
  text-align: center;
  padding: 3rem;
  color: var(--text-secondary, #94a3b8);
}

.slides-empty i {
  font-size: 3rem;
  opacity: 0.5;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .slide-display {
    min-height: 250px;
  }
}
</style>
