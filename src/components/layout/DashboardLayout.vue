<template>
  <div class="dashboard-layout">
    <!-- Sidebar -->
    <Sidebar />

    <!-- Main Content Area -->
    <div class="main-container">
      <!-- Navbar -->
      <Navbar />

      <!-- Content -->
      <main class="content-area">
        <slot />
      </main>
    </div>

    <!-- Global Search Modal (Cmd+K) -->
    <GlobalSearchModal v-model="showSearch" @result-selected="handleSearchResult" />

    <!-- Toast Container for notifications -->
    <ToastContainer />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'
import GlobalSearchModal from '@/components/modals/GlobalSearchModal.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import { useNotifications } from '@/composables/useNotifications'

export default {
  name: 'DashboardLayout',

  components: {
    Sidebar,
    Navbar,
    GlobalSearchModal,
    ToastContainer
  },

  setup() {
    const showSearch = ref(false)

    // Initialiser le système de notifications avec vérification automatique
    const { unreadCount, notifications } = useNotifications({
      autoCheck: true,
      checkIntervalMs: 30000, // Vérifier toutes les 30 secondes
      showToast: true
    })

    function handleSearchResult(result) {
      console.log('Résultat sélectionné:', result)
    }

    // Initialize theme on mount
    onMounted(() => {
      // Theme is handled by useTheme composable in child components
      // No additional initialization needed here
      console.log('DashboardLayout: Système de notifications activé')
    })

    return {
      showSearch,
      handleSearchResult,
      unreadCount,
      notifications
    }
  }
}
</script>

<style scoped>
.dashboard-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: var(--bg-secondary);
}

.main-container {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.content-area {
  flex: 1;
  padding: var(--spacing-xl);
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-secondary);
}

/* Page transitions */
.page-enter-active,
.page-leave-active {
  transition: all var(--transition-base);
}

.page-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.page-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Responsive */
@media (max-width: 768px) {
  .content-area {
    padding: var(--spacing-md);
  }
}

@media (max-width: 480px) {
  .content-area {
    padding: var(--spacing-sm);
  }
}
</style>
