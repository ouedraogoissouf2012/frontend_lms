<template>
  <div class="content-loader">
    <div class="loader-animation">
      <!-- Chapeau de graduation au centre -->
      <div class="cap-center">
        <i class="fa fa-graduation-cap"></i>
      </div>
      <!-- Lettres LMS tournant autour -->
      <div class="rotating-letters">
        <span class="letter letter-l">L</span>
        <span class="letter letter-m">M</span>
        <span class="letter letter-s">S</span>
      </div>
    </div>
    <p v-if="text" class="loader-text">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  text: {
    type: String,
    default: 'Chargement...'
  }
})
</script>

<style scoped>
.content-loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  min-height: 200px;
}

.loader-animation {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Chapeau au centre */
.cap-center {
  position: absolute;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cap-center i {
  font-size: 2.5rem;
  color: #1B3B6F;
  filter: drop-shadow(0 2px 4px rgba(27, 59, 111, 0.3));
}

/* Container des lettres tournantes */
.rotating-letters {
  position: absolute;
  width: 100%;
  height: 100%;
  animation: container-rotate 3s linear infinite;
}

/* Lettres individuelles */
.letter {
  position: absolute;
  font-size: 1.4rem;
  font-weight: 900;
  font-family: 'Arial Black', sans-serif;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  /* Position sur le cercle - rayon de 50px */
  left: 50%;
  top: 50%;
  transform-origin: center center;
}

/* Lettre L - position 0deg (haut) */
.letter-l {
  color: #1B3B6F;
  transform: translate(-50%, -50%) rotate(0deg) translateY(-45px) rotate(0deg);
  animation: letter-scale-l 3s ease-in-out infinite;
}

/* Lettre M - position 120deg */
.letter-m {
  color: #FFB81C;
  transform: translate(-50%, -50%) rotate(120deg) translateY(-45px) rotate(-120deg);
  animation: letter-scale-m 3s ease-in-out infinite;
}

/* Lettre S - position 240deg */
.letter-s {
  color: #2D5A9E;
  transform: translate(-50%, -50%) rotate(240deg) translateY(-45px) rotate(-240deg);
  animation: letter-scale-s 3s ease-in-out infinite;
}

/* Animation de rotation du container */
@keyframes container-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

/* Animation de scale pour L - grossit au debut */
@keyframes letter-scale-l {
  0%, 100% {
    transform: translate(-50%, -50%) rotate(0deg) translateY(-45px) rotate(0deg) scale(1);
  }
  33% {
    transform: translate(-50%, -50%) rotate(0deg) translateY(-45px) rotate(0deg) scale(1.5);
  }
}

/* Animation de scale pour M - grossit au milieu */
@keyframes letter-scale-m {
  0%, 33%, 100% {
    transform: translate(-50%, -50%) rotate(120deg) translateY(-45px) rotate(-120deg) scale(1);
  }
  66% {
    transform: translate(-50%, -50%) rotate(120deg) translateY(-45px) rotate(-120deg) scale(1.5);
  }
}

/* Animation de scale pour S - grossit a la fin */
@keyframes letter-scale-s {
  0%, 66% {
    transform: translate(-50%, -50%) rotate(240deg) translateY(-45px) rotate(-240deg) scale(1);
  }
  100% {
    transform: translate(-50%, -50%) rotate(240deg) translateY(-45px) rotate(-240deg) scale(1.5);
  }
}

/* Texte de chargement */
.loader-text {
  margin-top: 1.5rem;
  color: var(--text-secondary);
  font-size: 0.95rem;
  font-weight: 500;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  animation: pulse-text 1.5s ease-in-out infinite;
}

@keyframes pulse-text {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

/* Mode sombre */
:deep([data-theme="dark"]) .cap-center i {
  color: #60a5fa;
  filter: drop-shadow(0 2px 8px rgba(96, 165, 250, 0.5));
}

:deep([data-theme="dark"]) .letter-l {
  color: #60a5fa;
}

:deep([data-theme="dark"]) .letter-m {
  color: #fbbf24;
}

:deep([data-theme="dark"]) .letter-s {
  color: #93c5fd;
}

:deep([data-theme="dark"]) .loader-text {
  color: #cbd5e1;
}
</style>
