import { createApp, h, ref } from 'vue'
import Modal from '@/components/ui/Modal.vue'

const buttonBase = {
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontWeight: '600',
  padding: '0.7rem 1rem',
}

const variants = {
  primary: { background: 'var(--blue-600, #2563eb)', color: 'white' },
  danger: { background: 'var(--red-600, #dc2626)', color: 'white' },
}

export function confirmDialog({
  title = 'Confirmation',
  message,
  confirmLabel = 'Confirmer',
  cancelLabel = 'Annuler',
  variant = 'primary',
} = {}) {
  if (typeof document === 'undefined') return Promise.resolve(false)

  return new Promise((resolve) => {
    const mountNode = document.createElement('div')
    document.body.appendChild(mountNode)

    let app
    let settled = false

    const finish = (value) => {
      if (settled) return
      settled = true
      resolve(value)
      app?.unmount()
      mountNode.remove()
    }

    const Root = {
      setup() {
        const open = ref(true)
        const close = (value) => {
          open.value = false
          finish(value)
        }

        return () => h(
          Modal,
          {
            modelValue: open.value,
            'onUpdate:modelValue': (value) => {
              if (!value) close(false)
            },
            title,
            size: 'sm',
            teleport: true,
            closeOnOverlay: false,
            onClose: () => close(false),
          },
          {
            default: () => h('p', { style: { margin: 0, lineHeight: '1.6' } }, message || ''),
            footer: () => [
              h('button', {
                type: 'button',
                style: {
                  ...buttonBase,
                  background: 'var(--bg-secondary, #f3f4f6)',
                  color: 'var(--text-primary, #111827)',
                },
                onClick: () => close(false),
              }, cancelLabel),
              h('button', {
                type: 'button',
                style: { ...buttonBase, ...(variants[variant] || variants.primary) },
                onClick: () => close(true),
              }, confirmLabel),
            ],
          },
        )
      },
    }

    app = createApp(Root)
    app.mount(mountNode)
  })
}
