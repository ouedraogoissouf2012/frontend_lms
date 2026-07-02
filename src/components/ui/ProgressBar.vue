<template>
  <div class="progress-container">
    <div v-if="label" class="progress-header">
      <span class="progress-label">{{ label }}</span>
      <span class="progress-percentage">{{ percentage }}%</span>
    </div>
    <div class="progress-bar" :class="sizeClass">
      <div
        class="progress-fill"
        :class="colorClass"
        :style="{ width: `${percentage}%` }"
      >
        <span v-if="showPercentage && !label" class="progress-text">
          {{ percentage }}%
        </span>
      </div>
    </div>
    <div v-if="subtitle" class="progress-subtitle">{{ subtitle }}</div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'ProgressBar',

  props: {
    percentage: {
      type: Number,
      required: true,
      validator: (value) => value >= 0 && value <= 100
    },
    label: {
      type: String,
      default: ''
    },
    subtitle: {
      type: String,
      default: ''
    },
    showPercentage: {
      type: Boolean,
      default: false
    },
    color: {
      type: String,
      default: 'blue', // 'blue', 'green', 'yellow', 'red', 'purple', 'gradient'
      validator: (value) => ['blue', 'green', 'yellow', 'red', 'purple', 'gradient'].includes(value)
    },
    size: {
      type: String,
      default: 'md', // 'sm', 'md', 'lg'
      validator: (value) => ['sm', 'md', 'lg'].includes(value)
    }
  },

  setup(props) {
    const colorClass = computed(() => {
      return `progress-${props.color}`
    })

    const sizeClass = computed(() => {
      return `progress-${props.size}`
    })

    return {
      colorClass,
      sizeClass
    }
  }
}
</script>

<style scoped>
.progress-container {
  width: 100%;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.progress-label {
  font-size: var(--font-size-sm);
  font-weight: 600;
  color: var(--text-primary);
}

.progress-percentage {
  font-size: var(--font-size-sm);
  font-weight: 700;
  color: var(--text-secondary);
}

.progress-bar {
  background: var(--bg-tertiary);
  border-radius: var(--radius-full);
  overflow: hidden;
  position: relative;
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.05);
}

.progress-bar.progress-sm {
  height: 6px;
}

.progress-bar.progress-md {
  height: 10px;
}

.progress-bar.progress-lg {
  height: 16px;
}

.progress-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: var(--spacing-sm);
  position: relative;
  overflow: hidden;
}

/* Animated shimmer effect */
.progress-fill::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  animation: shimmer 2s infinite;
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

.progress-text {
  font-size: var(--font-size-xs);
  font-weight: 700;
  color: white;
  position: relative;
  z-index: 1;
}

.progress-subtitle {
  margin-top: var(--spacing-xs);
  font-size: var(--font-size-xs);
  color: var(--text-tertiary);
}

/* Color variations */
.progress-blue {
  background: linear-gradient(90deg, var(--blue-500) 0%, var(--blue-600) 100%);
}

.progress-green {
  background: linear-gradient(90deg, var(--emerald-500) 0%, var(--emerald-600) 100%);
}

.progress-yellow {
  background: linear-gradient(90deg, var(--yellow-400) 0%, var(--yellow-500) 100%);
}

.progress-red {
  background: linear-gradient(90deg, var(--red-500) 0%, var(--red-600) 100%);
}

.progress-purple {
  background: linear-gradient(90deg, var(--violet-500) 0%, var(--violet-600) 100%);
}

.progress-gradient {
  background: linear-gradient(90deg, var(--cyan-500) 0%, var(--blue-500) 50%, var(--violet-500) 100%);
}
</style>
