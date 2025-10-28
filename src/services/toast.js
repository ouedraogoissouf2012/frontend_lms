import { createApp } from 'vue'
import Toast from '@/components/ui/Toast.vue'

class ToastService {
  constructor() {
    this.toasts = []
    this.containerId = 'toast-container'
    this.ensureContainer()
  }

  ensureContainer() {
    // Créer le conteneur global si il n'existe pas
    if (!document.getElementById(this.containerId)) {
      const container = document.createElement('div')
      container.id = this.containerId
      container.className = 'toast-container'
      document.body.appendChild(container)
    }
  }

  show(options) {
    const {
      message,
      title = '',
      type = 'info',
      duration = 3000
    } = options

    // Assurer que le conteneur existe
    this.ensureContainer()
    const mainContainer = document.getElementById(this.containerId)

    // Créer un wrapper pour ce toast
    const wrapper = document.createElement('div')
    wrapper.className = 'toast-wrapper'
    mainContainer.appendChild(wrapper)

    // Créer le toast
    const app = createApp(Toast, {
      message,
      title,
      type,
      duration,
      onClose: () => {
        app.unmount()
        if (wrapper && wrapper.parentNode) {
          wrapper.parentNode.removeChild(wrapper)
        }
      }
    })

    app.mount(wrapper)
  }

  success(message, title = 'Succès') {
    this.show({ message, title, type: 'success' })
  }

  error(message, title = 'Erreur') {
    this.show({ message, title, type: 'error' })
  }

  warning(message, title = 'Attention') {
    this.show({ message, title, type: 'warning' })
  }

  info(message, title = 'Information') {
    this.show({ message, title, type: 'info' })
  }
}

export const toast = new ToastService()
