import { useAuthStore } from '@/stores/auth'

/**
 * « Mes leçons » = les leçons de l'enseignant CONNECTÉ (décision D72), jamais celles
 * de ses collègues. Source unique pour l'écran « Mes leçons », le hub et le formulaire.
 *
 * Le filtre porte l'id LMS (`lessons.enseignant_id`, écrit à la création par le
 * serveur), pas `klassci_id`. Sans identité connue : `null`, et l'appelant ne demande
 * aucune liste (sans filtre, le serveur rendrait celles de l'établissement).
 */
export function myLessonsParams() {
  const id = useAuthStore().currentUser?.id
  return id == null ? null : { enseignant_id: id }
}

// v2 : les entrées v1 portaient aussi les leçons des collègues (liste non filtrée).
export const TEACHER_LESSONS_CACHE = 'teacher_lessons_v2'
