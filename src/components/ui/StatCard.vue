<template>
  <div class="stat-card" :class="{ clickable: clickable }" @click="handleClick">
    <div class="stat-icon" :style="{ background: iconBg }">
      <span>{{ icon }}</span>
    </div>
    <div class="stat-content">
      <div class="stat-label">{{ label }}</div>
      <div class="stat-value">{{ formattedValue }}</div>
      <div v-if="subtitle" class="stat-subtitle">{{ subtitle }}</div>
      <div v-if="trend" class="stat-trend" :class="trendClass">
        <span class="trend-icon">{{ trendIcon }}</span>
        <span>{{ trend }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'StatCard',

  props: {
    icon: {
      type: String,
      default: 'fa-bar-chart'
    },
    iconBg: {
      type: String,
      default: 'linear-gradient(135deg, var(--blue-500) 0%, var(--blue-600) 100%)'
    },
    label: {
      type: String,
      required: true
    },
    value: {
      type: [String, Number],
      required: true
    },
    subtitle: {
      type: String,
      default: ''
    },
    trend: {
      type: String,
      default: ''
    },
    trendDirection: {
      type: String,
      default: 'neutral', // 'up', 'down', 'neutral'
      validator: (value) => ['up', 'down', 'neutral'].includes(value)
    },
    clickable: {
      type: Boolean,
      default: false
    }
  },

  emits: ['click'],

  setup(props, { emit }) {
    const formattedValue = computed(() => {
      if (typeof props.value === 'number') {
        // Format numbers with thousands separator
        return props.value.toLocaleString('fr-FR')
      }
      return props.value
    })

    const trendClass = computed(() => {
      return {
        'trend-up': props.trendDirection === 'up',
        'trend-down': props.trendDirection === 'down',
        'trend-neutral': props.trendDirection === 'neutral'
      }
    })

    const trendIcon = computed(() => {
      switch (props.trendDirection) {
        case 'up':
          return '↗'
        case 'down':
          return '↘'
        default:
          return '→'
      }
    })

    const handleClick = () => {
      if (props.clickable) {
        emit('click')
      }
    }

    return {
      formattedValue,
      trendClass,
      trendIcon,
      handleClick
    }
  }
}
</script>

<style scoped>
.stat-card {
  background: var(--card-bg);
  border: 1px solid var(--card-border);
  border-radius: var(--radius-xl);
  padding: var(--spacing-lg);
  box-shadow: var(--card-shadow);
  display: flex;
  gap: var(--spacing-lg);
  transition: all var(--transition-base);
  position: relative;
  overflow: hidden;
}

.stat-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, var(--blue-500) 0%, var(--blue-600) 100%);
  opacity: 0;
  transition: opacity var(--transition-base);
}

.stat-card:hover {
  box-shadow: var(--card-hover-shadow);
  transform: translateY(-2px);
}

.stat-card:hover::before {
  opacity: 1;
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-icon {
  width: 56px;
  height: 56px;
  min-width: 56px;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.75rem;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.stat-label {
  font-size: var(--font-size-sm);
  color: var(--text-secondary);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.stat-value {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1;
}

.stat-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-tertiary);
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: 600;
  margin-top: var(--spacing-xs);
}

.trend-icon {
  font-size: 1rem;
}

.trend-up {
  color: var(--emerald-500);
}

.trend-down {
  color: var(--red-500);
}

.trend-neutral {
  color: var(--text-tertiary);
}

/* Responsive */
@media (max-width: 480px) {
  .stat-card {
    padding: var(--spacing-md);
    gap: var(--spacing-md);
  }

  .stat-icon {
    width: 48px;
    height: 48px;
    min-width: 48px;
    font-size: 1.5rem;
  }

  .stat-value {
    font-size: var(--font-size-2xl);
  }
}
</style>
