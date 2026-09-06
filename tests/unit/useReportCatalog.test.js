import { describe, expect, it, vi } from 'vitest'

vi.mock('@/services/klassciStructure', () => ({
  klassciStructureService: {
    getClasses: vi.fn().mockResolvedValue([{ id: 1, name: '6e A' }]),
    getMatieres: vi.fn().mockResolvedValue([{ id: 2, nom: 'Maths' }]),
  },
}))

import { klassciStructureService } from '@/services/klassciStructure'
import { useReportCatalog } from '@/composables/useReportCatalog'

describe('useReportCatalog (#330)', () => {
  it('loads classes and matieres without the modal importing klassci', async () => {
    const { classes, matieres, loadCatalog } = useReportCatalog()
    await loadCatalog()
    expect(klassciStructureService.getClasses).toHaveBeenCalled()
    expect(klassciStructureService.getMatieres).toHaveBeenCalled()
    expect(classes.value).toEqual([{ id: 1, name: '6e A' }])
    expect(matieres.value).toEqual([{ id: 2, nom: 'Maths' }])
  })
})
