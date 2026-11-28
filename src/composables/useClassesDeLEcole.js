import { ref } from 'vue'
import { enrolmentCodesService } from '@/services/enrolmentCodes'
import { ERROR_MESSAGES } from '@/constants/errorMessages'

/**
 * Les classes LOCALES de l'école (#676), lues page après page sur `GET /classes` (ClassesLocalesPage :
 * `data` = la page, `meta.last_page`). Bornée : au-delà de PAGES_MAX pages, la liste est dite incomplète, jamais
 * présentée comme entière. Une page refusée rend l'erreur du catalogue et une liste vide.
 */
export const PAGES_MAX = 40

export function useClassesDeLEcole() {
  const classes = ref([])
  const classesErreur = ref('')
  const classesIncompletes = ref(false)

  async function chargerClasses() {
    const toutes = []
    classesErreur.value = ''
    classesIncompletes.value = false
    try {
      for (let page = 1; page <= PAGES_MAX; page++) {
        const response = await enrolmentCodesService.listClasses(page)
        if (response?.success !== true || !Array.isArray(response.data)) throw new Error('page de classes illisible')
        toutes.push(...response.data.filter((c) => Number.isInteger(c?.id)).map((c) => ({ id: c.id, libelle: String(c.libelle ?? `Classe ${c.id}`) })))
        const derniere = Number(response.meta?.last_page)
        if (!Number.isFinite(derniere) || page >= derniere) break
        if (page === PAGES_MAX) classesIncompletes.value = true
      }
      classes.value = toutes
    } catch (err) {
      classes.value = []
      classesErreur.value = err?.userMessage || ERROR_MESSAGES.unknown
    }
  }

  const libelleDeClasse = (id) => classes.value.find((c) => c.id === id)?.libelle ?? `Classe ${id}`

  return { classes, classesErreur, classesIncompletes, chargerClasses, libelleDeClasse }
}
