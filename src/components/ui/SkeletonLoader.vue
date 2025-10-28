<template>
  <div :class="['skeleton', `skeleton-${type}`, { animated }]" :style="customStyle"></div>
</template>

<script>
export default {
  name: 'SkeletonLoader',
  props: {
    type: {
      type: String,
      default: 'text',
      validator: (value) => ['text', 'circle', 'rect', 'card'].includes(value)
    },
    width: {
      type: String,
      default: ''
    },
    height: {
      type: String,
      default: ''
    },
    animated: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    customStyle() {
      const style = {}
      if (this.width) style.width = this.width
      if (this.height) style.height = this.height
      return style
    }
  }
}
</script>

<style scoped>
.skeleton {
  background: linear-gradient(
    90deg,
    var(--skeleton-base, #E5E7EB) 0%,
    var(--skeleton-base, #E5E7EB) 40%,
    var(--skeleton-highlight, #F3F4F6) 50%,
    var(--skeleton-base, #E5E7EB) 60%,
    var(--skeleton-base, #E5E7EB) 100%
  );
  background-size: 200% 100%;
  border-radius: 0.25rem;
}

.skeleton.animated {
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 200% 0;
  }
  100% {
    background-position: -200% 0;
  }
}

.skeleton-text {
  height: 1rem;
  width: 100%;
  margin-bottom: 0.5rem;
}

.skeleton-circle {
  border-radius: 50%;
  width: 3rem;
  height: 3rem;
}

.skeleton-rect {
  width: 100%;
  height: 8rem;
}

.skeleton-card {
  width: 100%;
  height: 12rem;
  border-radius: 0.75rem;
}

/* Dark mode */
:global(.dark) .skeleton {
  background: linear-gradient(
    90deg,
    var(--skeleton-base, #374151) 0%,
    var(--skeleton-base, #374151) 40%,
    var(--skeleton-highlight, #4B5563) 50%,
    var(--skeleton-base, #374151) 60%,
    var(--skeleton-base, #374151) 100%
  );
  background-size: 200% 100%;
}
</style>
