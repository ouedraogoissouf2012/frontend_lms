<template>
  <div class="dashboard-layout">
    <!-- Mobile Header -->
    <MobileHeader v-if="isMobile" @toggle-sidebar="toggleMobileSidebar" />

    <!-- Mobile Sidebar (Drawer) -->
    <MobileSidebar
      v-if="isMobile"
      :is-open="isMobileSidebarOpen"
      @close="closeMobileSidebar"
    />

    <!-- Desktop Sidebar -->
    <Sidebar v-if="!isMobile" />

    <!-- Main Content Area -->
    <div class="main-container" :class="{ 'mobile-layout': isMobile }">
      <!-- Desktop Navbar -->
      <Navbar v-if="!isMobile" />

      <!-- Content -->
      <main class="content-area" :class="{ 'mobile-content': isMobile }">
        <slot />
      </main>
    </div>

    <!-- Bottom Navigation (Mobile only) -->
    <BottomNavigation v-if="isMobile" />

    <!-- Global Search Modal (Cmd+K) -->
    <GlobalSearchModal v-model="showSearch" @result-selected="handleSearchResult" />

    <!-- Toast Container for notifications -->
    <ToastContainer />
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'
import Sidebar from './Sidebar.vue'
import Navbar from './Navbar.vue'
import MobileHeader from './MobileHeader.vue'
import MobileSidebar from './MobileSidebar.vue'
import BottomNavigation from './BottomNavigation.vue'
import GlobalSearchModal from '@/components/modals/GlobalSearchModal.vue'
import ToastContainer from '@/components/ui/ToastContainer.vue'
import { useNotifications } from '@/composables/useNotifications'

export default {
  name: 'DashboardLayout',

  components: {
    Sidebar,
    Navbar,
    MobileHeader,
    MobileSidebar,
    BottomNavigation,
    GlobalSearchModal,
    ToastContainer
  },

  setup() {
    const showSearch = ref(false)
    const isMobile = ref(window.innerWidth < 768)
    const isMobileSidebarOpen = ref(false)

    // Initialiser le système de notifications avec vérification automatique
    const { unreadCount, notifications } = useNotifications({
      autoCheck: true,
      checkIntervalMs: 30000, // Vérifier toutes les 30 secondes
      showToast: true
    })

    // Detect window resize
    function handleResize() {
      isMobile.value = window.innerWidth < 768
      // Close mobile sidebar when switching to desktop
      if (!isMobile.value && isMobileSidebarOpen.value) {
        isMobileSidebarOpen.value = false
      }
    }

    function handleSearchResult(result) {
      console.log('Résultat sélectionné:', result)
    }

    function toggleMobileSidebar() {
      isMobileSidebarOpen.value = !isMobileSidebarOpen.value
    }

    function closeMobileSidebar() {
      isMobileSidebarOpen.value = false
    }

    // Initialize theme on mount
    onMounted(() => {
      window.addEventListener('resize', handleResize)
      console.log('DashboardLayout: Système de notifications activé')
      console.log('DashboardLayout: Mode mobile =', isMobile.value)
    })

    onUnmounted(() => {
      window.removeEventListener('resize', handleResize)
    })

    return {
      showSearch,
      handleSearchResult,
      unreadCount,
      notifications,
      isMobile,
      isMobileSidebarOpen,
      toggleMobileSidebar,
      closeMobileSidebar
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

/* Mobile layout adjustments */
.main-container.mobile-layout {
  padding-top: 56px; /* Mobile header height */
  padding-bottom: 56px; /* Bottom navigation height */
  width: 100%;
}

.content-area {
  flex: 1;
  padding: var(--spacing-xl);
  overflow-y: auto;
  overflow-x: hidden;
  background: var(--bg-secondary);
}

/* Mobile content adjustments */
.content-area.mobile-content {
  padding: 1rem;
  padding-top: 0.5rem;
  padding-bottom: 0.5rem;
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
  .dashboard-layout {
    flex-direction: column;
  }

  .content-area {
    padding: 1rem;
  }

  /* Hide scrollbar on mobile for cleaner look */
  .content-area::-webkit-scrollbar {
    width: 0;
    height: 0;
  }
}

@media (max-width: 480px) {
  .content-area {
    padding: 0.75rem;
  }

  .content-area.mobile-content {
    padding: 0.75rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
}
</style>
