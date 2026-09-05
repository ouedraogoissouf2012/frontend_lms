import { ref } from 'vue'
import { klassciStructureService } from '@/services/klassciStructure'

/**
 * Catalogue classes/matières pour le formulaire de rapport (#330).
 * La modale ne parle plus à klassciService.
 */
export function useReportCatalog() {
  const classes = ref([])
  const matieres = ref([])

  async function loadCatalog() {
    const [classesData, matieresData] = await Promise.all([
      klassciStructureService.getClasses(),
      klassciStructureService.getMatieres(),
    ])
    classes.value = classesData
    matieres.value = matieresData
  }

  return { classes, matieres, loadCatalog }
}
