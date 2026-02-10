<template>
  <transition name="fade">
    <div v-if="show" class="page-loader-overlay">
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
      <p class="loader-text">Chargement...</p>
    </div>
  </transition>
</template>

<script setup>
defineProps({
  show: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.page-loader-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, rgba(27, 59, 111, 0.97) 0%, rgba(13, 37, 73, 0.98) 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  backdrop-filter: blur(8px);
}

.loader-animation {
  position: relative;
  width: 160px;
  height: 160px;
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
  font-size: 3.5rem;
  color: #ffffff;
  filter: drop-shadow(0 4px 12px rgba(255, 255, 255, 0.4));
  animation: cap-pulse 2s ease-in-out infinite;
}

@keyframes cap-pulse {
  0%, 100% {
    transform: scale(1);
    filter: drop-shadow(0 4px 12px rgba(255, 255, 255, 0.4));
  }
  50% {
    transform: scale(1.05);
    filter: drop-shadow(0 6px 20px rgba(255, 255, 255, 0.6));
  }
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
  font-size: 2rem;
  font-weight: 900;
  font-family: 'Arial Black', sans-serif;
  text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  left: 50%;
  top: 50%;
  transform-origin: center center;
}

/* Lettre L - position 0deg (haut) */
.letter-l {
  color: #93c5fd;
  transform: translate(-50%, -50%) rotate(0deg) translateY(-65px) rotate(0deg);
  animation: letter-scale-l 3s ease-in-out infinite;
}

/* Lettre M - position 120deg */
.letter-m {
  color: #fbbf24;
  transform: translate(-50%, -50%) rotate(120deg) translateY(-65px) rotate(-120deg);
  animation: letter-scale-m 3s ease-in-out infinite;
}

/* Lettre S - position 240deg */
.letter-s {
  color: #60a5fa;
  transform: translate(-50%, -50%) rotate(240deg) translateY(-65px) rotate(-240deg);
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

/* Animations de scale pour chaque lettre - toujours visibles */
@keyframes letter-scale-l {
  0%, 100% {
    transform: translate(-50%, -50%) rotate(0deg) translateY(-65px) rotate(0deg) scale(1);
  }
  33% {
    transform: translate(-50%, -50%) rotate(0deg) translateY(-65px) rotate(0deg) scale(1.5);
  }
}

@keyframes letter-scale-m {
  0%, 33%, 100% {
    transform: translate(-50%, -50%) rotate(120deg) translateY(-65px) rotate(-120deg) scale(1);
  }
  66% {
    transform: translate(-50%, -50%) rotate(120deg) translateY(-65px) rotate(-120deg) scale(1.5);
  }
}

@keyframes letter-scale-s {
  0%, 66% {
    transform: translate(-50%, -50%) rotate(240deg) translateY(-65px) rotate(-240deg) scale(1);
  }
  100% {
    transform: translate(-50%, -50%) rotate(240deg) translateY(-65px) rotate(-240deg) scale(1.5);
  }
}

/* Texte de chargement */
.loader-text {
  margin-top: 2rem;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
  font-weight: 500;
  letter-spacing: 3px;
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

/* Transitions fade */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.4s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
