/**
 * Vue AdminDashboard : la région qui annonce un échec d'analytics est présente dès
 * le montage (un lecteur d'écran n'annonce que ce qui change dans une région qui
 * existait déjà), et le calendrier passe par son panneau à états.
 */
import { shallowMount } from '@vue/test-utils'
import { describe, it, expect, vi } from 'vitest'

const etat = vi.hoisted(() => ({}))
vi.mock('@/composables/useAdminDashboard', async () => {
  const { ref: r } = await import('vue')
  Object.assign(etat, {
    analyticsError: r(''), calendarState: r('non-charge'), calendarError: r(''), calendarEvents: r([]),
  })
  return {
    useAdminDashboard: () => ({
      user: r({}), meta: r(null), stats: r(null), classes: r([]), matieres: r([]),
      activityData: r(null), pendingTasks: r(null), recentUsers: r(null),
      showGenerateReportModal: r(false), loading: r({ stats: false, classes: false, matieres: false, analytics: false }),
      loadError: r(null), navigateTo: vi.fn(), handleReportGenerated: vi.fn(), getDashboardTitle: () => '',
      isCoordinateur: () => false, isTeacher: () => false, isAdmin: () => true, loadDashboard: vi.fn(),
      loadCalendarEvents: vi.fn(), ...etat,
    }),
  }
})

import AdminDashboard from '@/views/dashboards/AdminDashboard.vue'

const monter = () => shallowMount(AdminDashboard, {
  global: { directives: { reveal: {} }, stubs: { DashboardLayout: { template: '<div><slot /></div>' } } },
})

describe('AdminDashboard — régions d état', () => {
  it('la région des analytics existe au montage, vide, en role="status", sans style', () => {
    const region = monter().find('[data-test="erreur-analytics"]')
    expect(region.exists()).toBe(true)
    expect(region.attributes('role')).toBe('status')
    expect(region.text()).toBe('')
    expect(region.attributes('style')).toBeUndefined()
  })

  it('le calendrier passe par son panneau à états, qui reçoit l état « non chargé »', () => {
    const panneau = monter().findComponent({ name: 'DashboardCalendarPanel' })
    expect(panneau.exists()).toBe(true)
    expect(panneau.props('etat')).toBe('non-charge')
  })
})

