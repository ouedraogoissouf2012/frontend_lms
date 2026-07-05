import { mount } from '@vue/test-utils'
import { describe, expect, it, vi, beforeEach } from 'vitest'

const { joinTrackedVisio } = vi.hoisted(() => ({
  joinTrackedVisio: vi.fn()
}))

vi.mock('vue-router', () => ({ useRouter: () => ({ push: vi.fn() }) }))
vi.mock('@/services/lms', () => ({ lmsService: { hideSeance: vi.fn() } }))
vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({ currentUser: { name: 'Eleve' } })
}))
vi.mock('@/composables/useTrackedVisioJoin', () => ({
  useTrackedVisioJoin: () => ({ joinTrackedVisio })
}))

import StudentSchedule from '@/views/student/StudentSchedule.vue'

function mountView() {
  return mount(StudentSchedule, {
    global: {
      stubs: {
        DashboardLayout: { template: '<div><slot /></div>' },
        UniversalCalendar: {
          template: '<button class="join" @click="$emit(\'event-action\', { type: \'joinVisio\', data: { id: 9, visio_room_id: \'room-event-api\' } })">join</button>'
        }
      }
    }
  })
}

describe('StudentSchedule (#184)', () => {
  beforeEach(() => {
    joinTrackedVisio.mockReset()
    joinTrackedVisio.mockResolvedValue({ success: true })
  })

  it('rejoint la visio via le helper tracké', async () => {
    const w = mountView()

    await w.find('.join').trigger('click')

    expect(joinTrackedVisio).toHaveBeenCalledWith(
      { id: 9, visio_room_id: 'room-event-api' },
      { displayName: 'Eleve' },
    )
  })
})
